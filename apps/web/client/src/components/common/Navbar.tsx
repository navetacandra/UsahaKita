import {
  LayoutDashboard,
  Boxes,
  Package,
  ArrowLeftRight,
  ClipboardCheck,
  BookOpen,
  Factory,
  ShoppingCart,
  Receipt,
  Sparkles,
  Settings,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  lowStockCount?: number;
  isStaleInsight?: boolean;
}

export function Navbar({ currentPath, onNavigate, lowStockCount = 0, isStaleInsight = false }: NavbarProps) {
  const tabs = [
    { id: 'tab-dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
      id: 'tab-materials',
      label: 'Stok Bahan',
      path: '/inventory/materials',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} tipis` : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-800',
    },
    { id: 'tab-products', label: 'Stok Produk', path: '/inventory/products', icon: Package },
    { id: 'tab-movements', label: 'Mutasi Stok', path: '/inventory/movements', icon: ArrowLeftRight },
    { id: 'tab-opname', label: 'Stok Opname', path: '/inventory/stock-opname', icon: ClipboardCheck },
    { id: 'tab-bom', label: 'Resep (BoM)', path: '/bom', icon: BookOpen },
    { id: 'tab-production', label: 'Produksi', path: '/production', icon: Factory },
    { id: 'tab-pos', label: 'Kasir POS', path: '/pos', icon: ShoppingCart },
    { id: 'tab-sales', label: 'Penjualan', path: '/sales', icon: Receipt },
    {
      id: 'tab-insights',
      label: 'AI Insight',
      path: '/insights',
      icon: Sparkles,
      badge: isStaleInsight ? 'Baru' : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-700',
    },
    { id: 'tab-settings', label: 'Pengaturan', path: '/settings/business', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard' && (currentPath === '/' || currentPath === '/dashboard')) return true;
    if (path === '/bom' && currentPath.startsWith('/bom')) return true;
    if (path === '/production' && currentPath.startsWith('/production')) return true;
    return currentPath === path;
  };

  return (
    <nav className="bg-white border-b-2 border-slate-900 overflow-x-auto scrollbar-none py-1.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-1 min-w-max">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              id={tab.id}
              onClick={() => onNavigate(tab.path)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all border-2 ${
                active
                  ? 'bg-blue-600 text-white border-slate-900 shadow-[2px_2px_0px_#0f172a] -translate-y-0.5'
                  : 'text-slate-700 border-transparent hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${
                    active ? 'bg-white text-blue-900 border-slate-900' : tab.badgeColor
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
