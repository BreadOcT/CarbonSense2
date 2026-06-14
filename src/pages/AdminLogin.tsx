import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      containerRef.current.style.setProperty('--mouse-x', `${x}px`);
      containerRef.current.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

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
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden pt-20"
      style={{
        background: 'var(--cs-bg)',
        backgroundImage: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), oklch(74% 0.16 65 / 0.15), transparent 40%)`
      }}
    >
      {/* Navigation Header */}
      <header className="absolute top-0 left-0 right-0 z-50 border-b" style={{ background: 'color-mix(in oklab, var(--cs-bg) 80%, transparent)', borderColor: 'var(--cs-border)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'var(--cs-amber)' }}>
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <span className="font-bold tracking-wide text-lg text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>CarbonSense Admin</span>
          </Link>
          <Link to="/" className="text-xs uppercase tracking-widest font-semibold text-[var(--cs-text-dim)] hover:text-[var(--cs-amber)] transition-colors border px-4 py-2 rounded-xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            Kembali ke Beranda
          </Link>
        </div>
      </header>
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="relative z-10 w-full max-w-md p-8 backdrop-blur-xl border rounded-[2rem] shadow-2xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--cs-danger)' }}>
            <ShieldAlert className="w-8 h-8" style={{ color: 'var(--cs-danger-text)' }} />
          </div>
          <h1 className="text-2xl font-bold text-white font-sans" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>Admin Portal</h1>
          <p className="text-sm text-[var(--cs-text-dim)] mt-2">Sistem Manajemen CarbonSense</p>
        </div>

        {error && (
          <div className="mb-6 p-4 border rounded-xl text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--cs-danger)', color: 'var(--cs-danger-text)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[var(--cs-text-dim)] uppercase tracking-wider mb-2">Admin ID</label>
            <input 
              type="text" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors text-white border" 
              style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'var(--cs-border)' }}
              placeholder="admin_xxx" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--cs-text-dim)] uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors text-white border" 
              style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'var(--cs-border)' }}
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 mt-4 text-[#0c0a08] font-bold rounded-xl transition-all cursor-pointer hover:brightness-110 active:scale-95 shadow-md ${loading ? 'opacity-50' : ''}`}
            style={{ background: 'var(--cs-amber)', boxShadow: '0 4px 15px -4px var(--cs-amber-glow)' }}
          >
            {loading ? 'Memproses...' : 'Akses Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
}
