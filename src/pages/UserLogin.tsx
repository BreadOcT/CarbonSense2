import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ShieldCheck, Wind, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';

export default function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.auth.login({ email, password });
      
      // Store user details in localStorage
      localStorage.setItem('cs_user', JSON.stringify({ username: response.user.username, email: response.user.email }));
      localStorage.setItem('cs_user_email', response.user.email);
      localStorage.setItem('cs_user_token', response.token);

      // Restore user-specific onboarding keys to generic keys
      const emailVal = response.user.email;
      const userPersonality = localStorage.getItem(`cs_ai_personality_${emailVal}`);
      const userAnswers = localStorage.getItem(`cs_onboarding_answers_${emailVal}`);
      const hasOnboarded = localStorage.getItem(`cs_onboarding_completed_${emailVal}`) === 'true';

      if (userPersonality) {
        localStorage.setItem('cs_ai_personality', userPersonality);
      } else {
        localStorage.removeItem('cs_ai_personality');
      }

      if (userAnswers) {
        localStorage.setItem('cs_onboarding_answers', userAnswers);
      } else {
        localStorage.removeItem('cs_onboarding_answers');
      }

      setLoading(false);
      
      if (hasOnboarded) {
        navigate('/select-device');
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    }
  };

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
            Selamat <br/><span style={{ color: 'var(--cs-amber)' }}>Datang Kembali.</span>
          </h2>
          <p className="text-[var(--cs-text-dim)] text-lg leading-relaxed">
            Monitor kualitas udara rumah Anda secara real-time dan lindungi keluarga dari paparan polutan berbahaya.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-2xl border" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'var(--cs-border)' }}>
              <ShieldCheck className="w-6 h-6 mb-2" style={{ color: 'var(--cs-amber)' }} />
              <p className="text-sm font-medium">Monitoring 24/7</p>
            </div>
            <div className="p-4 rounded-2xl border" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'var(--cs-border)' }}>
              <Wind className="w-6 h-6 mb-2" style={{ color: 'var(--cs-amber)' }} />
              <p className="text-sm font-medium">Analisis Pintar</p>
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

          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Masuk ke Akun</h2>
            <p className="text-[var(--cs-text-dim)]">Gunakan email dan password Anda untuk mengakses dashboard.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 border rounded-xl text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--cs-danger)', color: 'var(--cs-danger-text)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--cs-text-dim)] mb-2">Email</label>
              <input 
                type="email" 
                required 
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
                  required 
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
              {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
            </button>

            <p className="text-center text-sm text-[var(--cs-text-dim)] mt-8">
              Belum punya akun? <Link to="/register" className="hover:underline font-medium" style={{ color: 'var(--cs-amber)' }}>Daftar sekarang</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
