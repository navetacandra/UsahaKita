import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, ProductionPreview } from '../types';
import { formatNumber } from '../utils/formatters';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import {
  Factory,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Edit3,
} from 'lucide-react';

interface ProductionCreatePageProps {
  onNavigate: (path: string) => void;
}

interface MaterialAdjustment {
  material_id: string;
  material_name: string;
  calculated_quantity: number;
  actual_quantity: number;
  unit: string;
  available_quantity: number;
  precision: number;
}

export function ProductionCreatePage({ onNavigate }: ProductionCreatePageProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Step 1: Product & Target Qty
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [targetOutputQty, setTargetOutputQty] = useState<number>(10);

  // Step 2 & 3: Preview & Adjustments
  const [previewData, setPreviewData] = useState<ProductionPreview | null>(null);
  const [materialsAdjustment, setMaterialsAdjustment] = useState<MaterialAdjustment[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Step 4: Actual Output Qty & Notes
  const [actualOutputQty, setActualOutputQty] = useState<number>(10);
  const [productionNote, setProductionNote] = useState<string>('');

  // Step 5: Submit Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const res = await api.products.list();
        if (res.success && Array.isArray(res.data)) {
          setProducts(res.data);
          if (res.data.length > 0) {
            setSelectedProductId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Trigger Step 2: Fetch Preview from API
  const handleProceedToStep2 = async () => {
    if (!selectedProductId || targetOutputQty <= 0) {
      showToast('error', 'Pilih produk dan masukkan target kuantitas yang valid.');
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await api.productions.preview(selectedProductId, targetOutputQty);
      if (res.success && res.data) {
        setPreviewData(res.data);
        // Initialize adjustments (defaults: if precision === 0, round ceiling or natural integer e.g., 3.5 -> 4 eggs)
        const adjustments: MaterialAdjustment[] = (res.data.materials || []).map((m) => {
          const precision = m.quantity_precision ?? 2;
          let initialActual = m.calculated_quantity;
          if (precision === 0 && !Number.isInteger(m.calculated_quantity)) {
            // e.g. eggs rounded up to whole eggs as in the plan example
            initialActual = Math.ceil(m.calculated_quantity);
          }
          return {
            material_id: m.material_id,
            material_name: m.material_name,
            calculated_quantity: m.calculated_quantity,
            actual_quantity: initialActual,
            unit: m.unit,
            available_quantity: m.available_quantity,
            precision,
          };
        });

        setMaterialsAdjustment(adjustments);
        setActualOutputQty(targetOutputQty);
        setCurrentStep(2);
      } else {
        showToast('error', res.error?.message || 'Gagal memuat resep untuk produk ini.');
      }
    } catch {
      showToast('error', 'Terjadi gangguan sistem saat kalkulasi resep.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleUpdateAdjustment = (index: number, val: number) => {
    setMaterialsAdjustment((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], actual_quantity: val };
      return copy;
    });
  };

  // Check if any material exceeds available stock
  const hasInsufficientStock = materialsAdjustment.some(
    (m) => m.actual_quantity > m.available_quantity
  );

  const handleProceedToSubmit = () => {
    if (hasInsufficientStock) {
      showToast('error', 'Tidak dapat memproses produksi: Bahan yang digunakan melebihi stok yang tersedia di gudang.');
      return;
    }
    if (actualOutputQty <= 0) {
      showToast('error', 'Hasil produksi aktual harus lebih dari 0.');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!previewData || !selectedProduct) return;
    setIsSubmitting(true);

    try {
      const res = await api.productions.create({
        product_id: selectedProduct.id,
        target_output_quantity: targetOutputQty,
        actual_output_quantity: actualOutputQty,
        bom_id: previewData.bom_id,
        materials: materialsAdjustment.map((m) => ({
          material_id: m.material_id,
          calculated_quantity: m.calculated_quantity,
          actual_quantity: m.actual_quantity,
        })),
        note: productionNote,
      });

      if (res.success) {
        showToast(
          'success',
          `Produksi ${actualOutputQty} ${selectedProduct.unit} ${selectedProduct.name} selesai! Stok produk telah bertambah.`
        );
        setIsConfirmOpen(false);
        onNavigate('/production');
      } else {
        showToast('error', res.error?.message || 'Gagal memproses produksi.');
      }
    } catch {
      showToast('error', 'Terjadi gangguan sistem saat memproses produksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Back */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('/production')}
          className="p-2 bg-white border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a] hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sesi Produksi Terukur (5 Langkah)
          </h1>
          <p className="text-xs text-slate-600">
            Kalkulasi kebutuhan bahan baku otomatis berdasarkan Resep (BoM) dengan penyesuaian riil.
          </p>
        </div>
      </div>

      {/* Step Progress Tracker */}
      <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl p-4">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center text-xs font-bold">
          {[
            { step: 1, label: 'Pilih Produk' },
            { step: 2, label: 'Kalkulasi BoM' },
            { step: 3, label: 'Penyesuaian' },
            { step: 4, label: 'Output Riil' },
            { step: 5, label: 'Selesai' },
          ].map((s) => (
            <div
              key={s.step}
              className={`p-2 rounded-lg border-2 transition-all ${
                currentStep === s.step
                  ? 'bg-blue-600 text-white border-slate-900 shadow-[2px_2px_0px_#0f172a]'
                  : currentStep > s.step
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-800'
                  : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
            >
              <span className="block text-[10px] font-black uppercase">Langkah {s.step}</span>
              <span className="truncate block mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Pilih Produk & Target Quantity */}
      {currentStep === 1 && (
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-6 space-y-5">
          <div className="border-b-2 border-slate-900 pb-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Langkah 1 dari 5</span>
            <h2 className="text-lg font-black text-slate-900">Pilih Produk & Rencana Target Produksi</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pilih barang yang ingin dibuat dan tentukan jumlah target yang ingin diproduksi pada sesi ini.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Produk yang Diproduksi <span className="text-rose-600">*</span>
              </label>
              <select
                id="prod-step1-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-semibold focus:bg-white focus:outline-hidden"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok saat ini: {p.current_stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Target Kuantitas Produksi <span className="text-rose-600">*</span>
              </label>
              <div className="flex items-center max-w-xs">
                <input
                  id="prod-step1-target-qty"
                  type="number"
                  min={1}
                  required
                  value={targetOutputQty}
                  onChange={(e) => setTargetOutputQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-l-lg text-lg font-black font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                />
                <span className="px-4 py-2.5 bg-slate-200 border-2 border-l-0 border-slate-900 rounded-r-lg text-xs font-bold text-slate-700 whitespace-nowrap">
                  {selectedProduct?.unit || 'pcs'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sistem akan membagi target ini dengan resep standar untuk menghitung proporsi bahan (BoM multiplier).
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                id="prod-step1-next-btn"
                type="button"
                onClick={handleProceedToStep2}
                disabled={previewLoading || products.length === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2"
              >
                {previewLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Lanjut ke Kalkulasi Resep</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Preview Kebutuhan Resep & Stok Check */}
      {currentStep === 2 && previewData && (
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-6 space-y-5">
          <div className="border-b-2 border-slate-900 pb-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Langkah 2 dari 5</span>
            <h2 className="text-lg font-black text-slate-900">Preview Kebutuhan Resep (Kalkulasi Otomatis)</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Sistem telah menghitung proporsi resep dan mengecek ketersediaan bahan baku di gudang.
            </p>
          </div>

          {/* Recipe multiplier summary badge */}
          <div className="bg-blue-50 border-2 border-blue-900 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[10px] font-bold text-blue-900 uppercase">Resep yang Digunakan:</span>
              <p className="font-black text-slate-900 text-sm sm:text-base">{previewData.bom_name}</p>
              <p className="text-xs text-slate-600">
                1 Resep Standar = {previewData.bom_output_quantity} {selectedProduct?.unit}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-blue-900 uppercase">BoM Multiplier:</span>
              <p className="font-mono font-black text-blue-700 text-lg">
                {formatNumber(previewData.bom_multiplier, 4)}x Resep
              </p>
            </div>
          </div>

          {/* Stock warnings if any */}
          {!previewData.stock_check.can_produce && (
            <div className="bg-rose-50 border-2 border-rose-900 rounded-xl p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                Peringatan: Stok Bahan Tidak Cukup
              </div>
              <ul className="list-disc list-inside space-y-1 text-rose-800">
                {(previewData.stock_check?.errors || []).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              <p className="text-rose-700 font-medium pt-1">
                Silakan kurangi target output atau lakukan pembelian stok masuk terlebih dahulu di menu Bahan Baku.
              </p>
            </div>
          )}

          {/* Table: Bahan Baku & Hasil Kalkulasi */}
          <div className="border-2 border-slate-900 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-900 font-black text-slate-900 uppercase">
                  <th className="py-2.5 px-3">Bahan Baku</th>
                  <th className="py-2.5 px-3 text-right">Hasil Kalkulasi Resep</th>
                  <th className="py-2.5 px-3 text-right">Stok Gudang</th>
                  <th className="py-2.5 px-3 text-center">Kesiapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(previewData.materials || []).map((m) => {
                  const isEnough = m.available_quantity >= m.calculated_quantity;
                  return (
                    <tr key={m.material_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{m.material_name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-blue-700">
                        {m.calculated_quantity} {m.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {m.available_quantity} {m.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                            isEnough
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-800'
                              : 'bg-rose-100 text-rose-900 border-rose-800'
                          }`}
                        >
                          {isEnough ? 'Cukup' : 'Kurang'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 border-2 border-slate-900 rounded-lg font-bold text-xs hover:bg-slate-100"
            >
              ← Kembali ke Langkah 1
            </button>
            <button
              id="prod-step2-next-btn"
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center gap-2"
            >
              <span>Lanjut ke Penyesuaian Riil</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Penyesuaian Aktual Bahan */}
      {currentStep === 3 && (
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-6 space-y-5">
          <div className="border-b-2 border-slate-900 pb-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Langkah 3 dari 5</span>
            <h2 className="text-lg font-black text-slate-900">Penyesuaian Aktual Bahan (Riil)</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Anda memegang kendali penuh. Ubah takaran aktual jika ada pembulatan butir telur atau penyesuaian porsi di dapur.
            </p>
          </div>

          <div className="bg-amber-50 border-2 border-amber-900 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Kaidah Sistem:</strong> Nilai kalkulasi resep tetap disimpan sebagai catatan pembanding. Kuantitas aktual yang Anda masukkan di sini yang akan memotong stok bahan secara riil.
            </div>
          </div>

          <div className="space-y-3">
            {materialsAdjustment.map((adj, idx) => {
              const stepVal = adj.precision > 0 ? Math.pow(10, -adj.precision) : 1;
              const isOverStock = adj.actual_quantity > adj.available_quantity;
              return (
                <div
                  key={adj.material_id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isOverStock
                      ? 'bg-rose-50 border-rose-900'
                      : 'bg-slate-50 border-slate-900'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{adj.material_name}</span>
                      <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-2">
                        <span>
                          Kalkulasi Teoretis: <strong className="font-mono text-slate-800">{adj.calculated_quantity} {adj.unit}</strong>
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>
                          Stok Tersedia: <strong className="font-mono text-slate-800">{adj.available_quantity} {adj.unit}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Aktual Terpakai:
                        </span>
                        <div className="flex items-center mt-1">
                          <input
                            id={`adj-input-${adj.material_id}`}
                            type="number"
                            min={0}
                            step={stepVal}
                            value={adj.actual_quantity}
                            onChange={(e) => handleUpdateAdjustment(idx, parseFloat(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-l-lg text-sm font-black font-mono text-blue-900 text-center focus:outline-hidden"
                          />
                          <span className="px-2.5 py-1.5 bg-slate-200 border-2 border-l-0 border-slate-900 rounded-r-lg text-xs font-bold text-slate-700">
                            {adj.unit}
                          </span>
                        </div>
                      </div>

                      {/* Display Example format: 3.5 -> 4 butir */}
                      {adj.actual_quantity !== adj.calculated_quantity && (
                        <div className="hidden sm:block text-right text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-800 px-2 py-1 rounded">
                          {adj.calculated_quantity} → {adj.actual_quantity} {adj.unit}
                        </div>
                      )}
                    </div>
                  </div>

                  {isOverStock && (
                    <p className="text-[11px] font-bold text-rose-700 mt-2">
                      ⚠️ Pemakaian aktual ({adj.actual_quantity} {adj.unit}) melebihi stok yang ada di gudang ({adj.available_quantity} {adj.unit})!
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 border-2 border-slate-900 rounded-lg font-bold text-xs hover:bg-slate-100"
            >
              ← Kembali ke Kalkulasi
            </button>
            <button
              id="prod-step3-next-btn"
              type="button"
              onClick={() => setCurrentStep(4)}
              disabled={hasInsufficientStock}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] disabled:opacity-50 flex items-center gap-2"
            >
              <span>Lanjut ke Hasil Produksi Riil</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Konfirmasi Hasil Produksi (Actual Output Qty) */}
      {currentStep === 4 && selectedProduct && (
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-6 space-y-5">
          <div className="border-b-2 border-slate-900 pb-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Langkah 4 dari 5</span>
            <h2 className="text-lg font-black text-slate-900">Konfirmasi Hasil Produksi Fisik</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Hasil jadi fisik riil terkadang berbeda dari target awal (misal ada adonan tersisa atau bantat).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Target Awal:</span>
              <p className="text-xl font-black font-mono text-slate-700">
                {targetOutputQty} {selectedProduct.unit}
              </p>
            </div>

            <div className="p-4 bg-blue-50 border-2 border-blue-900 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-blue-900 uppercase">Hasil Riil yang Berhasil Dibuat:</span>
              <div className="flex items-center mt-1">
                <input
                  id="prod-actual-output-qty"
                  type="number"
                  min={1}
                  required
                  value={actualOutputQty}
                  onChange={(e) => setActualOutputQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 bg-white border-2 border-blue-900 rounded-l-lg text-xl font-black font-mono text-blue-950 focus:outline-hidden"
                />
                <span className="px-3 py-1.5 bg-blue-200 border-2 border-l-0 border-blue-900 rounded-r-lg text-xs font-bold text-blue-950">
                  {selectedProduct.unit}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Catatan Sesi Produksi (Opsional)
            </label>
            <input
              id="prod-note-input"
              type="text"
              value={productionNote}
              onChange={(e) => setProductionNote(e.target.value)}
              placeholder="Contoh: Telur dibulatkan jadi 4 butir, adonan matang sempurna"
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 border-2 border-slate-900 rounded-lg font-bold text-xs hover:bg-slate-100"
            >
              ← Kembali ke Penyesuaian
            </button>
            <button
              id="prod-step4-submit-btn"
              type="button"
              onClick={handleProceedToSubmit}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesaikan & Simpan Produksi (Langkah 5)</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Step 5 Execution) */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Konfirmasi Penyelesaian Produksi"
        description="Aksi ini akan memotong stok bahan baku dan menambahkan stok produk siap jual ke inventaris sistem."
        isLoading={isSubmitting}
        summaryItems={[
          { label: 'Produk Dihasilkan', value: `${selectedProduct?.name}` },
          { label: 'Target Produksi', value: `${targetOutputQty} ${selectedProduct?.unit}` },
          { label: 'Hasil Jadi Riil', value: `${actualOutputQty} ${selectedProduct?.unit}`, highlight: true },
          {
            label: 'Total Bahan Baku Terpotong',
            value: `${materialsAdjustment.length} jenis bahan`,
          },
          { label: 'Catatan', value: productionNote || 'Sesuai resep BoM' },
        ]}
      />
    </div>
  );
}
