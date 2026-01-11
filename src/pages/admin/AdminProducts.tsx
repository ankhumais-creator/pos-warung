// 📦 ADMIN PRODUCTS - Product CRUD Management
import { useState, useEffect, useCallback } from 'react';
import { db, type Product, type Category } from '../../lib/db';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { nanoid } from 'nanoid';

interface ProductFormData {
    id?: string;
    name: string;
    categoryId: string;
    basePrice: number;
    costPrice: number;
    stock: number;
    isAvailable: boolean;
}

const initialFormData: ProductFormData = {
    name: '',
    categoryId: '',
    basePrice: 0,
    costPrice: 0,
    stock: 100,
    isAvailable: true,
};

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

    const loadData = useCallback(async () => {
        try {
            const [prods, cats] = await Promise.all([
                db.products.toArray(),
                db.categories.toArray(),
            ]);
            // Filter only active products for display (soft delete)
            setProducts(prods.filter(p => p.isActive !== false));
            setCategories(cats.filter(c => c.isActive !== false));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || product.categoryId === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Open add modal
    const handleAdd = () => {
        setFormData(initialFormData);
        setIsEditing(false);
        setShowModal(true);
    };

    // Open edit modal
    const handleEdit = (product: Product) => {
        setFormData({
            id: product.id,
            name: product.name,
            categoryId: product.categoryId,
            basePrice: product.basePrice,
            costPrice: product.costPrice || 0,
            stock: product.stock || 0,
            isAvailable: product.isAvailable,
        });
        setIsEditing(true);
        setShowModal(true);
    };

    // Soft delete product
    const handleDelete = async (product: Product) => {
        if (!confirm(`Hapus produk "${product.name}"?`)) return;

        try {
            // Soft delete - set isActive to false
            await db.products.update(product.id, {
                isActive: false,
                updatedAt: Date.now()
            });

            // Sync to Supabase if connected
            if (isSupabaseConfigured() && supabase) {
                await supabase.from('products').update({
                    is_active: false
                }).eq('id', product.id);
            }

            loadData();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Gagal menghapus produk');
        }
    };

    // Save product (create or update)
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.categoryId) {
            alert('Nama dan Kategori wajib diisi');
            return;
        }

        setIsSaving(true);

        try {
            const now = Date.now();
            const productId = formData.id || `prod_${nanoid(10)}`;

            const productData: Product = {
                id: productId,
                name: formData.name,
                categoryId: formData.categoryId,
                basePrice: formData.basePrice,
                costPrice: formData.costPrice,
                stock: formData.stock,
                storeId: 'default',
                isAvailable: formData.isAvailable,
                isActive: true,
                createdAt: isEditing ? (products.find(p => p.id === productId)?.createdAt || now) : now,
                updatedAt: now,
            };

            // Save to local Dexie
            if (isEditing) {
                await db.products.update(productId, productData);
            } else {
                await db.products.add(productData);
            }

            // Sync to Supabase if connected
            if (isSupabaseConfigured() && supabase) {
                const supabaseData = {
                    id: productId,
                    name: productData.name,
                    category_id: productData.categoryId,
                    base_price: productData.basePrice,
                    cost_price: productData.costPrice,
                    stock: productData.stock,
                    store_id: productData.storeId,
                    is_available: productData.isAvailable,
                    is_active: productData.isActive,
                    synced_at: new Date().toISOString(),
                };

                const { error } = await supabase
                    .from('products')
                    .upsert(supabaseData, { onConflict: 'id' });

                if (error) {
                    console.error('Supabase sync error:', error);
                    // Still close modal, product saved locally
                }
            }

            setShowModal(false);
            loadData();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Gagal menyimpan produk');
        } finally {
            setIsSaving(false);
        }
    };

    // Sync all products from Supabase
    const handleSyncFromServer = async () => {
        if (!isSupabaseConfigured() || !supabase) {
            alert('Supabase tidak terkonfigurasi');
            return;
        }

        setSyncStatus('syncing');

        try {
            // Fetch all products from Supabase
            const { data: serverProducts, error } = await supabase
                .from('products')
                .select('*');

            if (error) throw error;

            if (serverProducts && serverProducts.length > 0) {
                // Convert and upsert to local Dexie
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

                    await db.products.put(localProduct);
                }

                setSyncStatus('success');
                loadData();

                setTimeout(() => setSyncStatus('idle'), 2000);
            }
        } catch (error) {
            console.error('Sync error:', error);
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 3000);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || categoryId;
    };

    // Helper functions for sync button styling
    const getSyncButtonClass = () => {
        if (syncStatus === 'syncing') return 'border-yellow-400 bg-yellow-50 text-yellow-700';
        if (syncStatus === 'success') return 'border-green-400 bg-green-50 text-green-700';
        if (syncStatus === 'error') return 'border-red-400 bg-red-50 text-red-700';
        return 'border-base-200 hover:border-base-900';
    };

    const getSyncButtonText = () => {
        if (syncStatus === 'syncing') return 'Syncing...';
        if (syncStatus === 'success') return 'Synced!';
        if (syncStatus === 'error') return 'Error';
        return 'Sync dari Server';
    };

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-base-200 border-t-base-900 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-zinc-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-base-900">Manajemen Produk</h1>
                    <p className="text-zinc-500">{products.length} produk aktif</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSyncFromServer}
                        disabled={syncStatus === 'syncing'}
                        className={`px-4 py-2 border rounded-lg font-medium transition-colors flex items-center gap-2 ${getSyncButtonClass()}`}
                    >
                        <span className={syncStatus === 'syncing' ? 'animate-spin' : ''}>🔄</span>
                        {getSyncButtonText()}
                    </button>
                    <button
                        onClick={handleAdd}
                        className="btn-primary px-4 py-2 flex items-center gap-2"
                    >
                        <span>➕</span>{' '}
                        Tambah Produk
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Cari produk..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                >
                    <option value="all">Semua Kategori</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-base-200 rounded-lg overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                <table className="w-full">
                    <thead className="bg-base-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-base-900">Nama Produk</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-base-900">Kategori</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-base-900">Harga Jual</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-base-900">Modal</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-base-900">Margin</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-base-900">Stok</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-base-900">Status</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-base-900">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200">
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                                    Tidak ada produk ditemukan
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map(product => {
                                const margin = product.basePrice - (product.costPrice || 0);
                                const marginPercent = product.costPrice > 0
                                    ? ((margin / product.costPrice) * 100).toFixed(0)
                                    : '∞';

                                return (
                                    <tr key={product.id} className="hover:bg-base-50">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-base-900">{product.name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-600">
                                            {getCategoryName(product.categoryId)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-base-900">
                                            {formatCurrency(product.basePrice)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-zinc-600">
                                            {formatCurrency(product.costPrice || 0)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-green-600 font-medium">
                                                {formatCurrency(margin)} ({marginPercent}%)
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-medium ${(product.stock || 0) < 10 ? 'text-red-600' : 'text-base-900'
                                                }`}>
                                                {product.stock || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isAvailable
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {product.isAvailable ? 'Tersedia' : 'Habis'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 hover:bg-base-100 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product)}
                                                    className="p-2 hover:bg-red-50 rounded transition-colors"
                                                    title="Hapus"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-lg mx-4">
                        <div className="p-4 border-b border-base-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-base-900">
                                {isEditing ? 'Edit Produk' : 'Tambah Produk'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-base-100 rounded"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-4">
                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label htmlFor="productName" className="block text-sm font-medium text-base-900 mb-1">
                                        Nama Produk *
                                    </label>
                                    <input
                                        id="productName"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                                        placeholder="Es Kopi Susu"
                                        required
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label htmlFor="productCategory" className="block text-sm font-medium text-base-900 mb-1">
                                        Kategori *
                                    </label>
                                    <select
                                        id="productCategory"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                                        required
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Prices */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="basePrice" className="block text-sm font-medium text-base-900 mb-1">
                                            Harga Jual (Rp)
                                        </label>
                                        <input
                                            id="basePrice"
                                            type="number"
                                            value={formData.basePrice}
                                            onChange={(e) => setFormData({ ...formData, basePrice: Number.parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                                            min="0"
                                            step="1000"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="costPrice" className="block text-sm font-medium text-base-900 mb-1">
                                            Modal / COGS (Rp)
                                        </label>
                                        <input
                                            id="costPrice"
                                            type="number"
                                            value={formData.costPrice}
                                            onChange={(e) => setFormData({ ...formData, costPrice: Number.parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                                            min="0"
                                            step="1000"
                                        />
                                    </div>
                                </div>

                                {/* Stock */}
                                <div>
                                    <label htmlFor="stockAmount" className="block text-sm font-medium text-base-900 mb-1">
                                        Stok
                                    </label>
                                    <input
                                        id="stockAmount"
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                                        min="0"
                                    />
                                </div>

                                {/* Availability */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isAvailable"
                                        checked={formData.isAvailable}
                                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                        className="w-5 h-5 accent-base-900"
                                    />
                                    <label htmlFor="isAvailable" className="text-sm font-medium text-base-900">
                                        Produk tersedia untuk dijual
                                    </label>
                                </div>

                                {/* Margin Preview */}
                                {formData.basePrice > 0 && formData.costPrice > 0 && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="text-sm text-green-700">
                                            <span className="font-medium">Margin: </span>
                                            {formatCurrency(formData.basePrice - formData.costPrice)}
                                            ({((formData.basePrice - formData.costPrice) / formData.costPrice * 100).toFixed(0)}%)
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-base-200 rounded-lg font-medium hover:bg-base-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 btn-primary px-4 py-2 flex items-center justify-center gap-2"
                                >
                                    {isSaving && (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
