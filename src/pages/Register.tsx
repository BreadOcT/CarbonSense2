import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Activity, ShieldCheck, Wind, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qrDevice = searchParams.get('device');

  const [deviceValid, setDeviceValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Auto-redirect if already logged in
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Harap lengkapi semua kolom input.');
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
    return <div className="min-h-screen" style={{ background: 'var(--cs-bg)' }} />;
  }

  return (
    <div className="min-h-screen flex text-[var(--cs-text)] font-sans relative pt-16 lg:pt-0" style={{ background: 'var(--cs-bg)' }}>
      {/* Back Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-50 group flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs uppercase tracking-widest font-bold transition-all border active:scale-95 shadow-lg" 
        style={{ 
          background: 'var(--cs-bg)', 
          borderColor: 'var(--cs-amber)', 
          color: 'var(--cs-amber)', 
          boxShadow: '0 0 15px -4px var(--cs-amber-glow)' 
        }}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Beranda
      </Link>

      {/* Left Visual */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center border-r" style={{ background: 'var(--cs-surface-2)', borderColor: 'var(--cs-border)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--cs-amber-glow)_0,transparent_70%)]" style={{ opacity: 0.25 }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--cs-border) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3 }} />
        
        <div className="relative z-10 p-12 max-w-lg">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-lg animate-pulse" style={{
              background: 'linear-gradient(140deg, var(--cs-amber), var(--cs-danger))',
              boxShadow: '0 0 18px -4px var(--cs-amber-glow)'
            }} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="6" cy="12" r="2.6" fill="#0c0a08" />
                <circle cx="18" cy="12" r="2.6" fill="#0c0a08" />
                <circle cx="12" cy="12" r="3.4" fill="#0c0a08" />
                <line x1="8.4" y1="11" x2="9.2" y2="11" stroke="#0c0a08" strokeWidth="1" />
                <line x1="8.4" y1="13" x2="9.2" y2="13" stroke="#0c0a08" strokeWidth="1" />
                <line x1="14.8" y1="11" x2="15.6" y2="11" stroke="#0c0a08" strokeWidth="1" />
                <line x1="14.8" y1="13" x2="15.6" y2="13" stroke="#0c0a08" strokeWidth="1" />
              </svg>
            </span>
            <span className="flex flex-col leading-none text-left">
              <span className="text-[20px] font-semibold tracking-wide text-[var(--cs-text)]" style={{
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.04em'
              }}>
                CARBONSENSE
              </span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--cs-amber)] font-mono">
                air integrity system
              </span>
            </span>
          </div>
          <h2 className="text-7xl sm:text-8xl lg:text-[90px] uppercase font-semibold tracking-tight mb-6 leading-[0.9]" style={{ fontFamily: 'var(--font-display)' }}>
            Mulai Monitor <br/><span style={{ color: 'var(--cs-amber)' }}>Udara Anda.</span>
          </h2>
          <p className="text-[var(--cs-text-dim)] text-lg leading-relaxed">
            Satu langkah lagi untuk melindungi keluarga Anda dari polusi udara dalam ruangan.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-2xl border" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'var(--cs-border)' }}>
              <ShieldCheck className="w-6 h-6 mb-2" style={{ color: 'var(--cs-amber)' }} />
              <p className="text-sm font-medium">Privasi Terjamin</p>
            </div>
            <div className="p-4 rounded-2xl border" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'var(--cs-border)' }}>
              <Wind className="w-6 h-6 mb-2" style={{ color: 'var(--cs-amber)' }} />
              <p className="text-sm font-medium">Monitoring Akurat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 pt-24 lg:pt-8" style={{ background: 'var(--cs-bg)' }}>
        <div className="w-full max-w-md">
          <div className="mb-8 flex lg:hidden items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg" style={{
              background: 'linear-gradient(140deg, var(--cs-amber), var(--cs-danger))',
              boxShadow: '0 0 18px -4px var(--cs-amber-glow)'
            }} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="6" cy="12" r="2.6" fill="#0c0a08" />
                <circle cx="18" cy="12" r="2.6" fill="#0c0a08" />
                <circle cx="12" cy="12" r="3.4" fill="#0c0a08" />
                <line x1="8.4" y1="11" x2="9.2" y2="11" stroke="#0c0a08" strokeWidth="1" />
                <line x1="8.4" y1="13" x2="9.2" y2="13" stroke="#0c0a08" strokeWidth="1" />
                <line x1="14.8" y1="11" x2="15.6" y2="11" stroke="#0c0a08" strokeWidth="1" />
                <line x1="14.8" y1="13" x2="15.6" y2="13" stroke="#0c0a08" strokeWidth="1" />
              </svg>
            </span>
            <span className="flex flex-col leading-none text-left">
              <span className="text-[19px] font-semibold tracking-wide text-[var(--cs-text)]" style={{
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.04em'
              }}>
                CARBONSENSE
              </span>
              <span className="text-[9px] uppercase tracking-[0.28em] text-[var(--cs-amber)] font-mono">
                air integrity system
              </span>
            </span>
          </div>

          {qrDevice ? (
            <div className="mb-8 p-5 rounded-2xl border flex flex-col items-center gap-3 relative overflow-hidden" style={{ background: 'rgba(245, 158, 11, 0.03)', borderColor: 'var(--cs-amber)' }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle_at_center,var(--cs-amber-glow)_0,transparent_70%)] opacity-30 pointer-events-none" />
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-amber-500/10" style={{ borderColor: 'var(--cs-amber)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 animate-pulse">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <div className="text-center">
                <span className="text-xs uppercase tracking-widest text-[var(--cs-amber)] font-mono font-bold">Mode Penautan Alat</span>
                <h3 className="text-xl font-bold text-white mt-1 font-mono">{qrDevice}</h3>
                <p className="text-xs text-[var(--cs-text-dim)] mt-2">
                  Silakan buat akun baru untuk menyelesaikan penautan alat. Sudah punya akun? <Link to={`/login?device=${qrDevice}`} className="text-amber-400 hover:underline">Masuk di sini</Link>.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-10">
              <h2 className="text-3xl font-bold tracking-tight mb-2">Buat Akun Baru</h2>
              <p className="text-[var(--cs-text-dim)]">Lengkapi data diri Anda untuk memulai.</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 border border-red-500 rounded-xl text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--cs-danger)', color: 'var(--cs-danger-text)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-[var(--cs-text-dim)] mb-2">Nama Lengkap</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors" 
                style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}
                placeholder="Nama Lengkap" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--cs-text-dim)] mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors" 
                style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}
                placeholder="nama@email.com" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--cs-text-dim)] mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 border rounded-xl focus:outline-none transition-colors" 
                  style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--cs-text-dim)] hover:text-[var(--cs-text)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 text-[#0c0a08] font-bold rounded-xl transition-all shadow-lg cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:scale-95'}`}
              style={{ background: 'var(--cs-amber)', boxShadow: '0 8px 24px -8px var(--cs-amber-glow)' }}
            >
              {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
            </button>

            <p className="text-center text-sm text-[var(--cs-text-dim)] mt-6 font-sans">
              Sudah punya akun? <Link to={qrDevice ? `/login?device=${qrDevice}` : '/login'} className="hover:underline font-medium" style={{ color: 'var(--cs-amber)' }}>Masuk di sini</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
