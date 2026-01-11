// 📊 ADMIN DASHBOARD - Overview Page
import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface DashboardStats {
    totalProducts: number;
    activeProducts: number;
    totalCategories: number;
    todayTransactions: number;
    todayRevenue: number;
    pendingSyncItems: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        activeProducts: 0,
        totalCategories: 0,
        todayTransactions: 0,
        todayRevenue: 0,
        pendingSyncItems: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

    useEffect(() => {
        loadStats();
        checkSupabaseConnection();
    }, []);

    async function loadStats() {
        try {
            // Local stats from Dexie
            const products = await db.products.toArray();
            const categories = await db.categories.toArray();
            const syncQueue = await db.syncQueue.count();

            // Today's transactions
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStart = today.getTime();

            const todayTx = await db.transactions
                .where('createdAt')
                .above(todayStart)
                .toArray();

            const todayRevenue = todayTx
                .filter(tx => tx.status === 'completed')
                .reduce((sum, tx) => sum + tx.total, 0);

            setStats({
                totalProducts: products.length,
                activeProducts: products.filter(p => p.isActive !== false).length,
                totalCategories: categories.length,
                todayTransactions: todayTx.length,
                todayRevenue,
                pendingSyncItems: syncQueue,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function checkSupabaseConnection() {
        if (!isSupabaseConfigured() || !supabase) {
            setSupabaseStatus('disconnected');
            return;
        }

        try {
            const { error } = await supabase.from('products').select('id').limit(1);
            setSupabaseStatus(error ? 'disconnected' : 'connected');
        } catch {
            setSupabaseStatus('disconnected');
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
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

    // Helper functions for status display
    const getStatusColorClass = (status: typeof supabaseStatus) => {
        if (status === 'connected') return 'bg-green-500';
        if (status === 'checking') return 'bg-yellow-500 animate-pulse';
        return 'bg-red-500';
    };

    const getStatusText = (status: typeof supabaseStatus) => {
        if (status === 'connected') return 'Terhubung';
        if (status === 'checking') return 'Memeriksa...';
        return 'Tidak Terhubung';
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-base-900">Dashboard</h1>
                <p className="text-zinc-500">Overview sistem POS Anda</p>
            </div>

            {/* Connection Status */}
            <div className="mb-6 p-4 bg-white border border-base-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColorClass(supabaseStatus)}`}></div>
                    <span className="font-medium text-base-900">
                        Supabase: {getStatusText(supabaseStatus)}
                    </span>
                </div>
                {stats.pendingSyncItems > 0 && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                        {stats.pendingSyncItems} item menunggu sync
                    </span>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon="📦"
                    label="Total Produk"
                    value={stats.totalProducts.toString()}
                    subtext={`${stats.activeProducts} aktif`}
                />
                <StatCard
                    icon="📁"
                    label="Kategori"
                    value={stats.totalCategories.toString()}
                />
                <StatCard
                    icon="🧾"
                    label="Transaksi Hari Ini"
                    value={stats.todayTransactions.toString()}
                />
                <StatCard
                    icon="💰"
                    label="Pendapatan Hari Ini"
                    value={formatCurrency(stats.todayRevenue)}
                    highlight
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-base-200 rounded-lg p-4">
                <h2 className="font-semibold text-base-900 mb-4">Aksi Cepat</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <QuickActionButton
                        icon="➕"
                        label="Tambah Produk"
                        href="/admin/products?action=add"
                    />
                    <QuickActionButton
                        icon="📊"
                        label="Lihat Laporan"
                        href="/admin/reports"
                    />
                    <QuickActionButton
                        icon="🔄"
                        label="Sync Data"
                        onClick={loadStats}
                    />
                    <QuickActionButton
                        icon="💳"
                        label="Buka Kasir"
                        href="/"
                    />
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
interface StatCardProps {
    readonly icon: string;
    readonly label: string;
    readonly value: string;
    readonly subtext?: string;
    readonly highlight?: boolean;
}

function StatCard({ icon, label, value, subtext, highlight }: StatCardProps) {
    return (
        <div className={`p-4 rounded-lg border ${highlight ? 'bg-base-900 text-white border-base-900' : 'bg-white border-base-200'
            }`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{icon}</span>
            </div>
            <div className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-base-900'}`}>
                {value}
            </div>
            <div className={`text-sm ${highlight ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {label}
                {subtext && <span className="ml-1">• {subtext}</span>}
            </div>
        </div>
    );
}

// Quick Action Button
interface QuickActionButtonProps {
    readonly icon: string;
    readonly label: string;
    readonly href?: string;
    readonly onClick?: () => void;
}

function QuickActionButton({ icon, label, href, onClick }: QuickActionButtonProps) {
    const className = "flex flex-col items-center gap-2 p-4 border border-base-200 rounded-lg hover:border-base-900 hover:bg-base-100 transition-colors cursor-pointer";

    if (href) {
        return (
            <a href={href} className={className}>
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-base-900">{label}</span>
            </a>
        );
    }

    return (
        <button onClick={onClick} className={className}>
            <span className="text-2xl">{icon}</span>
            <span className="text-sm font-medium text-base-900">{label}</span>
        </button>
    );
}
