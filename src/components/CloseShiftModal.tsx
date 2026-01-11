// 📊 CLOSE SHIFT MODAL - Z-Report dan Cash Reconciliation
import { useState, useEffect } from 'react';
import { X, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { db, type ShiftLog } from '../lib/db';
import { printZReport } from '../lib/receipt';

interface CloseShiftModalProps {
    shift: ShiftLog;
    onClose: () => void;
    onShiftClosed: () => void;
}

export default function CloseShiftModal({ shift, onClose, onShiftClosed }: Readonly<CloseShiftModalProps>) {
    const [actualCash, setActualCash] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const numericActual = Number.parseInt(actualCash.replaceAll(/\D/g, '')) || 0;
    const expectedCash = shift.openingCash + totalRevenue;
    const variance = numericActual - expectedCash;

    useEffect(() => {
        loadShiftStats();
    }, [shift.id]);

    async function loadShiftStats() {
        // Count transactions for this shift
        const transactions = await db.transactions
            .where('shiftId')
            .equals(shift.id)
            .toArray();

        setTotalTransactions(transactions.length);

        // Sum only cash transactions
        const cashRevenue = transactions
            .filter(t => t.paymentMethod === 'cash' && t.status === 'completed')
            .reduce((sum, t) => sum + t.total, 0);

        setTotalRevenue(cashRevenue);
    }

    const handleCloseShift = async () => {
        if (numericActual <= 0) return;
        setIsSubmitting(true);

        try {
            const closedAt = Date.now();

            // Update shift log
            await db.shiftLogs.update(shift.id, {
                status: 'closed',
                closedAt,
                closingCash: numericActual,
                cashDifference: variance,
                totalTransactions,
                totalRevenue,
            });

            // Print Z-Report
            printZReport({
                shiftNumber: shift.shiftNumber,
                cashierName: shift.openedBy,
                openedAt: shift.openedAt,
                closedAt,
                openingCash: shift.openingCash,
                totalTransactions,
                totalRevenue,
                actualCash: numericActual,
                variance,
            });

            onShiftClosed();
        } catch (error) {
            console.error('Failed to close shift:', error);
            alert('Gagal menutup shift. Coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (value: string) => {
        const num = value.replaceAll(/\D/g, '');
        if (!num) return '';
        return Number.parseInt(num).toLocaleString('id-ID');
    };

    const getVarianceColor = () => {
        if (variance === 0) return 'text-emerald-700 bg-emerald-50';
        if (variance > 0) return 'text-emerald-700 bg-emerald-50';
        return 'text-rose-700 bg-rose-50';
    };

    const getVarianceLabel = () => {
        if (variance === 0) return 'PAS';
        if (variance > 0) return 'SURPLUS';
        return 'MINUS';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText size={24} strokeWidth={2} />
                        <div>
                            <h2 className="text-xl font-bold">Tutup Shift</h2>
                            <p className="text-zinc-400 text-sm">{shift.shiftNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-md">
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Shift Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-100 p-4 rounded-lg">
                            <p className="text-sm text-zinc-500">Kasir</p>
                            <p className="text-lg font-bold text-zinc-900">{shift.openedBy}</p>
                        </div>
                        <div className="bg-zinc-100 p-4 rounded-lg">
                            <p className="text-sm text-zinc-500">Jumlah Transaksi</p>
                            <p className="text-lg font-bold text-zinc-900">{totalTransactions}</p>
                        </div>
                    </div>

                    {/* Cash Calculation */}
                    <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-200">
                        <div className="flex items-center justify-between p-4">
                            <span className="text-zinc-600">Modal Awal</span>
                            <span className="font-semibold">Rp {shift.openingCash.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <span className="text-zinc-600">+ Penjualan Tunai</span>
                            <span className="font-semibold text-emerald-700">Rp {totalRevenue.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-zinc-50">
                            <span className="font-bold text-zinc-900">Seharusnya</span>
                            <span className="font-bold text-zinc-900 text-lg">Rp {expectedCash.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Actual Cash Input */}
                    <div>
                        <label htmlFor="actual-cash-input" className="block text-sm font-semibold text-zinc-700 mb-2">
                            Uang Aktual di Laci (Hitung Manual)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold">
                                Rp
                            </span>
                            <input
                                id="actual-cash-input"
                                type="text"
                                inputMode="numeric"
                                value={actualCash}
                                onChange={(e) => setActualCash(formatCurrency(e.target.value))}
                                placeholder="Hitung uang di laci..."
                                className="w-full pl-12 pr-4 py-4 border-2 border-zinc-300 rounded-lg text-xl font-bold focus:outline-none focus:border-zinc-900"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Variance Display */}
                    {numericActual > 0 && (
                        <div className={`p-4 rounded-lg flex items-center justify-between ${getVarianceColor()}`}>
                            <div className="flex items-center gap-2">
                                {variance < 0 && <AlertTriangle size={20} />}
                                <span className="font-semibold">Selisih ({getVarianceLabel()})</span>
                            </div>
                            <span className="text-xl font-bold">
                                {variance >= 0 ? '+' : ''}Rp {variance.toLocaleString('id-ID')}
                            </span>
                        </div>
                    )}

                    {/* Warning for minus */}
                    {variance < 0 && numericActual > 0 && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                            <strong>Peringatan:</strong> Uang di laci kurang dari yang seharusnya.
                            Pastikan sudah menghitung dengan benar.
                        </div>
                    )}

                    {/* Quick Amounts */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setActualCash(expectedCash.toLocaleString('id-ID'))}
                            className="flex-1 py-2 px-3 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                        >
                            Sesuai ({(expectedCash / 1000).toLocaleString('id-ID')}K)
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleCloseShift}
                        disabled={isSubmitting || numericActual <= 0}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-md text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <DollarSign size={20} strokeWidth={2} />
                        {isSubmitting ? 'Memproses...' : 'TUTUP BUKU & PRINT LAPORAN'}
                    </button>
                </div>
            </div>
        </div>
    );
}
