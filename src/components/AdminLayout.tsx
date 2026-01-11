// 🔐 ADMIN LAYOUT - Desktop-optimized Back Office Interface
import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// MVP: Simple hardcoded password (REPLACE with Supabase Auth in production!)
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
const AUTH_STORAGE_KEY = 'pos_admin_authenticated';

interface AdminLayoutProps {
    readonly children: ReactNode;
}

// Sidebar menu items
const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/products', label: 'Produk', icon: '📦' },
    { path: '/admin/reports', label: 'Laporan', icon: '📈' },
    { path: '/admin/outlets', label: 'Outlet', icon: '🏪' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Check if already authenticated
        const authStatus = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (authStatus === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
            setError('');
        } else {
            setError('Password salah!');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        navigate('/');
    };

    // Password protection modal
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <div className="bg-white border border-base-200 rounded-lg p-8 w-full max-w-md">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-base-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🔐</span>
                        </div>
                        <h1 className="text-2xl font-bold text-base-900">Admin Panel</h1>
                        <p className="text-zinc-500 mt-1">Masukkan password untuk akses</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full px-4 py-3 border border-base-200 rounded-lg focus:outline-none focus:border-base-900"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full btn-primary py-3 text-lg"
                        >
                            Masuk
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/" className="text-zinc-500 hover:text-base-900 text-sm">
                            ← Kembali ke Kasir
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-base-200 flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b border-base-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-base-900 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-base-900">POS Admin</h1>
                            <p className="text-xs text-zinc-500">Back Office</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive
                                            ? 'bg-base-900 text-white'
                                            : 'text-zinc-600 hover:bg-base-100 hover:text-base-900'
                                            }`}
                                    >
                                        <span>{item.icon}</span>
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-base-200">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-2.5 text-zinc-600 hover:bg-base-100 hover:text-base-900 rounded-lg transition-colors"
                    >
                        <span>💳</span>
                        <span className="font-medium">Buka Kasir</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors mt-1"
                    >
                        <span>🚪</span>
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
