// 🎨 ZUSTAND STORE - State Management untuk Kasir
import { create } from 'zustand';
import type { Product, Category, Modifier, ModifierGroup, ShiftLog } from './db';

interface CartItem {
    id: string; // Unique per cart item (not product ID)
    product: Product;
    quantity: number;
    selectedModifiers: Array<{
        group: ModifierGroup;
        selected: Modifier[];
    }>;
    notes: string;
    itemTotal: number;
}

interface CashierStore {
    // Data
    categories: Category[];
    products: (Product & { modifierGroups: (ModifierGroup & { modifiers: Modifier[] })[] })[];
    currentShift: ShiftLog | null;

    // UI State
    selectedCategory: string | null;
    selectedProduct: (Product & { modifierGroups: (ModifierGroup & { modifiers: Modifier[] })[] }) | null;
    cart: CartItem[];

    // Actions
    setCategories: (categories: Category[]) => void;
    setProducts: (products: any[]) => void;
    setCurrentShift: (shift: ShiftLog | null) => void;
    selectCategory: (categoryId: string) => void;
    selectProduct: (product: any) => void;
    addToCart: (item: Omit<CartItem, 'id'>) => void;
    removeFromCart: (itemId: string) => void;
    updateCartItemQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
}

export const useCashierStore = create<CashierStore>((set) => ({
    // Initial State
    categories: [],
    products: [],
    currentShift: null,
    selectedCategory: null,
    selectedProduct: null,
    cart: [],

    // Actions
    setCategories: (categories) => set({ categories }),

    setProducts: (products) => set({ products }),

    setCurrentShift: (shift) => set({ currentShift: shift }),

    selectCategory: (categoryId) => set({ selectedCategory: categoryId }),

    selectProduct: (product) => set({ selectedProduct: product }),

    addToCart: (item) => set((state) => {
        const id = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        // Calculate correct item total (per-unit price * quantity)
        // Assuming item.itemTotal passed in is the per-unit price (including modifiers for one unit)
        const correctTotal = item.itemTotal * item.quantity;

        return {
            cart: [...state.cart, { ...item, id, itemTotal: correctTotal }],
            selectedProduct: null, // Close modifier panel after add
        };
    }),

    removeFromCart: (itemId) => set((state) => ({
        cart: state.cart.filter(item => item.id !== itemId),
    })),

    updateCartItemQuantity: (itemId, quantity) => set((state) => ({
        cart: state.cart.map(item => {
            if (item.id !== itemId) return item;

            // Recalculate item total based on new quantity
            const perUnitPrice = item.itemTotal / item.quantity;
            const newTotal = perUnitPrice * quantity;

            return { ...item, quantity, itemTotal: newTotal };
        }),
    })),

    clearCart: () => set({ cart: [], selectedProduct: null }),
}));
