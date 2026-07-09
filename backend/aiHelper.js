import { OpenAI } from 'openai';
import { config } from './config.js';

let openaiClient = null;
if (config.openaiApiKey) {
  openaiClient = new OpenAI({
  apiKey: config.openaiApiKey,
  baseURL: "https://openrouter.ai/api/v1",
});
}

const SCHEMA_PROMPT = `
You are an expert SQL query generator for an Apparel & Textiles ERP system.
The system uses SQLite (locally) or PostgreSQL (in production). Write SQL queries that work on both.
Return ONLY the raw SQL query. Do not wrap it in markdown code blocks, do not use backticks, and do not provide any explanations.

Database Schema:

1. suppliers
- id (INTEGER PRIMARY KEY)
- name (TEXT) -- Company Name
- contact_email (TEXT)
- phone (TEXT)
- address (TEXT)
- country (TEXT)
- contact (TEXT)
- lead_time (INTEGER) -- Lead time in days
- rating (REAL)
- created_at (TIMESTAMP)

2. buyers
- id (INTEGER PRIMARY KEY)
- name (TEXT) -- Company Name
- contact_email (TEXT)
- phone (TEXT)
- address (TEXT)
- country (TEXT)
- buyer_category (TEXT)
- created_at (TIMESTAMP)

3. finished_goods
- style_number (TEXT PRIMARY KEY)
- style_name (TEXT)
- category (TEXT)
- fabric (TEXT)
- gsm (INTEGER)
- color (TEXT)
- print (TEXT)
- season (TEXT)
- brand (TEXT)
- cost (REAL)
- price_inr (REAL) -- Selling Price
- stock_quantity (INTEGER)
- supplier_id (INTEGER) -- References suppliers
- created_at (TIMESTAMP)

4. tech_packs
- id (INTEGER PRIMARY KEY)
- style_number (TEXT) -- References finished_goods
- fabric_details (TEXT)
- construction (TEXT)
- wash_instructions (TEXT)
- specification_details (TEXT)
- image_url (TEXT)
- image_embedding (vector)
- created_at (TIMESTAMP)

5. sales_orders
- order_number (TEXT PRIMARY KEY)
- buyer_id (INTEGER) -- References buyers
- style_number (TEXT) -- References finished_goods
- quantity (INTEGER)
- order_date (DATE)
- shipment_date (DATE)
- status (TEXT) -- 'Pending', 'Shipped', 'Delivered', 'Cancelled'
- created_at (TIMESTAMP)

6. sales_invoices
- invoice_number (TEXT PRIMARY KEY)
- order_number (TEXT) -- References sales_orders
- amount_inr (REAL)
- currency (TEXT)
- payment_status (TEXT) -- 'Paid', 'Pending', 'Overdue'
- issue_date (DATE)
- due_date (DATE)
- created_at (TIMESTAMP)

Rules:
- Do not query the "image_embedding" column unless explicitly requested.
- Limit output to raw executable SQL query string ONLY. Do not use Markdown styling.
`;

// Heuristic Fallback Rules when OpenAI is not configured
function ruleBasedSqlFallback(question) {
  const q = (question || '').toLowerCase();

  if (q.includes('revenue') || q.includes('sales amount') || q.includes('total amount')) {
    return 'SELECT SUM(amount_inr) AS total_revenue FROM sales_invoices;';
  }
  if (q.includes('top product') || q.includes('finished goods') || q.includes('most stock') || q.includes('stock')) {
    return 'SELECT style_number, category, color, fabric, price_inr, stock_quantity FROM finished_goods ORDER BY stock_quantity DESC LIMIT 5;';
  }
  if (q.includes('supplier')) {
    return 'SELECT name, contact_email, address FROM suppliers LIMIT 5;';
  }
  if (q.includes('buyer') || q.includes('customer')) {
    return 'SELECT name, contact_email, address FROM buyers LIMIT 5;';
  }
  if (q.includes('invoice')) {
    return 'SELECT invoice_number, amount_inr, payment_status, issue_date FROM sales_invoices ORDER BY issue_date DESC LIMIT 5;';
  }
  if (q.includes('order')) {
    return 'SELECT order_number, status, quantity, order_date FROM sales_orders ORDER BY order_date DESC LIMIT 5;';
  }
  if (q.includes('designer') || q.includes('tech pack') || q.includes('specs')) {
    return 'SELECT id, style_number, created_at FROM tech_packs LIMIT 5;';
  }

  // Generic fallback: fetch some finished goods
  return 'SELECT style_number, category, color, fabric, price_inr, stock_quantity FROM finished_goods LIMIT 5;';
}

export async function generateSql(question) {
  if (!openaiClient) {
    console.warn("[WARN] OpenAI API key not configured, using heuristic fallback.");
    return ruleBasedSqlFallback(question);
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SCHEMA_PROMPT },
        { role: 'user', content: question }
      ],
      temperature: 0.1
    });

    let sql = response.choices[0].message.content.trim();
    if (sql.startsWith('```')) {
      sql = sql.replace(/^```sql?/i, '').replace(/```$/, '').trim();
    }
    return sql;
  } catch (err) {
    console.error("[ERROR] OpenAI text-to-SQL failed:", err.message);
    return ruleBasedSqlFallback(question);
  }
}

export async function generateSummary(question, sql, rows) {
  if (openaiClient) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: 'You are a helpful business intelligence assistant. Summarize the returned rows for the query in 1-2 business-friendly sentences.' },
          { 
            role: 'user', 
            content: `User Question: "${question}"\nSQL Query Run: "${sql}"\nResult Rows:\n${JSON.stringify(rows, null, 2)}\nProvide a brief business summary of these results.` 
          }
        ],
        temperature: 0.5
      });
      return response.choices[0].message.content.trim();
    } catch (err) {
      return `Executed SQL successfully. Returned ${rows.length} rows.`;
    }
  } else {
    // Generate simple static summary
    if (rows.length === 0) {
      return "No data found matching your query details.";
    }
    if (rows.length === 1 && Object.keys(rows[0]).length === 1) {
      const colName = Object.keys(rows[0])[0];
      const val = rows[0][colName];
      return `The result for your query shows a value of ${val} for ${colName.replace(/_/g, ' ')}.`;
    }
    return `Query executed successfully and returned ${rows.length} records matching your request.`;
  }
}
