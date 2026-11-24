import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.removeItem('cs_admin_token');
    localStorage.removeItem('cs_admin_email');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Harap lengkapi ID Admin dan kata sandi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.auth.adminLogin({ email, password });

      localStorage.setItem('cs_admin_token', response.token);
      localStorage.setItem('cs_admin_email', response.user.email);

      setLoading(false);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Akses ditolak. Silakan periksa kembali kredensial admin Anda.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F0F9FF] text-[#0F172A] font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-[#0284C7]/30 bg-[#E0F2FE] text-[#0284C7] shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-black tracking-tight text-sm sm:text-base text-[#0F172A] block leading-none truncate">
                CARBONSENSE ADMIN
              </span>
              <span className="hidden sm:block text-[10px] text-[#0284C7] font-mono uppercase tracking-widest font-bold">
                PORTAL MANAJEMEN PERANGKAT
              </span>
            </div>
          </Link>
          <Link
            to="/"
            className="text-xs px-3 sm:px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:border-[#0284C7] text-[#475569] hover:text-[#0284C7] transition-colors font-semibold flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
            <span className="sm:hidden">Beranda</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-2 sm:my-6">
        <div className="w-full max-w-md p-5 sm:p-8 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#0284C7]/30 bg-[#E0F2FE] text-[#0284C7]">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A]">Portal Administrator</h1>
            <p className="text-xs text-[#475569] mt-1">Sistem Manajemen Perangkat &amp; Pengguna CarbonSense</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                Admin ID / Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-slate-300 text-base sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors"
                placeholder="admin@carbonsense.id"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                Kata Sandi Admin
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-slate-300 text-base sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 mt-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-[#0284C7]/25 ${
                loading ? 'opacity-60' : 'active:scale-[0.99]'
              }`}
            >
              {loading ? 'Memproses...' : 'Masuk ke Dashboard Admin ->'}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-[#475569] border-t border-slate-200 bg-white">
        CarbonSense — Portal Administrasi Perangkat IoT
      </footer>
    </div>
  );
}
