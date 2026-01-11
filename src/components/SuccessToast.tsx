// ✅ SUCCESS TOAST - Notifikasi transaksi berhasil
import { useEffect } from 'react';
import { Check } from 'lucide-react';

interface SuccessToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

export default function SuccessToast({ message, onClose, duration = 3000 }: Readonly<SuccessToastProps>) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
            <div className="bg-emerald-700 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                    <Check size={20} strokeWidth={3} />
                </div>
                <span className="font-semibold text-lg">{message}</span>
            </div>
        </div>
    );
}
