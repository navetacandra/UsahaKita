import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@usahakita.com');
  const [password, setPassword] = useState('StrongPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        onNavigate('/dashboard');
      } else {
        setError(res.message || 'Email atau kata sandi tidak sesuai.');
      }
    } catch {
      setError('Terjadi kendala saat menghubungkan ke sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-xl bg-blue-600 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] items-center justify-center text-white font-black text-2xl mb-1">
            U
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Masuk ke UsahaKita</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Sistem manajemen stok, resep, dan produksi untuk UMKM
          </p>
        </div>

        {/* Demo Hint Banner */}
        <div className="bg-blue-50 border-2 border-blue-900 rounded-lg p-3 text-xs text-blue-950 space-y-2">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Akun Demo Cloud:</p>
              <p className="text-slate-600 mt-0.5">
                Email: <span className="font-mono font-semibold text-slate-900">demo@usahakita.com</span>
              </p>
              <p className="text-slate-600">
                Password: <span className="font-mono font-semibold text-slate-900">StrongPassword123!</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('demo@usahakita.com');
              setPassword('StrongPassword123!');
            }}
            className="w-full py-1.5 px-2.5 bg-white hover:bg-blue-100 border border-blue-900 rounded font-semibold text-blue-900 text-xs transition-colors"
          >
            Gunakan Kredensial Demo Ini
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border-2 border-rose-900 rounded-lg text-xs font-semibold text-rose-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Alamat Email
            </label>
            <input
              id="login-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@usaha.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <input
              id="login-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            Belum memiliki tenant usaha?{' '}
            <button
              id="goto-register-btn"
              type="button"
              onClick={() => onNavigate('/register')}
              className="font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              Daftar usaha baru
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
