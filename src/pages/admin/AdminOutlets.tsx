// 🏪 ADMIN OUTLETS - Placeholder Page
export default function AdminOutlets() {
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-base-900">Manajemen Outlet</h1>
                <p className="text-zinc-500">Kelola cabang dan multi-outlet</p>
            </div>

            <div className="bg-white border border-base-200 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4">🏪</div>
                <h2 className="text-xl font-semibold text-base-900 mb-2">
                    Coming Soon
                </h2>
                <p className="text-zinc-500 max-w-md mx-auto">
                    Fitur multi-outlet akan segera hadir. Anda akan dapat:
                </p>
                <ul className="mt-4 text-sm text-zinc-600 space-y-2">
                    <li>• Menambah outlet/cabang baru</li>
                    <li>• Melihat performa per outlet</li>
                    <li>• Mengelola stok per lokasi</li>
                    <li>• Transfer stok antar outlet</li>
                </ul>
            </div>
        </div>
    );
}
