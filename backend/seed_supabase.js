import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[ERROR] DATABASE_URL not found in backend/.env!");
  console.log("Please make sure you have configured your connection string in backend/.env first, for example:");
  console.log("DATABASE_URL=postgres://postgres:[YOUR_SUPABASE_PASSWORD]@db.vfgdyuwozkewyrucqmbf.supabase.co:5432/postgres\n");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

function splitSqlStatements(sqlText) {
  const statements = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < sqlText.length; i++) {
    const char = sqlText[i];
    if (char === "'" && sqlText[i - 1] !== '\\') {
      inQuote = !inQuote;
    }
    current += char;
    if (char === ';' && !inQuote) {
      statements.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) {
    statements.push(current.trim());
  }
  return statements.filter(stmt => {
    const clean = stmt.replace(/--.*$/gm, '').trim();
    return clean.length > 0;
  });
}

async function run() {
  let client;
  try {
    console.log("[INFO] Connecting to Supabase Postgres database...");
    client = await pool.connect();
    console.log("[SUCCESS] Connected to Supabase.");

    // 1. Execute Schema
    const schemaPath = path.resolve(process.cwd(), '../database/schema.sql');
    console.log(`[INFO] Reading schema file from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const schemaStmts = splitSqlStatements(schemaSql);

    console.log(`[INFO] Executing ${schemaStmts.length} schema statements...`);
    for (const stmt of schemaStmts) {
      await client.query(stmt);
    }
    console.log("[SUCCESS] Schema tables successfully created on Supabase.");

    // 2. Execute Seeding
    const seedPath = path.resolve(process.cwd(), '../database/seed.sql');
    console.log(`[INFO] Reading seed file from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    const seedStmts = splitSqlStatements(seedSql);

    console.log(`[INFO] Executing ${seedStmts.length} insert statements in batches of 100...`);
    const chunkSize = 100;
    for (let i = 0; i < seedStmts.length; i += chunkSize) {
      const chunk = seedStmts.slice(i, i + chunkSize);
      await client.query('BEGIN');
      for (const stmt of chunk) {
        await client.query(stmt);
      }
      await client.query('COMMIT');
      console.log(`[PROGRESS] Imported ${Math.min(i + chunkSize, seedStmts.length)} / ${seedStmts.length} statements...`);
    }
    console.log("[SUCCESS] Seeding complete! All 1,500+ records imported successfully to Supabase.");

  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {}
    }
    console.error("\n[ERROR] Migration/Seeding failed on Supabase:");
    console.error(err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

run();
