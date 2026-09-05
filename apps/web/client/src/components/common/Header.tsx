import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Store,
  LogOut,
  Sparkles,
  ShoppingCart,
  Layers,
  Menu,
  X,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Header({ currentPath: _currentPath, onNavigate }: HeaderProps) {
  const { user, business, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleResetData = () => {
    if (confirm('Kembalikan semua data ke sampel awal Toko Maju?')) {
      api.devReset();
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Stok Bahan', path: '/inventory/materials' },
    { label: 'Stok Produk', path: '/inventory/products' },
    { label: 'Mutasi Stok', path: '/inventory/movements' },
    { label: 'Stok Opname', path: '/inventory/stock-opname' },
    { label: 'Resep (BoM)', path: '/bom' },
    { label: 'Produksi', path: '/production' },
    { label: 'Kasir (POS)', path: '/pos' },
    { label: 'Penjualan', path: '/sales' },
    { label: 'AI Insight', path: '/insights' },
    { label: 'Pengaturan', path: '/settings/business' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Business Brand */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('/dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center text-white font-black text-xl group-hover:bg-blue-700 transition-colors">
                U
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">UsahaKita</span>
                  <span className="text-[10px] uppercase font-black bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-900">
                    Micro ERP
                  </span>
                  <span
                    className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-700"
                    title="Terhubung ke Cloud API: https://usahakita.cfexpense-tracker123.workers.dev/api/v1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Cloud API
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px] font-semibold text-slate-800">
                    {business?.name || 'Usaha Anda'}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Quick Action CTAs (Desktop) */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              id="header-quick-pos-btn"
              onClick={() => onNavigate('/pos')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Kasir POS
            </button>

            <button
              id="header-quick-prod-btn"
              onClick={() => onNavigate('/production/new')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-md border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              + Produksi Baru
            </button>

            <button
              id="header-quick-insight-btn"
              onClick={() => onNavigate('/insights')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-950 bg-indigo-100 hover:bg-indigo-200 rounded-md border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              AI Insight
            </button>
          </div>

          {/* User controls & mobile toggle */}
          <div className="flex items-center gap-2">
            <button
              id="header-reset-btn"
              onClick={handleResetData}
              title="Reset data ke sampel Toko Maju"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-400 rounded-md transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Data
            </button>

            <div className="hidden sm:flex flex-col text-right leading-tight">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {user?.email.split('@')[0]}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Tenant UMKM</span>
            </div>

            <button
              id="header-logout-btn"
              onClick={async () => {
                await logout();
                onNavigate('/login');
              }}
              title="Keluar"
              className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-800 bg-slate-100 border-2 border-slate-900 rounded-md"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div id="mobile-nav-drawer" className="md:hidden border-t-2 border-slate-900 bg-white px-4 pt-3 pb-5 space-y-2">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-200">
            <button
              onClick={() => {
                onNavigate('/pos');
                setMobileOpen(false);
              }}
              className="flex items-center justify-center gap-2 p-2.5 text-xs font-bold text-white bg-blue-600 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a]"
            >
              <ShoppingCart className="w-4 h-4" />
              Kasir POS
            </button>
            <button
              onClick={() => {
                onNavigate('/production/new');
                setMobileOpen(false);
              }}
              className="flex items-center justify-center gap-2 p-2.5 text-xs font-bold text-slate-900 bg-amber-300 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a]"
            >
              <Layers className="w-4 h-4" />
              + Produksi Baru
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setMobileOpen(false);
                }}
                className="text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-md"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
            <span>{user?.email}</span>
            <button onClick={handleResetData} className="text-blue-600 font-semibold underline">
              Reset Data Sampel
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
