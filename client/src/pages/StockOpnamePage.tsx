import { useState, useEffect, FormEvent } from 'react';
import { api } from '../services/api';
import { Material, Product, StockOpnameRecord } from '../types';
import { formatNumber, formatDate } from '../utils/formatters';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { ClipboardCheck, ArrowRight, History } from 'lucide-react';

interface StockOpnamePageProps {
  onNavigate: (path: string) => void;
}

export function StockOpnamePage({ onNavigate: _onNavigate }: StockOpnamePageProps) {
  const { showToast } = useToast();
  const [itemType, setItemType] = useState<'MATERIAL' | 'PRODUCT'>('MATERIAL');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [actualQuantity, setActualQuantity] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [history, setHistory] = useState<StockOpnameRecord[]>([]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [mRes, pRes, hRes] = await Promise.all([
        api.materials.list(),
        api.products.list(),
        api.stockOpname.list(),
      ]);
      if (mRes.success && Array.isArray(mRes.data)) {
        setMaterials(mRes.data);
        if (itemType === 'MATERIAL' && mRes.data.length > 0 && !selectedItemId) {
          setSelectedItemId(mRes.data[0].id);
          setActualQuantity(mRes.data[0].current_stock);
        }
      }
      if (pRes.success && Array.isArray(pRes.data)) {
        setProducts(pRes.data);
        if (itemType === 'PRODUCT' && pRes.data.length > 0 && !selectedItemId) {
          setSelectedItemId(pRes.data[0].id);
          setActualQuantity(pRes.data[0].current_stock);
        }
      }
      if (hRes.success && Array.isArray(hRes.data)) {
        setHistory(hRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When type or selection changes, reset actual quantity to current system quantity
  const handleTypeChange = (type: 'MATERIAL' | 'PRODUCT') => {
    setItemType(type);
    if (type === 'MATERIAL') {
      const first = materials[0];
      setSelectedItemId(first?.id || '');
      setActualQuantity(first?.current_stock || 0);
    } else {
      const first = products[0];
      setSelectedItemId(first?.id || '');
      setActualQuantity(first?.current_stock || 0);
    }
  };

  const handleItemSelect = (id: string) => {
    setSelectedItemId(id);
    if (itemType === 'MATERIAL') {
      const item = materials.find((m) => m.id === id);
      if (item) setActualQuantity(item.current_stock);
    } else {
      const item = products.find((p) => p.id === id);
      if (item) setActualQuantity(item.current_stock);
    }
  };

  const selectedItem =
    itemType === 'MATERIAL'
      ? materials.find((m) => m.id === selectedItemId)
      : products.find((p) => p.id === selectedItemId);

  const systemQuantity = selectedItem ? selectedItem.current_stock : 0;
  const unit = selectedItem ? selectedItem.unit : '';
  const precision =
    itemType === 'MATERIAL' ? (selectedItem as Material)?.quantity_precision || 2 : 0;
  const difference = Number((actualQuantity - systemQuantity).toFixed(precision));

  const handleProceed = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      showToast('error', 'Pilih item terlebih dahulu');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedItem) return;
    setLoading(true);

    try {
      const res = await api.stockOpname.create({
        item_type: itemType,
        item_id: selectedItem.id,
        actual_quantity: actualQuantity,
        note: note || 'Penyesuaian stok fisik berkala',
      });

      if (res.success) {
        showToast(
          'success',
          `Stok opname berhasil disimpan. Selisih ${difference >= 0 ? '+' : ''}${difference} ${unit} telah disesuaikan.`
        );
        setIsConfirmOpen(false);
        setNote('');
        loadData();
      } else {
        showToast('error', res.error?.message || 'Gagal menyimpan stok opname.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md text-blue-800">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Stok Opname (Penyesuaian Fisik)
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Cocokkan stok yang tercatat di sistem dengan jumlah riil di gudang atau rak pajang.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Opname Workflow */}
        <div className="lg:col-span-7 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 sm:p-6 space-y-5">
          <h2 className="font-black text-slate-900 text-base border-b-2 border-slate-900 pb-3">
            Formulir Opname Stok
          </h2>

          <form onSubmit={handleProceed} className="space-y-4">
            {/* Step 1: Pilih Jenis Item */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Kategori Item
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="opname-select-mat"
                  onClick={() => handleTypeChange('MATERIAL')}
                  className={`py-2.5 px-4 text-xs font-extrabold rounded-lg border-2 border-slate-900 transition-all ${
                    itemType === 'MATERIAL'
                      ? 'bg-blue-600 text-white shadow-[2px_2px_0px_#0f172a]'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Bahan Baku / Material
                </button>
                <button
                  type="button"
                  id="opname-select-prod"
                  onClick={() => handleTypeChange('PRODUCT')}
                  className={`py-2.5 px-4 text-xs font-extrabold rounded-lg border-2 border-slate-900 transition-all ${
                    itemType === 'PRODUCT'
                      ? 'bg-blue-600 text-white shadow-[2px_2px_0px_#0f172a]'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Produk Jadi Siap Jual
                </button>
              </div>
            </div>

            {/* Step 2: Pilih Item */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Pilih Item yang Dihitung
              </label>
              <select
                id="opname-item-dropdown"
                value={selectedItemId}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-semibold focus:bg-white focus:outline-hidden"
              >
                {itemType === 'MATERIAL' ? (
                  materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stok Sistem: {m.current_stock} {m.unit})
                    </option>
                  ))
                ) : (
                  products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok Sistem: {p.current_stock} {p.unit})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Step 3: Perbandingan Stok Sistem vs Aktual */}
            {selectedItem && (
              <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 border-b border-slate-200 pb-2">
                  <span>ITEM: {selectedItem.name}</span>
                  <span>SATUAN: {unit}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white border-2 border-slate-900 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Stok Sistem</span>
                    <p className="text-lg font-black text-slate-900 font-mono">
                      {formatNumber(systemQuantity, precision)} <span className="text-xs font-semibold">{unit}</span>
                    </p>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-900 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-blue-900 uppercase">Stok Aktual (Fisik)</span>
                    <input
                      id="opname-actual-input"
                      type="number"
                      min={0}
                      step={precision > 0 ? Math.pow(10, -precision) : 1}
                      required
                      value={actualQuantity}
                      onChange={(e) => setActualQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border-2 border-blue-900 rounded px-2 py-1 text-base font-black font-mono text-blue-950 mt-1 focus:outline-hidden"
                    />
                  </div>

                  <div
                    className={`border-2 rounded-lg p-3 ${
                      difference === 0
                        ? 'bg-slate-100 border-slate-900'
                        : difference > 0
                        ? 'bg-emerald-50 border-emerald-900'
                        : 'bg-rose-50 border-rose-900'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-slate-600">Selisih Otomatis</span>
                    <p
                      className={`text-lg font-black font-mono ${
                        difference === 0
                          ? 'text-slate-700'
                          : difference > 0
                          ? 'text-emerald-800'
                          : 'text-rose-800'
                      }`}
                    >
                      {difference > 0 ? `+${formatNumber(difference, precision)}` : formatNumber(difference, precision)}{' '}
                      <span className="text-xs font-semibold">{unit}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Alasan & Catatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan / Keterangan Penyesuaian
              </label>
              <input
                id="opname-note-input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Ditemukan selisih saat pengecekan stok mingguan"
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
              />
            </div>

            <button
              id="opname-submit-btn"
              type="submit"
              disabled={loading || !selectedItem}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <span>Tinjau & Konfirmasi Opname</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right: Opname History */}
        <div className="lg:col-span-5 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-3">
            <History className="w-4 h-4 text-slate-700" />
            <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Riwayat Stok Opname Terakhir
            </h2>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {history.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">
                Belum ada catatan stok opname.
              </div>
            ) : (
              history.map((rec) => (
                <div
                  key={rec.opname_id}
                  className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {rec.item_type === 'MATERIAL' ? 'Bahan' : 'Produk'}
                      </span>
                      <p className="font-extrabold text-slate-900 text-sm">{rec.item_name}</p>
                    </div>
                    <span
                      className={`font-mono font-black px-2 py-0.5 rounded text-xs border ${
                        rec.difference === 0
                          ? 'bg-slate-200 text-slate-800 border-slate-400'
                          : rec.difference > 0
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-700'
                          : 'bg-rose-100 text-rose-900 border-rose-700'
                      }`}
                    >
                      {rec.difference > 0 ? `+${rec.difference}` : rec.difference} {rec.unit}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-600 border-t border-slate-200 pt-1">
                    <span>Sistem: {rec.system_quantity} {rec.unit}</span>
                    <span>Aktual: {rec.actual_quantity} {rec.unit}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">"{rec.note}"</p>
                  <p className="text-[10px] text-slate-400 font-medium">{formatDate(rec.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Konfirmasi Penyesuaian Stok Opname"
        description="Stok sistem akan diubah mengikuti jumlah stok aktual yang Anda masukkan."
        isDanger={difference !== 0}
        isLoading={loading}
        summaryItems={
          selectedItem
            ? [
                { label: 'Item', value: selectedItem.name },
                { label: 'Kategori', value: itemType === 'MATERIAL' ? 'Bahan Baku' : 'Produk Jadi' },
                { label: 'Stok Sistem Saat Ini', value: `${systemQuantity} ${unit}` },
                { label: 'Stok Fisik Aktual', value: `${actualQuantity} ${unit}`, highlight: true },
                {
                  label: 'Selisih (Penyesuaian)',
                  value: `${difference > 0 ? '+' : ''}${difference} ${unit}`,
                  highlight: true,
                },
                { label: 'Catatan', value: note || 'Penyesuaian fisik berkala' },
              ]
            : []
        }
      />
    </div>
  );
}
