import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProductionRecord } from '../types';
import { formatDate, formatNumber } from '../utils/formatters';
import { Factory, ArrowLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProductionDetailPageProps {
  id: string;
  onNavigate: (path: string) => void;
}

export function ProductionDetailPage({ id, onNavigate }: ProductionDetailPageProps) {
  const [record, setRecord] = useState<ProductionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.productions.getById(id);
        if (res.success && res.data) {
          setRecord(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center space-y-3">
        <p className="font-bold text-slate-700">Catatan produksi tidak ditemukan.</p>
        <button
          onClick={() => onNavigate('/production')}
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg"
        >
          Kembali ke Daftar Produksi
        </button>
      </div>
    );
  }

  const outputDifference = record.actual_output_quantity - record.target_output_quantity;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('/production')}
          className="p-2 bg-white border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a] hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Detail Produksi #{record.id}
          </h1>
          <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5" />
            Waktu: {formatDate(record.created_at)}
          </p>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 border border-amber-900 rounded-lg text-amber-900">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Produk Jadi Selesai
              </span>
              <h2 className="text-lg font-black text-slate-900">{record.product_name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-blue-100 text-blue-900 border border-blue-900 px-2.5 py-1 rounded">
              Multiplier BoM: {formatNumber(record.bom_multiplier, 3)}x
            </span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-900 px-2.5 py-1 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Selesai & Masuk Stok
            </span>
          </div>
        </div>

        {/* Planned vs Actual Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Target Rencana:</span>
            <p className="text-xl font-black font-mono text-slate-900">
              {record.target_output_quantity} unit
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-900 rounded-lg p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-blue-900 uppercase">Hasil Riil Fisik:</span>
            <p className="text-xl font-black font-mono text-blue-900">
              {record.actual_output_quantity} unit
            </p>
          </div>

          <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Selisih Output:</span>
            <p
              className={`text-xl font-black font-mono ${
                outputDifference === 0
                  ? 'text-slate-700'
                  : outputDifference > 0
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {outputDifference > 0 ? `+${outputDifference}` : outputDifference} unit
            </p>
          </div>
        </div>

        {record.note && (
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 text-xs text-slate-700">
            <strong>Catatan Sesi:</strong> {record.note}
          </div>
        )}
      </div>

      {/* Material Comparison Table (Planned vs Actual) */}
      <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl overflow-hidden">
        <div className="p-4 border-b-2 border-slate-900 bg-slate-100 flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-slate-900">
            Perbandingan Konsumsi Bahan Baku (Planned vs Actual)
          </h3>
          <span className="text-xs text-slate-600 font-medium">
            Total {(record.materials || []).length} material
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-black text-slate-700 uppercase">
                <th className="py-3 px-4">Nama Bahan</th>
                <th className="py-3 px-4 text-right">Kalkulasi Resep (Planned)</th>
                <th className="py-3 px-4 text-right">Pemakaian Riil (Actual)</th>
                <th className="py-3 px-4 text-right">Selisih Bahan</th>
                <th className="py-3 px-4 text-center">Status Pemakaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 sm:text-sm">
              {(record.materials || []).map((m) => {
                const diff = Number((m.actual_quantity - m.calculated_quantity).toFixed(3));
                return (
                  <tr key={m.material_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.material_name}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-600">
                      {m.calculated_quantity} {m.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-blue-900">
                      {m.actual_quantity} {m.unit}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        diff === 0
                          ? 'text-slate-500'
                          : diff > 0
                          ? 'text-amber-800'
                          : 'text-emerald-700'
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff} {m.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {diff === 0 ? (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                          Presisi Resep
                        </span>
                      ) : diff > 0 ? (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-700">
                          Dibulatkan / Tambah
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-700">
                          Hemat Bahan
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
