// 🌱 SEED DATABASE - Produk Pakan Ternak untuk Toko Pakan Ainun
// Fokus: Retail/Grosir dengan sistem Satuan (Karung/Eceran)

import { db, type Category, type Product, type ModifierGroup, type Modifier, type ShiftLog } from './db';
import { nanoid } from 'nanoid';

export async function seedDatabase() {
    // Clear existing data (untuk development only!)
    await db.categories.clear();
    await db.products.clear();
    await db.modifierGroups.clear();
    await db.modifiers.clear();
    await db.shiftLogs.clear();

    const now = Date.now();

    // ==================== CATEGORIES ====================
    const categories: Category[] = [
        { id: 'cat_1', name: 'Pakan Ayam', icon: '🐔', displayOrder: 1, isActive: true, createdAt: now },
        { id: 'cat_2', name: 'Pakan Itik', icon: '🦆', displayOrder: 2, isActive: true, createdAt: now },
        { id: 'cat_3', name: 'Pakan Sapi', icon: '🐄', displayOrder: 3, isActive: true, createdAt: now },
        { id: 'cat_4', name: 'Konsentrat', icon: '📦', displayOrder: 4, isActive: true, createdAt: now },
        { id: 'cat_5', name: 'Dedak & Bekatul', icon: '🌾', displayOrder: 5, isActive: true, createdAt: now },
    ];

    await db.categories.bulkAdd(categories);

    // ==================== PRODUCTS ====================
    // Helper to create product with all required fields
    const createProduct = (id: string, name: string, categoryId: string, basePrice: number, costPrice: number): Product => ({
        id,
        name,
        categoryId,
        basePrice,
        costPrice,
        stock: 500, // Default stock dalam kg
        storeId: 'default',
        isAvailable: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
    });

    const products: Product[] = [
        // PAKAN AYAM (10 items)
        createProduct('prod_1', 'Pakan Ayam 511', 'cat_1', 10000, 8500),
        createProduct('prod_2', 'Pakan Ayam 512', 'cat_1', 10500, 9000),
        createProduct('prod_3', 'Pakan Ayam 521', 'cat_1', 9500, 8000),
        createProduct('prod_4', 'Pakan Ayam 522', 'cat_1', 9800, 8300),
        createProduct('prod_5', 'Pakan Ayam 551', 'cat_1', 11000, 9500),
        createProduct('prod_6', 'Pakan Ayam Broiler Starter', 'cat_1', 12000, 10200),
        createProduct('prod_7', 'Pakan Ayam Broiler Finisher', 'cat_1', 11500, 9800),
        createProduct('prod_8', 'Pakan Ayam Layer', 'cat_1', 10000, 8500),
        createProduct('prod_9', 'Pakan Ayam Kampung', 'cat_1', 9000, 7500),
        createProduct('prod_10', 'Pakan Ayam DOC', 'cat_1', 13000, 11000),

        // PAKAN ITIK (5 items)
        createProduct('prod_11', 'Pakan Itik Starter', 'cat_2', 11000, 9300),
        createProduct('prod_12', 'Pakan Itik Grower', 'cat_2', 10500, 8900),
        createProduct('prod_13', 'Pakan Itik Layer', 'cat_2', 10000, 8500),
        createProduct('prod_14', 'Pakan Itik Petelur Super', 'cat_2', 11500, 9800),
        createProduct('prod_15', 'Pakan Itik Pedaging', 'cat_2', 10800, 9200),

        // PAKAN SAPI (5 items)
        createProduct('prod_16', 'Pakan Sapi Potong', 'cat_3', 8000, 6500),
        createProduct('prod_17', 'Pakan Sapi Perah', 'cat_3', 9000, 7500),
        createProduct('prod_18', 'Pakan Sapi Penggemukan', 'cat_3', 8500, 7000),
        createProduct('prod_19', 'Pakan Pedet (Anak Sapi)', 'cat_3', 10000, 8500),
        createProduct('prod_20', 'Rumput Fermentasi', 'cat_3', 5000, 3500),

        // KONSENTRAT (5 items)
        createProduct('prod_21', 'Konsentrat Ayam Super', 'cat_4', 15000, 12500),
        createProduct('prod_22', 'Konsentrat Sapi 148', 'cat_4', 12000, 10000),
        createProduct('prod_23', 'Konsentrat Kambing', 'cat_4', 11000, 9200),
        createProduct('prod_24', 'Mineral Mix Unggas', 'cat_4', 20000, 17000),
        createProduct('prod_25', 'Vitamin Ternak Serbuk', 'cat_4', 25000, 21000),

        // DEDAK & BEKATUL (5 items)
        createProduct('prod_26', 'Dedak Padi Halus', 'cat_5', 5000, 4000),
        createProduct('prod_27', 'Dedak Padi Kasar', 'cat_5', 4500, 3500),
        createProduct('prod_28', 'Bekatul Premium', 'cat_5', 6000, 5000),
        createProduct('prod_29', 'Ampas Tahu', 'cat_5', 3000, 2000),
        createProduct('prod_30', 'Pollard (Dedak Gandum)', 'cat_5', 7000, 5800),
    ];

    await db.products.bulkAdd(products);

    // ==================== MODIFIER GROUPS (SATUAN) ====================
    const modifierGroups: ModifierGroup[] = [];
    const modifiers: Modifier[] = [];

    // Helper function untuk create modifier group (Satuan)
    function createSatuanGroup(
        productId: string,
        satuanOptions: Array<{ name: string; price: number; unitMultiplier: number; isDefault?: boolean }>
    ) {
        const groupId = nanoid();

        modifierGroups.push({
            id: groupId,
            productId,
            name: 'Pilih Satuan',
            selectionType: 'single',
            minSelection: 1,
            maxSelection: 1,
            isRequired: true,
            displayOrder: 1,
        });

        satuanOptions.forEach((opt, idx) => {
            modifiers.push({
                id: nanoid(),
                modifierGroupId: groupId,
                name: opt.name,
                priceAdjustment: opt.price,
                unitMultiplier: opt.unitMultiplier,
                isDefault: opt.isDefault ?? false,
                isAvailable: true,
                displayOrder: idx + 1,
            });
        });
    }

    // Apply satuan ke semua pakan ayam
    const pakanAyamIds = products.filter(p => p.categoryId === 'cat_1').map(p => p.id);
    pakanAyamIds.forEach(id => {
        createSatuanGroup(id, [
            { name: 'Karung (50kg)', price: 450000, unitMultiplier: 50, isDefault: true },
            { name: 'Eceran (1kg)', price: 10000, unitMultiplier: 1 },
        ]);
    });

    // Apply satuan ke pakan itik
    const pakanItikIds = products.filter(p => p.categoryId === 'cat_2').map(p => p.id);
    pakanItikIds.forEach(id => {
        createSatuanGroup(id, [
            { name: 'Karung (50kg)', price: 500000, unitMultiplier: 50, isDefault: true },
            { name: 'Eceran (1kg)', price: 11000, unitMultiplier: 1 },
        ]);
    });

    // Apply satuan ke pakan sapi
    const pakanSapiIds = products.filter(p => p.categoryId === 'cat_3').map(p => p.id);
    pakanSapiIds.forEach(id => {
        createSatuanGroup(id, [
            { name: 'Karung (50kg)', price: 380000, unitMultiplier: 50, isDefault: true },
            { name: 'Karung (25kg)', price: 195000, unitMultiplier: 25 },
            { name: 'Eceran (1kg)', price: 8000, unitMultiplier: 1 },
        ]);
    });

    // Apply satuan ke konsentrat
    const konsentratIds = products.filter(p => p.categoryId === 'cat_4').map(p => p.id);
    konsentratIds.forEach(id => {
        createSatuanGroup(id, [
            { name: 'Karung (50kg)', price: 700000, unitMultiplier: 50, isDefault: true },
            { name: 'Karung (25kg)', price: 360000, unitMultiplier: 25 },
            { name: 'Eceran (1kg)', price: 15000, unitMultiplier: 1 },
        ]);
    });

    // Apply satuan ke dedak
    const dedakIds = products.filter(p => p.categoryId === 'cat_5').map(p => p.id);
    dedakIds.forEach(id => {
        createSatuanGroup(id, [
            { name: 'Karung (25kg)', price: 100000, unitMultiplier: 25, isDefault: true },
            { name: 'Eceran (1kg)', price: 5000, unitMultiplier: 1 },
        ]);
    });

    await db.modifierGroups.bulkAdd(modifierGroups);
    await db.modifiers.bulkAdd(modifiers);

    // ==================== INITIAL SHIFT ====================
    const initialShift: ShiftLog = {
        id: nanoid(),
        shiftNumber: `SHIFT-${new Date().toISOString().slice(0, 10)}-001`,
        openedBy: 'Kasir Ainun',
        openedAt: now,
        openingCash: 500000, // Modal awal Rp 500.000
        totalTransactions: 0,
        totalRevenue: 0,
        status: 'open',
    };

    await db.shiftLogs.add(initialShift);

    console.log('✅ Database seeded successfully!');
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${modifierGroups.length} satuan groups`);
    console.log(`   - ${modifiers.length} satuan options`);
    console.log(`   - 1 active shift`);
}

