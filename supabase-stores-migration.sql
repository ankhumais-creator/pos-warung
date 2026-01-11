-- =============================================
-- Phase 8: STORES TABLE for Multi-Outlet Support
-- Run this in Supabase SQL Editor
-- =============================================

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow all operations on stores" ON stores;
CREATE POLICY "Allow all operations on stores" ON stores
    FOR ALL USING (true) WITH CHECK (true);

-- Insert default store with a fixed UUID
INSERT INTO stores (id, name, address, phone) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Warung Pusat', 'Jl. Utama No. 1', '08123456789')
ON CONFLICT (id) DO NOTHING;

-- Add store_id to transactions if not exists
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_store ON transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);

-- Update daily_sales_summary view to include store_id
DROP VIEW IF EXISTS daily_sales_summary;
CREATE VIEW daily_sales_summary AS 
SELECT 
    DATE(created_at) as sale_date,
    store_id,
    COUNT(*) as total_transactions,
    SUM(total) as total_revenue,
    AVG(total) as average_ticket
FROM transactions
WHERE status = 'completed'
GROUP BY DATE(created_at), store_id
ORDER BY sale_date DESC;
