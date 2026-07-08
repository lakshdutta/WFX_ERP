import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import json

from app.database import execute_query
from app.vector_helper import get_image_embedding, get_text_embedding
from app.ai_helper import generate_sql_query, generate_text_answer
from app.config import settings

app = FastAPI(title="ERP Exploration Platform API", version="1.0.0")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str

@app.get("/health")
def health_check():
    return {"status": "healthy", "supabase_connected": settings.is_supabase_configured}

@app.get("/api/stats")
def get_stats():
    """
    Returns dashboard statistics (Goods, Suppliers, Buyers, Orders, Revenue)
    and monthly trends.
    """
    try:
        # Finished Goods Count
        goods_res, _, _ = execute_query("SELECT COUNT(*) as count FROM finished_goods;")
        goods_count = goods_res[0]['count'] if goods_res else 0
        
        # Suppliers Count
        suppliers_res, _, _ = execute_query("SELECT COUNT(*) as count FROM suppliers;")
        suppliers_count = suppliers_res[0]['count'] if suppliers_res else 0
        
        # Buyers Count
        buyers_res, _, _ = execute_query("SELECT COUNT(*) as count FROM buyers;")
        buyers_count = buyers_res[0]['count'] if buyers_res else 0
        
        # Sales Orders Count
        orders_res, _, _ = execute_query("SELECT COUNT(*) as count FROM sales_orders;")
        orders_count = orders_res[0]['count'] if orders_res else 0
        
        # Total Revenue (Paid Invoices)
        rev_res, _, _ = execute_query("SELECT SUM(amount_inr) as total FROM sales_invoices WHERE payment_status = 'Paid';")
        total_revenue = float(rev_res[0]['total']) if rev_res and rev_res[0]['total'] is not None else 0.0
        
        # Monthly Revenue Trend (Last 6 Months)
        # Handle SQLite vs Postgres group/date formatting
        trend_sql = """
            SELECT 
                strftime('%Y-%m', issue_date) as month,
                SUM(amount_inr) as revenue,
                COUNT(invoice_number) as invoice_count
            FROM sales_invoices
            WHERE payment_status = 'Paid'
            GROUP BY month
            ORDER BY month DESC
            LIMIT 6;
        """
        try:
            trend_res, _, db_type = execute_query(trend_sql)
        except Exception:
            # Fallback for Postgres date formatting if strftime fails
            trend_sql_pg = """
                SELECT 
                    to_char(issue_date, 'YYYY-MM') as month,
                    SUM(amount_inr) as revenue,
                    COUNT(invoice_number) as invoice_count
                FROM sales_invoices
                WHERE payment_status = 'Paid'
                GROUP BY month
                ORDER BY month DESC
                LIMIT 6;
            """
            trend_res, _, db_type = execute_query(trend_sql_pg)
            
        trend_data = [{"month": r["month"], "revenue": float(r["revenue"]), "count": r["invoice_count"]} for r in reversed(trend_res)]
        
        # Category distribution
        cat_sql = "SELECT category, COUNT(*) as count FROM finished_goods GROUP BY category;"
        cat_res, _, _ = execute_query(cat_sql)
        category_distribution = [{"category": r["category"], "count": r["count"]} for r in cat_res]
        
        return {
            "totals": {
                "finished_goods": goods_count,
                "suppliers": suppliers_count,
                "buyers": buyers_count,
                "sales_orders": orders_count,
                "revenue_inr": total_revenue
            },
            "revenue_trend": trend_data,
            "categories": category_distribution
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error gathering stats: {str(e)}")

@app.post("/api/query")
def natural_language_query(req: QueryRequest):
    """
    NL2SQL Endpoint: Converts natural language question to SQL,
    executes query on database, and generates summary text answer.
    """
    try:
        sql = generate_sql_query(req.question)
        # Execute generated SQL query
        results, columns, db_type = execute_query(sql)
        # Generate final text answer
        answer = generate_text_answer(req.question, sql, results)
        
        return {
            "question": req.question,
            "sql": sql,
            "columns": columns,
            "results": results[:100], # Cap display results at 100
            "answer": answer,
            "db_type": db_type
        }
    except Exception as e:
        # Return SQL generation even on execution failure to help debugging
        return {
            "question": req.question,
            "sql": locals().get("sql", "Not compiled"),
            "error": str(e),
            "answer": "Failed to execute the generated query. There might be a schema mismatch."
        }

@app.get("/api/search")
def search_products(
    q: str = Query(None),
    category: str = Query(None),
    fabric: str = Query(None),
    min_gsm: int = Query(None),
    max_gsm: int = Query(None),
    sort_by: str = Query("style_number"),
    sort_dir: str = Query("asc"),
    page: int = Query(1),
    limit: int = Query(12)
):
    """
    Handles structured search filters and free text searches
    for Finished Goods.
    """
    try:
        # Base query with join to Supplier and Tech Pack
        base_select = """
            SELECT fg.style_number, fg.category, fg.fabric, fg.gsm, fg.color, 
                   fg.price_inr, fg.stock_quantity, s.name as supplier_name, 
                   tp.image_url, tp.specification_details
            FROM finished_goods fg
            LEFT JOIN suppliers s ON fg.supplier_id = s.id
            LEFT JOIN tech_packs tp ON fg.style_number = tp.style_number
        """
        
        where_clauses = []
        params = []
        
        # Category filter
        if category:
            cats = [c.strip() for c in category.split(",")]
            where_clauses.append("fg.category IN (" + ",".join([f"'{c}'" for c in cats]) + ")")
            
        # Fabric filter
        if fabric:
            fabs = [f.strip() for f in fabric.split(",")]
            where_clauses.append("fg.fabric IN (" + ",".join([f"'{f}'" for f in fabs]) + ")")
            
        # GSM range
        if min_gsm is not None:
            where_clauses.append(f"fg.gsm >= {min_gsm}")
        if max_gsm is not None:
            where_clauses.append(f"fg.gsm <= {max_gsm}")
            
        # Free Text query (supports fabric, category, color, specifications search)
        if q:
            term = q.lower().strip()
            where_clauses.append(f"""
                (LOWER(fg.style_number) LIKE '%{term}%' OR
                 LOWER(fg.category) LIKE '%{term}%' OR
                 LOWER(fg.fabric) LIKE '%{term}%' OR
                 LOWER(fg.color) LIKE '%{term}%' OR
                 LOWER(tp.specification_details) LIKE '%{term}%')
            """)
            
        # Assemble WHERE clause
        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)
            
        # Total count query for pagination
        count_sql = f"SELECT COUNT(*) as count FROM finished_goods fg LEFT JOIN tech_packs tp ON fg.style_number = tp.style_number {where_sql};"
        count_res, _, _ = execute_query(count_sql)
        total_items = count_res[0]['count'] if count_res else 0
        
        # Order and Pagination
        valid_sort_cols = ["style_number", "price_inr", "gsm", "stock_quantity", "category", "fabric"]
        if sort_by not in valid_sort_cols:
            sort_by = "style_number"
        if sort_dir.lower() not in ["asc", "desc"]:
            sort_dir = "asc"
            
        offset = (page - 1) * limit
        order_limit_sql = f" ORDER BY fg.{sort_by} {sort_dir} LIMIT {limit} OFFSET {offset};"
        
        # Execute items query
        final_sql = base_select + where_sql + order_limit_sql
        items, _, _ = execute_query(final_sql)
        
        return {
            "items": items,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_items": total_items,
                "total_pages": int(np.ceil(total_items / limit)) if total_items > 0 else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/api/search-image")
async def search_by_image(
    image: UploadFile = File(None),
    text_fallback: str = Form(None)
):
    """
    Image similarity search.
    Generates embedding for uploaded image (or query text) and runs
    cosine similarity search on tech pack vector column.
    """
    try:
        # Generate embedding
        if image:
            contents = await image.read()
            query_embedding = get_image_embedding(contents)
        elif text_fallback:
            query_embedding = get_text_embedding(text_fallback)
        else:
            raise HTTPException(status_code=400, detail="Either an image file or text_fallback search query is required.")
            
        # Execute Vector search
        # 1. Supabase Postgres with pgvector
        # 2. SQLite local fallback with pure python similarity math
        
        # Try fetching all tech pack embeddings to see if we are in Postgres or SQLite
        try:
            # Let's perform a check query to see if we can use postgres pgvector <=> syntax
            postgres_vector_sql = f"""
                SELECT tp.style_number, tp.image_url, tp.specification_details,
                       fg.category, fg.fabric, fg.gsm, fg.price_inr, fg.color,
                       (1 - (tp.image_embedding <=> '{query_embedding}'::vector)) as similarity
                FROM tech_packs tp
                JOIN finished_goods fg ON tp.style_number = fg.style_number
                ORDER BY tp.image_embedding <=> '{query_embedding}'::vector
                LIMIT 8;
            """
            results, _, db_type = execute_query(postgres_vector_sql)
            if db_type == "postgres":
                return {"items": results, "search_method": "postgres-pgvector"}
        except Exception as pg_err:
            print(f"Postgres vector search failed or database is SQLite: {pg_err}. Using SQLite Python fallback.")
            
        # SQLite / Local Python vector search fallback
        # Fetch all tech packs, load embeddings, compute similarity, sort
        tp_sql = "SELECT style_number, image_url, specification_details, image_embedding FROM tech_packs;"
        tech_packs, _, _ = execute_query(tp_sql)
        
        scored_items = []
        q_vec = np.array(query_embedding)
        
        for tp in tech_packs:
            emb_str = tp.get("image_embedding")
            if not emb_str:
                continue
                
            try:
                # Embedding is stored as JSON array string like "[0.12, -0.4, ...]" in SQLite
                if isinstance(emb_str, str):
                    emb_arr = json.loads(emb_str)
                else:
                    emb_arr = list(emb_str) # Already list/array
                
                tp_vec = np.array(emb_arr)
                if len(tp_vec) != len(q_vec):
                    continue
                    
                # Cosine Similarity = dot(A, B) / (norm(A) * norm(B))
                dot_prod = np.dot(q_vec, tp_vec)
                norm_q = np.linalg.norm(q_vec)
                norm_tp = np.linalg.norm(tp_vec)
                
                similarity = float(dot_prod / (norm_q * norm_tp)) if norm_q > 0 and norm_tp > 0 else 0.0
                scored_items.append((tp["style_number"], similarity, tp["image_url"], tp["specification_details"]))
            except Exception as parse_err:
                print(f"Error parsing embedding for style {tp.get('style_number')}: {parse_err}")
                
        # Sort by similarity DESC
        scored_items.sort(key=lambda x: x[1], reverse=True)
        top_items = scored_items[:8]
        
        # Load style details for top items
        final_items = []
        for style_num, similarity, img_url, specs in top_items:
            fg_sql = f"SELECT category, fabric, gsm, price_inr, color FROM finished_goods WHERE style_number = '{style_num}';"
            fg_res, _, _ = execute_query(fg_sql)
            if fg_res:
                fg = fg_res[0]
                final_items.append({
                    "style_number": style_num,
                    "image_url": img_url,
                    "specification_details": specs,
                    "category": fg["category"],
                    "fabric": fg["fabric"],
                    "gsm": fg["gsm"],
                    "price_inr": float(fg["price_inr"]),
                    "color": fg["color"],
                    "similarity": similarity
                })
                
        return {"items": final_items, "search_method": "local-python-cosine"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image search failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
