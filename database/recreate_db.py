import os
import sqlite3
import re

DB_PATH = 'C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/erp_local.db'
SCHEMA_PATH = 'C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/schema.sql'
SEED_PATH = 'C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/seed.sql'

def recreate_and_seed():
    print("=== Recreating Local SQLite Database ===")
    
    # 1. Delete existing DB
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
            print("Deleted existing erp_local.db")
        except Exception as e:
            print(f"Error deleting database file: {e}")
            return
            
    # 2. Open new database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 3. Read and adapt schema.sql
    if os.path.exists(SCHEMA_PATH):
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
            
        schema_sql = re.sub(r'CREATE EXTENSION.*?;', '', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'vector\(\d+\)', 'TEXT', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'DECIMAL\(\d+,\s*\d+\)', 'REAL', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'TIMESTAMP WITH TIME ZONE', 'TIMESTAMP', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'DATE NOT NULL DEFAULT CURRENT_DATE', 'DATE NOT NULL DEFAULT (date(\'now\'))', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'DATE NOT NULL DEFAULT CURRENT_TIMESTAMP', 'DATE NOT NULL DEFAULT (date(\'now\'))', schema_sql, flags=re.IGNORECASE)
        
        statements = schema_sql.split(';')
        for stmt in statements:
            stmt = stmt.strip()
            if stmt:
                try:
                    cursor.execute(stmt)
                except Exception as e:
                    print(f"Error executing schema statement: {e}\nStatement: {stmt}")
        conn.commit()
        print("[SUCCESS] Schema created successfully.")
    else:
        print("[ERROR] schema.sql not found!")
        conn.close()
        return

    # 4. Read and execute seed.sql
    if os.path.exists(SEED_PATH):
        with open(SEED_PATH, 'r', encoding='utf-8') as f:
            seed_sql = f.read()
            
        statements = seed_sql.split(';')
        print(f"Loading {len(statements)} seed statements...")
        
        # In python sqlite3, calling cursor.execute() on inserts automatically handles transactions.
        # We don't run BEGIN TRANSACTION manually to prevent lock conflicts.
        success_count = 0
        error_count = 0
        
        for stmt in statements:
            stmt = stmt.strip()
            if stmt:
                try:
                    cursor.execute(stmt)
                    success_count += 1
                except Exception as e:
                    error_count += 1
                    # Log only the first 5 errors to avoid flooding
                    if error_count <= 5:
                        print(f"Error running seed statement: {e}\nStatement: {stmt[:100]}...")
                        
        conn.commit()
        print(f"[SUCCESS] Seeding complete. Successfully executed {success_count} statements ({error_count} errors).")
    else:
        print("[ERROR] seed.sql not found!")
        
    # 5. Check row count to verify database population
    print("\n--- Verifying Database Table Counts ---")
    tables = ['suppliers', 'buyers', 'finished_goods', 'tech_packs', 'sales_orders', 'sales_invoices']
    for t in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {t};")
            count = cursor.fetchone()[0]
            print(f"Table '{t}': {count} rows")
        except Exception as e:
            print(f"Table '{t}' query failed: {e}")
            
    conn.close()

if __name__ == "__main__":
    recreate_and_seed()
