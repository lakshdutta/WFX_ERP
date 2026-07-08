import re
from app.config import settings

# Global Vanna client holder
vanna_client = None

def init_vanna():
    """
    Initializes Vanna AI client if keys are available in the configuration.
    """
    global vanna_client
    if settings.VANNA_API_KEY and settings.OPENAI_API_KEY:
        try:
            # Note: We import inside to avoid hard crashes if vanna is not fully installed
            from vanna.openai.openai_chat import OpenAI_Chat
            from vanna.chromadb.chromadb_vector import ChromaDB_VectorStore
            
            class MyVanna(ChromaDB_VectorStore, OpenAI_Chat):
                def __init__(self, config=None):
                    ChromaDB_VectorStore.__init__(self, config=config)
                    OpenAI_Chat.__init__(self, config=config)
                    
            vanna_client = MyVanna(config={
                'api_key': settings.OPENAI_API_KEY,
                'model': 'gpt-4o',
                'path': './vanna_chroma'
            })
            
            # Train on schema if not already trained
            train_vanna(vanna_client)
            print("Successfully initialized Vanna AI with OpenAI GPT-4o.")
        except Exception as e:
            print(f"Failed to initialize Vanna client: {e}. Falling back to Rule-Based SQL Generator.")
            vanna_client = None

def train_vanna(client):
    """
    Trains Vanna client on the ERP schema and sample questions.
    """
    try:
        from app.database import SCHEMA_SQL_PATH
        import os
        if os.path.exists(SCHEMA_SQL_PATH):
            with open(SCHEMA_SQL_PATH, 'r') as f:
                schema_ddl = f.read()
            # Train Vanna on DDL
            client.train(ddl=schema_ddl)
            
            # Train on typical query-SQL pairs (few-shot training)
            client.train(
                question="Show pending invoices above ₹1,000",
                sql="SELECT invoice_number, order_number, amount_inr, payment_status, issue_date FROM sales_invoices WHERE payment_status = 'Pending' AND amount_inr > 1000;"
            )
            client.train(
                question="What is the total revenue by buyer?",
                sql="SELECT b.name AS buyer_name, SUM(i.amount_inr) AS total_revenue FROM buyers b JOIN sales_orders o ON b.id = o.buyer_id JOIN sales_invoices i ON o.order_number = i.order_number GROUP BY b.name ORDER BY total_revenue DESC;"
            )
            client.train(
                question="List style numbers with fabric Silk and GSM above 150",
                sql="SELECT style_number, category, fabric, gsm, price_inr FROM finished_goods WHERE fabric = 'Silk' AND gsm > 150;"
            )
            print("Vanna training complete.")
    except Exception as e:
        print(f"Error training Vanna: {e}")

def generate_sql_query(user_question: str) -> str:
    """
    Generates SQL based on natural language query.
    Uses Vanna AI if configured, otherwise falls back to a rule-based regex mapper.
    """
    global vanna_client
    if vanna_client is None:
        init_vanna()
        
    if vanna_client:
        try:
            return vanna_client.generate_sql(user_question)
        except Exception as e:
            print(f"Vanna generation failed: {e}. Using rule-based fallback.")
            
    # Rule-based fallback (regex matching for standard ERP questions)
    q = user_question.lower().strip()
    
    # 1. "Show pending invoices above ₹1,000"
    if "pending" in q and "invoice" in q and ("above" in q or "greater" in q or ">" in q):
        # Extract number
        nums = re.findall(r'\d+', q.replace(',', ''))
        amount = nums[0] if nums else "1000"
        return f"SELECT invoice_number, order_number, amount_inr, payment_status, due_date FROM sales_invoices WHERE payment_status = 'Pending' AND amount_inr > {amount} ORDER BY amount_inr DESC;"
        
    # 2. "What is the total revenue by buyer?" or "revenue by buyer"
    if "revenue" in q and "buyer" in q:
        return """SELECT b.name AS buyer_name, 
       COUNT(DISTINCT o.order_number) AS total_orders,
       SUM(i.amount_inr) AS total_revenue_inr
FROM buyers b
JOIN sales_orders o ON b.id = o.buyer_id
JOIN sales_invoices i ON o.order_number = i.order_number
WHERE i.payment_status = 'Paid'
GROUP BY b.name
ORDER BY total_revenue_inr DESC;"""

    # 3. "List style numbers with fabric Silk and GSM above 150"
    if "style" in q and "fabric" in q and "gsm" in q:
        # Extract fabric (e.g. Silk, Cotton)
        fabrics = ['cotton', 'silk', 'linen', 'polyester', 'wool', 'denim', 'rayon', 'nylon']
        found_fabric = "Silk"
        for f in fabrics:
            if f in q:
                found_fabric = f.capitalize()
                break
        # Extract GSM limit
        nums = re.findall(r'\d+', q)
        gsm_val = nums[0] if nums else "150"
        return f"SELECT style_number, category, fabric, gsm, color, price_inr, stock_quantity FROM finished_goods WHERE LOWER(fabric) = '{found_fabric.lower()}' AND gsm > {gsm_val} ORDER BY gsm ASC;"

    # 4. "Show all suppliers" / "List suppliers"
    if "supplier" in q:
        return "SELECT id, name, contact_email, phone, address FROM suppliers ORDER BY name ASC;"
        
    # 5. "Show all buyers" / "List buyers"
    if "buyer" in q:
        return "SELECT id, name, contact_email, phone, address FROM buyers ORDER BY name ASC;"

    # 6. "Total sales" / "Total revenue"
    if "total revenue" in q or "total sales" in q:
        return "SELECT SUM(amount_inr) AS total_revenue_inr, COUNT(invoice_number) AS total_invoices FROM sales_invoices WHERE payment_status = 'Paid';"

    # 7. "How many orders are pending?" or "pending orders"
    if "pending" in q and "order" in q:
        return "SELECT order_number, buyer_id, style_number, quantity, order_date, status FROM sales_orders WHERE status = 'Pending' ORDER BY order_date DESC;"

    # Default fallback - return a query showing recently created finished goods style numbers
    return "SELECT style_number, category, fabric, gsm, color, price_inr, stock_quantity FROM finished_goods LIMIT 10;"

def generate_text_answer(question: str, sql: str, results: list) -> str:
    """
    Generates a natural language summary of the SQL query results.
    """
    if not results:
        return "No records were found matching your criteria."
        
    q = question.lower()
    
    # 1. Invoices answer
    if "pending" in q and "invoice" in q:
        total_amt = sum(row.get('amount_inr', 0) for row in results)
        count = len(results)
        return f"Found **{count} pending invoices** totaling **₹{total_amt:,.2f}**. The highest pending invoice is **{results[0].get('invoice_number')}** for **₹{results[0].get('amount_inr', 0):,.2f}**."
        
    # 2. Revenue answer
    if "revenue" in q and "buyer" in q:
        top_buyer = results[0].get('buyer_name', 'N/A')
        top_rev = results[0].get('total_revenue_inr', 0)
        return f"The buyer generating the highest revenue is **{top_buyer}** with **₹{top_rev:,.2f}** in paid sales. A total of **{len(results)} buyers** have recordable purchases."
        
    # 3. Fabrics/GSM answer
    if "fabric" in q or "gsm" in q:
        return f"Found **{len(results)} styles** matching your fabric/GSM request. The matching style numbers are: {', '.join([row.get('style_number') for row in results[:5]])}{' and others' if len(results) > 5 else ''}."
        
    # Default text response summarizing fields
    return f"Query returned **{len(results)} rows**. Columns returned: {', '.join(results[0].keys())}."
