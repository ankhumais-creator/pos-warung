// ⚡ SYNC WORKER - Background Process untuk One-Way Backup ke Supabase
import { useEffect, useRef, useCallback } from 'react';
import { db, type SyncQueue } from './db';
import { supabase, isSupabaseConfigured } from './supabase';

const SYNC_INTERVAL_MS = 15000; // 15 detik

interface SyncResult {
    success: boolean;
    error?: string;
}

/**
 * Custom hook untuk background sync ke Supabase
 * Berjalan setiap 15 detik atau saat online
 */
export function useSyncWorker() {
    const isProcessing = useRef(false);
    const intervalRef = useRef<number | null>(null);

    // Process single sync item
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

    // Main sync loop
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

    // Start sync worker on mount
    useEffect(() => {
        // Initial sync attempt
        runSyncCycle();

        // Set up interval
        intervalRef.current = globalThis.setInterval(runSyncCycle, SYNC_INTERVAL_MS);

        // Listen for online event
        const handleOnline = () => {
            console.log('📶 Back online - triggering sync');
            runSyncCycle();
        };

        globalThis.addEventListener('online', handleOnline);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            globalThis.removeEventListener('online', handleOnline);
        };
    }, [runSyncCycle]);

    // Manual sync trigger
    const triggerSync = useCallback(() => {
        runSyncCycle();
    }, [runSyncCycle]);

    return { triggerSync };
}

// === SYNC HANDLERS ===

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
            is_available: payload.isAvailable ?? true,
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
