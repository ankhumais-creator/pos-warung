// 💳 PAYMENT MODAL - Kalkulator pembayaran dan kembalian
import { useState, useEffect } from 'react';
import { X, Check, Banknote } from 'lucide-react';

interface PaymentModalProps {
    total: number;
    onClose: () => void;
    onPaymentComplete: (amountPaid: number, change: number) => void;
}

export default function PaymentModal({ total, onClose, onPaymentComplete }: PaymentModalProps) {
    const [amountPaid, setAmountPaid] = useState('');
    const [change, setChange] = useState(0);

    const numericAmount = parseInt(amountPaid.replace(/\D/g, '')) || 0;

    useEffect(() => {
        setChange(Math.max(0, numericAmount - total));
    }, [numericAmount, total]);

    const isPaymentValid = numericAmount >= total;

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
        if (isPaymentValid) {
            onPaymentComplete(numericAmount, change);
        }
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

        return suggestions.slice(0, 4).sort((a, b) => a - b);
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
                    </div>

                    {/* Right: Numpad */}
                    <div className="w-1/2 p-6">
                        {/* Quick Suggestions */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                onClick={handleExactAmount}
                                className="py-3 px-4 bg-zinc-100 hover:bg-zinc-200 rounded-md font-semibold text-zinc-700"
                            >
                                Uang Pas
                            </button>
                            {suggestions.slice(0, 3).map((amount) => (
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

                        {/* Confirm Button */}
                        <button
                            onClick={handleConfirm}
                            disabled={!isPaymentValid}
                            className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-5 rounded-md text-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check size={24} strokeWidth={2} />
                            BAYAR & SELESAI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
