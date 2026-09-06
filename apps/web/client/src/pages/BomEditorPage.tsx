import { useState, useEffect, FormEvent } from 'react';
import { api } from '../services/api';
import { Material, Product, Bom } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { BookOpen, Plus, Trash2, ArrowLeft, Layers, Calculator } from 'lucide-react';

interface BomEditorPageProps {
  bomId?: string;
  onNavigate: (path: string) => void;
}

interface MaterialRow {
  material_id: string;
  quantity: number;
}

export function BomEditorPage({ bomId, onNavigate }: BomEditorPageProps) {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [outputQuantity, setOutputQuantity] = useState(0);
  const [outputUnit, setOutputUnit] = useState('');
  const [sellingPrice, setSellingPrice] = useState(0);
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);

  // Fractional simulation state
  const [simTargetQty, setSimTargetQty] = useState(0);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [pRes, mRes] = await Promise.all([api.products.list(), api.materials.list()]);
        if (pRes.success && Array.isArray(pRes.data)) {
          setProducts(pRes.data);
          if (pRes.data.length > 0 && !productId) {
            setProductId(pRes.data[0].id);
            setOutputUnit(pRes.data[0].unit);
            setSellingPrice(pRes.data[0].selling_price);
          }
        }
        if (mRes.success && Array.isArray(mRes.data)) {
          setMaterials(mRes.data);
          if (mRes.data.length > 0 && materialRows.length === 0 && !bomId) {
            // default sample row
            setMaterialRows([
              { material_id: mRes.data[0].id, quantity: 1 },
              ...(mRes.data.length > 1 ? [{ material_id: mRes.data[1].id, quantity: 0.5 }] : []),
            ]);
          }
        }

        if (bomId) {
          const bRes = await api.boms.getById(bomId);
          if (bRes.success && bRes.data) {
            const b = bRes.data;
            setName(b.name);
            setProductId(b.product_id);
            setOutputQuantity(b.output_quantity);
            setOutputUnit(b.output_unit);
            setSellingPrice(b.selling_price_per_unit);
            setMaterialRows(
              (b.materials || []).map((m) => ({
                material_id: m.material_id,
                quantity: m.quantity,
              }))
            );
            setSimTargetQty(Math.round(b.output_quantity / 2));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [bomId]);

  const handleProductChange = (id: string) => {
    setProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setOutputUnit(prod.unit);
      setSellingPrice(prod.selling_price);
      if (!name) {
        setName(`Resep ${prod.name}`);
      }
    }
  };

  const addMaterialRow = () => {
    if (materials.length === 0) return;
    setMaterialRows((prev) => [...prev, { material_id: materials[0].id, quantity: 1 }]);
  };

  const removeMaterialRow = (index: number) => {
    setMaterialRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateMaterialRow = (index: number, field: keyof MaterialRow, val: any) => {
    setMaterialRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Nama resep tidak boleh kosong.');
      return;
    }
    if (!productId) {
      showToast('error', 'Pilih produk hasil terlebih dahulu.');
      return;
    }
    if (materialRows.length === 0) {
      showToast('error', 'Masukkan minimal 1 bahan baku.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.boms.create({
        name,
        product_id: productId,
        output_quantity: outputQuantity,
        output_unit: outputUnit,
        selling_price_per_unit: sellingPrice,
        materials: materialRows,
      });

      if (res.success) {
        showToast('success', `Resep "${name}" berhasil disimpan.`);
        onNavigate('/bom');
      } else {
        showToast('error', res.error?.message || 'Gagal menyimpan resep.');
      }
    } catch {
      showToast('error', 'Terjadi kendala sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === productId);
  const simMultiplier = outputQuantity > 0 ? simTargetQty / outputQuantity : 1;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back button & Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('/bom')}
          className="p-2 bg-white border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a] hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {bomId ? 'Detail Resep & Komposisi' : 'Buat Resep & Komposisi Baru (BoM)'}
          </h1>
          <p className="text-xs text-slate-600">
            Tentukan takaran bahan untuk 1 batch standar produksi.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Informasi Resep & Produk Hasil */}
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 sm:p-6 space-y-4">
          <h2 className="font-extrabold text-sm sm:text-base text-slate-900 border-b-2 border-slate-900 pb-2">
            1. Informasi Resep & Produk Hasil
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Resep <span className="text-rose-600">*</span>
              </label>
              <input
                id="bom-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Resep Donat Coklat Standar"
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Produk Hasil <span className="text-rose-600">*</span>
              </label>
              <select
                id="bom-product-select"
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-semibold focus:bg-white focus:outline-hidden"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Satuan: {p.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Jumlah Output 1 Resep <span className="text-rose-600">*</span>
              </label>
              <div className="flex items-center">
                <input
                  id="bom-output-qty"
                  type="number"
                  min={1}
                  required
                  value={outputQuantity}
                  onChange={(e) => setOutputQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-l-lg text-sm font-bold focus:bg-white focus:outline-hidden"
                />
                <span className="px-3.5 py-2.5 bg-slate-200 border-2 border-l-0 border-slate-900 rounded-r-lg text-xs font-bold text-slate-700">
                  {outputUnit}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Satuan Output
              </label>
              <input
                type="text"
                value={outputUnit}
                onChange={(e) => setOutputUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-100 border-2 border-slate-900 rounded-lg text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Harga Jual Satuan (IDR)
              </label>
              <input
                id="bom-selling-price"
                type="number"
                min={0}
                step={500}
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-bold text-blue-700 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Daftar Komposisi Bahan Baku */}
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2">
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                2. Komposisi Bahan Baku (Material)
              </h2>
              <p className="text-xs text-slate-500">
                Kebutuhan bahan untuk menghasilkan tepat <strong>{outputQuantity} {outputUnit}</strong>.
              </p>
            </div>
            <button
              type="button"
              id="bom-add-row-btn"
              onClick={addMaterialRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a] rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              + Baris Bahan
            </button>
          </div>

          <div className="space-y-2.5">
            {materialRows.map((row, idx) => {
              const currentMat = materials.find((m) => m.id === row.material_id);
              const precision = currentMat?.quantity_precision ?? 2;
              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Pilih Bahan Baku #{idx + 1}
                    </label>
                    <select
                      value={row.material_id}
                      onChange={(e) => updateMaterialRow(idx, 'material_id', e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-semibold focus:outline-hidden"
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} (Tersedia: {m.current_stock} {m.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-48">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Kebutuhan 1 Resep ({currentMat?.unit || 'unit'})
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min={0.001}
                        step={precision > 0 ? Math.pow(10, -precision) : 1}
                        required
                        value={row.quantity}
                        onChange={(e) =>
                          updateMaterialRow(idx, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-l-lg text-xs font-bold text-slate-900 font-mono focus:outline-hidden"
                      />
                      <span className="px-2.5 py-2 bg-slate-200 border-2 border-l-0 border-slate-900 rounded-r-lg text-xs font-bold text-slate-700 whitespace-nowrap">
                        {currentMat?.unit || 'unit'}
                      </span>
                    </div>
                  </div>

                  <div className="sm:pt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeMaterialRow(idx)}
                      disabled={materialRows.length <= 1}
                      title="Hapus baris bahan"
                      className="p-2 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-400 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Live Fractional Production Simulation Preview */}
        <div className="bg-amber-50 border-2 border-amber-900 shadow-[4px_4px_0px_#78350f] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-900" />
            <h3 className="font-extrabold text-sm text-amber-950">
              Simulasi Produksi Pecahan (BoM Multiplier)
            </h3>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            Jika nantinya Anda hanya memproduksi separuh batch atau jumlah tertentu, sistem akan menghitung proporsi secara presisi:
          </p>

          <div className="flex items-center gap-3 flex-wrap text-xs bg-white border border-amber-900 rounded-lg p-3">
            <span className="font-bold text-slate-700">Coba Target Output:</span>
            <input
              type="number"
              min={1}
              value={simTargetQty}
              onChange={(e) => setSimTargetQty(parseInt(e.target.value) || 1)}
              className="w-20 px-2 py-1 border-2 border-slate-900 rounded font-bold font-mono text-center text-blue-700"
            />
            <span className="font-semibold text-slate-600">{outputUnit}</span>
            <span className="text-slate-400">|</span>
            <span className="font-bold text-slate-800">
              Multiplier: <span className="font-mono bg-amber-200 px-1.5 py-0.5 rounded border border-amber-800">{formatNumber(simMultiplier, 3)}x</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {materialRows.map((r, i) => {
              const mat = materials.find((m) => m.id === r.material_id);
              const calculated = Number((r.quantity * simMultiplier).toFixed(mat?.quantity_precision || 2));
              return (
                <div key={i} className="bg-white/80 border border-amber-300 rounded p-2 text-[11px]">
                  <p className="font-bold text-slate-800 truncate">{mat?.name || r.material_id}</p>
                  <p className="text-slate-600 font-mono mt-0.5">
                    {r.quantity} {mat?.unit} → <strong className="text-amber-950 font-black">{calculated} {mat?.unit}</strong>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/bom')}
            className="px-5 py-2.5 bg-white border-2 border-slate-900 font-bold text-xs rounded-lg hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            id="bom-save-btn"
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            Simpan Resep & Komposisi
          </button>
        </div>
      </form>
    </div>
  );
}
