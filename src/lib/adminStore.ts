// 🏪 ADMIN STORE - Global State untuk Admin Dashboard
import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './supabase';

// Outlet/Store data structure
export interface Outlet {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    isActive?: boolean;
}

// Default outlet when Supabase not connected
const DEFAULT_OUTLETS: Outlet[] = [
    { id: 'all', name: 'Semua Outlet' },
    { id: 'default', name: 'Outlet Utama', address: 'Jl. Utama No. 1' },
];

interface AdminState {
    // Outlets list (fetched from Supabase)
    outlets: Outlet[];
    isLoadingOutlets: boolean;
    fetchOutlets: () => Promise<void>;

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

    // CRUD operations
    addOutlet: (outlet: Omit<Outlet, 'id'>) => Promise<Outlet | null>;
    updateOutlet: (id: string, data: Partial<Outlet>) => Promise<boolean>;
    deleteOutlet: (id: string) => Promise<boolean>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
    // Outlets list
    outlets: DEFAULT_OUTLETS,
    isLoadingOutlets: false,

    // Fetch outlets from Supabase
    fetchOutlets: async () => {
        set({ isLoadingOutlets: true });

        try {
            if (!isSupabaseConfigured() || !supabase) {
                set({ outlets: DEFAULT_OUTLETS, isLoadingOutlets: false });
                return;
            }

            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) {
                console.error('Error fetching outlets:', error);
                set({ outlets: DEFAULT_OUTLETS, isLoadingOutlets: false });
                return;
            }

            // Add "Semua Outlet" option at the beginning
            const outlets: Outlet[] = [
                { id: 'all', name: 'Semua Outlet' },
                ...(data || []).map((store: Record<string, unknown>) => ({
                    id: store.id as string,
                    name: store.name as string,
                    address: store.address as string | undefined,
                    phone: store.phone as string | undefined,
                    isActive: store.is_active as boolean,
                })),
            ];

            set({ outlets, isLoadingOutlets: false });
        } catch (error) {
            console.error('Error fetching outlets:', error);
            set({ outlets: DEFAULT_OUTLETS, isLoadingOutlets: false });
        }
    },

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

    // Add new outlet
    addOutlet: async (outletData) => {
        if (!isSupabaseConfigured() || !supabase) {
            console.warn('Supabase not configured');
            return null;
        }

        try {
            const newOutlet = {
                name: outletData.name,
                address: outletData.address || null,
                phone: outletData.phone || null,
                is_active: true,
            };

            const { data, error } = await supabase
                .from('stores')
                .insert(newOutlet)
                .select()
                .single();

            if (error) {
                console.error('Error adding outlet:', error);
                return null;
            }

            // Refresh outlets list
            await get().fetchOutlets();

            return {
                id: data.id,
                name: data.name,
                address: data.address,
                phone: data.phone,
                isActive: data.is_active,
            };
        } catch (error) {
            console.error('Error adding outlet:', error);
            return null;
        }
    },

    // Update outlet
    updateOutlet: async (id, data) => {
        if (!isSupabaseConfigured() || !supabase) {
            console.warn('Supabase not configured');
            return false;
        }

        try {
            const updateData: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
            };

            if (data.name !== undefined) updateData.name = data.name;
            if (data.address !== undefined) updateData.address = data.address;
            if (data.phone !== undefined) updateData.phone = data.phone;
            if (data.isActive !== undefined) updateData.is_active = data.isActive;

            const { error } = await supabase
                .from('stores')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('Error updating outlet:', error);
                return false;
            }

            // Refresh outlets list
            await get().fetchOutlets();
            return true;
        } catch (error) {
            console.error('Error updating outlet:', error);
            return false;
        }
    },

    // Soft delete outlet
    deleteOutlet: async (id) => {
        if (!isSupabaseConfigured() || !supabase) {
            console.warn('Supabase not configured');
            return false;
        }

        try {
            // Soft delete - set is_active to false
            const { error } = await supabase
                .from('stores')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                console.error('Error deleting outlet:', error);
                return false;
            }

            // Refresh outlets list
            await get().fetchOutlets();
            return true;
        } catch (error) {
            console.error('Error deleting outlet:', error);
            return false;
        }
    },
}));

// Helper to get outlets excluding "all" option
export const getActiveOutlets = (outlets: Outlet[]) => {
    return outlets.filter(o => o.id !== 'all');
};
