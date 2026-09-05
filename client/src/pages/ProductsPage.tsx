import { useState, useEffect, FormEvent } from 'react';
import { api } from '../services/api';
import { Product } from '../types';
import { formatCurrency, formatNumber, getStockStatus } from '../utils/formatters';
import { StockBadge } from '../components/common/StockBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import {
  Package,
  Plus,
  ArrowUpRight,
  Search,
  Factory,
  Info,
  X,
} from 'lucide-react';

interface ProductsPageProps {
  onNavigate: (path: string) => void;
}

export function ProductsPage({ onNavigate }: ProductsPageProps) {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOutgoingModalOpen, setIsOutgoingModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Add product form
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [sellingPrice, setSellingPrice] = useState(5000);
  const [minimumStock, setMinimumStock] = useState(15);

  // Outgoing form
  const [outgoingQty, setOutgoingQty] = useState(1);
  const [outgoingReasonType, setOutgoingReasonType] = useState<'DAMAGED' | 'EXPIRED' | 'SAMPLE' | 'OTHER'>('DAMAGED');
  const [outgoingNote, setOutgoingNote] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.products.list({ search });
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat produk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setActionLoading(true);

    try {
      const res = await api.products.create({
        name,
        unit,
        selling_price: sellingPrice,
        minimum_stock: minimumStock,
      });

      if (res.success) {
        showToast('success', `Produk "${name}" berhasil dibuat. Stok awal adalah 0 (bertambah via Produksi).`);
        setIsAddModalOpen(false);
        setName('');
        fetchProducts();
      } else {
        showToast('error', res.error?.message || 'Gagal menambahkan produk.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenOutgoing = (prod: Product) => {
    setSelectedProduct(prod);
    setOutgoingQty(1);
    setOutgoingReasonType('DAMAGED');
    setOutgoingNote('');
    setIsOutgoingModalOpen(true);
  };

  const handleProceedOutgoing = () => {
    if (!selectedProduct || outgoingQty <= 0) return;
    if (selectedProduct.current_stock < outgoingQty) {
      showToast('error', `Stok produk tidak mencukupi (Sisa: ${selectedProduct.current_stock} ${selectedProduct.unit})`);
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmOutgoing = async () => {
    if (!selectedProduct) return;
    setActionLoading(true);

    try {
      const res = await api.products.recordOutgoing(
        selectedProduct.id,
        outgoingQty,
        outgoingReasonType,
        outgoingNote
      );

      if (res.success) {
        showToast('success', `Pengeluaran ${outgoingQty} ${selectedProduct.unit} ${selectedProduct.name} berhasil dicatat.`);
        setIsConfirmOpen(false);
        setIsOutgoingModalOpen(false);
        fetchProducts();
      } else {
        showToast('error', res.error?.message || 'Gagal memproses pengeluaran produk.');
      }
    } catch {
      showToast('error', 'Terjadi gangguan sistem.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md text-blue-800">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Stok Produk Jadi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Katalog barang jadi hasil olahan usaha yang siap dijual kepada pelanggan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="prod-btn-goto-production"
            onClick={() => onNavigate('/production/new')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Factory className="w-4 h-4" />
            + Buat Produksi
          </button>
          <button
            id="prod-btn-add"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Business Rule Banner */}
      <div className="bg-blue-50 border-2 border-blue-900 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-950">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Prinsip Alur Stok Produk:</span> Produk tidak memiliki tombol stok masuk manual. Stok bertambah secara akurat melalui proses <strong>Produksi</strong> berdasarkan Resep (BoM), dan berkurang saat transaksi <strong>Kasir POS</strong> atau pengeluaran non-penjualan (rusak/kadaluarsa).
        </div>
      </div>

      {/* Search & Stats */}
      <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="prod-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk (misal: donat, roti)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden"
          />
        </div>
        <div className="text-xs text-slate-600 font-semibold flex items-center gap-4">
          <span>Total: <strong className="text-slate-900">{products.length}</strong> produk</span>
          <span className="text-rose-700">
            Stok Rendah: <strong>{products.filter((p) => p.current_stock <= p.minimum_stock).length}</strong>
          </span>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-900 text-xs font-black text-slate-900 uppercase tracking-wider">
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-right">Stok Fisik Tersedia</th>
                <th className="py-3 px-4 text-right">Batas Min.</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Memuat daftar produk...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    <p className="font-bold text-slate-800">Belum ada produk terdaftar.</p>
                    <p className="text-xs text-slate-500 mt-1">Tambahkan produk baru dengan tombol di atas.</p>
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const status = getStockStatus(prod.current_stock, prod.minimum_stock);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {prod.name}
                        <div className="text-[11px] text-slate-500 font-mono font-normal">ID: {prod.id}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-blue-700">
                        {formatCurrency(prod.selling_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        {formatNumber(prod.current_stock, 0)} <span className="font-semibold text-slate-600">{prod.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatNumber(prod.minimum_stock, 0)} {prod.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StockBadge status={status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`prod-btn-produce-${prod.id}`}
                            onClick={() => onNavigate('/production/new')}
                            title="Produksi Produk Ini"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 border border-slate-900 rounded-md transition-all active:translate-y-0.5"
                          >
                            <Factory className="w-3.5 h-3.5" />
                            Produksi
                          </button>
                          <button
                            id={`prod-btn-out-${prod.id}`}
                            onClick={() => handleOpenOutgoing(prod)}
                            title="Catat Produk Keluar (Afkir / Rusak / Sampel)"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-800 rounded-md transition-all active:translate-y-0.5"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Keluar Afkir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Produk Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <h3 className="font-extrabold text-slate-900">Tambah Produk Jadi Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nama Produk <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Donat Meses Coklat"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Satuan Jual <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
                  >
                    <option value="pcs">pcs (Satuan)</option>
                    <option value="porsi">porsi</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                    <option value="cup">cup</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Harga Jual Satuan (IDR) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-bold text-blue-700 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Batas Stok Minimum ({unit})
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-[11px] text-slate-600">
                Catatan: Stok awal produk baru otomatis <strong>0 {unit}</strong>. Buat Resep (BoM) lalu jalankan Produksi untuk menambah stok fisik.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border-2 border-slate-900 font-bold rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-bold rounded-lg hover:bg-blue-700"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Catat Pengeluaran Produk Non-Penjualan */}
      {isOutgoingModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <h3 className="font-extrabold text-slate-900">Catat Produk Keluar (Non-Penjualan)</h3>
              <button onClick={() => setIsOutgoingModalOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 text-xs space-y-1">
              <p className="font-bold text-slate-900 text-sm">{selectedProduct.name}</p>
              <div className="flex justify-between text-slate-600">
                <span>Stok tersedia:</span>
                <span className="font-bold text-slate-900">
                  {selectedProduct.current_stock} {selectedProduct.unit}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Jumlah Keluar ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedProduct.current_stock}
                  step={1}
                  value={outgoingQty}
                  onChange={(e) => setOutgoingQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-base font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Jenis Alasan
                </label>
                <select
                  value={outgoingReasonType}
                  onChange={(e) => setOutgoingReasonType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
                >
                  <option value="DAMAGED">DAMAGED - Rusak / Gosong / Hancur</option>
                  <option value="EXPIRED">EXPIRED - Kadaluarsa / Melewati batas layak</option>
                  <option value="SAMPLE">SAMPLE - Tester / Icip Pelanggan / Konsumsi Sendiri</option>
                  <option value="OTHER">OTHER - Alasan lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={outgoingNote}
                  onChange={(e) => setOutgoingNote(e.target.value)}
                  placeholder="Contoh: Kemasan tertindih saat display"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsOutgoingModalOpen(false)}
                  className="px-4 py-2 border-2 border-slate-900 font-bold rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProceedOutgoing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-bold rounded-lg"
                >
                  Lanjutkan Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmOutgoing}
        title="Konfirmasi Pengeluaran Produk"
        description="Pengurangan stok ini bukan merupakan transaksi penjualan."
        isDanger={true}
        isLoading={actionLoading}
        summaryItems={
          selectedProduct
            ? [
                { label: 'Nama Produk', value: selectedProduct.name },
                {
                  label: 'Stok Sebelum',
                  value: `${selectedProduct.current_stock} ${selectedProduct.unit}`,
                },
                {
                  label: 'Jumlah Dikeluarkan',
                  value: `${outgoingQty} ${selectedProduct.unit}`,
                  highlight: true,
                },
                {
                  label: 'Sisa Stok Setelahnya',
                  value: `${selectedProduct.current_stock - outgoingQty} ${selectedProduct.unit}`,
                },
                { label: 'Jenis Alasan', value: outgoingReasonType },
                { label: 'Catatan', value: outgoingNote || '-' },
              ]
            : []
        }
      />
    </div>
  );
}
