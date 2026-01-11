// 🌐 SUPABASE CLIENT - Cloud Database Connection
import { createClient } from '@supabase/supabase-js';

// Environment variables (set in .env file)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not configured. Sync disabled.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey);
}

// Database types for Supabase (matches our Dexie schema)
export interface SupabaseTransaction {
    id: string;
    transaction_number: string;
    shift_id: string;
    items: unknown; // JSONB
    subtotal: number;
    tax: number;
    total: number;
    payment_method: string;
    cash_received: number | null;
    cash_change: number | null;
    status: string;
    created_at: string;
    synced_at: string;
}

export interface SupabaseShiftLog {
    id: string;
    shift_number: string;
    opened_by: string;
    opened_at: string;
    closed_at: string | null;
    opening_cash: number;
    closing_cash: number | null;
    cash_difference: number | null;
    total_transactions: number;
    total_revenue: number;
    status: string;
    synced_at: string;
}

export interface SupabaseProduct {
    id: string;
    name: string;
    category_id: string;
    base_price: number;
    is_available: boolean;
    created_at: string;
    synced_at: string;
}
