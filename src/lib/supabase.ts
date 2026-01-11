// 🌐 SUPABASE CLIENT - Cloud Database Connection
import { createClient } from '@supabase/supabase-js';

// Environment variables (set in .env file)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey);
}

// Create Supabase client only if configured (avoids runtime error)
export const supabase = isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    })
    : null;

// Log warning if not configured
if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase not configured. Running in offline-only mode.');
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
    cost_price: number;
    stock: number;
    store_id: string;
    is_available: boolean;
    is_active: boolean;
    created_at: string;
    synced_at: string;
}

export interface SupabaseCategory {
    id: string;
    name: string;
    icon?: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
    synced_at: string;
}
