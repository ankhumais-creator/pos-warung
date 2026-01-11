// 🏪 CASHIER PAGE - Industrial Clean Split-View Layout
import { useEffect, useState } from 'react';
import { useCashierStore } from '../lib/store';
import { db, getProductsWithModifiers, getCurrentShift, addTransaction } from '../lib/db';
import { Coffee, UtensilsCrossed, CupSoda, Cake, Pizza, ShoppingCart, X, Plus, Minus, LogOut } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import SuccessToast from '../components/SuccessToast';
import CloseShiftModal from '../components/CloseShiftModal';

const CATEGORY_ICONS: Record<string, any> = {
    'cat_1': Coffee,
    'cat_2': CupSoda,
    'cat_3': UtensilsCrossed,
    'cat_4': Pizza,
    'cat_5': Cake,
};

export default function Cashier() {
    const {
        categories,
        products,
        currentShift,
        selectedCategory,
        selectedProduct,
        cart,
        setCategories,
        setProducts,
        setCurrentShift,
        selectCategory,
        selectProduct,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
    } = useCashierStore();

    const [modifierSelections, setModifierSelections] = useState<Record<string, string[]>>({});
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const cats = await db.categories.orderBy('displayOrder').toArray();
        const prods = await getProductsWithModifiers();
        const shift = await getCurrentShift();

        setCategories(cats);
        setProducts(prods);
        setCurrentShift(shift);

        // Auto-select first category
        if (cats.length > 0) {
            selectCategory(cats[0].id);
        }
    }

    // Filter products by selected category
    const filteredProducts = selectedCategory
        ? products.filter(p => p.categoryId === selectedCategory)
        : products;

    // Calculate item total based on modifier selections
    const calculateItemTotal = () => {
        if (!selectedProduct) return 0;

        let total = selectedProduct.basePrice;

        Object.values(modifierSelections).flat().forEach(modId => {
            selectedProduct.modifierGroups.forEach(group => {
                const modifier = group.modifiers.find(m => m.id === modId);
                if (modifier) {
                    total += modifier.priceAdjustment;
                }
            });
        });

        return total * quantity;
    };

    const handleAddToCart = () => {
        if (!selectedProduct) return;

        const selectedMods = selectedProduct.modifierGroups
            .map(group => ({
                group,
                selected: group.modifiers.filter(m =>
                    modifierSelections[group.id]?.includes(m.id)
                ),
            }))
            .filter(item => item.selected.length > 0);

        addToCart({
            product: selectedProduct,
            quantity,
            selectedModifiers: selectedMods,
            notes,
            itemTotal: calculateItemTotal(),
        });

        // Reset
        setModifierSelections({});
        setQuantity(1);
        setNotes('');
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);

    // Handle CHARGE button click
    const handleCharge = () => {
        if (cart.length === 0) return;
        setShowPaymentModal(true);
    };

    // Handle payment completion
    const handlePaymentComplete = async (amountPaid: number, change: number) => {
        if (!currentShift) return;

        try {
            // Prepare transaction items with correct format
            const items = cart.map((item, index) => ({
                id: `item_${Date.now()}_${index}`,
                transactionId: '', // Will be set by addTransaction
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                basePrice: item.product.basePrice,
                selectedModifiers: item.selectedModifiers.flatMap(m =>
                    m.selected.map(mod => ({
                        groupName: m.group.name,
                        modifierName: mod.name,
                        priceAdjustment: mod.priceAdjustment,
                    }))
                ),
                notes: item.notes || '',
                itemTotal: item.itemTotal,
            }));

            // Save transaction
            await addTransaction({
                shiftId: currentShift.id,
                transactionNumber: `TRX-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-3)}`,
                items,
                subtotal: cartTotal,
                tax: 0,
                total: cartTotal,
                paymentMethod: 'cash',
                cashReceived: amountPaid,
                cashChange: change,
                status: 'completed',
            });

            // Clear cart
            useCashierStore.getState().clearCart();

            // Close modal and show success
            setShowPaymentModal(false);
            setShowSuccessToast(true);

        } catch (error) {
            console.error('Transaction failed:', error);
            alert('Transaksi gagal. Silakan coba lagi.');
        }
    };

    return (
        <div className="h-screen flex flex-col bg-base-100">
            {/* Header */}
            <header className="bg-white border-b border-base-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-base-900">POS Warung</h1>
                        {currentShift && (
                            <p className="text-sm text-slate-600 mt-1">
                                Shift: {currentShift.shiftNumber} • {currentShift.openedBy}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-slate-600">Modal Awal</div>
                            <div className="text-xl font-bold text-success-600">
                                Rp {currentShift?.openingCash.toLocaleString('id-ID')}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCloseShiftModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white font-semibold rounded-md hover:bg-zinc-800"
                        >
                            <LogOut size={18} strokeWidth={2} />
                            Tutup Shift
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content - Grid 12 Columns */}
            <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">

                {/* 1. SIDEBAR KIRI - Category Tabs (Cols 1-2) */}
                <aside className="col-span-2 bg-white border-r border-base-200 h-full overflow-y-auto custom-scrollbar">
                    <div className="p-4">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                            Kategori
                        </h2>
                        <div className="space-y-1">
                            {categories.map((cat) => {
                                const Icon = CATEGORY_ICONS[cat.id] || Coffee;
                                const isActive = selectedCategory === cat.id;

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => selectCategory(cat.id)}
                                        className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-md text-left
                      transition-all duration-150
                      ${isActive
                                                ? 'bg-zinc-900 text-white font-bold'
                                                : 'text-zinc-600 hover:bg-zinc-100'
                                            }
                    `}
                                    >
                                        <Icon size={20} strokeWidth={2} />
                                        <span className="font-medium">{cat.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* 2. PRODUCT GRID (Cols 3-8) */}
                <main className="col-span-6 p-6 h-full overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-3 gap-4">
                        {filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => selectProduct(product)}
                                className="card p-4 text-left hover:shadow-sm transition-shadow"
                            >
                                {/* Placeholder Image */}
                                <div className="aspect-square bg-base-100 rounded-md mb-3 flex items-center justify-center">
                                    <span className="text-4xl">{CATEGORY_ICONS[product.categoryId] ? '☕' : '🍽️'}</span>
                                </div>

                                <h3 className="font-medium text-base-900 mb-1 line-clamp-2">
                                    {product.name}
                                </h3>

                                <p className="text-price">
                                    Rp {product.basePrice.toLocaleString('id-ID')}
                                </p>

                                {!product.isAvailable && (
                                    <span className="inline-block mt-2 text-xs font-semibold text-danger-600 bg-red-50 px-2 py-1 rounded">
                                        Habis
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </main>

                {/* 3. CART & MODIFIER PANEL (Cols 9-12) */}
                <aside className="col-span-4 bg-white border-l border-base-200 h-full flex flex-col overflow-hidden">
                    {/* Cart Items - Scrollable Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-base-900 flex items-center gap-2">
                                    <ShoppingCart size={20} strokeWidth={2} />
                                    Keranjang ({cart.length})
                                </h2>
                            </div>

                            {cart.length === 0 && !selectedProduct && (
                                <div className="text-center py-12 text-slate-500">
                                    <ShoppingCart size={48} strokeWidth={1.5} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Keranjang kosong</p>
                                </div>
                            )}

                            {/* Cart Items List */}
                            <div className="space-y-3 mb-4">
                                {cart.map((item) => (
                                    <div key={item.id} className="card p-3">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-base-900">{item.product.name}</h4>
                                                {item.selectedModifiers.map(mod => (
                                                    <div key={mod.group.id} className="text-xs text-slate-600 mt-1">
                                                        {mod.selected.map(m => m.name).join(', ')}
                                                    </div>
                                                ))}
                                                {item.notes && (
                                                    <p className="text-xs text-slate-500 italic mt-1">{item.notes}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-danger-600 hover:bg-red-50 p-1 rounded"
                                            >
                                                <X size={16} strokeWidth={2} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                    className="w-8 h-8 flex items-center justify-center border border-base-200 rounded hover:bg-base-100"
                                                >
                                                    <Minus size={14} strokeWidth={2} />
                                                </button>
                                                <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                                    className="w-8 h-8 flex items-center justify-center border border-base-200 rounded hover:bg-base-100"
                                                >
                                                    <Plus size={14} strokeWidth={2} />
                                                </button>
                                            </div>
                                            <span className="font-bold text-zinc-900">
                                                Rp {item.itemTotal.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Modifier Panel (Contextual) */}
                            {selectedProduct && (
                                <div className="border-t-2 border-base-200 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-base-900">{selectedProduct.name}</h3>
                                        <button
                                            onClick={() => selectProduct(null)}
                                            className="text-slate-500 hover:text-base-900"
                                        >
                                            <X size={20} strokeWidth={2} />
                                        </button>
                                    </div>

                                    <p className="text-price mb-4">
                                        Rp {selectedProduct.basePrice.toLocaleString('id-ID')}
                                    </p>

                                    {/* Modifier Groups */}
                                    <div className="space-y-4 mb-4">
                                        {selectedProduct.modifierGroups.map((group) => (
                                            <div key={group.id}>
                                                <h4 className="text-sm font-semibold text-base-900 mb-2">
                                                    {group.name}
                                                    {group.isRequired && <span className="text-danger-600 ml-1">*</span>}
                                                </h4>

                                                <div className="space-y-2">
                                                    {group.modifiers.map((modifier) => {
                                                        const isSelected = modifierSelections[group.id]?.includes(modifier.id);

                                                        return (
                                                            <label
                                                                key={modifier.id}
                                                                className={`
                                flex items-center justify-between p-2 rounded border cursor-pointer
                                ${isSelected ? 'border-zinc-900 bg-zinc-100' : 'border-base-200'}
                                ${modifier.isAvailable ? '' : 'opacity-50 cursor-not-allowed'}
                              `}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type={group.selectionType === 'single' ? 'radio' : 'checkbox'}
                                                                        name={group.id}
                                                                        checked={isSelected}
                                                                        disabled={!modifier.isAvailable}
                                                                        onChange={(e) => {
                                                                            if (group.selectionType === 'single') {
                                                                                setModifierSelections(prev => ({
                                                                                    ...prev,
                                                                                    [group.id]: [modifier.id],
                                                                                }));
                                                                            } else {
                                                                                setModifierSelections(prev => {
                                                                                    const current = prev[group.id] || [];
                                                                                    return {
                                                                                        ...prev,
                                                                                        [group.id]: e.target.checked
                                                                                            ? [...current, modifier.id]
                                                                                            : current.filter(id => id !== modifier.id),
                                                                                    };
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="w-4 h-4"
                                                                    />
                                                                    <span className="text-sm font-medium">
                                                                        {modifier.name}
                                                                        {!modifier.isAvailable && ' (Habis)'}
                                                                    </span>
                                                                </div>
                                                                {modifier.priceAdjustment !== 0 && (
                                                                    <span className="text-sm font-semibold text-zinc-900">
                                                                        {modifier.priceAdjustment > 0 ? '+' : ''}
                                                                        Rp {modifier.priceAdjustment.toLocaleString('id-ID')}
                                                                    </span>
                                                                )}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Notes */}
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Catatan khusus..."
                                        className="w-full p-2 border border-base-200 rounded text-sm mb-3"
                                        rows={2}
                                    />

                                    {/* Quantity */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-semibold">Jumlah</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-10 h-10 flex items-center justify-center border border-base-200 rounded hover:bg-base-100"
                                            >
                                                <Minus size={18} strokeWidth={2} />
                                            </button>
                                            <span className="font-bold text-lg w-12 text-center">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="w-10 h-10 flex items-center justify-center border border-base-200 rounded hover:bg-base-100"
                                            >
                                                <Plus size={18} strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Add to Cart Button */}
                                    <button
                                        onClick={handleAddToCart}
                                        className="w-full btn-primary py-4 text-lg font-bold rounded-md mb-4"
                                    >
                                        Tambah - Rp {calculateItemTotal().toLocaleString('id-ID')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sticky Footer - Charge Button */}
                    <div className="border-t-2 border-base-200 p-4 bg-white">
                        <div className="flex items-baseline justify-between mb-3">
                            <span className="text-sm font-semibold text-slate-600">TOTAL</span>
                            <span className="text-total">
                                Rp {cartTotal.toLocaleString('id-ID')}
                            </span>
                        </div>
                        <button
                            onClick={handleCharge}
                            disabled={cart.length === 0}
                            className="w-full btn-primary py-5 text-xl font-bold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            CHARGE
                        </button>
                    </div>
                </aside>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <PaymentModal
                    total={cartTotal}
                    onClose={() => setShowPaymentModal(false)}
                    onPaymentComplete={handlePaymentComplete}
                />
            )}

            {/* Success Toast */}
            {showSuccessToast && (
                <SuccessToast
                    message="Transaksi Berhasil!"
                    onClose={() => setShowSuccessToast(false)}
                />
            )}

            {/* Close Shift Modal */}
            {showCloseShiftModal && currentShift && (
                <CloseShiftModal
                    shift={currentShift}
                    onClose={() => setShowCloseShiftModal(false)}
                    onShiftClosed={() => {
                        setShowCloseShiftModal(false);
                        setCurrentShift(null);
                    }}
                />
            )}
        </div>
    );
}
