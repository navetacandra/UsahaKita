import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardSummary, Material, Product, StockMovement, Insight } from '../types';
import { formatCurrency, formatNumber, formatRelativeTime } from '../utils/formatters';
import { StockBadge } from '../components/common/StockBadge';
import {
  TrendingUp,
  Boxes,
  Factory,
  AlertTriangle,
  ShoppingCart,
  Plus,
  Sparkles,
  ArrowRight,
  Package,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lowMaterials, setLowMaterials] = useState<Material[]>([]);
  const [lowProducts, setLowProducts] = useState<Product[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [latestInsight, setLatestInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, matRes, prodRes, movRes, insRes] = await Promise.all([
        api.dashboard.getSummary(),
        api.materials.list(),
        api.products.list(),
        api.movements.list(),
        api.insights.list(),
      ]);

      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
      if (matRes.success && Array.isArray(matRes.data)) {
        setLowMaterials(matRes.data.filter((m) => m && m.current_stock <= m.minimum_stock));
      }
      if (prodRes.success && Array.isArray(prodRes.data)) {
        setLowProducts(prodRes.data.filter((p) => p && p.current_stock <= p.minimum_stock));
      }
      if (movRes.success && Array.isArray(movRes.data)) {
        setRecentMovements(movRes.data.slice(0, 5));
      }
      if (insRes.success && Array.isArray(insRes.data) && insRes.data.length > 0) {
        setLatestInsight(insRes.data[0]);
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 border border-slate-300" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-lg border-2 border-slate-300" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Welcome & Quick Action Bar */}
      <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Ringkasan Operasional Usaha
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Pantau arus penjualan, kesiapan stok bahan, dan status produksi harian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="dash-quick-pos"
            onClick={() => onNavigate('/pos')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Kasir POS
          </button>
          <button
            id="dash-quick-production"
            onClick={() => onNavigate('/production/new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Plus className="w-4 h-4" />
            Mulai Produksi
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid (4 Key Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Sales */}
        <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Penjualan</span>
            <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(summary?.sales.total || 0)}
          </div>
          <div className="text-xs text-slate-600 font-medium">
            Dari <span className="font-bold text-slate-900">{summary?.sales.transaction_count || 0}</span> transaksi kasir
          </div>
        </div>

        {/* Metric 2: Production Output */}
        <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Output Produksi</span>
            <div className="p-1.5 bg-amber-100 border border-amber-900 rounded-md text-amber-800">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatNumber(summary?.production.output_quantity || 0, 0)} <span className="text-sm font-semibold text-slate-600">item</span>
          </div>
          <div className="text-xs text-slate-600 font-medium">
            Dari <span className="font-bold text-slate-900">{summary?.production.production_count || 0}</span> kali sesi produksi
          </div>
        </div>

        {/* Metric 3: Bahan Menipis */}
        <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Bahan Baku Menipis</span>
            <div className={`p-1.5 border rounded-md ${
              (summary?.low_stock.materials || 0) > 0
                ? 'bg-amber-100 border-amber-900 text-amber-800'
                : 'bg-emerald-100 border-emerald-900 text-emerald-800'
            }`}>
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summary?.low_stock.materials || 0} <span className="text-sm font-semibold text-slate-600">material</span>
          </div>
          <div className="text-xs font-medium">
            {(summary?.low_stock.materials || 0) > 0 ? (
              <button
                onClick={() => onNavigate('/inventory/materials')}
                className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
              >
                Periksa & catat stok masuk →
              </button>
            ) : (
              <span className="text-emerald-700 font-bold">Semua stok di atas batas minimum</span>
            )}
          </div>
        </div>

        {/* Metric 4: Produk Siap Jual */}
        <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Produk Stok Rendah</span>
            <div className="p-1.5 bg-rose-100 border border-rose-900 rounded-md text-rose-800">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summary?.low_stock.products || 0} <span className="text-sm font-semibold text-slate-600">produk</span>
          </div>
          <div className="text-xs font-medium">
            {(summary?.low_stock.products || 0) > 0 ? (
              <button
                onClick={() => onNavigate('/production/new')}
                className="text-amber-700 hover:underline font-bold inline-flex items-center gap-1"
              >
                Jadwalkan produksi baru →
              </button>
            ) : (
              <span className="text-emerald-700 font-bold">Stok barang jadi aman</span>
            )}
          </div>
        </div>
      </div>

      {/* Latest AI Insight Highlights */}
      {latestInsight && (
        <div className="bg-indigo-50 border-2 border-indigo-950 shadow-[3px_3px_0px_#1e1b4b] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-200 border border-indigo-900 rounded-md text-indigo-900">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="font-extrabold text-sm sm:text-base text-indigo-950">
                Insight Bisnis UsahaKita
              </h2>
              {latestInsight.is_stale && (
                <span className="text-[11px] font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  Ada data transaksi baru
                </span>
              )}
            </div>
            <button
              id="dash-view-all-insights"
              onClick={() => onNavigate('/insights')}
              className="text-xs font-bold text-indigo-900 hover:text-indigo-950 underline inline-flex items-center gap-1"
            >
              Lihat Semua Analisis
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {(latestInsight.content || []).slice(0, 2).map((item, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-indigo-900 rounded-lg p-3.5 shadow-[2px_2px_0px_#1e1b4b] space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                      item.type === 'WARNING'
                        ? 'bg-rose-100 text-rose-900 border-rose-800'
                        : item.type === 'OPPORTUNITY'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-800'
                        : 'bg-blue-100 text-blue-900 border-blue-800'
                    }`}
                  >
                    {item.type}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 truncate">{item.title}</h4>
                </div>
                <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Section: Low Stock Warnings & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Perhatian Stok (Material & Produk Rendah) */}
        <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                Perlu Perhatian Stok
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/inventory/materials')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Kelola Bahan →
            </button>
          </div>

          <div className="space-y-3">
            {lowMaterials.length === 0 && lowProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-medium">
                Semua stok bahan dan produk dalam batas aman.
              </div>
            ) : (
              <>
                {lowMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-300 rounded-lg text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{mat.name}</p>
                      <p className="text-slate-600">
                        Sisa: <span className="font-semibold text-amber-900">{mat.current_stock} {mat.unit}</span> (Min: {mat.minimum_stock} {mat.unit})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StockBadge
                        status={mat.current_stock <= 0 ? 'Habis' : 'Menipis'}
                      />
                      <button
                        onClick={() => onNavigate('/inventory/materials')}
                        className="px-2 py-1 bg-white border border-slate-900 rounded font-bold text-[11px] hover:bg-slate-100"
                      >
                        + Masuk
                      </button>
                    </div>
                  </div>
                ))}

                {lowProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-2.5 bg-rose-50/70 border border-rose-300 rounded-lg text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{prod.name}</p>
                      <p className="text-slate-600">
                        Sisa Produk: <span className="font-semibold text-rose-900">{prod.current_stock} {prod.unit}</span> (Min: {prod.minimum_stock} {prod.unit})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StockBadge
                        status={prod.current_stock <= 0 ? 'Habis' : 'Menipis'}
                      />
                      <button
                        onClick={() => onNavigate('/production/new')}
                        className="px-2 py-1 bg-amber-300 border border-slate-900 rounded font-bold text-[11px] hover:bg-amber-400"
                      >
                        Produksi
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right: Aktivitas Terbaru */}
        <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
              Aktivitas Stok & Penjualan Terbaru
            </h2>
            <button
              onClick={() => onNavigate('/inventory/movements')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Lihat Mutasi →
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {recentMovements.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-medium">
                Belum ada mutasi stok tercatat.
              </div>
            ) : (
              recentMovements.map((mov) => (
                <div key={mov.movement_id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                          mov.type === 'IN' || mov.type === 'PRODUCTION_OUTPUT'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-700'
                            : 'bg-rose-100 text-rose-900 border-rose-700'
                        }`}
                      >
                        {mov.type === 'IN'
                          ? 'STOK MASUK'
                          : mov.type === 'SALE'
                          ? 'PENJUALAN'
                          : mov.type === 'PRODUCTION_OUTPUT'
                          ? 'HASIL PRODUKSI'
                          : mov.type === 'PRODUCTION_CONSUME'
                          ? 'BAHAN PRODUKSI'
                          : mov.type === 'OPNAME'
                          ? 'OPNAME'
                          : 'KELUAR'}
                      </span>
                      <span className="font-bold text-slate-900">{mov.item_name}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{mov.reason || 'Perubahan stok'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-slate-900">
                      {mov.type === 'IN' || mov.type === 'PRODUCTION_OUTPUT' ? '+' : '-'}
                      {mov.quantity} {mov.unit}
                    </p>
                    <p className="text-[10px] text-slate-500">{formatRelativeTime(mov.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
