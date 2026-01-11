// 🔒 OPEN SHIFT MODAL - Memaksa kasir input modal awal sebelum jualan
import { useState } from 'react';
import { db } from '../lib/db';
import { Lock, DollarSign } from 'lucide-react';

interface OpenShiftModalProps {
    onShiftOpened: () => void;
}

export default function OpenShiftModal({ onShiftOpened }: OpenShiftModalProps) {
    const [cashierName, setCashierName] = useState('');
    const [openingCash, setOpeningCash] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleOpenShift = async () => {
        // Validation
        if (!cashierName.trim()) {
            setError('Nama kasir wajib diisi');
            return;
        }

        const cashAmount = parseInt(openingCash.replace(/\D/g, '')) || 0;
        if (cashAmount < 0) {
            setError('Modal awal tidak boleh negatif');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const now = Date.now();
            const today = new Date().toISOString().split('T')[0];

            // Count existing shifts today to generate shift number
            const existingShifts = await db.shiftLogs
                .where('openedAt')
                .above(new Date(today).getTime())
                .count();

            const shiftNumber = `SHIFT-${today}-${String(existingShifts + 1).padStart(3, '0')}`;

            await db.shiftLogs.add({
                id: `shift_${now}_${Math.random().toString(36).slice(2, 9)}`,
                shiftNumber,
                openedBy: cashierName.trim(),
                openedAt: now,
                openingCash: cashAmount,
                totalTransactions: 0,
                totalRevenue: 0,
                status: 'open',
            });

            onShiftOpened();
        } catch (err) {
            setError('Gagal membuka shift. Coba lagi.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (value: string) => {
        const num = value.replace(/\D/g, '');
        if (!num) return '';
        return parseInt(num).toLocaleString('id-ID');
    };

    const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOpeningCash(formatCurrency(e.target.value));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="bg-zinc-900 text-white px-6 py-4 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <Lock size={24} strokeWidth={2} />
                        <div>
                            <h2 className="text-xl font-bold">Buka Kasir</h2>
                            <p className="text-zinc-400 text-sm">Sistem terkunci. Silakan buka shift.</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    {/* Cashier Name */}
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 mb-2">
                            Nama Kasir
                        </label>
                        <input
                            type="text"
                            value={cashierName}
                            onChange={(e) => setCashierName(e.target.value)}
                            placeholder="Contoh: Budi"
                            className="w-full px-4 py-3 border border-zinc-300 rounded-md text-lg focus:outline-none focus:border-zinc-900"
                            autoFocus
                        />
                    </div>

                    {/* Opening Cash */}
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 mb-2">
                            Modal Awal (Petty Cash)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold">
                                Rp
                            </span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={openingCash}
                                onChange={handleCashChange}
                                placeholder="500.000"
                                className="w-full pl-12 pr-4 py-3 border border-zinc-300 rounded-md text-lg font-bold focus:outline-none focus:border-zinc-900"
                            />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Masukkan jumlah uang tunai di laci kasir saat ini
                        </p>
                    </div>

                    {/* Quick Amounts */}
                    <div className="flex gap-2">
                        {[100000, 300000, 500000].map((amount) => (
                            <button
                                key={amount}
                                type="button"
                                onClick={() => setOpeningCash(amount.toLocaleString('id-ID'))}
                                className="flex-1 py-2 px-3 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                            >
                                {(amount / 1000).toLocaleString('id-ID')}K
                            </button>
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleOpenShift}
                        disabled={isSubmitting}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-md text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <DollarSign size={20} strokeWidth={2} />
                        {isSubmitting ? 'Membuka...' : 'BUKA KASIR'}
                    </button>
                </div>
            </div>
        </div>
    );
}
