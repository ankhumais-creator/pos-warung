// 🏪 STORE SELECTOR - First-time tablet setup
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface Store {
    id: string;
    name: string;
    address?: string;
}

interface StoreSelectProps {
    readonly onStoreSelected: (storeId: string) => void;
}

export default function StoreSelect({ onStoreSelected }: StoreSelectProps) {
    const [stores, setStores] = useState<Store[]>([]);
    const [selectedStore, setSelectedStore] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStores();
    }, []);

    async function loadStores() {
        setIsLoading(true);
        setError('');

        try {
            // If Supabase not configured, use default store
            if (!isSupabaseConfigured() || !supabase) {
                setStores([{ id: 'default', name: 'Outlet Utama', address: 'Mode Offline' }]);
                setIsLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('stores')
                .select('id, name, address')
                .eq('is_active', true)
                .order('name');

            if (fetchError) {
                console.error('Error fetching stores:', fetchError);
                // Fallback to default store
                setStores([{ id: 'default', name: 'Outlet Utama', address: 'Offline Mode' }]);
            } else if (data && data.length > 0) {
                setStores(data);
            } else {
                // No stores in database, create default
                setStores([{ id: 'default', name: 'Outlet Utama', address: 'Default' }]);
            }
        } catch {
            setError('Gagal memuat daftar outlet');
            setStores([{ id: 'default', name: 'Outlet Utama', address: 'Offline' }]);
        } finally {
            setIsLoading(false);
        }
    }

    const handleConfirm = () => {
        if (!selectedStore) {
            setError('Pilih outlet terlebih dahulu');
            return;
        }

        // Save to localStorage
        localStorage.setItem('pos_store_id', selectedStore);
        const storeName = stores.find(s => s.id === selectedStore)?.name || selectedStore;
        localStorage.setItem('pos_store_name', storeName);

        onStoreSelected(selectedStore);
    };

    return (
        <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
            <div className="bg-white border border-base-200 rounded-xl shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="p-6 text-center border-b border-base-200">
                    <div className="w-20 h-20 bg-base-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🏪</span>
                    </div>
                    <h1 className="text-2xl font-bold text-base-900">Selamat Datang!</h1>
                    <p className="text-zinc-500 mt-1">Pilih outlet untuk perangkat ini</p>
                </div>

                {/* Store Selection */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-10 h-10 border-4 border-base-200 border-t-base-900 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            <label htmlFor="storeSelect" className="block text-sm font-medium text-base-900 mb-2">
                                Pilih Outlet
                            </label>
                            <div className="space-y-2">
                                {stores.map(store => (
                                    <button
                                        key={store.id}
                                        onClick={() => setSelectedStore(store.id)}
                                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${selectedStore === store.id
                                            ? 'border-base-900 bg-base-50'
                                            : 'border-base-200 hover:border-base-400'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedStore === store.id ? 'bg-base-900' : 'bg-base-100'
                                                }`}>
                                                <span className={selectedStore === store.id ? 'text-white' : ''}>
                                                    📍
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-base-900">{store.name}</div>
                                                {store.address && (
                                                    <div className="text-sm text-zinc-500">{store.address}</div>
                                                )}
                                            </div>
                                            {selectedStore === store.id && (
                                                <div className="ml-auto">
                                                    <span className="text-base-900">✓</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleConfirm}
                                disabled={!selectedStore}
                                className="w-full mt-6 btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Mulai Kasir
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-base-50 rounded-b-xl text-center text-xs text-zinc-500">
                    Pengaturan ini tersimpan di perangkat ini.<br />
                    Anda bisa mengubahnya nanti di pengaturan.
                </div>
            </div>
        </div>
    );
}
