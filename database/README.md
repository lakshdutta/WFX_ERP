# Supabase Database Setup Guide

This directory contains the SQL files necessary to set up the database schema and seed it with 1,000+ rows of realistic ERP data.

## Files
- `schema.sql`: Contains the database DDL (tables, keys, indexes, and pgvector extension).
- `seed.sql`: Contains over 1,500 insert statements for suppliers, buyers, finished goods, tech packs (with vector embeddings), sales orders, and invoices.
- `seed_generator.js`: A Node.js utility script used to generate `seed.sql` with rich, randomized, but coherent relational mock data.
- `seed_data.py`: A Python equivalent of the seeding generator.

---

## Setting up on Supabase

Follow these steps to setup your database online:

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and sign in.
   - Click **New project** and fill in your project name, password, and region.
   - Wait for the database to finish provisioning (usually takes 1-2 minutes).

2. **Enable pgvector and Create Tables:**
   - On the left sidebar, click on **SQL Editor**.
   - Click **New Query**.
   - Open and copy the contents of the [schema.sql](file:///C:/Users/laksh/.gemini/antigravity/scratch/ERP/database/schema.sql) file.
   - Paste the SQL into the editor and click **Run**.
   - You should see a success message. This creates all 6 tables (`suppliers`, `buyers`, `finished_goods`, `tech_packs`, `sales_orders`, `sales_invoices`) and enables `pgvector`.

3. **Seed the Data:**
   - Create another **New Query** in the SQL Editor.
   - Open the generated `seed.sql` file in your project directory.
   - Copy the contents (it will contain around 1,500 insert statements).
   - Paste them into the editor and click **Run**.
   - This will populate your tables with the generated mock dataset.

4. **Retrieve API Keys:**
   - Go to **Project Settings** (gear icon) -> **API**.
   - Copy your **Project URL** and the **service_role** API key (needed by the backend to bypass RLS and perform operations, or the `anon` key if you set up permissive RLS policies).
   - Paste these credentials into the backend's `.env` configuration.
