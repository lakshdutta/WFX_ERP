import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { config } from './config.js';
import { initDb, query, queryRaw } from './database.js';
import { getPseudoEmbedding, cosineSimilarity } from './vectorHelper.js';
import { generateSql, generateSummary } from './aiHelper.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// 1. Dashboard Statistics
app.get('/', (req, res)=>{
  res.send("Welcome to the ERP Backend API. Use /api/stats, /api/query, /api/search, or /api/search-image endpoints.");
});
app.get('/api/stats', async (req, res) => {
  try {
    // Totals queries
    const countGoods = await query("SELECT COUNT(*) AS count FROM finished_goods");
    const countSuppliers = await query("SELECT COUNT(*) AS count FROM suppliers");
    const countBuyers = await query("SELECT COUNT(*) AS count FROM buyers");
    const countOrders = await query("SELECT COUNT(*) AS count FROM sales_orders");
    const sumRevenue = await query("SELECT SUM(amount_inr) AS sum FROM sales_invoices");

    const totals = {
      finished_goods: countGoods[0]?.count || 0,
      suppliers: countSuppliers[0]?.count || 0,
      buyers: countBuyers[0]?.count || 0,
      sales_orders: countOrders[0]?.count || 0,
      revenue_inr: parseFloat(sumRevenue[0]?.sum || 0)
    };

    // Revenue Trend Query (adapted dynamically for SQLite vs PostgreSQL)
    let trendSql;
    if (config.isSupabase) {
      trendSql = `
        SELECT TO_CHAR(issue_date, 'YYYY-MM') AS month, SUM(amount_inr) AS revenue, COUNT(*) AS count 
        FROM sales_invoices 
        GROUP BY month 
        ORDER BY month ASC
      `;
    } else {
      trendSql = `
        SELECT strftime('%Y-%m', issue_date) AS month, SUM(amount_inr) AS revenue, COUNT(*) AS count 
        FROM sales_invoices 
        GROUP BY month 
        ORDER BY month ASC
      `;
    }
    const trendRows = await query(trendSql);
    const revenue_trend = trendRows.map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue || 0),
      count: parseInt(row.count || 0)
    }));

    // Category Breakdown
    const catRows = await query("SELECT category, COUNT(*) AS count FROM finished_goods GROUP BY category");
    const categories = catRows.map(row => ({
      category: row.category,
      count: parseInt(row.count || 0)
    }));

    res.json({ totals, revenue_trend, categories });
  } catch (err) {
    console.error("Stats API error:", err);
    res.status(500).json({ error: "Failed to compile stats metrics", details: err.message });
  }
});

// 2. Natural Language AI Chat (Text-to-SQL)
app.post('/api/query', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Missing parameter 'question'" });
  }

  try {
    const sql = await generateSql(question);
    
    // Execute query and extract raw result sets
    try {
      const { columns, rows } = await queryRaw(sql);
      const summary = await generateSummary(question, sql, rows);
      res.json({ 
        question, 
        sql, 
        columns, 
        rows, 
        results: rows,         // Compatibility fallback
        summary, 
        answer: summary        // Compatibility fallback
      });
    } catch (dbErr) {
      // If SQL execution fails, return query details + clear database error string
      res.json({
        question,
        sql,
        columns: [],
        rows: [],
        results: [],
        summary: `Query execution failed: ${dbErr.message}`,
        answer: `Query execution failed: ${dbErr.message}`,
        error: dbErr.message
      });
    }
  } catch (err) {
    console.error("Query API error:", err);
    res.status(500).json({ error: "Text-to-SQL translation failed", details: err.message });
  }
});

