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
        { id: 'cat_1', name: 'Kopi', icon: '☕', displayOrder: 1, createdAt: now },
        { id: 'cat_2', name: 'Teh', icon: '🍵', displayOrder: 2, createdAt: now },
        { id: 'cat_3', name: 'Jus & Smoothie', icon: '🥤', displayOrder: 3, createdAt: now },
        { id: 'cat_4', name: 'Makanan Berat', icon: '🍜', displayOrder: 4, createdAt: now },
        { id: 'cat_5', name: 'Snack', icon: '🍰', displayOrder: 5, createdAt: now },
    ];

    await db.categories.bulkAdd(categories);

    // ==================== PRODUCTS ====================
    const products: Product[] = [
        // KOPI (15 items)
        { id: 'prod_1', name: 'Es Kopi Susu', categoryId: 'cat_1', basePrice: 15000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_2', name: 'Americano', categoryId: 'cat_1', basePrice: 18000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_3', name: 'Cappuccino', categoryId: 'cat_1', basePrice: 20000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_4', name: 'Latte', categoryId: 'cat_1', basePrice: 22000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_5', name: 'Mocha', categoryId: 'cat_1', basePrice: 24000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_6', name: 'Affogato', categoryId: 'cat_1', basePrice: 28000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_7', name: 'Kopi Tubruk', categoryId: 'cat_1', basePrice: 10000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_8', name: 'Kopi Susu Gula Aren', categoryId: 'cat_1', basePrice: 18000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_9', name: 'Vietnamese Coffee', categoryId: 'cat_1', basePrice: 20000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_10', name: 'Kopi Jahe', categoryId: 'cat_1', basePrice: 16000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_11', name: 'Caramel Macchiato', categoryId: 'cat_1', basePrice: 26000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_12', name: 'Espresso', categoryId: 'cat_1', basePrice: 15000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_13', name: 'Flat White', categoryId: 'cat_1', basePrice: 23000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_14', name: 'Kopi Kelapa', categoryId: 'cat_1', basePrice: 19000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_15', name: 'Irish Coffee', categoryId: 'cat_1', basePrice: 30000, isAvailable: true, createdAt: now, updatedAt: now },

        // TEH (10 items)
        { id: 'prod_16', name: 'Es Teh Manis', categoryId: 'cat_2', basePrice: 8000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_17', name: 'Thai Tea', categoryId: 'cat_2', basePrice: 15000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_18', name: 'Lemon Tea', categoryId: 'cat_2', basePrice: 12000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_19', name: 'Green Tea Latte', categoryId: 'cat_2', basePrice: 18000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_20', name: 'Teh Tarik', categoryId: 'cat_2', basePrice: 14000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_21', name: 'Jasmine Tea', categoryId: 'cat_2', basePrice: 10000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_22', name: 'Oolong Tea', categoryId: 'cat_2', basePrice: 12000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_23', name: 'Teh Poci', categoryId: 'cat_2', basePrice: 7000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_24', name: 'Milk Tea', categoryId: 'cat_2', basePrice: 16000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_25', name: 'Earl Grey', categoryId: 'cat_2', basePrice: 11000, isAvailable: true, createdAt: now, updatedAt: now },

        // JUS & SMOOTHIE (10 items)
        { id: 'prod_26', name: 'Jus Jeruk', categoryId: 'cat_3', basePrice: 15000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_27', name: 'Jus Alpukat', categoryId: 'cat_3', basePrice: 18000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_28', name: 'Jus Mangga', categoryId: 'cat_3', basePrice: 17000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_29', name: 'Smoothie Bowl', categoryId: 'cat_3', basePrice: 35000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_30', name: 'Green Smoothie', categoryId: 'cat_3', basePrice: 25000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_31', name: 'Jus Wortel', categoryId: 'cat_3', basePrice: 14000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_32', name: 'Jus Semangka', categoryId: 'cat_3', basePrice: 12000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_33', name: 'Jus Melon', categoryId: 'cat_3', basePrice: 13000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_34', name: 'Banana Smoothie', categoryId: 'cat_3', basePrice: 20000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_35', name: 'Berry Blast', categoryId: 'cat_3', basePrice: 28000, isAvailable: true, createdAt: now, updatedAt: now },

        // MAKANAN BERAT (10 items)
        { id: 'prod_36', name: 'Nasi Goreng', categoryId: 'cat_4', basePrice: 25000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_37', name: 'Mie Goreng', categoryId: 'cat_4', basePrice: 23000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_38', name: 'Nasi Ayam Geprek', categoryId: 'cat_4', basePrice: 28000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_39', name: 'Nasi Rendang', categoryId: 'cat_4', basePrice: 35000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_40', name: 'Soto Ayam', categoryId: 'cat_4', basePrice: 22000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_41', name: 'Gado-gado', categoryId: 'cat_4', basePrice: 20000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_42', name: 'Nasi Uduk', categoryId: 'cat_4', basePrice: 18000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_43', name: 'Pasta Carbonara', categoryId: 'cat_4', basePrice: 32000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_44', name: 'Fried Rice Special', categoryId: 'cat_4', basePrice: 30000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_45', name: 'Chicken Katsu Don', categoryId: 'cat_4', basePrice: 35000, isAvailable: true, createdAt: now, updatedAt: now },

        // SNACK (5 items)
        { id: 'prod_46', name: 'Pisang Goreng', categoryId: 'cat_5', basePrice: 10000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_47', name: 'French Fries', categoryId: 'cat_5', basePrice: 15000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_48', name: 'Croissant', categoryId: 'cat_5', basePrice: 18000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_49', name: 'Brownie', categoryId: 'cat_5', basePrice: 20000, isAvailable: true, createdAt: now, updatedAt: now },
        { id: 'prod_50', name: 'Donut', categoryId: 'cat_5', basePrice: 12000, isAvailable: true, createdAt: now, updatedAt: now },
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
