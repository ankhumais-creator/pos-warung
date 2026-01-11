// 📈 ADMIN REPORTS - Placeholder Page
export default function AdminReports() {
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-base-900">Laporan</h1>
                <p className="text-zinc-500">Analisis penjualan dan performa</p>
            </div>

            <div className="bg-white border border-base-200 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4">📈</div>
                <h2 className="text-xl font-semibold text-base-900 mb-2">
                    Coming Soon
                </h2>
                <p className="text-zinc-500 max-w-md mx-auto">
                    Fitur laporan akan segera hadir. Anda akan dapat melihat:
                </p>
                <ul className="mt-4 text-sm text-zinc-600 space-y-2">
                    <li>• Laporan penjualan harian/mingguan/bulanan</li>
                    <li>• Analisis produk terlaris</li>
                    <li>• Margin keuntungan per produk</li>
                    <li>• Rekonsiliasi shift kasir</li>
                </ul>
            </div>
        </div>
    );
}
