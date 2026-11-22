import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qrDevice = searchParams.get('device');

  const [deviceValid, setDeviceValid] = useState<boolean | null>(null);
  const [simpleMode, setSimpleMode] = useState<boolean>(() => {
    return localStorage.getItem('cs_simple_mode') === 'true';
  });

  useEffect(() => {
    const token = localStorage.getItem('cs_user_token');
    if (token) {
      if (qrDevice) {
        localStorage.setItem('cs_pending_bind_device', qrDevice);
      }
      navigate('/select-device');
      return;
    }

    if (qrDevice) {
      api.devices.list()
        .then((allDevs) => {
          const exists = allDevs.some((d: any) => d.id === qrDevice);
          if (exists) {
            setDeviceValid(true);
            localStorage.setItem('cs_pending_bind_device', qrDevice);
          } else {
            setDeviceValid(false);
            localStorage.removeItem('cs_pending_bind_device');
          }
        })
        .catch((err) => {
          console.error('Failed to verify QR device:', err);
          setDeviceValid(false);
        });
    } else {
      setDeviceValid(true);
    }
  }, [qrDevice, navigate]);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggleSimpleMode = (checked: boolean) => {
    setSimpleMode(checked);
    localStorage.setItem('cs_simple_mode', checked ? 'true' : 'false');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Harap lengkapi semua kolom pendaftaran.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid (contoh: nama@email.com).');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    setLoading(true);
    setError('');
    localStorage.setItem('cs_simple_mode', simpleMode ? 'true' : 'false');

    try {
      const response = await api.auth.register({ username, email, password });

      // Clear previous user session keys
      localStorage.removeItem('cs_user');
      localStorage.removeItem('cs_user_email');
      localStorage.removeItem('cs_user_token');
      localStorage.removeItem('cs_active_devices');
      localStorage.removeItem('cs_ai_personality');
      localStorage.removeItem('cs_onboarding_answers');
      localStorage.removeItem('cs_purchase_status');

      // Store in localStorage for frontend session consistency
      localStorage.setItem('cs_user', JSON.stringify({ username: response.user.username, email: response.user.email }));
      localStorage.setItem('cs_user_email', response.user.email);
      localStorage.setItem('cs_user_token', response.token);

      setLoading(false);
      navigate('/onboarding');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
    }
  };

  if (deviceValid === null || deviceValid === false) {
    return <div className="min-h-screen bg-[#F0F9FF]" />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F0F9FF] text-[#0F172A] font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md"
              style={{ background: 'linear-gradient(135deg, #0284C7, #0369A1)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="6" cy="12" r="2.5" fill="#FFFFFF" />
                <circle cx="18" cy="12" r="2.5" fill="#FFFFFF" />
                <circle cx="12" cy="12" r="3.2" fill="#FFFFFF" />
              </svg>
            </span>
            <div>
              <span className="font-black text-base tracking-tight block leading-none text-[#0F172A]">CARBONSENSE</span>
              <span className="text-[10px] text-[#0284C7] font-mono tracking-widest uppercase font-bold">PEMANTAU UDARA &amp; GAS</span>
            </div>
          </Link>
          <Link
            to="/login"
            className="text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:border-[#0284C7] text-[#475569] hover:text-[#0284C7] transition-all flex items-center gap-1.5 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Sudah Punya Akun? Masuk
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
          {qrDevice ? (
            <div className="mb-6 p-5 rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#0284C7]/30 bg-[#E0F2FE] text-[#0284C7]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#0284C7] font-mono font-bold">Mode Penautan Alat</span>
                <h3 className="text-lg font-extrabold text-[#0F172A] mt-1 font-mono">{qrDevice}</h3>
                <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
                  Buat akun baru untuk menautkan alat ini. Sudah punya akun?{' '}
                  <Link to={`/login?device=${qrDevice}`} className="text-[#0284C7] font-bold hover:underline">
                    Masuk di sini
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-[#DCFCE7] border border-[#16A34A]/30 text-[#16A34A] text-[10px] font-mono uppercase tracking-widest mb-3 font-bold">
                Pendaftaran Pelanggan Baru
              </span>
              <h1 className="text-2xl font-extrabold text-[#0F172A]">Buat Akun CarbonSense</h1>
              <p className="text-xs text-[#475569] mt-1">Satu akun untuk memantau keamanan udara rumah atau tempat usaha Anda.</p>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">Nama Lengkap / Nama Usaha</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Contoh: Ibu Sari / Warung Makan Berkah"
                className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-slate-300 text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">Alamat Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@email.com"
                className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-slate-300 text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">Kata Sandi (Minimal 6 Karakter)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#F9FAFB] border border-slate-300 text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#0F172A] cursor-pointer"
                  aria-label="Tampilkan kata sandi"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* UI Simple Mode Toggle */}
            <div className="p-4 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD]">
              <label htmlFor="reg-simple-mode-toggle" className="flex items-center justify-between cursor-pointer gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0F172A]">Mode Tampilan Sederhana</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#E0F2FE] text-[#0284C7] border border-[#0284C7]/30">
                      Mudah Dibaca
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] mt-1 leading-relaxed">
                    Nyalakan untuk tampilan ekstra simpel tanpa grafik dan angka rumit (cocok untuk ibu rumah tangga &amp; pemula).
                  </p>
                </div>
                <div className="relative inline-flex items-center shrink-0">
                  <input
                    type="checkbox"
                    id="reg-simple-mode-toggle"
                    checked={simpleMode}
                    onChange={(e) => handleToggleSimpleMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0284C7]"></div>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 mt-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#0284C7]/25 cursor-pointer ${
                loading ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.99]'
              }`}
            >
              {loading ? 'Mendaftarkan...' : 'Daftar & Lanjut Pengaturan Ruangan ->'}
            </button>
          </form>

          <p className="text-center text-xs text-[#475569] mt-6">
            Sudah punya akun?{' '}
            <Link
              to={qrDevice ? `/login?device=${qrDevice}` : '/login'}
              className="text-[#0284C7] font-bold hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-[#475569] border-t border-slate-200 bg-white">
        CarbonSense — Sistem Pemantauan Keamanan Udara &amp; Gas
      </footer>
    </div>
  );
}
