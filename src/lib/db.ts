// 🔥 DATABASE LAYER - CRITICAL FOUNDATION
// Setup Dexie IndexedDB dengan schema lengkap untuk offline-first POS

import Dexie, { type EntityTable } from 'dexie';

// ==================== INTERFACES ====================

export interface Category {
    id: string;
    name: string;
    icon?: string;
    displayOrder: number;
    isActive: boolean; // Soft delete flag
    createdAt: number;
}

export interface Product {
    id: string;
    name: string;
    categoryId: string;
    basePrice: number;
    costPrice: number; // Modal/COGS
    stock: number; // Stok tersedia
    storeId: string; // Multi-outlet support
    image?: string;
    isAvailable: boolean;
    isActive: boolean; // Soft delete flag
    createdAt: number;
    updatedAt: number;
}

export interface ModifierGroup {
    id: string;
    productId: string;
    name: string; // "Ukuran", "Level Es", "Topping"
    selectionType: 'single' | 'multiple';
    minSelection: number;
    maxSelection: number;
    isRequired: boolean;
    displayOrder: number;
}

export interface Modifier {
    id: string;
    modifierGroupId: string;
    name: string; // "Large", "Less Ice", "Extra Shot"
    priceAdjustment: number; // +5000, 0, +3000
    isDefault: boolean;
    isAvailable: boolean; // ⚠️ CRITICAL: Track stock untuk topping (e.g., telur habis)
    displayOrder: number;
}

export interface Transaction {
    id: string;
    transactionNumber: string; // "TRX-20260111-001"
    items: TransactionItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'cash' | 'qris' | 'debit' | 'credit';
    cashReceived?: number; // Uang yang diterima dari customer
    cashChange?: number; // Kembalian
    status: 'completed' | 'pending' | 'cancelled';
    shiftId: string; // Link ke shift log
    createdAt: number;
    syncedToServer: boolean; // Untuk tracking sync
}

export interface TransactionItem {
    id: string;
    transactionId: string;
    productId: string;
    productName: string; // Denormalisasi: simpan nama di snapshot
    quantity: number;
    basePrice: number; // Denormalisasi: simpan harga di snapshot
    selectedModifiers: SelectedModifier[];
    notes?: string;
    itemTotal: number; // (basePrice + modifier prices) * quantity
}

export interface SelectedModifier {
    groupName: string;
    modifierName: string;
    priceAdjustment: number;
}

// 🔥 APPEND-ONLY LOG - Event Sourcing Pattern (tidak timpa data!)
export interface InventoryEvent {
    id: string;
    eventType: 'sale' | 'restock' | 'adjustment' | 'waste';
    productId: string;
    modifierId?: string; // Untuk track topping/modifier stock
    quantityChange: number; // -1 (dijual), +50 (restock), -2 (rusak)
    timestamp: number;
    transactionId?: string; // Link ke transaction jika dari sale
    metadata?: Record<string, unknown>; // Extra info (supplier, reason, etc.)
}

export interface SyncQueue {
    id: string;
    action: 'create' | 'update' | 'delete';
    entityType: 'transaction' | 'product' | 'category' | 'inventory_event' | 'shift';
    entityId: string;
    payload: unknown;
    createdAt: number;
    attempts: number;
    lastError?: string;
}

// 🏪 SHIFT MANAGEMENT - Cash Flow Tracking (WAJIB untuk POS!)
export interface ShiftLog {
    id: string;
    shiftNumber: string; // "SHIFT-20260111-001"
    openedBy: string; // Nama kasir
    openedAt: number;
    closedAt?: number;
    openingCash: number; // Modal awal di laci
    closingCash?: number; // Uang akhir di laci
    expectedCash?: number; // Calculated dari transactions
    cashDifference?: number; // closingCash - expectedCash (selisih)
    totalTransactions: number;
    totalRevenue: number;
    notes?: string; // Catatan kasir (e.g., "Ada uang palsu Rp50k")
    status: 'open' | 'closed';
}

// ==================== DEXIE DATABASE ====================

class POSDatabase extends Dexie {
    categories!: EntityTable<Category, 'id'>;
    products!: EntityTable<Product, 'id'>;
    modifierGroups!: EntityTable<ModifierGroup, 'id'>;
    modifiers!: EntityTable<Modifier, 'id'>;
    transactions!: EntityTable<Transaction, 'id'>;
    inventoryEvents!: EntityTable<InventoryEvent, 'id'>;
    syncQueue!: EntityTable<SyncQueue, 'id'>;
    shiftLogs!: EntityTable<ShiftLog, 'id'>;

