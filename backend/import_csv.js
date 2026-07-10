import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[ERROR] DATABASE_URL not found in backend/.env!");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

function getEmbedding(category, fabric) {
    const vector = Array(512).fill(0).map(() => (Math.random() - 0.5) * 0.2);
    const categories = ['dress', 'shirt', 'pants', 'jacket', 't-shirt', 'sweater', 'skirt', 'shorts'];
    const fabrics = ['cotton', 'silk', 'linen', 'polyester', 'wool', 'denim', 'rayon', 'nylon'];
    
    let cat = (category || '').toLowerCase();
    let fab = (fabric || '').toLowerCase();
    
    categories.forEach((c, idx) => {
        if (cat.includes(c) || cat.includes(c.replace('-','')) || cat === c + 's' || cat.includes(c + 's')) {
            vector[idx] += 10.0;
        }
    });
    fabrics.forEach((f, idx) => {
        if (fab.includes(f)) {
            vector[idx + 8] += 10.0;
        }
    });
    
    return `[${vector.join(',')}]`;
}

const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

async function run() {
    let client;
    try {
        console.log("[INFO] Connecting to database...");
        client = await pool.connect();
        
        console.log("[INFO] Truncating tables...");
        await client.query('TRUNCATE TABLE sales_invoices, sales_orders, tech_packs, finished_goods, buyers, suppliers RESTART IDENTITY CASCADE');

        const dataDir = path.resolve(__dirname, '../company_data');

        // 1. Suppliers
        console.log("[INFO] Importing Suppliers...");
        const suppliersData = await readCSV(path.join(dataDir, 'suppliers.csv'));
        const supplierMap = {};
        for (const row of suppliersData) {
            const res = await client.query(
                `INSERT INTO suppliers (name, contact_email, country, lead_time, rating) VALUES ($1, $2, $3, $4, $5) RETURNING id, name`,
                [row.company_name, row.contact, row.country, parseInt(row.lead_time_days), parseFloat(row.rating)]
            );
            supplierMap[res.rows[0].name] = res.rows[0].id;
        }

        // 2. Buyers
        console.log("[INFO] Importing Buyers...");
        const buyersData = await readCSV(path.join(dataDir, 'buyers.csv'));
        const buyerMap = {};
        for (const row of buyersData) {
            const res = await client.query(
                `INSERT INTO buyers (name, country, buyer_category) VALUES ($1, $2, $3) RETURNING id, name`,
                [row.company_name, row.country, row.buyer_category]
            );
            buyerMap[res.rows[0].name] = res.rows[0].id;
        }

        // 3. Finished Goods
        console.log("[INFO] Importing Finished Goods...");
        const fgData = await readCSV(path.join(dataDir, 'finished_goods.csv'));
        const fgMap = {}; // store details for tech_packs
        const fgChunks = [];
        for (let i = 0; i < fgData.length; i += 100) fgChunks.push(fgData.slice(i, i + 100));
        
        for (const chunk of fgChunks) {
            await client.query('BEGIN');
            for (const row of chunk) {
                const supplierId = supplierMap[row.supplier];
                await client.query(
                    `INSERT INTO finished_goods (style_number, style_name, category, fabric, gsm, color, print, season, brand, cost, price_inr, stock_quantity, supplier_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [
                        row.style_number, row.style_name, row.category, row.fabric, parseInt(row.gsm), 
                        row.color, row.print, row.season, row.brand, parseFloat(row.cost), parseFloat(row.selling_price),
                        Math.floor(Math.random() * 200) + 10, supplierId || null
                    ]
                );
                fgMap[row.style_number] = { image_url: row.image_url, category: row.category, fabric: row.fabric };
            }
            await client.query('COMMIT');
        }

        // 4. Tech Packs
        console.log("[INFO] Importing Tech Packs...");
        const tpData = await readCSV(path.join(dataDir, 'tech_packs.csv'));
        const tpChunks = [];
        for (let i = 0; i < tpData.length; i += 100) tpChunks.push(tpData.slice(i, i + 100));
        
        for (const chunk of tpChunks) {
            await client.query('BEGIN');
            for (const row of chunk) {
                const fg = fgMap[row.style_number] || {};
                const embedding = getEmbedding(fg.category, fg.fabric);
                await client.query(
                    `INSERT INTO tech_packs (style_number, fabric_details, construction, wash_instructions, image_url, image_embedding)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [row.style_number, row.fabric_details, row.construction, row.wash_instructions, fg.image_url || null, embedding]
                );
            }
            await client.query('COMMIT');
        }

        // 5. Sales Orders
        console.log("[INFO] Importing Sales Orders...");
        const soData = await readCSV(path.join(dataDir, 'sales_orders.csv'));
        const soChunks = [];
        for (let i = 0; i < soData.length; i += 100) soChunks.push(soData.slice(i, i + 100));
        
        for (const chunk of soChunks) {
            await client.query('BEGIN');
            for (const row of chunk) {
                const buyerId = buyerMap[row.buyer];
                await client.query(
                    `INSERT INTO sales_orders (order_number, buyer_id, style_number, quantity, shipment_date, status)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [row.order_number, buyerId || null, row.style_number, parseInt(row.quantity), row.shipment_date, row.status]
                );
            }
            await client.query('COMMIT');
        }

        // 6. Sales Invoices
        console.log("[INFO] Importing Sales Invoices...");
        const siData = await readCSV(path.join(dataDir, 'sales_invoices.csv'));
        const siChunks = [];
        for (let i = 0; i < siData.length; i += 100) siChunks.push(siData.slice(i, i + 100));
        
        for (const chunk of siChunks) {
            await client.query('BEGIN');
            for (const row of chunk) {
                await client.query(
                    `INSERT INTO sales_invoices (invoice_number, order_number, amount_inr, currency, payment_status, due_date)
                     VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + INTERVAL '30 days')`,
                    [row.invoice_number, row.sales_order, parseFloat(row.amount), row.currency, row.payment_status]
                );
            }
            await client.query('COMMIT');
        }

        console.log("[SUCCESS] Data import completed successfully!");
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error("[ERROR]", err);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

run();
