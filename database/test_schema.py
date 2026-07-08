import sqlite3
import re
import os

DB_PATH = 'C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/test_temp2.db'
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

SCHEMA_PATH = 'C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/schema.sql'
with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
    sql = f.read()

sql = re.sub(r'CREATE EXTENSION.*?;', '', sql, flags=re.IGNORECASE)
sql = re.sub(r'SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT', sql, flags=re.IGNORECASE)
sql = re.sub(r'vector\(\d+\)', 'TEXT', sql, flags=re.IGNORECASE)
sql = re.sub(r'DECIMAL\(\d+,\s*\d+\)', 'REAL', sql, flags=re.IGNORECASE)
sql = re.sub(r'TIMESTAMP WITH TIME ZONE', 'TIMESTAMP', sql, flags=re.IGNORECASE)
sql = re.sub(r'DATE NOT NULL DEFAULT CURRENT_DATE', 'DATE NOT NULL DEFAULT (date(\'now\'))', sql, flags=re.IGNORECASE)
sql = re.sub(r'DATE NOT NULL DEFAULT CURRENT_TIMESTAMP', 'DATE NOT NULL DEFAULT (date(\'now\'))', sql, flags=re.IGNORECASE)

statements = sql.split(';')
print(f"Total schema statements to execute: {len(statements)}")

for idx, stmt in enumerate(statements):
    stmt = stmt.strip()
    if not stmt:
        continue
    print(f"\n--- Executing statement {idx} ---")
    print(stmt)
    try:
        cursor.execute(stmt)
        print("Success!")
    except Exception as e:
        print(f"FAILED: {e}")

conn.commit()
print("\n--- Verifying Tables after Commit ---")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("Tables:", cursor.fetchall())
conn.close()
