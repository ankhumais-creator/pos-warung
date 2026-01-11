// 📂 ADMIN CATEGORIES - Category CRUD Management
import { useState, useEffect, useCallback } from 'react';
import { db, type Category } from '../../lib/db';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { nanoid } from 'nanoid';

interface CategoryFormData {
    id?: string;
    name: string;
    icon: string;
    displayOrder: number;
    isActive: boolean;
}

const initialFormData: CategoryFormData = {
    name: '',
    icon: '📦',
    displayOrder: 0,
    isActive: true,
};

// Common emoji icons for categories
const commonIcons = ['🐔', '🥚', '🌾', '🍚', '🥛', '🧴', '🍜', '🥤', '🍰', '🍞', '📦', '🛒', '💊', '🧹', '⚡'];

export default function AdminCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

    const loadData = useCallback(async () => {
        try {
            const cats = await db.categories.toArray();
            // Filter only active categories and sort by displayOrder
            setCategories(
                cats
                    .filter(c => c.isActive !== false)
                    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
            );
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter categories
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Open add modal
    const handleAdd = () => {
        setFormData({
            ...initialFormData,
            displayOrder: categories.length + 1,
        });
        setIsEditing(false);
        setShowModal(true);
    };

    // Open edit modal
    const handleEdit = (category: Category) => {
        setFormData({
            id: category.id,
            name: category.name,
            icon: category.icon,
            displayOrder: category.displayOrder || 0,
            isActive: category.isActive ?? true,
        });
        setIsEditing(true);
        setShowModal(true);
    };

    // Soft delete category
    const handleDelete = async (category: Category) => {
        // Check if category has products
        const productsInCategory = await db.products
            .where('categoryId')
            .equals(category.id)
            .filter(p => p.isActive !== false)
            .count();

        if (productsInCategory > 0) {
            alert(`Tidak bisa hapus! Kategori ini memiliki ${productsInCategory} produk aktif.`);
            return;
        }

        if (!confirm(`Hapus kategori "${category.name}"?`)) return;

        try {
            // Soft delete - set isActive to false
            await db.categories.update(category.id, {
                isActive: false,
            });

            // Sync to Supabase if connected
            if (isSupabaseConfigured() && supabase) {
                await supabase.from('categories').update({
                    is_active: false
                }).eq('id', category.id);
            }

            loadData();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Gagal menghapus kategori');
        }
    };

    // Save category (create or update)
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert('Nama kategori wajib diisi');
            return;
        }

        setIsSaving(true);

        try {
            const now = Date.now();
            const categoryId = formData.id || `cat_${nanoid(10)}`;

            const categoryData: Category = {
                id: categoryId,
                name: formData.name,
                icon: formData.icon,
                displayOrder: formData.displayOrder,
                isActive: formData.isActive,
                createdAt: isEditing ? (categories.find(c => c.id === categoryId)?.createdAt || now) : now,
            };

            // Save to local Dexie
            if (isEditing) {
                await db.categories.update(categoryId, categoryData);
            } else {
                await db.categories.add(categoryData);
            }

            // Sync to Supabase if connected
            if (isSupabaseConfigured() && supabase) {
                const supabaseData = {
                    id: categoryId,
                    name: categoryData.name,
                    icon: categoryData.icon,
                    display_order: categoryData.displayOrder,
                    is_active: categoryData.isActive,
                };

                const { error } = await supabase
                    .from('categories')
                    .upsert(supabaseData, { onConflict: 'id' });

                if (error) {
                    console.error('Supabase sync error:', error);
                    // Still close modal, category saved locally
                }
            }

            setShowModal(false);
            loadData();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Gagal menyimpan kategori');
        } finally {
            setIsSaving(false);
        }
    };

    // Sync all categories from Supabase
    const handleSyncFromServer = async () => {
        if (!isSupabaseConfigured() || !supabase) {
            alert('Supabase tidak terkonfigurasi');
            return;
        }

        setSyncStatus('syncing');

        try {
            const { data: serverCategories, error } = await supabase
                .from('categories')
                .select('*');

            if (error) throw error;

            if (serverCategories && serverCategories.length > 0) {
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
                    <h1 className="text-2xl font-bold text-base-900">Manajemen Kategori</h1>
                    <p className="text-zinc-500">{categories.length} kategori aktif</p>
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
                        Tambah Kategori
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Cari kategori..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                />
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-zinc-500">
                        Tidak ada kategori ditemukan
                    </div>
                ) : (
                    filteredCategories.map(category => (
                        <div
                            key={category.id}
                            className="bg-white border border-base-200 rounded-lg p-4 hover:border-base-900 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{category.icon}</span>
                                    <div>
                                        <h3 className="font-semibold text-base-900">{category.name}</h3>
                                        <p className="text-xs text-zinc-500">Urutan: {category.displayOrder || 0}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="p-2 hover:bg-base-100 rounded transition-colors"
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category)}
                                        className="p-2 hover:bg-red-50 rounded transition-colors"
                                        title="Hapus"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.isActive !== false
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                    {category.isActive !== false ? 'Aktif' : 'Nonaktif'}
                                </span>
                                <span className="text-xs text-zinc-400">ID: {category.id.slice(0, 8)}...</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md mx-4">
                        <div className="p-4 border-b border-base-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-base-900">
                                {isEditing ? 'Edit Kategori' : 'Tambah Kategori'}
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
                                {/* Icon */}
                                <div>
                                    <label className="block text-sm font-medium text-base-900 mb-2">
                                        Icon
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {commonIcons.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon })}
                                                className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${formData.icon === icon
                                                        ? 'border-base-900 bg-base-100'
                                                        : 'border-base-200 hover:border-base-400'
                                                    }`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                                        placeholder="Atau ketik emoji..."
                                        maxLength={4}
                                    />
                                </div>

                                {/* Name */}
                                <div>
                                    <label htmlFor="categoryName" className="block text-sm font-medium text-base-900 mb-1">
                                        Nama Kategori *
                                    </label>
                                    <input
                                        id="categoryName"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                                        placeholder="Pakan Ayam"
                                        required
                                    />
                                </div>

                                {/* Display Order */}
                                <div>
                                    <label htmlFor="displayOrder" className="block text-sm font-medium text-base-900 mb-1">
                                        Urutan Tampil
                                    </label>
                                    <input
                                        id="displayOrder"
                                        type="number"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: Number.parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                                        min="0"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Angka kecil tampil lebih dulu</p>
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-5 h-5 accent-base-900"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-base-900">
                                        Kategori aktif
                                    </label>
                                </div>

                                {/* Preview */}
                                <div className="p-3 bg-base-50 border border-base-200 rounded-lg">
                                    <p className="text-xs text-zinc-500 mb-2">Preview:</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{formData.icon}</span>
                                        <span className="font-medium text-base-900">{formData.name || 'Nama Kategori'}</span>
                                    </div>
                                </div>
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
