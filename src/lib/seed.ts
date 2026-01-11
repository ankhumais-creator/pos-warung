// 🌱 SEED DATABASE - 50 Dummy Products untuk Testing Performa
// Fokus: F&B (Cafe/Warung) dengan modifier kompleks

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
        { id: 'cat_1', name: 'Kopi', icon: '☕', displayOrder: 1, isActive: true, createdAt: now },
        { id: 'cat_2', name: 'Teh', icon: '🍵', displayOrder: 2, isActive: true, createdAt: now },
        { id: 'cat_3', name: 'Jus & Smoothie', icon: '🥤', displayOrder: 3, isActive: true, createdAt: now },
        { id: 'cat_4', name: 'Makanan Berat', icon: '🍜', displayOrder: 4, isActive: true, createdAt: now },
        { id: 'cat_5', name: 'Snack', icon: '🍰', displayOrder: 5, isActive: true, createdAt: now },
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
        stock: 100, // Default stock
        storeId: 'default',
        isAvailable: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
    });

    const products: Product[] = [
        // KOPI (15 items) - costPrice ~60% of basePrice
        createProduct('prod_1', 'Es Kopi Susu', 'cat_1', 15000, 9000),
        createProduct('prod_2', 'Americano', 'cat_1', 18000, 10000),
        createProduct('prod_3', 'Cappuccino', 'cat_1', 20000, 12000),
        createProduct('prod_4', 'Latte', 'cat_1', 22000, 13000),
        createProduct('prod_5', 'Mocha', 'cat_1', 24000, 14000),
        createProduct('prod_6', 'Affogato', 'cat_1', 28000, 17000),
        createProduct('prod_7', 'Kopi Tubruk', 'cat_1', 10000, 5000),
        createProduct('prod_8', 'Kopi Susu Gula Aren', 'cat_1', 18000, 11000),
        createProduct('prod_9', 'Vietnamese Coffee', 'cat_1', 20000, 12000),
        createProduct('prod_10', 'Kopi Jahe', 'cat_1', 16000, 10000),
        createProduct('prod_11', 'Caramel Macchiato', 'cat_1', 26000, 16000),
        createProduct('prod_12', 'Espresso', 'cat_1', 15000, 8000),
        createProduct('prod_13', 'Flat White', 'cat_1', 23000, 14000),
        createProduct('prod_14', 'Kopi Kelapa', 'cat_1', 19000, 11000),
        createProduct('prod_15', 'Irish Coffee', 'cat_1', 30000, 18000),

        // TEH (10 items)
        createProduct('prod_16', 'Es Teh Manis', 'cat_2', 8000, 3000),
        createProduct('prod_17', 'Thai Tea', 'cat_2', 15000, 8000),
        createProduct('prod_18', 'Lemon Tea', 'cat_2', 12000, 6000),
        createProduct('prod_19', 'Green Tea Latte', 'cat_2', 18000, 10000),
        createProduct('prod_20', 'Teh Tarik', 'cat_2', 14000, 7000),
        createProduct('prod_21', 'Jasmine Tea', 'cat_2', 10000, 4000),
        createProduct('prod_22', 'Oolong Tea', 'cat_2', 12000, 6000),
        createProduct('prod_23', 'Teh Poci', 'cat_2', 7000, 2500),
        createProduct('prod_24', 'Milk Tea', 'cat_2', 16000, 9000),
        createProduct('prod_25', 'Earl Grey', 'cat_2', 11000, 5000),

        // JUS & SMOOTHIE (10 items)
        createProduct('prod_26', 'Jus Jeruk', 'cat_3', 15000, 8000),
        createProduct('prod_27', 'Jus Alpukat', 'cat_3', 18000, 10000),
        createProduct('prod_28', 'Jus Mangga', 'cat_3', 17000, 9000),
        createProduct('prod_29', 'Smoothie Bowl', 'cat_3', 35000, 20000),
        createProduct('prod_30', 'Green Smoothie', 'cat_3', 25000, 15000),
        createProduct('prod_31', 'Jus Wortel', 'cat_3', 14000, 7000),
        createProduct('prod_32', 'Jus Semangka', 'cat_3', 12000, 6000),
        createProduct('prod_33', 'Jus Melon', 'cat_3', 13000, 7000),
        createProduct('prod_34', 'Banana Smoothie', 'cat_3', 20000, 12000),
        createProduct('prod_35', 'Berry Blast', 'cat_3', 28000, 16000),

        // MAKANAN BERAT (10 items)
        createProduct('prod_36', 'Nasi Goreng', 'cat_4', 25000, 12000),
        createProduct('prod_37', 'Mie Goreng', 'cat_4', 23000, 11000),
        createProduct('prod_38', 'Nasi Ayam Geprek', 'cat_4', 28000, 14000),
        createProduct('prod_39', 'Nasi Rendang', 'cat_4', 35000, 18000),
        createProduct('prod_40', 'Soto Ayam', 'cat_4', 22000, 11000),
        createProduct('prod_41', 'Gado-gado', 'cat_4', 20000, 10000),
        createProduct('prod_42', 'Nasi Uduk', 'cat_4', 18000, 9000),
        createProduct('prod_43', 'Pasta Carbonara', 'cat_4', 32000, 16000),
        createProduct('prod_44', 'Fried Rice Special', 'cat_4', 30000, 15000),
        createProduct('prod_45', 'Chicken Katsu Don', 'cat_4', 35000, 18000),

        // SNACK (5 items)
        createProduct('prod_46', 'Pisang Goreng', 'cat_5', 10000, 5000),
        createProduct('prod_47', 'French Fries', 'cat_5', 15000, 8000),
        createProduct('prod_48', 'Croissant', 'cat_5', 18000, 10000),
        createProduct('prod_49', 'Brownie', 'cat_5', 20000, 12000),
        createProduct('prod_50', 'Donut', 'cat_5', 12000, 6000),
    ];

    await db.products.bulkAdd(products);

    // ==================== MODIFIER GROUPS & MODIFIERS ====================
    const modifierGroups: ModifierGroup[] = [];
    const modifiers: Modifier[] = [];

    // Helper function untuk create modifier group
    function createModifierGroup(
        productId: string,
        name: string,
        selectionType: 'single' | 'multiple',
        isRequired: boolean,
        modifierOptions: Array<{ name: string; price: number; isDefault?: boolean; isAvailable?: boolean }>
    ) {
        const groupId = nanoid();
        const displayOrder = modifierGroups.filter(g => g.productId === productId).length + 1;

        modifierGroups.push({
            id: groupId,
            productId,
            name,
            selectionType,
            minSelection: isRequired ? 1 : 0,
            maxSelection: selectionType === 'single' ? 1 : 99,
            isRequired,
            displayOrder,
        });

        modifierOptions.forEach((opt, idx) => {
            modifiers.push({
                id: nanoid(),
                modifierGroupId: groupId,
                name: opt.name,
                priceAdjustment: opt.price,
                isDefault: opt.isDefault ?? false,
                isAvailable: opt.isAvailable ?? true,
                displayOrder: idx + 1,
            });
        });
    }

    // Apply modifiers ke semua kopi (15 products)
    const coffeeIds = products.filter(p => p.categoryId === 'cat_1').map(p => p.id);
    coffeeIds.forEach(id => {
        // Ukuran (Required)
        createModifierGroup(id, 'Ukuran', 'single', true, [
            { name: 'Regular', price: 0, isDefault: true },
            { name: 'Large', price: 5000 },
            { name: 'Extra Large', price: 10000 },
        ]);

        // Level Es
        createModifierGroup(id, 'Es', 'single', false, [
            { name: 'Normal', price: 0, isDefault: true },
            { name: 'Less Ice', price: 0 },
            { name: 'No Ice', price: 0 },
        ]);

        // Level Gula
        createModifierGroup(id, 'Gula', 'single', false, [
            { name: 'Normal', price: 0, isDefault: true },
            { name: 'Less Sugar', price: 0 },
            { name: 'No Sugar', price: 0 },
            { name: 'Extra Sweet', price: 2000 },
        ]);

        // Tambahan (Multiple)
        createModifierGroup(id, 'Tambahan', 'multiple', false, [
            { name: 'Extra Shot', price: 5000 },
            { name: 'Whipped Cream', price: 3000 },
            { name: 'Vanilla Syrup', price: 3000 },
            { name: 'Caramel Drizzle', price: 4000 },
            { name: 'Hazelnut', price: 3000 },
            { name: 'Cinnamon', price: 2000 },
            { name: 'Chocolate Chips', price: 4000, isAvailable: false }, // Contoh: Habis stock!
        ]);
    });

    // Apply modifiers ke teh (10 products)
    const teaIds = products.filter(p => p.categoryId === 'cat_2').map(p => p.id);
    teaIds.forEach(id => {
        createModifierGroup(id, 'Ukuran', 'single', true, [
            { name: 'Regular', price: 0, isDefault: true },
            { name: 'Large', price: 3000 },
        ]);

        createModifierGroup(id, 'Es', 'single', false, [
            { name: 'Dingin', price: 0, isDefault: true },
            { name: 'Hangat', price: 0 },
            { name: 'Panas', price: 0 },
        ]);

        createModifierGroup(id, 'Topping', 'multiple', false, [
            { name: 'Bubble', price: 5000 },
            { name: 'Jelly', price: 4000 },
            { name: 'Pudding', price: 5000 },
            { name: 'Aloe Vera', price: 4000 },
        ]);
    });

    // Apply modifiers ke makanan berat (nasi goreng, mie goreng, dll)
    const foodIds = products.filter(p => p.categoryId === 'cat_4').map(p => p.id);
    foodIds.forEach(id => {
        createModifierGroup(id, 'Level Pedas', 'single', false, [
            { name: 'Tidak Pedas', price: 0, isDefault: true },
            { name: 'Sedang', price: 0 },
            { name: 'Pedas', price: 0 },
            { name: 'Extra Pedas', price: 2000 },
        ]);

        createModifierGroup(id, 'Tambahan Lauk', 'multiple', false, [
            { name: 'Telur Ceplok', price: 5000 },
            { name: 'Telur Dadar', price: 5000 },
            { name: 'Ayam Goreng', price: 10000 },
            { name: 'Tempe Goreng', price: 3000 },
            { name: 'Tahu Goreng', price: 3000 },
            { name: 'Kerupuk', price: 2000 },
        ]);

        createModifierGroup(id, 'Porsi Nasi', 'single', false, [
            { name: 'Normal', price: 0, isDefault: true },
            { name: 'Tambah Nasi', price: 5000 },
            { name: 'Tanpa Nasi', price: -3000 },
        ]);
    });

    await db.modifierGroups.bulkAdd(modifierGroups);
    await db.modifiers.bulkAdd(modifiers);

    // ==================== INITIAL SHIFT ====================
    const initialShift: ShiftLog = {
        id: nanoid(),
        shiftNumber: `SHIFT-${new Date().toISOString().slice(0, 10)}-001`,
        openedBy: 'Kasir Demo',
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
    console.log(`   - ${modifierGroups.length} modifier groups`);
    console.log(`   - ${modifiers.length} modifiers`);
    console.log(`   - 1 active shift`);
}
