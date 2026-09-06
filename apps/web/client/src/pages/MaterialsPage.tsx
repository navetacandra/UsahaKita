import { useState, useEffect, FormEvent } from 'react';
import { api } from '../services/api';
import { Material } from '../types';
import { formatNumber, getStockStatus } from '../utils/formatters';
import { StockBadge } from '../components/common/StockBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  History,
  ClipboardCheck,
  Boxes,
  X,
} from 'lucide-react';

interface MaterialsPageProps {
  onNavigate: (path: string) => void;
}

export function MaterialsPage({ onNavigate }: MaterialsPageProps) {
  const { showToast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Form states - Add Material
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newPrecision, setNewPrecision] = useState(0);
  const [newMinStock, setNewMinStock] = useState(0);
  const [newInitialStock, setNewInitialStock] = useState(0);

  // Form states - Movement
  const [movementQty, setMovementQty] = useState<number>(0);
  const [movementReason, setMovementReason] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.materials.list({ search });
      if (res.success && res.data) {
        setMaterials(res.data);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data bahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [search]);

  const handleOpenMovement = (mat: Material, type: 'IN' | 'OUT') => {
    setSelectedMaterial(mat);
    setMovementType(type);
    setMovementQty(0);
    setMovementReason('');
    setIsMovementModalOpen(true);
  };

  const handleAddMaterialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setActionLoading(true);

    try {
      const res = await api.materials.create({
        name: newName,
        unit: newUnit,
        quantity_precision: newPrecision,
        minimum_stock: newMinStock,
        initial_stock: newInitialStock,
      });

      if (res.success) {
        showToast('success', `Material "${newName}" berhasil ditambahkan.`);
        setIsAddModalOpen(false);
        setNewName('');
        setNewInitialStock(0);
        fetchMaterials();
      } else {
        showToast('error', res.error?.message || 'Gagal menambahkan material.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMovementProceed = () => {
    if (!selectedMaterial || movementQty <= 0) return;
    if (movementType === 'OUT' && selectedMaterial.current_stock < movementQty) {
      showToast('error', `Stok tidak mencukupi. Tersedia: ${selectedMaterial.current_stock} ${selectedMaterial.unit}`);
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmMovement = async () => {
    if (!selectedMaterial) return;
    setActionLoading(true);

    try {
      const res = await api.materials.addMovement(
        selectedMaterial.id,
        movementType,
        movementQty,
        movementReason
      );

      if (res.success) {
        showToast(
          'success',
          `Stok ${selectedMaterial.name} berhasil ${movementType === 'IN' ? 'ditambah' : 'dikurangi'}.`
        );
        setIsConfirmOpen(false);
        setIsMovementModalOpen(false);
        fetchMaterials();
      } else {
        showToast('error', res.error?.message || 'Gagal mencatat mutasi stok.');
      }
    } catch {
      showToast('error', 'Terjadi gangguan sistem.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md text-blue-800">
              <Boxes className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Stok Bahan Baku & Material
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Kelola stok bahan, pencatatan stok masuk dari pembelian, serta batas minimum persediaan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="mat-btn-opname"
            onClick={() => onNavigate('/inventory/stock-opname')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <ClipboardCheck className="w-4 h-4 text-slate-700" />
            Stok Opname
          </button>
          <button
            id="mat-btn-history"
            onClick={() => onNavigate('/inventory/movements')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <History className="w-4 h-4 text-slate-700" />
            Riwayat Stok
          </button>
          <button
            id="mat-btn-add"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Material
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="mat-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama material (misal: tepung, telur)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="text-xs text-slate-600 font-semibold flex items-center gap-4">
          <span>Total: <strong className="text-slate-900">{materials.length}</strong> bahan</span>
          <span className="text-amber-700">
            Menipis/Habis: <strong>{materials.filter((m) => m.current_stock <= m.minimum_stock).length}</strong>
          </span>
        </div>
      </div>

      {/* Material Table */}
      <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-900 text-xs font-black text-slate-900 uppercase tracking-wider">
                <th className="py-3 px-4">Nama Material</th>
                <th className="py-3 px-4 text-right">Stok Sistem</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-right">Batas Min.</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Tindakan Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Memuat data material...
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    <p className="font-bold text-slate-800">Belum ada material yang cocok.</p>
                    <p className="text-xs text-slate-500 mt-1">Tambahkan bahan baku baru dengan tombol di atas.</p>
                  </td>
                </tr>
              ) : (
                materials.map((mat) => {
                  const status = getStockStatus(mat.current_stock, mat.minimum_stock);
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {mat.name}
                        <div className="text-[11px] text-slate-500 font-mono font-normal">ID: {mat.id}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                        {formatNumber(mat.current_stock, mat.quantity_precision)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">{mat.unit}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatNumber(mat.minimum_stock, mat.quantity_precision)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StockBadge status={status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`mat-btn-in-${mat.id}`}
                            onClick={() => handleOpenMovement(mat, 'IN')}
                            title="Catat Stok Masuk (Beli)"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-800 rounded-md transition-all active:translate-y-0.5"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            + Masuk
                          </button>
                          <button
                            id={`mat-btn-out-${mat.id}`}
                            onClick={() => handleOpenMovement(mat, 'OUT')}
                            title="Catat Stok Keluar Non-Produksi (Susut/Afkir)"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-800 rounded-md transition-all active:translate-y-0.5"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            - Keluar
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

      {/* Modal: Tambah Material */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <h3 className="font-extrabold text-slate-900">Tambah Bahan Baku Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddMaterialSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nama Bahan Baku <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Tepung Terigu Segitiga"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Satuan / Unit <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => {
                      const u = e.target.value;
                      setNewUnit(u);
                      if (u === 'pcs' || u === 'butir' || u === 'lembar') {
                        setNewPrecision(0);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="gram">gram</option>
                    <option value="pcs">pcs (Buah)</option>
                    <option value="butir">butir</option>
                    <option value="liter">liter</option>
                    <option value="ml">ml (Mililiter)</option>
                    <option value="pack">pack</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Presisi Angka (Desimal)
                  </label>
                  <select
                    value={newPrecision}
                    onChange={(e) => setNewPrecision(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
                  >
                    <option value={0}>0 (Bulat / pcs)</option>
                    <option value={1}>1 (0.1)</option>
                    <option value={2}>2 (0.01)</option>
                    <option value={3}>3 (0.001)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Stok Awal ({newUnit})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={newPrecision > 0 ? Math.pow(10, -newPrecision) : 1}
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Batas Minimum ({newUnit})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={newPrecision > 0 ? Math.pow(10, -newPrecision) : 1}
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
                  />
                </div>
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
                  Simpan Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Catat Mutasi Masuk / Keluar */}
      {isMovementModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <h3 className="font-extrabold text-slate-900">
                {movementType === 'IN' ? 'Catat Stok Masuk (Bahan)' : 'Catat Stok Keluar (Bahan)'}
              </h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 text-xs space-y-1">
              <p className="font-bold text-slate-900 text-sm">{selectedMaterial.name}</p>
              <div className="flex justify-between text-slate-600">
                <span>Stok saat ini:</span>
                <span className="font-bold text-slate-900">
                  {selectedMaterial.current_stock} {selectedMaterial.unit}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Jumlah {movementType === 'IN' ? 'Masuk' : 'Keluar'} ({selectedMaterial.unit})
                </label>
                <input
                  type="number"
                  min={movementType === 'OUT' ? 0.001 : 0.001}
                  step={selectedMaterial.quantity_precision > 0 ? Math.pow(10, -selectedMaterial.quantity_precision) : 1}
                  value={movementQty}
                  onChange={(e) => setMovementQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-base font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Keterangan / Alasan
                </label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Contoh: Belanja pasar pagi / afkir basah"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 border-2 border-slate-900 font-bold rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleMovementProceed}
                  className={`px-4 py-2 text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-bold rounded-lg ${
                    movementType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Lanjutkan Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmMovement}
        title={movementType === 'IN' ? 'Konfirmasi Stok Masuk' : 'Konfirmasi Stok Keluar'}
        description={`Pastikan jumlah fisik ${movementType === 'IN' ? 'diterima' : 'dikeluarkan'} sudah sesuai.`}
        isDanger={movementType === 'OUT'}
        isLoading={actionLoading}
        summaryItems={
          selectedMaterial
            ? [
                { label: 'Nama Bahan', value: selectedMaterial.name },
                {
                  label: 'Stok Sebelum',
                  value: `${selectedMaterial.current_stock} ${selectedMaterial.unit}`,
                },
                {
                  label: movementType === 'IN' ? 'Jumlah Ditambah' : 'Jumlah Dikurang',
                  value: `${movementQty} ${selectedMaterial.unit}`,
                  highlight: true,
                },
                {
                  label: 'Stok Setelahnya',
                  value: `${
                    movementType === 'IN'
                      ? selectedMaterial.current_stock + movementQty
                      : selectedMaterial.current_stock - movementQty
                  } ${selectedMaterial.unit}`,
                },
                { label: 'Alasan', value: movementReason || '-' },
              ]
            : []
        }
      />
    </div>
  );
}
