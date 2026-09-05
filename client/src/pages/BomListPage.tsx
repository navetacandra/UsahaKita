import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bom } from '../types';
import { formatCurrency } from '../utils/formatters';
import { BookOpen, Plus, Factory, ChevronRight, Layers } from 'lucide-react';

interface BomListPageProps {
  onNavigate: (path: string) => void;
}

export function BomListPage({ onNavigate }: BomListPageProps) {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.boms.list();
        if (res.success && res.data) {
          setBoms(res.data);
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
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md text-blue-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Resep & Komposisi (BoM)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Rumus baku bahan untuk menghasilkan produk jadi dengan kalkulasi proporsi otomatis saat produksi.
          </p>
        </div>

        <button
          id="bom-btn-create"
          onClick={() => onNavigate('/bom/new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <Plus className="w-4 h-4" />
          Buat Resep Baru
        </button>
      </div>

      {/* BoM Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-xl border-2 border-slate-300" />
          <div className="h-44 bg-slate-200 rounded-xl border-2 border-slate-300" />
        </div>
      ) : boms.length === 0 ? (
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-10 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-base">Belum Ada Resep Tersimpan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Buat resep pertama Anda untuk menentukan kebutuhan bahan dan menghasilkan produk siap jual secara terukur.
          </p>
          <button
            onClick={() => onNavigate('/bom/new')}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-blue-700 text-xs"
          >
            + Buat Resep Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {boms.map((bom) => (
            <div
              key={bom.id}
              className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 space-y-4 hover:border-blue-600 transition-colors"
            >
              <div className="flex justify-between items-start gap-2 border-b-2 border-slate-900 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Resep & Komposisi
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{bom.name}</h3>
                  <p className="text-xs font-semibold text-blue-700 mt-0.5">
                    Hasil: {bom.product_name}
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-700">
                  Aktif
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div>
                  <span className="text-slate-500 block">Output Standar 1 Resep:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {bom.output_quantity} {bom.output_unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Harga Jual per Satuan:</span>
                  <span className="font-bold text-blue-800 text-sm">
                    {formatCurrency(bom.selling_price_per_unit)}
                  </span>
                </div>
              </div>

              {/* Material Composition Preview */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Komposisi Bahan ({(bom.materials || []).length} macam):
                </span>
                {(bom.materials || []).length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600 bg-white border border-slate-200 rounded-lg p-2.5">
                    {(bom.materials || []).map((m, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] py-0.5">
                        <span className="truncate pr-1 text-slate-800 font-medium">
                          • {m.material_name || m.material_id}
                        </span>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
                          {m.quantity} {m.unit || 'unit'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic py-1">
                    Detail komposisi bahan dapat dilihat pada detail resep.
                  </p>
                )}
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <button
                  id={`bom-detail-${bom.id}`}
                  onClick={() => onNavigate(`/bom/${bom.id}`)}
                  className="text-xs font-bold text-slate-700 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  Detail Resep <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  id={`bom-produce-${bom.id}`}
                  onClick={() => onNavigate('/production/new')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 border border-slate-900 rounded-md shadow-[1px_1px_0px_#0f172a] transition-all"
                >
                  <Factory className="w-3.5 h-3.5" />
                  Produksi Pakai Resep Ini
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
