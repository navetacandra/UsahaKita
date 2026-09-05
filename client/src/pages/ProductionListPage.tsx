import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProductionRecord } from '../types';
import { formatDate, formatNumber } from '../utils/formatters';
import { Factory, Plus, ChevronRight, Layers, Clock } from 'lucide-react';

interface ProductionListPageProps {
  onNavigate: (path: string) => void;
}

export function ProductionListPage({ onNavigate }: ProductionListPageProps) {
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.productions.list();
        if (res.success && res.data) {
          setProductions(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md text-blue-800">
              <Factory className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Aktivitas & Riwayat Produksi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Pantau perbandingan rencana target versus hasil riil dan efisiensi bahan yang dikonsumsi.
          </p>
        </div>

        <button
          id="prod-btn-new"
          onClick={() => onNavigate('/production/new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <Plus className="w-4 h-4" />
          Mulai Sesi Produksi Baru
        </button>
      </div>

      {loading ? (
        <div className="bg-white border-2 border-slate-900 rounded-xl p-8 text-center text-xs text-slate-500 animate-pulse">
          Memuat riwayat produksi...
        </div>
      ) : productions.length === 0 ? (
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-10 text-center space-y-3">
          <Factory className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-base">Belum Ada Sesi Produksi</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Gunakan panduan 5 langkah untuk membuat produk jadi dari bahan baku secara presisi.
          </p>
          <button
            onClick={() => onNavigate('/production/new')}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-xs hover:bg-blue-700"
          >
            + Buat Produksi Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {productions.map((prod) => (
            <div
              key={prod.id}
              className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-5 hover:border-blue-600 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-800 flex items-center justify-center text-amber-900">
                    <Factory className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      {prod.product_name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(prod.created_at)}</span>
                      <span>•</span>
                      <span className="font-mono">ID: {prod.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold bg-blue-50 text-blue-900 border border-blue-800 px-2.5 py-1 rounded">
                    Multiplier: {formatNumber(prod.bom_multiplier, 3)}x
                  </span>
                  <button
                    id={`view-prod-detail-${prod.id}`}
                    onClick={() => onNavigate(`/production/${prod.id}`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md border border-slate-400"
                  >
                    Detail Lengkap
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Planned vs Actual Output stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div>
                  <span className="text-slate-500 block">Target Awal:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {prod.target_output_quantity} unit
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Hasil Riil Selesai:</span>
                  <span className="font-black text-emerald-800 font-mono text-sm">
                    {prod.actual_output_quantity} unit
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bahan Dikonsumsi:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {(prod.materials || []).length} material
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Catatan:</span>
                  <span className="font-medium text-slate-700 truncate block text-[11px]">
                    {prod.note || 'Sesuai kalkulasi resep'}
                  </span>
                </div>
              </div>

              {/* Mini Material usage preview */}
              {(prod.materials || []).length > 0 && (
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 pt-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-500" />
                    Bahan terpakai:
                  </span>
                  {(prod.materials || []).map((m, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-medium"
                    >
                      {m.material_name}: <strong className="font-mono text-slate-900">{m.actual_quantity} {m.unit}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
