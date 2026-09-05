import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Material, Product, ProductionRecord, Sale } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
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
} from 'lucide-react';

interface InsightsPageProps {
  onNavigate: (path: string) => void;
}

export function InsightsPage({ onNavigate }: InsightsPageProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

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

  // Critical Low Stock materials
  const lowStockMaterials = (materials || []).filter((m) => m && m.current_stock <= m.minimum_stock);

  // Smart actionable recommendations
  const recommendations: Array<{
    type: 'critical' | 'opportunity' | 'efficiency';
    title: string;
    desc: string;
    actionLabel?: string;
    actionPath?: string;
  }> = [];

  if (lowStockMaterials.length > 0) {
    const matNames = lowStockMaterials.map((m) => m.name).join(', ');
    recommendations.push({
      type: 'critical',
      title: `${lowStockMaterials.length} Bahan Baku Mendekati Habis`,
      desc: `Bahan berikut telah menyentuh batas minimum stok: ${matNames}. Segera catat pembelian stok masuk agar lini produksi tidak terhenti.`,
      actionLabel: 'Tambah Stok Bahan',
      actionPath: '/inventory/materials',
    });
  }

  if (bestSellingProducts.length > 0 && products.length > 0) {
    const topProd = products.find((p) => p.name === bestSellingProducts[0].name);
    if (topProd && topProd.current_stock < 10) {
      recommendations.push({
        type: 'opportunity',
        title: `Produk Terlaris Rendah Stok: ${topProd.name}`,
        desc: `${topProd.name} adalah item paling laku dengan penjualan ${bestSellingProducts[0].totalQty} unit, namun stok siap jual tinggal ${topProd.current_stock} ${topProd.unit}. Pertimbangkan jadwal produksi batch baru.`,
        actionLabel: 'Mulai Produksi Baru',
        actionPath: '/production/new',
      });
    }
  }

  // General efficiency recommendation
  recommendations.push({
    type: 'efficiency',
    title: 'Disiplin Stok Opname Berkala',
    desc: 'Lakukan pencocokan stok fisik minimal seminggu sekali untuk mencegah kebocoran bahan baku dan menjamin keakuratan margin usaha.',
    actionLabel: 'Lakukan Stok Opname',
    actionPath: '/stock-opname',
  });

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

      {/* Top Actionable Recommendations */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-600" />
          Rekomendasi Tindakan Operasional
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border-2 shadow-[3px_3px_0px_#0f172a] space-y-2 flex flex-col justify-between ${
                rec.type === 'critical'
                  ? 'bg-rose-50 border-slate-900'
                  : rec.type === 'opportunity'
                  ? 'bg-amber-50 border-slate-900'
                  : 'bg-blue-50 border-slate-900'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  {rec.type === 'critical' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                  ) : rec.type === 'opportunity' ? (
                    <Sparkles className="w-4 h-4 text-amber-700" />
                  ) : (
                    <Lightbulb className="w-4 h-4 text-blue-700" />
                  )}
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm leading-snug">
                    {rec.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{rec.desc}</p>
              </div>

              {rec.actionPath && (
                <button
                  onClick={() => onNavigate(rec.actionPath!)}
                  className="mt-2 text-xs font-black text-blue-800 hover:text-blue-950 inline-flex items-center gap-1"
                >
                  {rec.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
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
