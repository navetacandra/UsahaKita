import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Material, Product, ProductionRecord, Sale, Insight, InsightItem } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Award,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Package,
  Layers,
  Bot,
  RefreshCw,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface InsightsPageProps {
  onNavigate: (path: string) => void;
}

export function InsightsPage({ onNavigate }: InsightsPageProps) {
  const { showToast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Insights state
  const [aiInsights, setAiInsights] = useState<Insight[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [mRes, pRes, prRes, sRes] = await Promise.all([
          api.materials.list(),
          api.products.list(),
          api.productions.list(),
          api.sales.list(),
        ]);
        if (mRes.success && Array.isArray(mRes.data)) setMaterials(mRes.data);
        if (pRes.success && Array.isArray(pRes.data)) setProducts(pRes.data);
        if (prRes.success && Array.isArray(prRes.data)) setProductions(prRes.data);
        if (sRes.success && Array.isArray(sRes.data)) setSales(sRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await api.insights.list();
      if (res.success && Array.isArray(res.data)) {
        setAiInsights(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleGenerateInsight = async () => {
    setAiLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const res = await api.insights.generate(thirtyDaysAgo, today);
      if (res.success && res.data) {
        const err = (res.data as Record<string, unknown>).ai_error as string | undefined;
        if (err) {
          showToast('warning', `AI tidak tersedia: ${err}`);
        } else {
          showToast('success', 'Insight AI berhasil dibuat!');
        }
        loadInsights();
      } else {
        showToast('error', 'Gagal menghasilkan insight AI.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan saat menghasilkan insight.');
    } finally {
      setAiLoading(false);
    }
  };

  // Compute best selling products
  const productSalesMap: Record<string, { name: string; totalQty: number; revenue: number }> = {};
  (sales || []).forEach((s) => {
    (s.items || []).forEach((item) => {
      if (!item || !item.product_id) return;
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = {
          name: item.product_name || 'Produk',
          totalQty: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.product_id].totalQty += item.quantity || 0;
      productSalesMap[item.product_id].revenue += item.subtotal || 0;
    });
  });

  const bestSellingProducts = Object.values(productSalesMap).sort(
    (a, b) => b.totalQty - a.totalQty
  );

  // Compute most used materials from production history
  const materialUsageMap: Record<string, { name: string; unit: string; totalQty: number }> = {};
  (productions || []).forEach((p) => {
    (p.materials || []).forEach((m) => {
      if (!m || !m.material_id) return;
      if (!materialUsageMap[m.material_id]) {
        materialUsageMap[m.material_id] = {
          name: m.material_name || 'Bahan',
          unit: m.unit || '',
          totalQty: 0,
        };
      }
      materialUsageMap[m.material_id].totalQty += m.actual_quantity || 0;
    });
  });

  const topMaterialsUsed = Object.values(materialUsageMap).sort((a, b) => b.totalQty - a.totalQty);

  const insightIcon = (type: InsightItem['type']) => {
    switch (type) {
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-rose-700" />;
      case 'POSITIVE': return <CheckCircle2 className="w-4 h-4 text-emerald-700" />;
      case 'INFO': return <Info className="w-4 h-4 text-blue-700" />;
      default: return <Lightbulb className="w-4 h-4 text-amber-700" />;
    }
  };

  const insightColor = (type: InsightItem['type']) => {
    switch (type) {
      case 'WARNING': return 'bg-rose-50 border-rose-900';
      case 'POSITIVE': return 'bg-emerald-50 border-emerald-900';
      case 'INFO': return 'bg-blue-50 border-blue-900';
      default: return 'bg-amber-50 border-amber-900';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md text-blue-800">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Insight & Rekomendasi Bisnis
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Analisis cerdas data operasional untuk membantu pengambilan keputusan pemilik UMKM.
        </p>
      </div>

      {/* AI Insight Section */}
      <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <h2 className="font-black text-slate-900 text-sm sm:text-base">
              Analisis AI Otomatis
            </h2>
          </div>
          <button
            id="insight-generate-btn"
            onClick={handleGenerateInsight}
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
          >
            {aiLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {aiLoading ? 'Memproses...' : 'Generate Insight AI'}
          </button>
        </div>

        {insightsLoading ? (
          <p className="text-xs text-slate-400 py-4 text-center">Memuat insight...</p>
        ) : aiInsights.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Bot className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Belum ada insight AI.</p>
            <p className="text-[11px] text-slate-400">Klik tombol "Generate Insight AI" untuk menganalisis data bisnis Anda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(() => {
              const insight = aiInsights[0];
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {formatDate(insight.generated_at)}
                      {insight.is_stale && (
                        <span className="ml-2 text-amber-600">(data telah berubah)</span>
                      )}
                    </span>
                    {insight.model_metadata && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {insight.model_metadata.provider}/{insight.model_metadata.model}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {insight.content.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border-2 shadow-[2px_2px_0px_#0f172a] space-y-1.5 ${insightColor(item.type)}`}
                      >
                        <div className="flex items-center gap-1.5">
                          {insightIcon(item.type)}
                          <h3 className="font-black text-slate-900 text-xs leading-snug">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Produk Terlaris */}
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Produk Paling Laris (Top Sellers)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Berdasarkan Kuantitas</span>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <p className="text-xs text-slate-400">Memuat data produk...</p>
            ) : bestSellingProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Belum ada data penjualan tercatat.</p>
            ) : (
              bestSellingProducts.slice(0, 5).map((prod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-900 text-blue-900 font-mono font-black flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{prod.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Omzet: {formatCurrency(prod.revenue)}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono font-black text-slate-900 text-sm">
                    {prod.totalQty} terjual
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Material Paling Sering Dipakai */}
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Bahan Paling Banyak Dikonsumsi
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Dari Catatan Produksi</span>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <p className="text-xs text-slate-400">Memuat data konsumsi...</p>
            ) : topMaterialsUsed.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Belum ada data produksi yang selesai.
              </p>
            ) : (
              topMaterialsUsed.slice(0, 5).map((mat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 border border-amber-900 text-amber-900 font-mono font-black flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{mat.name}</p>
                      <p className="text-[11px] text-slate-500">Satuan baku: {mat.unit}</p>
                    </div>
                  </div>

                  <span className="font-mono font-black text-blue-900 text-sm">
                    {formatNumber(mat.totalQty, 2)} {mat.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
