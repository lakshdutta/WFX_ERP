    -- ERP Exploration Platform Schema Definition
    -- Enables pgvector extension for image similarity search
    CREATE EXTENSION IF NOT EXISTS vector;

    -- Enable uuid-ossp for UUID generation if needed
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Drop existing tables for clean re-seeding
    DROP TABLE IF EXISTS sales_invoices CASCADE;
    DROP TABLE IF EXISTS sales_orders CASCADE;
    DROP TABLE IF EXISTS tech_packs CASCADE;
    DROP TABLE IF EXISTS finished_goods CASCADE;
    DROP TABLE IF EXISTS buyers CASCADE;
    DROP TABLE IF EXISTS suppliers CASCADE;

    -- 1. Suppliers Table
    CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL, -- Company Name
        contact_email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        country VARCHAR(100),
        contact VARCHAR(100),
        lead_time INTEGER, -- Lead time in days
        rating DECIMAL(3, 1),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Buyers Table
    CREATE TABLE IF NOT EXISTS buyers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL, -- Company Name
        contact_email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        country VARCHAR(100),
        buyer_category VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Finished Goods Table
    CREATE TABLE IF NOT EXISTS finished_goods (
        style_number VARCHAR(100) PRIMARY KEY,
        style_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        fabric VARCHAR(100) NOT NULL,
        gsm INTEGER NOT NULL,
        color VARCHAR(50) NOT NULL,
        print VARCHAR(100),
        season VARCHAR(50),
        brand VARCHAR(100),
        cost DECIMAL(12, 2) NOT NULL,
        price_inr DECIMAL(12, 2) NOT NULL, -- Selling Price
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Tech Packs Table
    CREATE TABLE IF NOT EXISTS tech_packs (
        id SERIAL PRIMARY KEY,
        style_number VARCHAR(100) REFERENCES finished_goods(style_number) ON DELETE CASCADE,
        fabric_details TEXT,
        construction TEXT,
        wash_instructions TEXT,
        specification_details TEXT, -- Retained for backward compatibility
        image_url TEXT,
        image_embedding vector(512),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Sales Orders Table
    CREATE TABLE IF NOT EXISTS sales_orders (
        order_number VARCHAR(100) PRIMARY KEY,
        buyer_id INTEGER REFERENCES buyers(id) ON DELETE SET NULL,
        style_number VARCHAR(100) REFERENCES finished_goods(style_number) ON DELETE SET NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        shipment_date DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Sales Invoices Table
    CREATE TABLE IF NOT EXISTS sales_invoices (
        invoice_number VARCHAR(100) PRIMARY KEY,
        order_number VARCHAR(100) REFERENCES sales_orders(order_number) ON DELETE CASCADE,
        amount_inr DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_finished_goods_category ON finished_goods(category);
    CREATE INDEX IF NOT EXISTS idx_finished_goods_fabric ON finished_goods(fabric);
    CREATE INDEX IF NOT EXISTS idx_finished_goods_print ON finished_goods(print);
    CREATE INDEX IF NOT EXISTS idx_finished_goods_season ON finished_goods(season);
    CREATE INDEX IF NOT EXISTS idx_sales_orders_buyer ON sales_orders(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_invoices_order ON sales_invoices(order_number);
        