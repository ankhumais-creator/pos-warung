// 📈 ADMIN REPORTS - Visual Analytics Dashboard with REAL DATA
import { useState, useEffect, useCallback } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { db } from '../../lib/db';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAdminStore } from '../../lib/adminStore';

// Chart colors - Zinc/Emerald theme
const COLORS = {
    primary: '#18181b',      // zinc-900
    secondary: '#71717a',    // zinc-500
    accent: '#10b981',       // emerald-500
    light: '#f4f4f5',        // zinc-100
    grid: '#e4e4e7',         // zinc-200
};

const PIE_COLORS = ['#18181b', '#3f3f46', '#52525b', '#71717a', '#a1a1aa'];

interface HourlyData {
    hour: string;
    revenue: number;
    transactions: number;
}

interface ProductSales {
    name: string;
    quantity: number;
    revenue: number;
}

interface CategorySales {
    name: string;
    value: number;
}

interface TransactionData {
    id: string;
    total: number;
    status: string;
    createdAt: number;
    storeId?: string;
    items?: Array<{
        productId: string;
        productName: string;
        quantity: number;
        itemTotal: number;
    }>;
}

// ===== HELPER FUNCTIONS (extracted to reduce cognitive complexity) =====

/** Fetch transactions from Supabase */
async function fetchFromSupabase(
    todayStart: number,
    selectedOutlet: string
): Promise<TransactionData[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('status', 'completed')
            .gte('created_at', new Date(todayStart).toISOString());

        if (selectedOutlet !== 'all') {
            query = query.eq('store_id', selectedOutlet);
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) return null;

        return data.map(tx => ({
            id: tx.id,
            total: tx.total,
            status: tx.status,
            createdAt: new Date(tx.created_at).getTime(),
            storeId: tx.store_id,
            items: tx.items || [],
        }));
    } catch (err) {
        console.warn('Supabase fetch failed:', err);
        return null;
    }
}

/** Fetch transactions from local Dexie database */
async function fetchFromLocal(
    todayStart: number,
    selectedOutlet: string
): Promise<TransactionData[]> {
    const localTx = await db.transactions
        .where('createdAt')
        .above(todayStart)
        .toArray();

    return localTx
        .filter(tx => {
            if (tx.status !== 'completed') return false;
            if (selectedOutlet !== 'all' && tx.storeId && tx.storeId !== selectedOutlet) {
                return false;
            }
            return true;
        })
        .map(tx => ({
            id: tx.id,
            total: tx.total,
            status: tx.status,
            createdAt: tx.createdAt,
            storeId: tx.storeId,
            items: tx.items,
        }));
}

/** Calculate hourly revenue data */
function calculateHourlyData(transactions: TransactionData[]): HourlyData[] {
    const hourlyMap = new Map<number, { revenue: number; count: number }>();
    for (let i = 6; i <= 22; i++) {
        hourlyMap.set(i, { revenue: 0, count: 0 });
    }

    for (const tx of transactions) {
        const hour = new Date(tx.createdAt).getHours();
        const current = hourlyMap.get(hour);
        if (current) {
            current.revenue += tx.total;
            current.count += 1;
        }
    }

    const result: HourlyData[] = [];
    hourlyMap.forEach((data, hour) => {
        result.push({
            hour: `${hour}:00`,
            revenue: data.revenue,
            transactions: data.count,
        });
    });

    return result;
}

