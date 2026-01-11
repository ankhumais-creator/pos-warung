// 🏪 ADMIN OUTLETS - Multi-Outlet Management
import { useState, useEffect } from 'react';
import { useAdminStore, getActiveOutlets, type Outlet } from '../../lib/adminStore';
import { isSupabaseConfigured } from '../../lib/supabase';

interface OutletFormData {
    id?: string;
    name: string;
    address: string;
    phone: string;
}

const initialFormData: OutletFormData = {
    name: '',
    address: '',
    phone: '',
};

export default function AdminOutlets() {
    const { outlets, fetchOutlets, addOutlet, updateOutlet, deleteOutlet, isLoadingOutlets } = useAdminStore();
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<OutletFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Get outlets excluding "all" option
    const activeOutlets = getActiveOutlets(outlets);

    useEffect(() => {
        fetchOutlets();
    }, [fetchOutlets]);

    // Open add modal
    const handleAdd = () => {
        setFormData(initialFormData);
        setIsEditing(false);
        setError('');
        setShowModal(true);
    };

    // Open edit modal
    const handleEdit = (outlet: Outlet) => {
        setFormData({
            id: outlet.id,
            name: outlet.name,
            address: outlet.address || '',
            phone: outlet.phone || '',
        });
        setIsEditing(true);
        setError('');
        setShowModal(true);
    };

    // Delete outlet
    const handleDelete = async (outlet: Outlet) => {
        if (outlet.id === 'default') {
            alert('Tidak bisa menghapus outlet utama!');
            return;
        }

        if (!confirm(`Hapus outlet "${outlet.name}"? Data outlet akan disembunyikan.`)) return;

        const success = await deleteOutlet(outlet.id);
        if (!success) {
            alert('Gagal menghapus outlet. Pastikan Supabase terhubung.');
        }
    };

    // Save outlet
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Nama outlet wajib diisi');
            return;
        }

        if (!isSupabaseConfigured()) {
            setError('Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env');
            return;
        }

        setIsSaving(true);

        try {
            if (isEditing && formData.id) {
                const success = await updateOutlet(formData.id, {
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone,
                });

                if (!success) {
                    setError('Gagal menyimpan perubahan');
                    return;
                }
            } else {
                const result = await addOutlet({
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone,
                });

                if (!result) {
                    setError('Gagal menambahkan outlet');
                    return;
                }
            }

            setShowModal(false);
        } catch {
            setError('Terjadi kesalahan');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-base-900">Manajemen Outlet</h1>
                    <p className="text-zinc-500">{activeOutlets.length} outlet terdaftar</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="btn-primary px-4 py-2 flex items-center gap-2"
                >
                    <span>➕</span>{' '}
                    Tambah Outlet
                </button>
            </div>

            {/* Supabase Warning */}
            {!isSupabaseConfigured() && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <h3 className="font-semibold text-yellow-800">Supabase Belum Dikonfigurasi</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                Untuk mengelola outlet, tambahkan variabel berikut di file <code className="bg-yellow-100 px-1 rounded">.env</code>:
                            </p>
                            <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                                {`VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key`}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoadingOutlets ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-base-200 border-t-base-900 rounded-full animate-spin"></div>
                </div>
            ) : (
                /* Outlets Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeOutlets.map(outlet => (
                        <OutletCard
                            key={outlet.id}
                            outlet={outlet}
                            onEdit={() => handleEdit(outlet)}
                            onDelete={() => handleDelete(outlet)}
                            isDefault={outlet.id === 'default'}
                        />
                    ))}

                    {/* Empty State */}
                    {activeOutlets.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white border border-base-200 rounded-lg">
                            <div className="text-4xl mb-3">🏪</div>
                            <h3 className="text-lg font-semibold text-base-900">Belum Ada Outlet</h3>
                            <p className="text-zinc-500 mt-1">Tambahkan outlet pertama Anda</p>
                            <button
                                onClick={handleAdd}
                                className="mt-4 btn-primary px-4 py-2"
                            >
                                Tambah Outlet
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md mx-4">
                        <div className="p-4 border-b border-base-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-base-900">
                                {isEditing ? 'Edit Outlet' : 'Tambah Outlet Baru'}
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
                                    <label htmlFor="outletName" className="block text-sm font-medium text-base-900 mb-1">
                                        Nama Outlet *
                                    </label>
                                    <input
                                        id="outletName"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                                        placeholder="Warung Cabang Baru"
                                        required
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <label htmlFor="outletAddress" className="block text-sm font-medium text-base-900 mb-1">
                                        Alamat
                                    </label>
                                    <textarea
                                        id="outletAddress"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900 resize-none"
                                        placeholder="Jl. Contoh No. 123"
                                        rows={2}
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label htmlFor="outletPhone" className="block text-sm font-medium text-base-900 mb-1">
                                        No. Telepon
                                    </label>
                                    <input
                                        id="outletPhone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                                        placeholder="081234567890"
                                    />
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                        {error}
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

// Outlet Card Component
interface OutletCardProps {
    readonly outlet: Outlet;
    readonly onEdit: () => void;
    readonly onDelete: () => void;
    readonly isDefault: boolean;
}

function OutletCard({ outlet, onEdit, onDelete, isDefault }: OutletCardProps) {
    return (
        <div className="bg-white border border-base-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-base-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🏪</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-base-900">{outlet.name}</h3>
                        {isDefault && (
                            <span className="text-xs bg-base-900 text-white px-2 py-0.5 rounded-full">
                                Utama
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-base-100 rounded transition-colors"
                        title="Edit"
                    >
                        ✏️
                    </button>
                    {!isDefault && (
                        <button
                            onClick={onDelete}
                            className="p-2 hover:bg-red-50 rounded transition-colors"
                            title="Hapus"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-1 text-sm text-zinc-600">
                {outlet.address && (
                    <div className="flex items-start gap-2">
                        <span>📍</span>
                        <span>{outlet.address}</span>
                    </div>
                )}
                {outlet.phone && (
                    <div className="flex items-center gap-2">
                        <span>📞</span>
                        <span>{outlet.phone}</span>
                    </div>
                )}
            </div>

            {/* Stats placeholder */}
            <div className="mt-4 pt-3 border-t border-base-200 grid grid-cols-2 gap-2 text-center">
                <div>
                    <div className="text-lg font-bold text-base-900">0</div>
                    <div className="text-xs text-zinc-500">Transaksi Hari Ini</div>
                </div>
                <div>
                    <div className="text-lg font-bold text-green-600">Rp 0</div>
                    <div className="text-xs text-zinc-500">Pendapatan</div>
                </div>
            </div>
        </div>
    );
}