// 3. Product Catalog text search with metadata filters and pagination
app.get('/api/search', async (req, res) => {
  try {
    const { 
      q, 
      category, 
      fabric, 
      min_gsm, 
      max_gsm, 
      sort_by = 'style_number', 
      sort_dir = 'asc',
      page = '1',
      limit = '12'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // We build the query dynamically
    let whereClauses = [];
    let params = [];

    if (category) {
      const cats = category.split(',').map(c => c.trim());
      const catPlaceholders = cats.map((_, i) => config.isSupabase ? `$${params.length + i + 1}` : '?').join(',');
      whereClauses.push(`category IN (${catPlaceholders})`);
      params.push(...cats);
    }

    if (fabric) {
      const fabs = fabric.split(',').map(f => f.trim());
      const fabPlaceholders = fabs.map((_, i) => config.isSupabase ? `$${params.length + i + 1}` : '?').join(',');
      whereClauses.push(`fabric IN (${fabPlaceholders})`);
      params.push(...fabs);
    }

    if (min_gsm) {
      whereClauses.push(`gsm >= ${config.isSupabase ? `$${params.length + 1}` : '?'}`);
      params.push(parseInt(min_gsm));
    }

    if (max_gsm) {
      whereClauses.push(`gsm <= ${config.isSupabase ? `$${params.length + 1}` : '?'}`);
      params.push(parseInt(max_gsm));
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Validate sorting parameters
    const validSortCols = ['style_number', 'price_inr', 'gsm', 'stock_quantity'];
    const sortCol = validSortCols.includes(sort_by) ? sort_by : 'style_number';
    const sortOrder = sort_dir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // If semantic text search query (q) is specified, we perform vector search
    if (q) {
      const queryVec = getPseudoEmbedding(q);

      if (config.isSupabase) {
        // Use PostgreSQL vector cosine distance
        const pgWhereStr = whereStr.replace(/\bcategory\b/g, 'fg.category').replace(/\bfabric\b/g, 'fg.fabric').replace(/\bgsm\b/g, 'fg.gsm');
        const queryTerms = q.toLowerCase().split(/\s+/).filter(t => t.length > 1);
        let similarityExpr = `(1 - (tp.image_embedding <=> $${params.length + 1}))`;
        let paramIndex = params.length + 2;
        let queryParams = [...params, `[${queryVec.join(',')}]`];
        
        for (const term of queryTerms) {
          similarityExpr += ` + 
            (CASE WHEN fg.fabric ILIKE $${paramIndex} THEN 0.5 ELSE 0 END) + 
            (CASE WHEN fg.category ILIKE $${paramIndex + 1} THEN 0.5 ELSE 0 END) + 
            (CASE WHEN fg.color ILIKE $${paramIndex + 2} THEN 0.5 ELSE 0 END) + 
            (CASE WHEN fg.style_number ILIKE $${paramIndex + 3} THEN 0.5 ELSE 0 END)`;
          queryParams.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
          paramIndex += 4;
        }
        
        queryParams.push(limitNum, offset);
        
        const sql = `
          SELECT fg.style_number, fg.category, fg.color, fg.fabric, fg.gsm, fg.price_inr, fg.stock_quantity, tp.image_url,
                 ${similarityExpr} AS similarity
          FROM finished_goods fg
          JOIN tech_packs tp ON fg.style_number = tp.style_number
          ${pgWhereStr}
          ORDER BY similarity DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const rows = await query(sql, queryParams);
        
        // Fetch total items matching filters
        const countSql = `SELECT COUNT(*) AS count FROM finished_goods ${whereStr}`;
        const countRes = await query(countSql, params);
        const totalItems = parseInt(countRes[0]?.count || 0);

        return res.json({
          items: rows,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total_items: totalItems,
            total_pages: Math.ceil(totalItems / limitNum)
          }
        });
      } else {
        // SQLite fallback vector search
        // Retrieve all records matching metadata filters, then calculate similarity in memory
        const pgWhereStr = whereStr.replace(/\bcategory\b/g, 'fg.category').replace(/\bfabric\b/g, 'fg.fabric').replace(/\bgsm\b/g, 'fg.gsm');
        const sql = `
          SELECT fg.*, tp.image_url, tp.image_embedding AS visual_embedding
          FROM finished_goods fg
          LEFT JOIN tech_packs tp ON fg.style_number = tp.style_number
          ${pgWhereStr}
        `;
        const allCandidates = await query(sql, params);

        const scoredItems = allCandidates.map(item => {
          let candidateVec = null;
          if (item.visual_embedding) {
            try {
              candidateVec = typeof item.visual_embedding === 'string' 
                ? JSON.parse(item.visual_embedding) 
                : item.visual_embedding;
            } catch (e) {}
          }
          // If no embedding exists, generate a deterministic fallback embedding from metadata
          if (!candidateVec || !Array.isArray(candidateVec)) {
            candidateVec = getPseudoEmbedding(`${item.color} ${item.fabric} ${item.category} ${item.style_number}`);
          }
          
          let similarity = cosineSimilarity(queryVec, candidateVec);

          // Apply text matching boost
          const queryTerms = q.toLowerCase().split(/\s+/).filter(t => t.length > 1);
          let matchCount = 0;
          const candidateText = `${item.color} ${item.fabric} ${item.category} ${item.style_number}`.toLowerCase();
          for (const term of queryTerms) {
            if (candidateText.includes(term)) {
              matchCount++;
            }
          }
          if (queryTerms.length > 0) {
            similarity += (matchCount / queryTerms.length) * 0.5;
          }

          return { ...item, similarity };
        });

        // Sort (no hard threshold filter to prevent empty results)
        const filtered = scoredItems.sort((a, b) => b.similarity - a.similarity);
        const paginated = filtered.slice(offset, offset + limitNum);
        
        return res.json({
          items: paginated,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total_items: filtered.length,
            total_pages: Math.ceil(filtered.length / limitNum)
          }
        });
      }
    } else {
      // Standard paginated listing query (no search string)
      const countSql = `SELECT COUNT(*) AS count FROM finished_goods ${whereStr}`;
      const countRes = await query(countSql, params);
      const totalItems = parseInt(countRes[0]?.count || 0);

      let sql;
      let queryParams;
      const pgWhereStr = whereStr.replace(/\bcategory\b/g, 'fg.category').replace(/\bfabric\b/g, 'fg.fabric').replace(/\bgsm\b/g, 'fg.gsm');
      if (config.isSupabase) {
        sql = `
          SELECT fg.style_number, fg.category, fg.color, fg.fabric, fg.gsm, fg.price_inr, fg.stock_quantity, tp.image_url
          FROM finished_goods fg
          LEFT JOIN tech_packs tp ON fg.style_number = tp.style_number
          ${pgWhereStr}
          ORDER BY fg.${sortCol} ${sortOrder}
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        queryParams = [...params, limitNum, offset];
      } else {
        sql = `
          SELECT fg.*, tp.image_url
          FROM finished_goods fg
          LEFT JOIN tech_packs tp ON fg.style_number = tp.style_number
          ${pgWhereStr}
          ORDER BY fg.${sortCol} ${sortOrder}
          LIMIT ? OFFSET ?
        `;
        queryParams = [...params, limitNum, offset];
      }

      const rows = await query(sql, queryParams);
      res.json({
        items: rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total_items: totalItems,
          total_pages: Math.ceil(totalItems / limitNum)
        }
      });
    }
  } catch (err) {
    console.error("Search API error:", err);
    res.status(500).json({ error: "Failed to fetch search catalog", details: err.message });
  }
});

// 4. Image Visual Similarity Search (Multer upload)
app.post('/api/search-image', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const textFallback = req.body.text_fallback;

    let queryVec;
    if (file) {
      console.log(`Processing image upload: ${file.originalname} (${file.size} bytes)`);
      queryVec = getPseudoEmbedding(file.buffer);
    } else if (textFallback) {
      console.log(`No image uploaded, falling back to text query: "${textFallback}"`);
      queryVec = getPseudoEmbedding(textFallback);
    } else {
      return res.status(400).json({ error: "Please upload an image file or provide a text fallback." });
    }

    // Rank candidates by visual similarity
    if (config.isSupabase) {
      let similarityExpr = `(1 - (tp.image_embedding <=> $1))`;
      let queryParams = [`[${queryVec.join(',')}]`];
      
      if (textFallback) {
        const queryTerms = textFallback.toLowerCase().split(/\s+/).filter(t => t.length > 1);
        let paramIndex = 2;
        for (const term of queryTerms) {
          similarityExpr += ` + 
            (CASE WHEN fg.fabric ILIKE $${paramIndex} THEN 0.5 ELSE 0 END) + 
            (CASE WHEN fg.category ILIKE $${paramIndex + 1} THEN 0.5 ELSE 0 END) + 
            (CASE WHEN fg.color ILIKE $${paramIndex + 2} THEN 0.5 ELSE 0 END) + 
            (CASE WHEN fg.style_number ILIKE $${paramIndex + 3} THEN 0.5 ELSE 0 END)`;
          queryParams.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
          paramIndex += 4;
        }
      }
      
      const sql = `
        SELECT fg.style_number, fg.category, fg.color, fg.fabric, fg.gsm, fg.price_inr, fg.stock_quantity, tp.image_url,
               ${similarityExpr} AS similarity
        FROM finished_goods fg
        JOIN tech_packs tp ON fg.style_number = tp.style_number
        ORDER BY similarity DESC
        LIMIT 12
      `;
      const rows = await query(sql, queryParams);
      res.json({ items: rows });
    } else {
      const rows = await query(`
        SELECT fg.*, tp.image_url, tp.image_embedding AS visual_embedding
        FROM finished_goods fg
        LEFT JOIN tech_packs tp ON fg.style_number = tp.style_number
      `);
      const scoredItems = rows.map(item => {
        let candidateVec = null;
        if (item.visual_embedding) {
          try {
            candidateVec = typeof item.visual_embedding === 'string'
              ? JSON.parse(item.visual_embedding)
              : item.visual_embedding;
          } catch (e) {}
        }
        if (!candidateVec || !Array.isArray(candidateVec)) {
          candidateVec = getPseudoEmbedding(`${item.color} ${item.fabric} ${item.category} ${item.style_number}`);
        }
        let similarity = cosineSimilarity(queryVec, candidateVec);

        // Apply text matching boost if visual query is text
        if (textFallback) {
          const queryTerms = textFallback.toLowerCase().split(/\s+/).filter(t => t.length > 1);
          let matchCount = 0;
          const candidateText = `${item.color} ${item.fabric} ${item.category} ${item.style_number}`.toLowerCase();
          for (const term of queryTerms) {
            if (candidateText.includes(term)) {
              matchCount++;
            }
          }
          if (queryTerms.length > 0) {
            similarity += (matchCount / queryTerms.length) * 0.5;
          }
        }

        return { ...item, similarity };
      });

      const filtered = scoredItems
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 12);

      res.json({ items: filtered });
    }
  } catch (err) {
    console.error("Image Search API error:", err);
    res.status(500).json({ error: "Visual search failed", details: err.message });
  }
});

// App Startup
const start = async () => {
  try {
    await initDb();
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`[SUCCESS] Express backend running on http://127.0.0.1:${config.port}`);
    });
  } catch (err) {
    console.error("Critical server startup failure:", err);
    process.exit(1);
  }
};

start();
