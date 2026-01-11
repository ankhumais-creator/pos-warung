// 💳 PAYMENT MODAL - Kalkulator pembayaran dan kembalian + Kasbon
import { useState, useEffect } from 'react';
import { X, Check, Banknote, CreditCard } from 'lucide-react';

type PaymentMode = 'cash' | 'kasbon';

interface PaymentModalProps {
    total: number;
    onClose: () => void;
    onPaymentComplete: (paymentData: {
        mode: PaymentMode;
        amountPaid: number;
        change: number;
        customerName?: string;
    }) => void;
}

export default function PaymentModal({ total, onClose, onPaymentComplete }: Readonly<PaymentModalProps>) {
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [change, setChange] = useState(0);
    const [customerName, setCustomerName] = useState('');

    const numericAmount = Number.parseInt(amountPaid.replaceAll(/\D/g, '')) || 0;

    useEffect(() => {
        setChange(Math.max(0, numericAmount - total));
    }, [numericAmount, total]);

    const isPaymentValid = paymentMode === 'cash'
        ? numericAmount >= total
        : customerName.trim().length > 0;

    const handleNumpadClick = (value: string) => {
        if (value === 'C') {
            setAmountPaid('');
        } else if (value === '00') {
            setAmountPaid(prev => prev + '00');
        } else if (value === '000') {
            setAmountPaid(prev => prev + '000');
        } else {
            setAmountPaid(prev => prev + value);
        }
    };

    const handleQuickAmount = (amount: number) => {
        setAmountPaid(amount.toString());
    };

    const handleExactAmount = () => {
        setAmountPaid(total.toString());
    };

    const handleConfirm = () => {
        if (!isPaymentValid) return;

        onPaymentComplete({
            mode: paymentMode,
            amountPaid: paymentMode === 'cash' ? numericAmount : 0,
            change: paymentMode === 'cash' ? change : 0,
            customerName: paymentMode === 'kasbon' ? customerName.trim() : undefined,
        });
    };

    // Generate smart suggestions based on total
    const generateSuggestions = () => {
        const suggestions: number[] = [];
        const roundedUp = Math.ceil(total / 10000) * 10000;

        if (roundedUp > total) suggestions.push(roundedUp);
        if (roundedUp + 10000 <= total * 2) suggestions.push(roundedUp + 10000);
        if (roundedUp + 50000 <= total * 3) suggestions.push(roundedUp + 50000);

        // Common denominations
        [50000, 100000, 150000, 200000].forEach(amt => {
            if (amt >= total && !suggestions.includes(amt)) {
                suggestions.push(amt);
            }
        });

        return suggestions.slice(0, 3).sort((a, b) => a - b);
    };

    const suggestions = generateSuggestions();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Banknote size={24} strokeWidth={2} />
                        <h2 className="text-xl font-bold">Pembayaran</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-md"
                    >
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                {/* Payment Mode Tabs */}
                <div className="flex border-b border-zinc-200">
                    <button
                        onClick={() => setPaymentMode('cash')}
                        className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors ${paymentMode === 'cash'
                                ? 'bg-zinc-100 text-zinc-900 border-b-2 border-zinc-900'
                                : 'text-zinc-500 hover:bg-zinc-50'
                            }`}
                    >
                        <Banknote size={20} />
                        Tunai
                    </button>
                    <button
                        onClick={() => setPaymentMode('kasbon')}
                        className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors ${paymentMode === 'kasbon'
                                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600'
                                : 'text-zinc-500 hover:bg-zinc-50'
                            }`}
                    >
                        <CreditCard size={20} />
                        Kasbon (Utang)
                    </button>
                </div>

                <div className="flex">
                    {/* Left: Summary */}
                    <div className="w-1/2 p-6 border-r border-zinc-200">
                        {/* Total */}
                        <div className="mb-6">
                            <p className="text-sm text-zinc-500 mb-1">Total Pembayaran</p>
                            <p className="text-4xl font-bold text-zinc-900">
                                Rp {total.toLocaleString('id-ID')}
                            </p>
                        </div>

                        {paymentMode === 'cash' ? (
                            <>
                                {/* Amount Paid Input */}
                                <div className="mb-4">
                                    <p className="text-sm text-zinc-500 mb-1">Uang Diterima</p>
                                    <div className="bg-zinc-100 border-2 border-zinc-300 rounded-lg p-4">
                                        <p className="text-3xl font-bold text-zinc-900 text-right">
                                            Rp {numericAmount.toLocaleString('id-ID') || '0'}
                                        </p>
                                    </div>
                                </div>

                                {/* Change */}
                                <div className={`p-4 rounded-lg ${isPaymentValid ? 'bg-emerald-50 border border-emerald-200' : 'bg-zinc-100'}`}>
                                    <p className="text-sm text-zinc-500 mb-1">Kembalian</p>
                                    <p className={`text-3xl font-bold ${isPaymentValid ? 'text-emerald-700' : 'text-zinc-400'}`}>
                                        Rp {change.toLocaleString('id-ID')}
                                    </p>
                                </div>

                                {/* Not enough warning */}
                                {numericAmount > 0 && !isPaymentValid && (
                                    <p className="text-rose-600 text-sm mt-3">
                                        Kurang Rp {(total - numericAmount).toLocaleString('id-ID')}
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Kasbon Mode */}
                                <div className="mb-4">
                                    <p className="text-sm text-zinc-500 mb-1">Nama Pelanggan <span className="text-rose-500">*</span></p>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Masukkan nama pengutang..."
                                        className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg text-lg font-semibold focus:outline-none focus:border-amber-500"
                                        autoFocus
                                    />
                                </div>

                                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                                    <p className="text-sm text-amber-700 mb-1">⚠️ Nota Kasbon</p>
                                    <p className="text-sm text-amber-600">
                                        Struk akan dicetak dengan kolom tanda tangan penerima sebagai bukti utang.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right: Numpad (only for cash) */}
                    <div className="w-1/2 p-6">
                        {paymentMode === 'cash' ? (
                            <>
                                {/* Quick Suggestions */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <button
                                        onClick={handleExactAmount}
                                        className="py-3 px-4 bg-zinc-100 hover:bg-zinc-200 rounded-md font-semibold text-zinc-700"
                                    >
                                        Uang Pas
                                    </button>
                                    {suggestions.map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => handleQuickAmount(amount)}
                                            className="py-3 px-4 bg-zinc-100 hover:bg-zinc-200 rounded-md font-semibold text-zinc-700"
                                        >
                                            {(amount / 1000).toLocaleString('id-ID')}K
                                        </button>
                                    ))}
                                </div>

                                {/* Numpad */}
                                <div className="grid grid-cols-3 gap-2">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '000'].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => handleNumpadClick(num)}
                                            className="py-4 bg-zinc-200 hover:bg-zinc-300 rounded-md text-xl font-bold text-zinc-900"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handleNumpadClick('C')}
                                        className="py-4 bg-rose-100 hover:bg-rose-200 rounded-md text-xl font-bold text-rose-700 col-span-3"
                                    >
                                        HAPUS
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <CreditCard size={64} className="text-amber-400 mb-4" />
                                <p className="text-lg font-semibold text-zinc-700 mb-2">Mode Kasbon</p>
                                <p className="text-sm text-zinc-500">
                                    Isi nama pelanggan di sebelah kiri, lalu klik tombol "Simpan Kasbon"
                                </p>
                            </div>
                        )}

                        {/* Confirm Button */}
                        <button
                            onClick={handleConfirm}
                            disabled={!isPaymentValid}
                            className={`w-full mt-4 font-bold py-5 rounded-md text-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${paymentMode === 'kasbon'
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                                }`}
                        >
                            <Check size={24} strokeWidth={2} />
                            {paymentMode === 'kasbon' ? 'SIMPAN KASBON' : 'BAYAR & SELESAI'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

