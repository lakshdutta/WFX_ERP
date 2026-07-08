import pg from 'pg';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';

let pgPool = null;
let sqliteDb = null;

// Helper to split SQL statements correctly ignoring semicolons in single quotes
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
    // Strip inline comments before length check
    const clean = stmt.replace(/--.*$/gm, '').trim();
    return clean.length > 0;
  });
}

// Convert PostgreSQL schema types to SQLite-compatible types
function convertPgToSqlite(sql) {
  return sql
    .replace(/CREATE EXTENSION.*?;/gi, '')
    .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/vector\(\d+\)/gi, 'TEXT') // Vectors are stored as JSON array strings in SQLite
    .replace(/DECIMAL\(\d+,\s*\d+\)/gi, 'REAL')
    .replace(/TIMESTAMP WITH TIME ZONE/gi, 'TIMESTAMP')
    .replace(/DATE NOT NULL DEFAULT CURRENT_DATE/gi, "DATE NOT NULL DEFAULT (date('now'))")
    .replace(/DATE NOT NULL DEFAULT CURRENT_TIMESTAMP/gi, "DATE NOT NULL DEFAULT (date('now'))");
}

function initializeLocalSQLite(dbPath) {
  return new Promise((resolve, reject) => {
    console.log("=== Initializing Local SQLite Database ===");
    
    // Ensure parent directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
    });

    // Check if tables already exist (e.g. check suppliers count)
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='suppliers'", [], (err, row) => {
      if (err) return reject(err);
      if (row) {
        console.log("[INFO] Database already exists and is initialized.");
        return resolve(db);
      }

      // Read schema and seed files
      try {
        const schemaPath = path.resolve(process.cwd(), '../database/schema.sql');
        const seedPath = path.resolve(process.cwd(), '../database/seed.sql');

        if (!fs.existsSync(schemaPath) || !fs.existsSync(seedPath)) {
          console.warn("[WARN] Schema or seed file missing. Creating empty database.");
          return resolve(db);
        }

        const schemaSql = convertPgToSqlite(fs.readFileSync(schemaPath, 'utf8'));
        const seedSql = convertPgToSqlite(fs.readFileSync(seedPath, 'utf8'));

        const schemaStmts = splitSqlStatements(schemaSql);
        const seedStmts = splitSqlStatements(seedSql);

        db.serialize(() => {
          // 1. Create Schema
          console.log(`Executing ${schemaStmts.length} schema statements...`);
          for (const stmt of schemaStmts) {
            db.run(stmt, (err) => {
              if (err) {
                console.error("Schema execution error:", err.message);
                console.error("Statement was:", stmt);
              }
            });
          }

          // 2. Seeding inside a transaction (makes it ultra-fast)
          console.log(`Seeding ${seedStmts.length} insert statements...`);
          db.run("BEGIN TRANSACTION");
          for (const stmt of seedStmts) {
            db.run(stmt, (err) => {
              if (err) {
                console.error("Seed execution error:", err.message);
              }
            });
          }
          db.run("COMMIT", (err) => {
            if (err) {
              console.error("[ERROR] Failed to commit seeding transaction:", err);
              reject(err);
            } else {
              console.log("[SUCCESS] SQLite database successfully seeded.");
              resolve(db);
            }
          });
        });

      } catch (fileErr) {
        reject(fileErr);
      }
    });
  });
}

export async function initDb() {
  if (config.isSupabase) {
    console.log("[INFO] Connecting to Supabase PostgreSQL database...");
    pgPool = new pg.Pool({
      connectionString: config.databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    // Test connection
    try {
      const client = await pgPool.connect();
      client.release();
      console.log("[SUCCESS] Successfully connected to Supabase.");
    } catch (err) {
      console.error("[ERROR] Supabase connection failed. Falling back to SQLite.", err.message);
      config.databaseUrl = '';
    }
  }

  if (!config.isSupabase) {
    console.log("[NOTICE] Supabase DATABASE_URL not found in env. Running in local SQLite mode.");
    const sqlitePath = path.resolve(process.cwd(), '../database/erp_local.db');
    sqliteDb = await initializeLocalSQLite(sqlitePath);
  }
}

/**
 * Runs a query. Returns result rows.
 */
export function query(sql, params = []) {
  if (config.isSupabase) {
    return pgPool.query(sql, params).then(res => res.rows);
  } else {
    // Translate syntax if query is using postgres style $1, $2 parameters
    let sqliteSql = sql;
    if (sql.includes('$1')) {
      sqliteSql = sql.replace(/\$(\d+)/g, '?');
    }
    return new Promise((resolve, reject) => {
      sqliteDb.all(sqliteSql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

/**
 * Runs a query that returns raw results, including column names.
 * Useful for NLQuery results dynamically formatting.
 */
export function queryRaw(sql, params = []) {
  if (config.isSupabase) {
    return pgPool.query(sql, params).then(res => ({
      columns: res.fields.map(f => f.name),
      rows: res.rows
    }));
  } else {
    let sqliteSql = sql;
    if (sql.includes('$1')) {
      sqliteSql = sql.replace(/\$(\d+)/g, '?');
    }
    return new Promise((resolve, reject) => {
      sqliteDb.all(sqliteSql, params, function(err, rows) {
        if (err) return reject(err);
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        resolve({ columns, rows });
      });
    });
  }
}
