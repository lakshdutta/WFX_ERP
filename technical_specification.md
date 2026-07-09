# Aura ERP Exploration Platform - Technical Specification

---

## 1. Executive Summary & Design Goals

The **Aura ERP Exploration Platform** is a state-of-the-art AI-enabled web application designed to bridge the gap between complex enterprise resource planning data and non-technical business users. Traditional ERP systems require complex SQL query skills, static dashboards, or custom report generation from IT teams, which creates a operational bottleneck. 

This platform solves these problems through:
1. **Natural Language Interface (NL2SQL):** Allowing users to query their database in plain conversational English (e.g., "Show pending invoices above ₹1,000" or "What is our total revenue by buyer?") and instantly receive formatted charts, tables, and AI explanations.
2. **Dynamic Semantic Exploration:** Combining structured multi-factor filters (GSM, Fabric, Category) with vector embeddings (Pseudo-Embeddings) to support both text search and visual sketch-based image matching.
3. **Resilient Local-First Development Architecture:** Creating a hybrid environment that works seamlessly on online production servers (Supabase + OpenAI + Render/Vercel) while maintaining a zero-setup local SQLite mock fallback mode that behaves identically for local engineering teams.

---

## 2. System Architecture & Components

Aura ERP follows a modular three-tier architecture: Presentation, Application, and Storage.

```text
┌────────────────────────────────────────────────────────┐
│                   PRESENTATION TIER                    │
│      React App (Vite) + Vanilla CSS Variables UI       │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       HTTP REST Requests       Multipart Image Form
                │                        │
                ▼                        ▼
┌────────────────────────────────────────────────────────┐
│                    APPLICATION TIER                    │
│  Express Server (Router, Vectorizer, AI Translator)   │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
        Postgres TCP Pool        SQLite Connection (Fallback)
                │                        │
                ▼                        ▼
┌────────────────────────────────────────────────────────┐
│                      STORAGE TIER                      │
│        Supabase (pgvector) / SQLite Database           │
└────────────────────────────────────────────────────────┘
```

### 2.1 Storage Tier
The schema centers around six core relational tables:
- **Suppliers:** Manufacturers providing fabric mills and sewing services.
- **Buyers:** Retail companies placing sales orders.
- **Finished Goods:** The base style catalog containing category, fabric, GSM, color, price, and stock levels.
- **Tech Packs:** Detailed sewing specifications linked to style numbers, hosting `image_url` and `image_embedding` (a 512-dimension vector representing the visual concept).
- **Sales Orders:** Relational transactions mapping a buyer and style number to order quantity and shipping status.
- **Sales Invoices:** Bill records linked to sales orders tracking total payment status (Paid, Pending, Overdue).

To support semantic visual search, the storage tier enables:
- **pgvector:** A PostgreSQL extension adding vector data types. In our database, the `image_embedding` column uses `vector(512)`.
- **Cosine Distance Operators (`<=>`):** Used to calculate distance:
  $$\text{Cosine Distance}(A, B) = 1 - \frac{A \cdot B}{\|A\| \|B\|}$$
  This is optimized in Supabase via indexing for sub-second retrieval across thousands of rows.

### 2.2 Application Tier (Express/Node.js)
The backend service acts as a lightweight, async router:
- **Express.js Framework:** Selected for low execution overhead, high flexibility, and ease of integration in the Node.js ecosystem.
- **OpenAI & Heuristics Translation:** Generates SQL queries using GPT-4o with a database DDL schema prompt. If API keys are absent, the router utilizes heuristic rules to construct appropriate SQL statements, ensuring stable local testing.
- **Deterministic Pseudo-Embedding Generator:** Converts incoming images (buffers) or text search terms into a 512-dimension normalized unit vector deterministically using SHA-256 and a Mulberry32 PRNG. This avoids heavy external machine learning libraries and runs entirely offline out-of-the-box.

