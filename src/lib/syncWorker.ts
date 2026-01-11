// ⚡ SYNC WORKER - Two-Way Sync: Push to Server + Pull Master Data
import { useEffect, useRef, useCallback, useState } from 'react';
import { db, type SyncQueue, type Product, type Category } from './db';
import { supabase, isSupabaseConfigured } from './supabase';

const SYNC_INTERVAL_MS = 15000; // 15 detik

interface SyncResult {
    success: boolean;
    error?: string;
}

interface PullResult {
    productsUpdated: number;
    categoriesUpdated: number;
}

/**
 * Custom hook untuk two-way sync dengan Supabase
 * - Push: Upload transactions/shifts ke server
 * - Pull: Download master data (products/categories) dari server
 */
export function useSyncWorker() {
    const isProcessing = useRef(false);
    const intervalRef = useRef<number | null>(null);
    const [lastPullTime, setLastPullTime] = useState<number | null>(null);

    // Process single sync item (PUSH)
    const processSyncItem = useCallback(async (item: SyncQueue): Promise<SyncResult> => {
        if (!isSupabaseConfigured()) {
            return { success: false, error: 'Supabase not configured' };
        }

        try {
            const payload = item.payload as Record<string, unknown>;

            switch (item.entityType) {
                case 'transaction':
                    return await syncTransaction(item.action, item.entityId, payload);
                case 'shift':
                    return await syncShiftLog(item.action, item.entityId, payload);
                case 'product':
                    return await syncProduct(item.action, item.entityId, payload);
                default:
                    console.warn(`Unknown entity type: ${item.entityType}`);
                    return { success: true }; // Skip unknown types
            }
        } catch (error) {
            console.error('Sync error:', error);
            return { success: false, error: String(error) };
        }
    }, []);

    // Main sync loop (PUSH)
    const runSyncCycle = useCallback(async () => {
        if (isProcessing.current) return;
        if (!navigator.onLine) return;
        if (!isSupabaseConfigured()) return;

        isProcessing.current = true;

        try {
            // Get oldest item from queue (FIFO)
            const item = await db.syncQueue.orderBy('createdAt').first();

            if (!item) {
                isProcessing.current = false;
                return;
            }

            console.log(`🔄 Syncing: ${item.entityType} (${item.action})`);

            const result = await processSyncItem(item);

            if (result.success) {
                // Success - remove from queue
                await db.syncQueue.delete(item.id);
                console.log(`✅ Synced: ${item.entityType}`);

                // Mark entity as synced in local DB
                await markAsSynced(item.entityType, item.entityId);

                // Process next item immediately
                isProcessing.current = false;
                runSyncCycle();
            } else {
                // Failed - increment retry count or leave for next cycle
                console.warn(`❌ Sync failed: ${result.error}`);

                // Simple retry: just leave in queue for next cycle
                // Could add retry count metadata here
                isProcessing.current = false;
            }
        } catch (error) {
            console.error('Sync cycle error:', error);
            isProcessing.current = false;
        }
    }, [processSyncItem]);

    // 🔽 PULL MASTER DATA - Download products & categories from server
    const pullMasterData = useCallback(async (): Promise<PullResult> => {
        if (!isSupabaseConfigured() || !supabase) {
            console.warn('⚠️ Supabase not configured, skipping pull');
            return { productsUpdated: 0, categoriesUpdated: 0 };
        }

        if (!navigator.onLine) {
            console.warn('⚠️ Offline, skipping pull');
            return { productsUpdated: 0, categoriesUpdated: 0 };
        }

        console.log('📥 Pulling master data from server...');

        let productsUpdated = 0;
        let categoriesUpdated = 0;

        try {
            // Fetch categories from Supabase
            const { data: serverCategories, error: catError } = await supabase
                .from('categories')
                .select('*');

            if (catError) {
                console.error('Error fetching categories:', catError);
            } else if (serverCategories && serverCategories.length > 0) {
                for (const sc of serverCategories) {
                    const localCategory: Category = {
                        id: sc.id,
                        name: sc.name,
                        icon: sc.icon,
                        displayOrder: sc.display_order || 0,
                        isActive: sc.is_active ?? true,
                        createdAt: new Date(sc.created_at).getTime(),
                    };
                    await db.categories.put(localCategory);
                    categoriesUpdated++;
                }
                console.log(`✅ Updated ${categoriesUpdated} categories`);
            }

            // Fetch products from Supabase
            const { data: serverProducts, error: prodError } = await supabase
                .from('products')
                .select('*');

            if (prodError) {
                console.error('Error fetching products:', prodError);
            } else if (serverProducts && serverProducts.length > 0) {
                for (const sp of serverProducts) {
                    const localProduct: Product = {
                        id: sp.id,
                        name: sp.name,
                        categoryId: sp.category_id,
                        basePrice: sp.base_price,
                        costPrice: sp.cost_price || 0,
                        stock: sp.stock || 0,
                        storeId: sp.store_id || 'default',
                        isAvailable: sp.is_available,
                        isActive: sp.is_active ?? true,
                        createdAt: new Date(sp.created_at).getTime(),
                        updatedAt: Date.now(),
                    };
                    // Use put() to upsert - doesn't delete local-only products
                    await db.products.put(localProduct);
                    productsUpdated++;
                }
                console.log(`✅ Updated ${productsUpdated} products`);
            }

            setLastPullTime(Date.now());
            console.log('📥 Pull complete!');

        } catch (error) {
            console.error('Pull master data error:', error);
        }

        return { productsUpdated, categoriesUpdated };
    }, []);

    // Start sync worker on mount + initial pull
    useEffect(() => {
        // Initial pull on app start
        pullMasterData();

        // Initial push attempt
        runSyncCycle();

        // Set up interval for push
        intervalRef.current = globalThis.setInterval(runSyncCycle, SYNC_INTERVAL_MS);

        // Listen for online event
        const handleOnline = () => {
            console.log('📶 Back online - triggering sync');
            pullMasterData(); // Pull first to get latest data
            runSyncCycle();   // Then push any pending items
        };

        globalThis.addEventListener('online', handleOnline);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            globalThis.removeEventListener('online', handleOnline);
        };
    }, [runSyncCycle, pullMasterData]);

    // Manual sync trigger (both push and pull)
    const triggerSync = useCallback(async () => {
        await pullMasterData();
        runSyncCycle();
    }, [runSyncCycle, pullMasterData]);

    // Manual pull trigger (pull only)
    const triggerPull = useCallback(async () => {
        return await pullMasterData();
    }, [pullMasterData]);

    return { triggerSync, triggerPull, lastPullTime };
}