    constructor() {
        super('POSDatabase');

        this.version(1).stores({
            categories: 'id, displayOrder',
            products: 'id, categoryId, isAvailable, updatedAt',
            modifierGroups: 'id, productId, displayOrder',
            modifiers: 'id, modifierGroupId, isAvailable, displayOrder',
            transactions: 'id, transactionNumber, shiftId, createdAt, syncedToServer',
            inventoryEvents: 'id, productId, modifierId, timestamp, eventType',
            syncQueue: 'id, entityType, createdAt, attempts',
            shiftLogs: 'id, shiftNumber, status, openedAt',
        });
    }
}

// Export singleton instance
export const db = new POSDatabase();

// ==================== HELPER FUNCTIONS ====================

/**
 * Get all products with their modifier groups and modifiers
 */
export async function getProductsWithModifiers() {
    const products = await db.products.toArray();
    const modifierGroups = await db.modifierGroups.toArray();
    const modifiers = await db.modifiers.toArray();

    return products.map((product) => {
        const groups = modifierGroups
            .filter((g) => g.productId === product.id)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((group) => ({
                ...group,
                modifiers: modifiers
                    .filter((m) => m.modifierGroupId === group.id)
                    .sort((a, b) => a.displayOrder - b.displayOrder),
            }));

        return {
            ...product,
            modifierGroups: groups,
        };
    });
}

/**
 * Get current active shift
 */
export async function getCurrentShift(): Promise<ShiftLog | null> {
    const shift = await db.shiftLogs
        .where('status')
        .equals('open')
        .first();
    return shift ?? null;
}

/**
 * Calculate current stock untuk product atau modifier
 * Menggunakan append-only log events
 */
export async function calculateStock(
    productId: string,
    modifierId?: string
): Promise<number> {
    const query = db.inventoryEvents.where('productId').equals(productId);

    let events = await query.toArray();

    if (modifierId) {
        events = events.filter((e) => e.modifierId === modifierId);
    }

    // Sum all quantity changes (sale=-1, restock=+50, etc.)
    return events.reduce((total, event) => total + event.quantityChange, 0);
}

/**
 * Add transaction dan auto-create inventory events
 */
export async function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'syncedToServer'>) {
    const now = Date.now();
    const txId = `tx_${now}_${Math.random().toString(36).slice(2, 9)}`;

    const fullTransaction: Transaction = {
        ...transaction,
        id: txId,
        createdAt: now,
        syncedToServer: false,
    };

    // Save transaction
    await db.transactions.add(fullTransaction);

    // Create inventory events untuk setiap item (append-only!)
    const inventoryEvents: InventoryEvent[] = [];

    for (const item of transaction.items) {
        // Event untuk base product
        inventoryEvents.push({
            id: `inv_${now}_${Math.random().toString(36).slice(2, 9)}`,
            eventType: 'sale',
            productId: item.productId,
            quantityChange: -item.quantity, // Kurangi stock
            timestamp: now,
            transactionId: txId,
        });

        // Event untuk modifiers (jika ada yang track stock, e.g., topping)
        // Track stock for modifiers if they have stock tracking enabled
        // Note: Currently all modifiers are tracked, but you can add an 'isStockTracked' field to filter
        for (const modSelection of item.selectedModifiers) {
            // You can extend Modifier interface to include `isStockTracked: boolean` field
            // For now, we'll create events for all modifiers to maintain complete audit trail
            inventoryEvents.push({
                id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                eventType: 'sale',
                productId: item.productId,
                modifierId: modSelection.modifierName, // Store modifier reference
                quantityChange: -item.quantity, // Same quantity as parent item
                timestamp: now,
                transactionId: txId,
            });
        }
    }

    await db.inventoryEvents.bulkAdd(inventoryEvents);

    // Add to sync queue untuk backend nanti
    await db.syncQueue.add({
        id: `sync_${now}_${Math.random().toString(36).slice(2, 9)}`,
        action: 'create',
        entityType: 'transaction',
        entityId: txId,
        payload: fullTransaction,
        createdAt: now,
        attempts: 0,
    });

    return fullTransaction;
}