### 2.3 Presentation Tier (React)
The frontend UI is crafted as a premium single-page dashboard:
- **Vite Bundler:** Scaffolded for instant hot module reloading and lightweight production builds.
- **Vanilla CSS Variable System:** Rejects Tailwind in favor of complete design flexibility. Implements custom themes, glassmorphism card panels (`backdrop-filter: blur(16px)`), neon interactive borders, custom scrollbars, and keyframe animations for message bubbles.
- **React State Hooks:** Manages tabs, search inputs, active detail modals, and files.

---

## 3. Database Schema DDL

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Suppliers
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Buyers
CREATE TABLE buyers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Finished Goods
CREATE TABLE finished_goods (
    style_number VARCHAR(100) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    fabric VARCHAR(100) NOT NULL,
    gsm INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL,
    price_inr DECIMAL(12, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tech Packs
CREATE TABLE tech_packs (
    id SERIAL PRIMARY KEY,
    style_number VARCHAR(100) REFERENCES finished_goods(style_number) ON DELETE CASCADE,
    specification_details TEXT,
    image_url TEXT,
    image_embedding vector(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales Orders
CREATE TABLE sales_orders (
    order_number VARCHAR(100) PRIMARY KEY,
    buyer_id INTEGER REFERENCES buyers(id) ON DELETE SET NULL,
    style_number VARCHAR(100) REFERENCES finished_goods(style_number) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales Invoices
CREATE TABLE sales_invoices (
    invoice_number VARCHAR(100) PRIMARY KEY,
    order_number VARCHAR(100) REFERENCES sales_orders(order_number) ON DELETE CASCADE,
    amount_inr DECIMAL(12, 2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_finished_goods_category ON finished_goods(category);
CREATE INDEX idx_finished_goods_fabric ON finished_goods(fabric);
CREATE INDEX idx_sales_orders_buyer ON sales_orders(buyer_id);
CREATE INDEX idx_sales_invoices_order ON sales_invoices(order_number);
```

---

## 4. API Endpoint Specifications

### 4.1 Dashboard Statistics
- **Endpoint:** `GET /api/stats`
- **Description:** Pulls card totals, revenue curves, and catalog category ratios.
- **Response Headers:** `Content-Type: application/json`
- **Response Payload:**
  ```json
  {
    "totals": {
      "finished_goods": 200,
      "suppliers": 10,
      "buyers": 20,
      "sales_orders": 600,
      "revenue_inr": 234567.89
    },
    "revenue_trend": [
      { "month": "2026-01", "revenue": 45000.0, "count": 25 }
    ],
    "categories": [
      { "category": "Dress", "count": 28 }
    ]
  }
  ```

### 4.2 Natural Language to SQL Query
- **Endpoint:** `POST /api/query`
- **Description:** Consumes English questions, yields SQL statements, queries the database, and provides summaries.
- **Request Payload:**
  ```json
  { "question": "Show pending invoices above ₹1,000" }
  ```
- **Response Payload:**
  ```json
  {
    "question": "Show pending invoices above ₹1,000",
    "sql": "SELECT invoice_number, order_number, amount_inr FROM sales_invoices WHERE payment_status = 'Pending' AND amount_inr > 1000 ORDER BY amount_inr DESC;",
    "columns": ["invoice_number", "order_number", "amount_inr"],
    "results": [
      { "invoice_number": "INV-20005", "order_number": "ORD-10022", "amount_inr": 1250.00 }
    ],
    "answer": "Found 1 pending invoice totaling ₹1,250.00.",
    "db_type": "sqlite"
  }
  ```

### 4.3 Structured Catalog Search
- **Endpoint:** `GET /api/search`
- **Description:** Queries finished goods items using parameters.
- **Query Parameters:**
  - `q`: String search keyword.
  - `category`: Comma-separated list of categories.
  - `fabric`: Comma-separated list of fabrics.
  - `min_gsm` / `max_gsm`: Integer limits.
  - `sort_by` / `sort_dir`: Ordering selectors.
  - `page` / `limit`: Pagination parameters.
- **Response Payload:**
  ```json
  {
    "items": [
      {
        "style_number": "SG-2026-101",
        "category": "Dress",
        "fabric": "Silk",
        "gsm": 95,
        "color": "Navy Blue",
        "price_inr": 1599.00,
        "stock_quantity": 450,
        "supplier_name": "Vardhman Textiles Ltd",
        "image_url": "https://images.unsplash.com/...",
        "specification_details": "..."
      }
    ],
    "pagination": { "page": 1, "limit": 12, "total_items": 1, "total_pages": 1 }
  }
  ```

### 4.4 Image Vector Search
- **Endpoint:** `POST /api/search-image`
- **Description:** Accepts a multipart image file or `text_fallback` string, converts it to an embedding, and finds matches.
- **Request Format:** `multipart/form-data`
  - `image`: Binary file (optional if `text_fallback` provided).
  - `text_fallback`: String description (optional if `image` provided).
- **Response Payload:**
  ```json
  {
    "items": [
      {
        "style_number": "SG-2026-101",
        "image_url": "https://images.unsplash.com/...",
        "specification_details": "...",
        "category": "Dress",
        "fabric": "Silk",
        "gsm": 95,
        "price_inr": 1599.0,
        "color": "Navy Blue",
        "similarity": 0.94523
      }
    ]
  }
  ```

---

## 5. Engineering Design Decisions

### 5.1 Supabase-Native pgvector vs. Secondary Indexing (Typesense)
While the initial blueprint proposed Typesense for quick text searching alongside Supabase for storage, we elected to integrate **pgvector** directly into Supabase. 
- **Rationale:** Operating Typesense requires setting up a separate host, managing a sync daemon (or code hooks) to handle insertions/updates, and dealing with split-brain issues. pgvector natively stores embeddings directly in a column alongside SQL data.
- **Impact:** Ensures 100% data consistency, eliminates synchronization lag, simplifies deployment, and reduces operational costs.

### 5.2 Decoupled Fallback Router Pattern
To support rapid local development without requiring immediate Supabase provisioning, we designed a database fallback router.
- **Rationale:** Team members onboarding to the project shouldn't have to wait for database permissions or API key provisioning to run the codebase.
- **Impact:** On startup, the backend checks for environment keys. If they are missing, it initializes a local SQLite instance, converts PostgreSQL DDL syntax to SQLite syntax on the fly, seeds it with 1,000 generated rows, and hosts the services immediately. Vector similarity search runs via JavaScript array operations, mirroring the production environment.

### 5.3 Pure Vanilla CSS Design System
We opted to styling the React interface using custom CSS Custom Properties (variables) and direct styling rules rather than a framework like Tailwind.
- **Rationale:** Tailwind utility classes can clutter React markup, and generic Tailwind templates often look standard and uninspired. Vanilla CSS variables offer precise control over transitions, backdrop blurs, gradients, and custom responsive layouts.
- **Impact:** Yields a high-fidelity visual experience with glassmorphism and neon components.

---

## 6. Verification and Deployment Strategy

### 6.1 Testing Pipeline
1. **Schema Check:** Run `verify_files.js` to ensure the integrity of the 15 required codebase files.
2. **Local Seeding Test:** Run the Node seed generator to verify SQL creation.
3. **Frontend Compile:** Run `npm run build` inside the frontend directory to ensure the build compiles without errors.

### 6.2 Vercel & Render Deployment Steps
1. **Frontend (Vercel):**
   - Connect the GitHub repository.
   - Set the root directory to `frontend`.
   - Add the backend API environment URL `VITE_API_URL` to Vercel settings.
2. **Backend (Render):**
   - Create a new Web Service pointing to the backend directory.
   - Configure the environment variables (`DATABASE_URL`, `OPENAI_API_KEY`, etc.).
   - Deploy via Node.js (e.g., `npm start`).
