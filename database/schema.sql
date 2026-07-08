    -- ERP Exploration Platform Schema Definition
    -- Enables pgvector extension for image similarity search
    CREATE EXTENSION IF NOT EXISTS vector;

    -- Enable uuid-ossp for UUID generation if needed
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- 1. Suppliers Table
    CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Buyers Table
    CREATE TABLE IF NOT EXISTS buyers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Finished Goods Table
    CREATE TABLE IF NOT EXISTS finished_goods (
        style_number VARCHAR(100) PRIMARY KEY,
        category VARCHAR(100) NOT NULL, -- e.g., 'Dress', 'Shirt', 'Pants', 'Jacket'
        fabric VARCHAR(100) NOT NULL,   -- e.g., 'Cotton', 'Silk', 'Linen', 'Polyester'
        gsm INTEGER NOT NULL,            -- Grams per Square Meter (e.g., 120, 180, 240)
        color VARCHAR(50) NOT NULL,      -- e.g., 'Blue', 'Black', 'White', 'Red'
        price_inr DECIMAL(12, 2) NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Tech Packs Table (Product tech specs and design vectors)
    CREATE TABLE IF NOT EXISTS tech_packs (
        id SERIAL PRIMARY KEY,
        style_number VARCHAR(100) REFERENCES finished_goods(style_number) ON DELETE CASCADE,
        specification_details TEXT,      -- Details about sewing, dimensions, structure
        image_url TEXT,                  -- URL or path to the sketch/garment image
        image_embedding vector(512),     -- 512-dimensional vector embedding (e.g., CLIP ViT-B/32)
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Sales Orders Table
    CREATE TABLE IF NOT EXISTS sales_orders (
        order_number VARCHAR(100) PRIMARY KEY,
        buyer_id INTEGER REFERENCES buyers(id) ON DELETE SET NULL,
        style_number VARCHAR(100) REFERENCES finished_goods(style_number) ON DELETE SET NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Shipped', 'Delivered', 'Cancelled'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Sales Invoices Table
    CREATE TABLE IF NOT EXISTS sales_invoices (
        invoice_number VARCHAR(100) PRIMARY KEY,
        order_number VARCHAR(100) REFERENCES sales_orders(order_number) ON DELETE CASCADE,
        amount_inr DECIMAL(12, 2) NOT NULL,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Paid', 'Pending', 'Overdue'
        issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_finished_goods_category ON finished_goods(category);
    CREATE INDEX IF NOT EXISTS idx_finished_goods_fabric ON finished_goods(fabric);
    CREATE INDEX IF NOT EXISTS idx_sales_orders_buyer ON sales_orders(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_invoices_order ON sales_invoices(order_number);
        