// === SYNC HANDLERS (PUSH) ===

async function syncTransaction(
    action: string,
    entityId: string,
    payload: Record<string, unknown>
): Promise<SyncResult> {
    if (!supabase) return { success: false, error: 'Supabase not available' };

    if (action === 'create') {
        const { error } = await supabase.from('transactions').insert({
            id: entityId,
            transaction_number: payload.transactionNumber,
            shift_id: payload.shiftId,
            items: payload.items, // JSONB
            subtotal: payload.subtotal,
            tax: payload.tax,
            total: payload.total,
            payment_method: payload.paymentMethod,
            cash_received: payload.cashReceived,
            cash_change: payload.cashChange,
            status: payload.status,
            created_at: new Date(payload.createdAt as number).toISOString(),
            synced_at: new Date().toISOString(),
        });

        if (error) {
            console.error('Supabase insert error:', error);
            return { success: false, error: error.message };
        }
    }

    return { success: true };
}

async function syncShiftLog(
    action: string,
    entityId: string,
    payload: Record<string, unknown>
): Promise<SyncResult> {
    if (!supabase) return { success: false, error: 'Supabase not available' };

    if (action === 'create' || action === 'update') {
        const data = {
            id: entityId,
            shift_number: payload.shiftNumber,
            opened_by: payload.openedBy,
            opened_at: new Date(payload.openedAt as number).toISOString(),
            closed_at: payload.closedAt ? new Date(payload.closedAt as number).toISOString() : null,
            opening_cash: payload.openingCash,
            closing_cash: payload.closingCash ?? null,
            cash_difference: payload.cashDifference ?? null,
            total_transactions: payload.totalTransactions ?? 0,
            total_revenue: payload.totalRevenue ?? 0,
            status: payload.status,
            synced_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('shift_logs')
            .upsert(data, { onConflict: 'id' });

        if (error) {
            console.error('Supabase upsert error:', error);
            return { success: false, error: error.message };
        }
    }

    return { success: true };
}

async function syncProduct(
    action: string,
    entityId: string,
    payload: Record<string, unknown>
): Promise<SyncResult> {
    if (!supabase) return { success: false, error: 'Supabase not available' };

    if (action === 'create' || action === 'update') {
        const data = {
            id: entityId,
            name: payload.name,
            category_id: payload.categoryId,
            base_price: payload.basePrice,
            cost_price: payload.costPrice ?? 0,
            stock: payload.stock ?? 0,
            store_id: payload.storeId ?? 'default',
            is_available: payload.isAvailable ?? true,
            is_active: payload.isActive ?? true,
            synced_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('products')
            .upsert(data, { onConflict: 'id' });

        if (error) {
            console.error('Supabase upsert error:', error);
            return { success: false, error: error.message };
        }
    }

    return { success: true };
}

// Mark local entity as synced
async function markAsSynced(entityType: string, entityId: string) {
    try {
        if (entityType === 'transaction') {
            await db.transactions.update(entityId, { syncedToServer: true });
        }
        // Add other entity types as needed
    } catch (error) {
        console.warn('Could not mark as synced:', error);
    }
}
