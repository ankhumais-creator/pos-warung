// 🏪 ADMIN STORE - Global State untuk Admin Dashboard
import { create } from 'zustand';

// Outlet/Store data structure
export interface Outlet {
    id: string;
    name: string;
    address?: string;
}

// Hardcoded outlets for now (will fetch from Supabase later)
export const OUTLETS: Outlet[] = [
    { id: 'all', name: 'Semua Outlet' },
    { id: 'default', name: 'Warung Pusat', address: 'Jl. Utama No. 1' },
    { id: 'cabang_a', name: 'Cabang A', address: 'Jl. Cabang A No. 10' },
    { id: 'cabang_b', name: 'Cabang B', address: 'Jl. Cabang B No. 20' },
];

interface AdminState {
    // Selected outlet filter
    selectedOutlet: string;
    setSelectedOutlet: (outletId: string) => void;

    // Date range filter (for reports)
    dateRange: 'today' | 'week' | 'month' | 'custom';
    setDateRange: (range: 'today' | 'week' | 'month' | 'custom') => void;

    // Custom date range
    customStartDate: Date | null;
    customEndDate: Date | null;
    setCustomDateRange: (start: Date, end: Date) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
    // Default: show all outlets
    selectedOutlet: 'all',
    setSelectedOutlet: (outletId) => set({ selectedOutlet: outletId }),

    // Default: today
    dateRange: 'today',
    setDateRange: (range) => set({ dateRange: range }),

    // Custom dates
    customStartDate: null,
    customEndDate: null,
    setCustomDateRange: (start, end) => set({
        customStartDate: start,
        customEndDate: end,
        dateRange: 'custom'
    }),
}));
