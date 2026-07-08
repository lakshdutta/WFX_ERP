import random
from datetime import datetime, timedelta

def generate_seed_data(num_finished_goods=200, num_orders=600):
    # Setup seed for reproducibility
    random.seed(42)
    
    # 1. Suppliers Data
    suppliers = [
        {"name": "Vardhman Textiles Ltd", "email": "info@vardhman.com", "phone": "+91-161-2228943", "address": "Ludhiana, Punjab, India"},
        {"name": "Arvind Mills", "email": "contact@arvind.in", "phone": "+91-79-68268000", "address": "Ahmedabad, Gujarat, India"},
        {"name": "Welspun India", "email": "sales@welspun.com", "phone": "+91-22-66136000", "address": "Mumbai, Maharashtra, India"},
        {"name": "Raymond Ltd", "email": "support@raymond.in", "phone": "+91-22-40349000", "address": "Thane, Maharashtra, India"},
        {"name": "Sutlej Textiles", "email": "export@sutlejtextiles.com", "phone": "+91-22-4219 8800", "address": "Mumbai, India"},
        {"name": "Page Industries", "email": "supplier@pageind.com", "phone": "+91-80-49454545", "address": "Bengaluru, Karnataka, India"},
        {"name": "KPR Mill Limited", "email": "kpr@kprmill.com", "phone": "+91-422-2207777", "address": "Coimbatore, Tamil Nadu, India"},
        {"name": "Trident Group", "email": "trident@tridentindia.com", "phone": "+91-161-5039999", "address": "Barnala, Punjab, India"},
        {"name": "Loyal Textile Mills", "email": "loyal@loyaltextiles.com", "phone": "+91-44-42261111", "address": "Chennai, Tamil Nadu, India"},
        {"name": "Shahi Exports", "email": "sourcing@shahi.co.in", "phone": "+91-129-4281000", "address": "Faridabad, Haryana, India"}
    ]
    
    # 2. Buyers Data
    buyers = [
        {"name": "Reliance Retail", "email": "buying@reliance.com", "phone": "+91-22-44770000", "address": "Navi Mumbai, India"},
        {"name": "Aditya Birla Fashion & Retail", "email": "abfrl.buyer@adityabirla.com", "phone": "+91-86579-79000", "address": "Mumbai, India"},
        {"name": "Tata Trent (Westside)", "email": "westside@trent-tata.com", "phone": "+91-22-67099000", "address": "Mumbai, India"},
        {"name": "Zara India (Inditex)", "email": "purchasing@zara.in", "phone": "+91-11-46060000", "address": "New Delhi, India"},
        {"name": "H&M India", "email": "hm.buying@hm.com", "phone": "+91-11-66440000", "address": "Gurugram, Haryana, India"},
        {"name": "Marks & Spencer India", "email": "sourcing@marksandspencer.in", "phone": "+91-124-4888000", "address": "Gurugram, India"},
        {"name": "Lifestyle International", "email": "lifestyle@landmarkgroup.in", "phone": "+91-80-41000000", "address": "Bengaluru, India"},
        {"name": "Shoppers Stop", "email": "merch@shoppersstop.com", "phone": "+91-22-42497000", "address": "Mumbai, India"},
        {"name": "Max Fashion", "email": "max.buyer@landmarkgroup.in", "phone": "+91-80-41001111", "address": "Bengaluru, India"},
        {"name": "Myntra Designs", "email": "vendors@myntra.com", "phone": "+91-80-61561999", "address": "Bengaluru, India"},
        {"name": "Nykaa Fashion", "email": "buying@nykaa.com", "phone": "+91-22-66141000", "address": "Mumbai, India"},
        {"name": "Fabindia Overseas", "email": "artisans@fabindia.net", "phone": "+91-11-40692000", "address": "New Delhi, India"},
        {"name": "Pantaloons", "email": "merchandiser@pantaloons.in", "phone": "+91-22-66253000", "address": "Mumbai, India"},
        {"name": "Decathlon India", "email": "sports@decathlon.in", "phone": "+91-76767-24321", "address": "Bengaluru, India"},
        {"name": "Benetton India", "email": "buying@benetton.co.in", "phone": "+91-124-4876000", "address": "Gurugram, India"},
        {"name": "Puma India", "email": "retail@puma.com", "phone": "+91-80-40224000", "address": "Bengaluru, India"},
        {"name": "Adidas India", "email": "sourcing@adidas.com", "phone": "+91-124-4553000", "address": "Gurugram, India"},
        {"name": "Ajio", "email": "merchant@ajio.com", "phone": "+91-22-44771111", "address": "Mumbai, India"},
        {"name": "Zivame", "email": "buying@zivame.com", "phone": "+91-80-68194444", "address": "Bengaluru, India"},
        {"name": "Peter England", "email": "sourcing@peterengland.in", "phone": "+91-80-40348000", "address": "Bengaluru, India"}
    ]
    
    # 3. Finished Goods Attributes
    categories = ['Dress', 'Shirt', 'Pants', 'Jacket', 'T-Shirt', 'Sweater', 'Skirt', 'Shorts']
    fabrics = ['Cotton', 'Silk', 'Linen', 'Polyester', 'Wool', 'Denim', 'Rayon', 'Nylon']
    colors = ['Crimson Red', 'Navy Blue', 'Forest Green', 'Charcoal Black', 'Ivory White', 
              'Mustard Yellow', 'Olive Green', 'Classic Beige', 'Lavender', 'Peach', 'Teal', 'Burgundy']
    
    # Generate Finished Goods
    finished_goods = []
    style_idx = 100
    for i in range(num_finished_goods):
        style_idx += 1
        style_number = f"SG-2026-{style_idx}"
        category = random.choice(categories)
        fabric = random.choice(fabrics)
        
        # Determine logical GSM based on fabric/category
        if fabric == 'Wool' or category == 'Jacket' or category == 'Sweater':
            gsm = random.randint(240, 450)
        elif fabric == 'Denim':
            gsm = random.randint(300, 500)
        elif fabric == 'Silk' or fabric == 'Rayon':
            gsm = random.randint(60, 120)
        else:
            gsm = random.randint(120, 220)
            
        color = random.choice(colors)
        
        # Determine price based on premiumness
        base_price = 250.00
        if fabric in ['Silk', 'Wool']:
            base_price *= 3.5
        elif fabric in ['Denim', 'Linen']:
            base_price *= 2.0
            
        if category in ['Jacket', 'Sweater']:
            base_price *= 2.5
            
        price_inr = round(base_price * random.uniform(0.8, 1.4), 2)
        stock_quantity = random.randint(10, 1500)
        supplier_id = random.randint(1, len(suppliers))
        
        finished_goods.append({
            "style_number": style_number,
            "category": category,
            "fabric": fabric,
            "gsm": gsm,
            "color": color,
            "price_inr": price_inr,
            "stock_quantity": stock_quantity,
            "supplier_id": supplier_id
        })
        
    # 4. Tech Packs Data
    tech_packs = []
    for fg in finished_goods:
        style_number = fg["style_number"]
        category = fg["category"]
        fabric = fg["fabric"]
        gsm = fg["gsm"]
        color = fg["color"]
        
        specs = (
            f"Tech Pack details for Style {style_number}. "
            f"A premium {color} {category} made from {gsm} GSM {fabric}. "
            f"Features reinforced stitching, standard sizing template fit, and customized branding label. "
            f"Pre-shrunk fabric treatment applied. Tailored cuffs and custom buttons included."
        )
        
        # Create a mock 512-dimension normalized vector embedding
        # To make it semantically interesting, let's base it on category and fabric
        emb_base = [0.0] * 512
        # Use hashing of category/fabric to seed values so similar fabrics/categories cluster slightly
        cat_hash = hash(category) % 512
        fab_hash = hash(fabric) % 512
        emb_base[cat_hash] = 0.5
        emb_base[fab_hash] = 0.5
        # Add random noise
        for j in range(512):
            emb_base[j] += random.gauss(0, 0.05)
            
        # Normalize the embedding
        mag = sum(x**2 for x in emb_base)**0.5
        normalized_emb = [round(x/mag, 6) for x in emb_base]
        
        # Create a mock image URL using Unsplash matching category
        img_keywords = f"{color.replace(' ', '-')}-{fabric.lower()}-{category.lower()}"
        image_url = f"https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&w=400&q=80&sig={random.randint(1, 1000)}"
        
        tech_packs.append({
            "style_number": style_number,
            "specification_details": specs,
            "image_url": image_url,
            "image_embedding": normalized_emb
        })
        
    # 5. Sales Orders & 6. Invoices Data
    sales_orders = []
    sales_invoices = []
    
    start_date = datetime(2025, 1, 1)
    order_idx = 10000
    invoice_idx = 20000
    
    for i in range(num_orders):
        order_idx += 1
        order_number = f"ORD-{order_idx}"
        buyer_id = random.randint(1, len(buyers))
        
        # Pick a random finished good
        fg = random.choice(finished_goods)
        style_number = fg["style_number"]
        unit_price = fg["price_inr"]
        
        # Higher volume for cheaper items
        if unit_price > 2000:
            quantity = random.randint(10, 80)
        elif unit_price > 1000:
            quantity = random.randint(20, 150)
        else:
            quantity = random.randint(50, 400)
            
        # Date generation spreading across 1.5 years
        days_offset = random.randint(0, 540)
        order_date = start_date + timedelta(days=days_offset)
        
        status_pool = ['Delivered', 'Delivered', 'Delivered', 'Shipped', 'Pending', 'Cancelled']
        status = random.choice(status_pool)
        
        sales_orders.append({
            "order_number": order_number,
            "buyer_id": buyer_id,
            "style_number": style_number,
            "quantity": quantity,
            "order_date": order_date.strftime("%Y-%m-%d"),
            "status": status
        })
        
        # Invoices are created for all non-cancelled orders
        if status != 'Cancelled':
            invoice_idx += 1
            invoice_number = f"INV-{invoice_idx}"
            amount_inr = round(unit_price * quantity, 2)
            
            # Payment status logic based on status and dates
            days_since_order = (datetime(2026, 7, 7) - order_date).days
            
            if status == 'Delivered':
                payment_status = random.choice(['Paid', 'Paid', 'Paid', 'Pending'])
            else:
                payment_status = 'Pending'
                
            # If pending and old, mark as overdue
            due_days = 30
            due_date = order_date + timedelta(days=due_days)
            if payment_status == 'Pending' and days_since_order > due_days:
                payment_status = 'Overdue'
                
            sales_invoices.append({
                "invoice_number": invoice_number,
                "order_number": order_number,
                "amount_inr": amount_inr,
                "payment_status": payment_status,
                "issue_date": order_date.strftime("%Y-%m-%d"),
                "due_date": due_date.strftime("%Y-%m-%d")
            })
            
    # Now generate SQL scripts
    sql_lines = []
    sql_lines.append("-- Seeding ERP Platform Tables\n")
    
    # Suppliers
    sql_lines.append("-- Suppliers")
    for s in suppliers:
        name = s['name'].replace("'", "''")
        email = s['email']
        phone = s['phone']
        addr = s['address'].replace("'", "''")
        sql_lines.append(f"INSERT INTO suppliers (name, contact_email, phone, address) VALUES ('{name}', '{email}', '{phone}', '{addr}');")
        
    # Buyers
    sql_lines.append("\n-- Buyers")
    for b in buyers:
        name = b['name'].replace("'", "''")
        email = b['email']
        phone = b['phone']
        addr = b['address'].replace("'", "''")
        sql_lines.append(f"INSERT INTO buyers (name, contact_email, phone, address) VALUES ('{name}', '{email}', '{phone}', '{addr}');")
        
    # Finished Goods
    sql_lines.append("\n-- Finished Goods")
    for fg in finished_goods:
        style = fg['style_number']
        cat = fg['category']
        fab = fg['fabric']
        gsm = fg['gsm']
        col = fg['color']
        price = fg['price_inr']
        stock = fg['stock_quantity']
        sup_id = fg['supplier_id']
        sql_lines.append(
            f"INSERT INTO finished_goods (style_number, category, fabric, gsm, color, price_inr, stock_quantity, supplier_id) "
            f"VALUES ('{style}', '{cat}', '{fab}', {gsm}, '{col}', {price}, {stock}, {sup_id});"
        )
        
    # Tech Packs
    sql_lines.append("\n-- Tech Packs")
    for tp in tech_packs:
        style = tp['style_number']
        specs = tp['specification_details'].replace("'", "''")
        img = tp['image_url']
        emb = str(tp['image_embedding']).replace(" ", "")
        sql_lines.append(
            f"INSERT INTO tech_packs (style_number, specification_details, image_url, image_embedding) "
            f"VALUES ('{style}', '{specs}', '{img}', '{emb}');"
        )
        
    # Sales Orders
    sql_lines.append("\n-- Sales Orders")
    for o in sales_orders:
        ord_num = o['order_number']
        buyer = o['buyer_id']
        style = o['style_number']
        qty = o['quantity']
        odate = o['order_date']
        stat = o['status']
        sql_lines.append(
            f"INSERT INTO sales_orders (order_number, buyer_id, style_number, quantity, order_date, status) "
            f"VALUES ('{ord_num}', {buyer}, '{style}', {qty}, '{odate}', '{stat}');"
        )
        
    # Sales Invoices
    sql_lines.append("\n-- Sales Invoices")
    for inv in sales_invoices:
        inv_num = inv['invoice_number']
        ord_num = inv['order_number']
        amount = inv['amount_inr']
        stat = inv['payment_status']
        idate = inv['issue_date']
        ddate = inv['due_date']
        sql_lines.append(
            f"INSERT INTO sales_invoices (invoice_number, order_number, amount_inr, payment_status, issue_date, due_date) "
            f"VALUES ('{inv_num}', '{ord_num}', {amount}, '{stat}', '{idate}', '{ddate}');"
        )
        
    # Write to seed.sql
    with open("C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/seed.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
        
    print(f"Success! Generated seed.sql with:")
    print(f" - {len(suppliers)} Suppliers")
    print(f" - {len(buyers)} Buyers")
    print(f" - {len(finished_goods)} Finished Goods")
    print(f" - {len(tech_packs)} Tech Packs")
    print(f" - {len(sales_orders)} Sales Orders")
    print(f" - {len(sales_invoices)} Sales Invoices")

if __name__ == "__main__":
    generate_seed_data()
