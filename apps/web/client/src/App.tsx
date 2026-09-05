import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/common/Header';
import { Navbar } from './components/common/Navbar';
import { api } from './services/api';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { ProductsPage } from './pages/ProductsPage';
import { MovementsPage } from './pages/MovementsPage';
import { StockOpnamePage } from './pages/StockOpnamePage';
import { BomListPage } from './pages/BomListPage';
import { BomEditorPage } from './pages/BomEditorPage';
import { ProductionListPage } from './pages/ProductionListPage';
import { ProductionCreatePage } from './pages/ProductionCreatePage';
import { ProductionDetailPage } from './pages/ProductionDetailPage';
import { PosPage } from './pages/PosPage';
import { SalesPage } from './pages/SalesPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  // Initialize path from hash or default to /dashboard
  const getInitialPath = () => {
    const hash = window.location.hash.replace(/^#/, '');
    return hash && hash.startsWith('/') ? hash : '/dashboard';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [isStaleInsight, setIsStaleInsight] = useState<boolean>(false);

  // Synchronize hash with currentPath
  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash && hash.startsWith('/')) {
        setCurrentPath(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check inventory alert numbers for navbar badges
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkBadges = async () => {
      try {
        const [mRes, sumRes] = await Promise.all([
          api.materials.list(),
          api.dashboard.getSummary(),
        ]);
        if (mRes.success && Array.isArray(mRes.data)) {
          const lowCount = mRes.data.filter((m) => m && m.current_stock <= m.minimum_stock).length;
          setLowStockCount(lowCount);
        }
        if (sumRes.success && sumRes.data) {
          // If latest activity exists
          setIsStaleInsight(false);
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkBadges();
    const interval = setInterval(checkBadges, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentPath]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center text-white font-black text-2xl animate-bounce mb-3">
          U
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-700">
          Memuat UsahaKita Micro ERP...
        </p>
      </div>
    );
  }

  // Unauthenticated routing
  if (!isAuthenticated) {
    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }
    return <LoginPage onNavigate={navigate} />;
  }

  // If user is authenticated but on auth pages, redirect to dashboard
  if (currentPath === '/login' || currentPath === '/register') {
    navigate('/dashboard');
    return null;
  }

  // Render active page
  const renderPage = () => {
    // Exact paths
    if (currentPath === '/' || currentPath === '/dashboard') {
      return <DashboardPage onNavigate={navigate} />;
    }

    if (currentPath === '/inventory/materials' || currentPath === '/materials') {
      return <MaterialsPage onNavigate={navigate} />;
    }

    if (currentPath === '/inventory/products' || currentPath === '/products') {
      return <ProductsPage onNavigate={navigate} />;
    }

    if (currentPath === '/inventory/movements' || currentPath === '/movements') {
      return <MovementsPage onNavigate={navigate} />;
    }

    if (currentPath === '/inventory/stock-opname' || currentPath === '/stock-opname') {
      return <StockOpnamePage onNavigate={navigate} />;
    }

    // BoM routing
    if (currentPath === '/bom') {
      return <BomListPage onNavigate={navigate} />;
    }

    if (currentPath === '/bom/new') {
      return <BomEditorPage onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/bom/')) {
      const bomId = currentPath.replace('/bom/', '');
      return <BomEditorPage bomId={bomId} onNavigate={navigate} />;
    }

    // Production routing
    if (currentPath === '/production') {
      return <ProductionListPage onNavigate={navigate} />;
    }

    if (currentPath === '/production/new') {
      return <ProductionCreatePage onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/production/')) {
      const prodId = currentPath.replace('/production/', '');
      return <ProductionDetailPage id={prodId} onNavigate={navigate} />;
    }

    // POS & Sales routing
    if (currentPath === '/pos') {
      return <PosPage onNavigate={navigate} />;
    }

    if (currentPath === '/sales') {
      return <SalesPage onNavigate={navigate} />;
    }

    // Insights & Settings
    if (currentPath === '/insights') {
      return <InsightsPage onNavigate={navigate} />;
    }

    if (currentPath === '/settings' || currentPath === '/settings/business') {
      return <SettingsPage onNavigate={navigate} />;
    }

    // Fallback default
    return <DashboardPage onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Global Header & Brand bar */}
      <Header currentPath={currentPath} onNavigate={navigate} />

      {/* Horizontal Tab Navbar */}
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        lowStockCount={lowStockCount}
        isStaleInsight={isStaleInsight}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">{renderPage()}</main>

      {/* Footer */}
      <footer className="border-t-2 border-slate-900 bg-white py-4 px-4 sm:px-8 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-5 h-5 rounded bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">
              U
            </span>
            <span>UsahaKita Micro ERP Multi-Tenant</span>
          </div>
          <p className="text-[11px]">
            Solusi Pencatatan Stok, Resep (BoM), Produksi Terukur, & Kasir untuk UMKM Grassroots
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
