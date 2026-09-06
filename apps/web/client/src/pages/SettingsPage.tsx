import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Settings, Store, User, RotateCcw, LogOut, CheckCircle2, Shield } from 'lucide-react';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

interface SettingsPageProps {
  onNavigate: (path: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { user, business, logout } = useAuth();
  const { showToast } = useToast();

  const [businessName, setBusinessName] = useState(business?.name || 'Toko Maju');
  const [businessType, setBusinessType] = useState((business as any)?.business_type || 'F&B / Kuliner');
  const [saved, setSaved] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isDemoAccount = user?.email === 'owner@tokomaju.com';

  const handleSaveBusiness = (e: FormEvent) => {
    e.preventDefault();
    setSaved(true);
    showToast('success', 'Informasi bisnis berhasil diperbarui.');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      const res = await api.dev.resetData();
      if (res.success) {
        showToast('success', 'Data berhasil direset ke data awal demo.');
        setIsResetConfirmOpen(false);
        window.location.reload();
      } else {
        showToast('error', res.error?.message || 'Gagal mereset data.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan saat mereset data.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 border border-blue-900 rounded-md text-blue-800">
            <Settings className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pengaturan & Profil Usaha
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Kelola profil toko UMKM, preferensi tenant, dan manajemen sesi.
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Informasi Usaha */}
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-3">
            <Store className="w-4 h-4 text-slate-800" />
            <h2 className="font-black text-slate-900 text-sm sm:text-base">
              Identitas Toko / Usaha (Tenant)
            </h2>
          </div>

          <form onSubmit={handleSaveBusiness} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Nama Bisnis / Brand
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-semibold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Kategori UMKM
                </label>
                <input
                  type="text"
                  required
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-semibold focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5"
              >
                {saved ? <CheckCircle2 className="w-4 h-4" /> : null}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Profil Pengguna & Multi-Tenant Info */}
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-3">
            <User className="w-4 h-4 text-slate-800" />
            <h2 className="font-black text-slate-900 text-sm sm:text-base">
              Akun Pemilik & Akses
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Nama Pengguna</span>
              <p className="font-black text-slate-900 text-sm">{(user as any)?.name || user?.email.split('@')[0] || 'Pemilik Usaha'}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Email Terdaftar</span>
              <p className="font-black text-slate-900 text-sm">{user?.email}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Peran Akses</span>
              <p className="font-black text-blue-700 text-sm flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                {(user as any)?.role || 'OWNER'} (Hak Penuh)
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                logout();
                onNavigate('/login');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar dari Akun (Logout)
            </button>
          </div>
        </div>

        {/* Section 3: Zona Demo Data */}
        {isDemoAccount && (
          <div className="bg-rose-50 border-2 border-rose-900 shadow-[4px_4px_0px_#881337] rounded-xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-800" />
              <h2 className="font-black text-rose-950 text-sm sm:text-base">
                Reset Data Sampel Demo
              </h2>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed">
              Mereset seluruh data tenant ke kondisi awal pabrik (bahan baku, produk, resep, produksi, dan penjualan).
            </p>
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              disabled={isResetting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isResetting ? 'Meriset...' : 'Reset ke Data Awal Pabrik'}
            </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDemoData}
        title="Reset Seluruh Data Tenant?"
        description="Semua data (bahan baku, produk, resep, produksi, penjualan, dan insight) akan dihapus dan diganti dengan data awal demo."
        confirmText={isResetting ? 'Meriset...' : 'Ya, Reset Data Sekarang'}
        isDanger={true}
        isLoading={isResetting}
      />
    </div>
  );
}
