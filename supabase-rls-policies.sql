-- ============================================
-- 🔐 SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- This script enables RLS on all tables and creates
-- explicit "public access" policies for MVP development.
-- 
-- NOTE: For production, replace these with proper
-- authentication-based policies.
-- ============================================

-- 1. ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. TRANSACTIONS TABLE POLICIES
-- ============================================
-- Allow anyone to read transactions (for MVP)
DROP POLICY IF EXISTS "Allow public read access to transactions" ON transactions;
CREATE POLICY "Allow public read access to transactions"
ON transactions FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to insert transactions (for MVP)
DROP POLICY IF EXISTS "Allow public insert access to transactions" ON transactions;
CREATE POLICY "Allow public insert access to transactions"
ON transactions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. SHIFT_LOGS TABLE POLICIES
-- ============================================
-- Allow anyone to read shift logs (for MVP)
DROP POLICY IF EXISTS "Allow public read access to shift_logs" ON shift_logs;
CREATE POLICY "Allow public read access to shift_logs"
ON shift_logs FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to insert/update shift logs (for MVP)
DROP POLICY IF EXISTS "Allow public insert access to shift_logs" ON shift_logs;
CREATE POLICY "Allow public insert access to shift_logs"
ON shift_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to shift_logs" ON shift_logs;
CREATE POLICY "Allow public update access to shift_logs"
ON shift_logs FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. PRODUCTS TABLE POLICIES
-- ============================================
-- Allow anyone to read products (for MVP)
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
CREATE POLICY "Allow public read access to products"
ON products FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to insert/update products (for MVP)
DROP POLICY IF EXISTS "Allow public insert access to products" ON products;
CREATE POLICY "Allow public insert access to products"
ON products FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to products" ON products;
CREATE POLICY "Allow public update access to products"
ON products FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 📝 NOTES FOR FUTURE SECURITY HARDENING:
-- ============================================
-- When ready to lock down:
-- 
-- 1. DROP all "public" policies:
--    DROP POLICY "Allow public read access to transactions" ON transactions;
--    (repeat for all policies)
--
-- 2. Create authenticated user policies:
--    CREATE POLICY "Users can only see their own shop data"
--    ON transactions FOR SELECT
--    TO authenticated
--    USING (shop_id = auth.jwt()->>'shop_id');
--
-- 3. Add shop_id column to tables and link to auth.users
-- ============================================
