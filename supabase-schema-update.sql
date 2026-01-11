-- 🔧 SUPABASE SCHEMA UPDATE - Phase 6: Admin Dashboard
-- Run this SQL in Supabase SQL Editor to add new columns

-- Add cost_price (modal), stock, and is_active for soft-delete
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add store_id for multi-outlet support (future)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'default';

-- Add is_active to categories for soft-delete
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for filtering active products
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);

-- Update view for daily sales to include store_id grouping
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
