import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StockMovement } from '../types';
import { formatDate } from '../utils/formatters';
import { ArrowLeftRight, Search } from 'lucide-react';

interface MovementsPageProps {
  onNavigate: (path: string) => void;
}

export function MovementsPage({ onNavigate: _onNavigate }: MovementsPageProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.movements.list();
      if (res.success && res.data) {
        setMovements(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const filtered = movements.filter((m) => {
    const matchSearch =
      m.item_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.reason && m.reason.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;
    if (filterType === 'MATERIAL') return m.item_type === 'MATERIAL';
    if (filterType === 'PRODUCT') return m.item_type === 'PRODUCT';
    if (filterType === 'IN') return m.type === 'IN' || m.type === 'PRODUCTION_OUTPUT';
    if (filterType === 'OUT') return m.type === 'OUT' || m.type === 'PRODUCTION_CONSUME' || m.type === 'SALE';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md text-blue-800">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Mutasi & Pergerakan Stok
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Lacak seluruh jejak transaksi stok masuk, konsumsi produksi, penjualan, hingga penyesuaian opname.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="movement-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari mutasi berdasarkan nama item atau alasan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          {['ALL', 'MATERIAL', 'PRODUCT', 'IN', 'OUT'].map((tab) => (
            <button
              key={tab}
              id={`filter-mov-${tab.toLowerCase()}`}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-lg border-2 border-slate-900 transition-all ${
                filterType === tab
                  ? 'bg-blue-600 text-white shadow-[2px_2px_0px_#0f172a]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL'
                ? 'Semua'
                : tab === 'MATERIAL'
                ? 'Bahan Saja'
                : tab === 'PRODUCT'
                ? 'Produk Saja'
                : tab === 'IN'
                ? 'Stok Masuk (+)'
                : 'Stok Keluar (-)'}
            </button>
          ))}
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-900 text-xs font-black text-slate-900 uppercase tracking-wider">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Nama Item</th>
                <th className="py-3 px-4 text-right">Perubahan</th>
                <th className="py-3 px-4 text-right">Sebelum</th>
                <th className="py-3 px-4 text-right">Sesudah</th>
                <th className="py-3 px-4">Keterangan / Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Memuat catatan mutasi...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    Tidak ditemukan catatan mutasi stok yang sesuai.
                  </td>
                </tr>
              ) : (
                filtered.map((mov) => {
                  const isPositive = mov.type === 'IN' || mov.type === 'PRODUCTION_OUTPUT';
                  return (
                    <tr key={mov.movement_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {formatDate(mov.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded border whitespace-nowrap ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-800'
                              : 'bg-rose-100 text-rose-900 border-rose-800'
                          }`}
                        >
                          {mov.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {mov.item_name}
                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                          ({mov.item_type === 'MATERIAL' ? 'Bahan' : 'Produk'})
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-black ${
                          isPositive ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isPositive ? '+' : '-'}
                        {mov.quantity} {mov.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {mov.stock_before} {mov.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {mov.stock_after} {mov.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-xs">{mov.reason || '-'}</td>
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
