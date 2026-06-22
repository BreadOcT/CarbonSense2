import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Lock, LogOut, ArrowLeft, Check, AlertCircle, Save, Key, Shield, Wind
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

export default function UserProfile() {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notice states
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userEmail = localStorage.getItem('cs_user_email');
    if (!userEmail) {
      navigate('/login');
      return;
    }
    setEmail(userEmail);

    const savedUser = localStorage.getItem('cs_user');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        setUsername(userObj.username || '');
      } catch (e) {
        setUsername(userEmail.split('@')[0]);
      }
    } else {
      setUsername(userEmail.split('@')[0]);
    }
  }, [navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!username.trim()) {
      setProfileError('Nama Lengkap / Username tidak boleh kosong.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.users.updateProfile({ email, username });
      
      // Save profile state locally
      localStorage.setItem('cs_user', JSON.stringify({ username: response.user.username, email: response.user.email }));

      setProfileSuccess('Profil Anda berhasil diperbarui!');
    } catch (err: any) {
      setProfileError(err.message || 'Gagal memperbarui profil di database.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess('');
    setPwError('');

    if (!newPassword || !confirmPassword) {
      setPwError('Harap lengkapi semua bidang.');
      return;
    }

    if (newPassword.length < 5) {
      setPwError('Password baru harus minimal 5 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setLoading(true);
    try {
      await api.users.updatePassword({ email, oldPassword, newPassword });
      setPwSuccess('Password berhasil diubah!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Gagal memperbarui password di database.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoading(true);
    setTimeout(() => {
      // Clear generic keys
      localStorage.removeItem('cs_user');
      localStorage.removeItem('cs_user_email');
      localStorage.removeItem('cs_user_token');
      localStorage.removeItem('cs_active_devices');
      localStorage.removeItem('cs_ai_personality');
      localStorage.removeItem('cs_onboarding_answers');
      localStorage.removeItem('cs_purchase_status');
      
      navigate('/login');
    }, 1000);
  };

  return (
    <div className="min-h-screen text-[var(--cs-text)] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden pt-24" style={{ background: 'var(--cs-bg)' }}>
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{ background: 'color-mix(in oklab, var(--cs-bg) 80%, transparent)', borderColor: 'var(--cs-border)' }}>
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-[var(--cs-text-dim)] group" title="Kembali ke Dashboard">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
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
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-zinc-800 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
            title="Keluar Sesi"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] rounded-full opacity-10 pointer-events-none" style={{ background: 'var(--cs-amber-glow)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] blur-[120px] rounded-full opacity-5 pointer-events-none" style={{ background: 'var(--cs-amber-glow)' }} />

      {/* Header Info */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full z-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-wide text-white uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Profil Pengguna</h1>
            <p className="text-xs text-[var(--cs-text-dim)] font-medium">Ubah pengaturan akun Anda, ganti password, atau keluar dari sesi sistem.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main profile section */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Form Edit Profile */}
            <form onSubmit={handleUpdateProfile} className="p-6 border rounded-3xl relative overflow-hidden" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5" style={{ color: 'var(--cs-amber)' }} />
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--cs-amber)' }}>Edit Informasi Profil</h3>
              </div>

              {profileSuccess && (
                <div className="mb-4 p-3 border text-[var(--cs-amber)] rounded-xl text-xs flex items-center gap-2" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'color-mix(in oklab, var(--cs-amber) 20%, var(--cs-border))' }}>
                  <Check className="w-4 h-4" /> {profileSuccess}
                </div>
              )}

              {profileError && (
                <div className="mb-4 p-3 border rounded-xl text-xs flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--cs-danger)', color: 'var(--cs-danger-text)' }}>
                  <AlertCircle className="w-4 h-4" /> {profileError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-2">Email Akun (Permanen)</label>
                  <div className="flex items-center gap-3 border px-4 py-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'var(--cs-border)' }}>
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-400">{email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-2">Nama Lengkap atau Username</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/40 border focus:border-[var(--cs-amber)] px-4 py-3 pl-11 rounded-xl text-sm font-bold text-white placeholder-zinc-700 focus:outline-none transition-all"
                      style={{ borderColor: 'var(--cs-border)' }}
                      placeholder="Ubah nama profil..."
                    />
                    <User className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 text-black font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-95"
                  style={{ background: 'var(--cs-amber)', boxShadow: '0 8px 24px -8px var(--cs-amber-glow)' }}
                >
                  <Save className="w-4 h-4" /> Simpan Perubahan Profil
                </button>
              </div>
            </form>

            {/* Logout Card */}
            <div className="p-6 border rounded-3xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-zinc-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Aksi Sesi Keamanan</h3>
              </div>
              <p className="text-xs text-[var(--cs-text-dim)] mb-6 leading-relaxed">
                Keluar dari sistem untuk menjaga keamanan akun Anda. Anda dapat kembali login kapan saja menggunakan email terdaftar.
              </p>

              <button 
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-3 bg-red-605/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 active:scale-95 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> {loading ? 'Mengeluarkan...' : 'Keluar dari Akun'}
              </button>
            </div>

          </div>

          {/* Right password section */}
          <div className="md:col-span-5">
            <form onSubmit={handleChangePassword} className="p-6 border rounded-3xl h-full flex flex-col justify-between" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Key className="w-5 h-5" style={{ color: 'var(--cs-amber)' }} />
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--cs-amber)' }}>Ubah Password</h3>
                </div>

                {pwSuccess && (
                  <div className="mb-4 p-3 border text-[var(--cs-amber)] rounded-xl text-xs flex items-center gap-2" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'color-mix(in oklab, var(--cs-amber) 20%, var(--cs-border))' }}>
                    <Check className="w-4 h-4" /> {pwSuccess}
                  </div>
                )}

                {pwError && (
                  <div className="mb-4 p-3 border rounded-xl text-xs flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--cs-danger)', color: 'var(--cs-danger-text)' }}>
                    <AlertCircle className="w-4 h-4" /> {pwError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-2">Password Lama (Opsional)</label>
                    <div className="relative">
                      <input 
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full bg-black/40 border focus:border-[var(--cs-amber)] px-4 py-3 pl-11 rounded-xl text-xs font-bold text-white placeholder-zinc-700 focus:outline-none transition-all"
                        style={{ borderColor: 'var(--cs-border)' }}
                        placeholder="Minta verifikasi lama..."
                      />
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-2">Password Baru</label>
                    <div className="relative">
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-black/40 border focus:border-[var(--cs-amber)] px-4 py-3 pl-11 rounded-xl text-xs font-bold text-white placeholder-zinc-700 focus:outline-none transition-all"
                        style={{ borderColor: 'var(--cs-border)' }}
                        placeholder="Minimal 5 karakter..."
                      />
                      <Key className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-2">Ulangi Password Baru</label>
                    <div className="relative">
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-black/40 border focus:border-[var(--cs-amber)] px-4 py-3 pl-11 rounded-xl text-xs font-bold text-white placeholder-zinc-700 focus:outline-none transition-all"
                        style={{ borderColor: 'var(--cs-border)' }}
                        placeholder="Ulangi kembali..."
                      />
                      <Check className="w-4 h-4 text-zinc-550 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full mt-6 py-3 text-black font-black text-xs rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:brightness-110"
                style={{ background: 'var(--cs-amber)', boxShadow: '0 8px 24px -8px var(--cs-amber-glow)' }}
              >
                Ganti Kata Sandi
              </button>
            </form>
          </div>

        </div>

        <div className="flex items-center justify-between mt-8 text-[10px] uppercase font-mono text-zinc-500">
          <span>Sesi Aktif Sejak {new Date().toLocaleDateString('id-ID')}</span>
          <span>Sistem Keamanan Terenkripsi</span>
        </div>
      </motion.div>
    </div>
  );
}
