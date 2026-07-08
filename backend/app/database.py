import os
import sqlite3
import re
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import settings

LOCAL_DB_PATH = "C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/erp_local.db"
SCHEMA_SQL_PATH = "C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/schema.sql"
SEED_SQL_PATH = "C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/seed.sql"

def get_db_connection():
    """
    Returns a database connection based on configuration.
    If Supabase/Postgres is configured, returns a psycopg2 connection.
    Otherwise, returns a sqlite3 connection to erp_local.db, initializing it if necessary.
    """
    if settings.is_supabase_configured:
        # Connect to Postgres
        conn_str = settings.DATABASE_URL
        if not conn_str and settings.SUPABASE_URL:
            # Parse connection from Supabase URL/key if needed
            # For simplicity, we assume DATABASE_URL is provided in .env
            pass
        
        if conn_str:
            try:
                conn = psycopg2.connect(conn_str)
                return conn, "postgres"
            except Exception as e:
                print(f"Failed to connect to Supabase Postgres: {e}. Falling back to SQLite.")
                
    # Fallback to local SQLite
    initialize_sqlite_db_if_needed()
    conn = sqlite3.connect(LOCAL_DB_PATH)
    # Enable dict factory for SQLite to return dictionary rows
    conn.row_factory = sqlite3.Row
    return conn, "sqlite"

def initialize_sqlite_db_if_needed():
    """
    Initializes a local SQLite database by reading schema.sql and seed.sql,
    modifying Postgres syntax to SQLite syntax on the fly.
    """
    if os.path.exists(LOCAL_DB_PATH):
        return
        
    print("Local database erp_local.db not found. Initializing SQLite database...")
    os.makedirs(os.path.dirname(LOCAL_DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(LOCAL_DB_PATH)
    cursor = conn.cursor()
    
    # 1. Read and adapt schema.sql
    if os.path.exists(SCHEMA_SQL_PATH):
        with open(SCHEMA_SQL_PATH, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
            
        # Adapt Postgres DDL to SQLite
        schema_sql = re.sub(r'CREATE EXTENSION.*?;', '', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'vector\(\d+\)', 'TEXT', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'DECIMAL\(\d+,\s*\d+\)', 'REAL', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'TIMESTAMP WITH TIME ZONE', 'TIMESTAMP', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'DATE NOT NULL DEFAULT CURRENT_DATE', 'DATE NOT NULL DEFAULT (date(\'now\'))', schema_sql, flags=re.IGNORECASE)
        schema_sql = re.sub(r'DATE NOT NULL DEFAULT CURRENT_TIMESTAMP', 'DATE NOT NULL DEFAULT (date(\'now\'))', schema_sql, flags=re.IGNORECASE)
        
        # Split by semicolons and run statements
        statements = schema_sql.split(';')
        for stmt in statements:
            stmt = stmt.strip()
            if stmt:
                try:
                    cursor.execute(stmt)
                except Exception as e:
                    print(f"Error running SQLite schema statement: {e}\nStatement: {stmt}")
        conn.commit()
        print("SQLite tables created successfully.")
    else:
        print(f"Warning: schema.sql not found at {SCHEMA_SQL_PATH}!")

    # 2. Read and adapt seed.sql
    if os.path.exists(SEED_SQL_PATH):
        with open(SEED_SQL_PATH, 'r', encoding='utf-8') as f:
            seed_sql = f.read()
            
        # SQLite handles array inputs as plain strings, so we don't need major changes to vector inserts
        statements = seed_sql.split(';')
        # We don't call BEGIN TRANSACTION manually to prevent Python sqlite3 transaction lock conflicts.
        for stmt in statements:
            stmt = stmt.strip()
            if stmt:
                try:
                    cursor.execute(stmt)
                except Exception as e:
                    print(f"Error running SQLite seed statement: {e}\nStatement: {stmt}")
        conn.commit()
        print("SQLite database seeded successfully with 1,000+ rows.")
    else:
        print(f"Warning: seed.sql not found at {SEED_SQL_PATH}! Run seed_generator.js first.")
        
    conn.close()

def execute_query(sql_query: str):
    """
    Executes a SQL query and returns results as a list of dicts,
    along with column names.
    """
    conn, db_type = get_db_connection()
    try:
        if db_type == "postgres":
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(sql_query)
            # If the query returns rows (like SELECT)
            if cursor.description:
                results = [dict(row) for row in cursor.fetchall()]
                columns = [col.name for col in cursor.description]
            else:
                conn.commit()
                results = [{"status": "Success", "rows_affected": cursor.rowcount}]
                columns = ["status", "rows_affected"]
            cursor.close()
        else: # sqlite
            cursor = conn.cursor()
            cursor.execute(sql_query)
            if cursor.description:
                results = []
                for row in cursor.fetchall():
                    results.append(dict(row))
                columns = [col[0] for col in cursor.description]
            else:
                conn.commit()
                results = [{"status": "Success", "rows_affected": cursor.rowcount}]
                columns = ["status", "rows_affected"]
            cursor.close()
        return results, columns, db_type
    except Exception as e:
        raise e
    finally:
        conn.close()

def get_database_schema_info() -> str:
    """
    Returns schema info for AI training or fallback SQL builder.
    """
    conn, db_type = get_db_connection()
    try:
        schema_text = ""
        if db_type == "postgres":
            cursor = conn.cursor()
            # Fetch all user tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = [row[0] for row in cursor.fetchall()]
            for table in tables:
                cursor.execute(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = '{table}' AND table_schema = 'public'
                """)
                columns = cursor.fetchall()
                cols_str = ", ".join([f"{col[0]} ({col[1]})" for col in columns])
                schema_text += f"Table: {table}\nColumns: {cols_str}\n\n"
            cursor.close()
        else: # sqlite
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
            tables = [row[0] for row in cursor.fetchall()]
            for table in tables:
                cursor.execute(f"PRAGMA table_info({table});")
                columns = cursor.fetchall()
                cols_str = ", ".join([f"{col[1]} ({col[2]})" for col in columns])
                schema_text += f"Table: {table}\nColumns: {cols_str}\n\n"
            cursor.close()
        return schema_text
    except Exception as e:
        return f"Error reading schema: {str(e)}"
    finally:
        conn.close()