/** Calculate top selling products */
function calculateTopProducts(transactions: TransactionData[]): ProductSales[] {
    const productMap = new Map<string, { name: string; qty: number; rev: number }>();

    for (const tx of transactions) {
        if (!tx.items) continue;
        for (const item of tx.items) {
            const current = productMap.get(item.productId) || {
                name: item.productName,
                qty: 0,
                rev: 0
            };
            current.qty += item.quantity;
            current.rev += item.itemTotal;
            productMap.set(item.productId, current);
        }
    }

    return Array.from(productMap.values())
        .map(p => ({ name: p.name, quantity: p.qty, revenue: p.rev }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
}

/** Calculate category sales for pie chart */
async function calculateCategorySales(transactions: TransactionData[]): Promise<CategorySales[]> {
    const categories = await db.categories.toArray();
    const products = await db.products.toArray();

    const categoryMap = new Map<string, number>();
    categories.forEach(cat => categoryMap.set(cat.id, 0));

    for (const tx of transactions) {
        if (!tx.items) continue;
        for (const item of tx.items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const current = categoryMap.get(product.categoryId) || 0;
                categoryMap.set(product.categoryId, current + item.itemTotal);
            }
        }
    }

    return categories
        .filter(cat => (categoryMap.get(cat.id) || 0) > 0)
        .map(cat => ({
            name: cat.name,
            value: categoryMap.get(cat.id) || 0,
        }))
        .sort((a, b) => b.value - a.value);
}

/** Count total items sold */
function countTotalItems(transactions: TransactionData[]): number {
    return transactions.reduce((total, tx) => {
        if (!tx.items) return total;
        return total + tx.items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
}

// ===== MAIN COMPONENT =====

export default function AdminReports() {
    const { selectedOutlet, dateRange } = useAdminStore();
    const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
    const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
    const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
    const [totals, setTotals] = useState({
        revenue: 0,
        transactions: 0,
        avgTicket: 0,
        itemsSold: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [dataSource, setDataSource] = useState<'local' | 'supabase'>('local');

    const loadReportData = useCallback(async () => {
        setIsLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStart = today.getTime();

            // Try Supabase first, fallback to local
            let transactions = await fetchFromSupabase(todayStart, selectedOutlet);
            if (transactions) {
                setDataSource('supabase');
            } else {
                transactions = await fetchFromLocal(todayStart, selectedOutlet);
                setDataSource('local');
            }

            // Calculate all metrics using helper functions
            setHourlyData(calculateHourlyData(transactions));
            setTopProducts(calculateTopProducts(transactions));
            setCategorySales(await calculateCategorySales(transactions));

            const totalRevenue = transactions.reduce((sum, tx) => sum + tx.total, 0);
            const totalTx = transactions.length;

            setTotals({
                revenue: totalRevenue,
                transactions: totalTx,
                avgTicket: totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0,
                itemsSold: countTotalItems(transactions),
            });

        } catch (error) {
            console.error('Error loading report data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedOutlet, dateRange]);

    useEffect(() => {
        loadReportData();
    }, [loadReportData]);

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toString();
    };

    const formatFullCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-base-200 border-t-base-900 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-zinc-500">Memuat laporan...</p>
                </div>
            </div>
        );
    }

    const hasData = totals.transactions > 0;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-base-900">Laporan & Analitik</h1>
                    <p className="text-zinc-500">
                        Performa penjualan {selectedOutlet === 'all' ? 'semua outlet' : 'outlet terpilih'} hari ini
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${dataSource === 'supabase'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-zinc-100 text-zinc-600'
                        }`}>
                        {dataSource === 'supabase' ? '☁️ Supabase' : '💾 Lokal'}
                    </span>
                    <button
                        onClick={loadReportData}
                        className="px-4 py-2 border border-base-200 rounded-lg hover:border-base-900 flex items-center gap-2"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* No Data State */}
            {!hasData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-center">
                    <div className="text-4xl mb-3">📊</div>
                    <h3 className="text-lg font-semibold text-yellow-800">Belum Ada Transaksi Hari Ini</h3>
                    <p className="text-yellow-700 mt-1">
                        Grafik akan terisi setelah ada transaksi. Buka kasir dan mulai jual!
                    </p>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <SummaryCard
                    label="Total Pendapatan"
                    value={formatFullCurrency(totals.revenue)}
                    icon="💰"
                    highlight={hasData}
                />
                <SummaryCard
                    label="Total Transaksi"
                    value={totals.transactions.toString()}
                    icon="🧾"
                />
                <SummaryCard
                    label="Rata-rata Ticket"
                    value={formatFullCurrency(totals.avgTicket)}
                    icon="📊"
                />
                <SummaryCard
                    label="Item Terjual"
                    value={totals.itemsSold.toString()}
                    icon="📦"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                {/* Revenue Trend - Area Chart */}
                <div className="col-span-2 bg-white border border-base-200 rounded-lg p-4">
                    <h2 className="font-semibold text-base-900 mb-4">📈 Trend Penjualan Harian</h2>
                    {hasData ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                                <XAxis
                                    dataKey="hour"
                                    tick={{ fill: COLORS.secondary, fontSize: 12 }}
                                    axisLine={{ stroke: COLORS.grid }}
                                />
                                <YAxis
                                    tickFormatter={formatCurrency}
                                    tick={{ fill: COLORS.secondary, fontSize: 12 }}
                                    axisLine={{ stroke: COLORS.grid }}
                                />
                                <Tooltip
                                    formatter={(value: number) => [formatFullCurrency(value), 'Pendapatan']}
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: `1px solid ${COLORS.grid}`,
                                        borderRadius: '8px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke={COLORS.primary}
                                    strokeWidth={2}
                                    fill="url(#revenueGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart icon="📉" message="Data tersedia setelah ada transaksi" />
                    )}
                </div>

                {/* Category Breakdown - Pie Chart */}
                <div className="bg-white border border-base-200 rounded-lg p-4">
                    <h2 className="font-semibold text-base-900 mb-4">🥧 Penjualan per Kategori</h2>
                    {categorySales.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categorySales}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {categorySales.map((category) => (
                                        <Cell
                                            key={`category-${category.name}`}
                                            fill={PIE_COLORS[categorySales.indexOf(category) % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatFullCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart icon="🥧" message="Belum ada data kategori" />
                    )}
                </div>
            </div>

            {/* Top Products - Bar Chart */}
            <div className="bg-white border border-base-200 rounded-lg p-4">
                <h2 className="font-semibold text-base-900 mb-4">🏆 Top 5 Produk Terlaris</h2>
                {topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                            <XAxis type="number" tick={{ fill: COLORS.secondary, fontSize: 12 }} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fill: COLORS.primary, fontSize: 12, fontWeight: 500 }}
                                width={100}
                            />
                            <Tooltip
                                formatter={(value: number, name: string) => [
                                    name === 'quantity' ? `${value} item` : formatFullCurrency(value),
                                    name === 'quantity' ? 'Terjual' : 'Pendapatan'
                                ]}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: `1px solid ${COLORS.grid}`,
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                            <Bar dataKey="quantity" name="Qty Terjual" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                            <Bar dataKey="revenue" name="Pendapatan" fill={COLORS.accent} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyChart icon="🏆" message="Belum ada produk terjual" height={250} />
                )}
            </div>

            {/* Data Note */}
            <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-500 flex items-center gap-2">
                <span>💡</span>
                <span>
                    Data diambil dari {dataSource === 'supabase' ? 'Supabase (cloud)' : 'database lokal'}.
                    {selectedOutlet !== 'all' && ' Difilter berdasarkan outlet yang dipilih.'}
                </span>
            </div>
        </div>
    );
}

// ===== SUB-COMPONENTS =====

interface SummaryCardProps {
    readonly label: string;
    readonly value: string;
    readonly icon: string;
    readonly highlight?: boolean;
}

function SummaryCard({ label, value, icon, highlight }: SummaryCardProps) {
    const baseClass = highlight
        ? 'bg-base-900 text-white border-base-900'
        : 'bg-white border-base-200';
    const textClass = highlight ? 'text-white' : 'text-base-900';
    const subtextClass = highlight ? 'text-zinc-300' : 'text-zinc-500';

    return (
        <div className={`rounded-lg border p-4 ${baseClass}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
            </div>
            <div className={`text-xl font-bold ${textClass}`}>{value}</div>
            <div className={`text-sm ${subtextClass}`}>{label}</div>
        </div>
    );
}

interface EmptyChartProps {
    readonly icon: string;
    readonly message: string;
    readonly height?: number;
}

function EmptyChart({ icon, message, height = 300 }: EmptyChartProps) {
    return (
        <div className={`flex items-center justify-center text-zinc-400`} style={{ height }}>
            <div className="text-center">
                <div className="text-4xl mb-2">{icon}</div>
                <p>{message}</p>
            </div>
        </div>
    );
}
