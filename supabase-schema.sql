-- 🚀 SUPABASE SCHEMA - POS Warung Database
-- Run this SQL in Supabase SQL Editor to create all required tables

-- ================================================
-- 1. PRODUCTS TABLE (Master Data)
-- ================================================
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL,
    base_price INTEGER NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- ================================================
-- 2. CATEGORIES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 3. SHIFT LOGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS shift_logs (
    id TEXT PRIMARY KEY,
    shift_number TEXT NOT NULL UNIQUE,
    opened_by TEXT NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    opening_cash INTEGER NOT NULL DEFAULT 0,
    closing_cash INTEGER,
    cash_difference INTEGER,
    total_transactions INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_shift_logs_status ON shift_logs(status);
CREATE INDEX IF NOT EXISTS idx_shift_logs_opened_at ON shift_logs(opened_at DESC);

-- ================================================
-- 4. TRANSACTIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    transaction_number TEXT NOT NULL UNIQUE,
    shift_id TEXT NOT NULL REFERENCES shift_logs(id) ON DELETE RESTRICT,
    items JSONB NOT NULL DEFAULT '[]', -- Array of transaction items
    subtotal INTEGER NOT NULL DEFAULT 0,
    tax INTEGER DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'qris', 'debit', 'credit')),
    cash_received INTEGER,
    cash_change INTEGER,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_shift ON transactions(shift_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ================================================
-- 5. INVENTORY EVENTS TABLE (Append-Only Log)
-- ================================================
CREATE TABLE IF NOT EXISTS inventory_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('sale', 'restock', 'adjustment', 'waste')),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    modifier_id TEXT,
    quantity_change INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    metadata JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for product stock queries
CREATE INDEX IF NOT EXISTS idx_inventory_events_product ON inventory_events(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_events_timestamp ON inventory_events(timestamp DESC);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable after setting up auth if needed
-- ================================================

-- For now, allow all operations (disable RLS for MVP)
-- Uncomment these after setting up authentication:
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE shift_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory_events ENABLE ROW LEVEL SECURITY;

-- ================================================
-- HELPER VIEWS (Optional)
-- ================================================

-- Daily sales summary view
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_transactions,
    SUM(total) as total_revenue,
    SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_revenue,
    SUM(CASE WHEN payment_method != 'cash' THEN total ELSE 0 END) as non_cash_revenue
FROM transactions
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Shift summary view
CREATE OR REPLACE VIEW shift_summary AS
SELECT 
    sl.*,
    CASE 
        WHEN sl.cash_difference > 0 THEN 'surplus'
        WHEN sl.cash_difference < 0 THEN 'shortage'
        ELSE 'balanced'
    END as reconciliation_status
FROM shift_logs sl
ORDER BY opened_at DESC;
