import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Receipt, ShoppingBag, Plus, Calendar } from 'lucide-react';

interface SalesPageProps {
  onNavigate: (path: string) => void;
}

export function SalesPage({ onNavigate }: SalesPageProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.sales.list();
        if (res.success && res.data) {
          setSales(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalOmzet = sales.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md text-blue-800">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Riwayat Transaksi Penjualan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Rekap seluruh nota kasir dan penjualan produk jadi.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/pos')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <Plus className="w-4 h-4" />
          Buka Kasir (POS)
        </button>
      </div>

      {/* Summary Stat */}
      <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 border border-emerald-900 rounded-lg text-emerald-800">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Akumulasi Penjualan:</span>
            <p className="text-lg font-black font-mono text-emerald-700">
              {formatCurrency(totalOmzet)}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold font-mono bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-slate-700">
          {sales.length} Transaksi Terdata
        </span>
      </div>

      {/* Sales List Table */}
      <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-900 font-black text-slate-900 uppercase">
                <th className="py-3 px-4">No. Struk</th>
                <th className="py-3 px-4">Waktu Transaksi</th>
                <th className="py-3 px-4">Rincian Item Terjual</th>
                <th className="py-3 px-4 text-center">Jumlah Item</th>
                <th className="py-3 px-4 text-right">Total Tagihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Memuat riwayat transaksi...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Belum ada transaksi penjualan yang tercatat.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const safeItems = sale.items || [];
                  const totalCount = safeItems.reduce((s, i) => s + (i.quantity || 0), 0);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-extrabold text-blue-700">
                        #{sale.id}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                        {formatDate(sale.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {safeItems.map((item, idx) => (
                            <div key={idx} className="text-xs text-slate-800">
                              <span className="font-bold">{item.product_name || item.product_id}</span> × {item.quantity} (
                              {formatCurrency(item.unit_price)})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {totalCount} pcs
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
