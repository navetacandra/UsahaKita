import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, ArrowRight } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await register(email, password, businessName, businessDesc);
      if (res.success) {
        onNavigate('/dashboard');
      } else {
        setError(res.message || 'Registrasi tidak berhasil, periksa data Anda.');
      }
    } catch {
      setError('Terjadi kendala saat registrasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-1.5">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-600 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] items-center justify-center text-white font-black text-xl mb-1">
            U
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daftarkan Usaha Anda</h1>
          <p className="text-xs text-slate-600 font-medium">
            Mulai kelola stok bahan, resep, dan kasir dengan mudah
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border-2 border-rose-900 rounded-lg text-xs font-semibold text-rose-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Usaha / Toko <span className="text-rose-600">*</span>
            </label>
            <input
              id="reg-business-name"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Contoh: Dapur Kue Bu Maya"
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Alamat Email Pemilik <span className="text-rose-600">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@usaha.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kata Sandi <span className="text-rose-600">*</span>
            </label>
            <input
              id="reg-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Deskripsi Usaha (Opsional)
            </label>
            <textarea
              id="reg-desc"
              rows={2}
              value={businessDesc}
              onChange={(e) => setBusinessDesc(e.target.value)}
              placeholder="Contoh: Produksi roti donat dan kue basah harian"
              className="w-full px-3.5 py-2 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            id="reg-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Buat Akun & Masuk</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            Sudah memiliki akun?{' '}
            <button
              id="goto-login-btn"
              type="button"
              onClick={() => onNavigate('/login')}
              className="font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
