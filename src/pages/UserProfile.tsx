import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Lock, LogOut, ArrowLeft, Check, AlertCircle, Save, Key, Shield, Phone
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

export default function UserProfile() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState<{ name: string; phone: string }[]>([]);

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

    const savedContacts =
      localStorage.getItem(`cs_emergency_contacts_${userEmail}`) ||
      localStorage.getItem('cs_emergency_contacts');
    if (savedContacts) {
      try {
        const parsed = JSON.parse(savedContacts);
        if (Array.isArray(parsed)) {
          setEmergencyContacts(parsed);
        }
      } catch (e) {
        console.error('Failed to parse emergency contacts:', e);
      }
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
      setPwError('Harap lengkapi semua kolom kata sandi.');
      return;
    }

    if (newPassword.length < 5) {
      setPwError('Kata sandi baru harus minimal 5 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    setLoading(true);
    try {
      await api.users.updatePassword({ email, oldPassword, newPassword });
      setPwSuccess('Kata sandi berhasil diubah!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Gagal memperbarui kata sandi di database.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.removeItem('cs_user');
      localStorage.removeItem('cs_user_email');
      localStorage.removeItem('cs_user_token');
      localStorage.removeItem('cs_active_devices');
      localStorage.removeItem('cs_ai_personality');
      localStorage.removeItem('cs_onboarding_answers');
      localStorage.removeItem('cs_purchase_status');
      navigate('/login');
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F0F9FF] text-[#0F172A] font-sans">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-[#475569] hover:text-[#0284C7] group"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
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
            <div className="flex flex-col leading-none text-left">
              <span className="text-base font-black tracking-tight text-[#0F172A]">CARBONSENSE</span>
              <span className="text-[10px] uppercase tracking-widest text-[#0284C7] font-mono font-bold">
                PROFIL PENGGUNA
              </span>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:border-[#0284C7] text-[#475569] hover:text-[#0284C7] transition-all font-semibold"
          >
            &lt;- Kembali ke Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl w-full"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-[#0F172A]">Pengaturan Akun &amp; Keamanan</h1>
            <p className="text-xs text-[#475569] mt-1">
              Kelola identitas akun Anda, ubah kata sandi, atau keluar dari sesi aktif.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="md:col-span-7 space-y-6">
              {/* Form Edit Profile */}
              <form
                onSubmit={handleUpdateProfile}
                className="p-6 bg-white border border-slate-200 rounded-3xl shadow-md"
              >
                <div className="flex items-center gap-2.5 mb-5">
                  <User className="w-5 h-5 text-[#0284C7]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0284C7]">
                    Informasi Profil
                  </h3>
                </div>

                {profileSuccess && (
                  <div className="mb-4 p-3 border border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A] rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" /> {profileSuccess}
                  </div>
                )}

                {profileError && (
                  <div className="mb-4 p-3 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {profileError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-[#475569] font-semibold uppercase mb-1.5">
                      Email Akun (Tetap)
                    </label>
                    <div className="flex items-center gap-3 border border-slate-200 bg-slate-100 px-4 py-3 rounded-xl">
                      <Mail className="w-4 h-4 text-[#475569]" />
                      <span className="text-sm font-mono text-[#475569]">{email}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#475569] font-semibold uppercase mb-1.5">
                      Nama Lengkap / Nama Usaha
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#F9FAFB] border border-slate-300 focus:border-[#0284C7] focus:bg-white px-4 py-3 pl-11 rounded-xl text-sm font-bold text-[#0F172A] focus:outline-none transition-all"
                        placeholder="Ubah nama profil..."
                      />
                      <User className="w-4 h-4 text-[#475569] absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-[#0284C7]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Save className="w-4 h-4" /> Simpan Perubahan Profil
                  </button>
                </div>
              </form>

              {/* Emergency Contacts Summary Card */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#16A34A]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#16A34A]">
                      Daftar Kontak Darurat WhatsApp
                    </h3>
                  </div>
                  <Link to="/settings" className="text-[11px] text-[#0284C7] font-bold hover:underline">
                    Ubah di Pengaturan -&gt;
                  </Link>
                </div>
                {emergencyContacts.length === 0 ? (
                  <p className="text-xs text-[#475569]">
                    Belum ada nomor WhatsApp darurat terdaftar.{' '}
                    <Link to="/settings" className="text-[#0284C7] font-bold underline">
                      Tambahkan sekarang
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="space-y-2">
                    {emergencyContacts.map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs"
                      >
                        <span className="font-bold text-[#0F172A]">{c.name || `Kontak #${idx + 1}`}</span>
                        <span className="font-mono text-[#16A34A] font-semibold">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Logout Card */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-md">
                <div className="flex items-center gap-2.5 mb-2">
                  <Shield className="w-4 h-4 text-[#475569]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                    Keluar Sesi Akun
                  </h3>
                </div>
                <p className="text-xs text-[#475569] mb-4 leading-relaxed">
                  Keluar dari akun Anda pada perangkat ini. Anda dapat masuk kembali kapan saja menggunakan email terdaftar.
                </p>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full py-3 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] active:scale-95 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> {loading ? 'Mengeluarkan...' : 'Keluar dari Akun'}
                </button>
              </div>
            </div>

            {/* Right Column: Password Change */}
            <div className="md:col-span-5">
              <form
                onSubmit={handleChangePassword}
                className="p-6 bg-white border border-slate-200 rounded-3xl shadow-md h-full flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <Key className="w-5 h-5 text-[#0284C7]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0284C7]">
                      Ubah Kata Sandi
                    </h3>
                  </div>

                  {pwSuccess && (
                    <div className="mb-4 p-3 border border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A] rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4" /> {pwSuccess}
                    </div>
                  )}

                  {pwError && (
                    <div className="mb-4 p-3 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> {pwError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] text-[#475569] font-semibold uppercase mb-1.5">
                        Kata Sandi Lama (Opsional)
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full bg-[#F9FAFB] border border-slate-300 focus:border-[#0284C7] focus:bg-white px-4 py-3 pl-11 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none transition-all"
                          placeholder="Masukkan sandi lama..."
                        />
                        <Lock className="w-4 h-4 text-[#475569] absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#475569] font-semibold uppercase mb-1.5">
                        Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-[#F9FAFB] border border-slate-300 focus:border-[#0284C7] focus:bg-white px-4 py-3 pl-11 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none transition-all"
                          placeholder="Minimal 5 karakter..."
                        />
                        <Key className="w-4 h-4 text-[#475569] absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#475569] font-semibold uppercase mb-1.5">
                        Ulangi Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#F9FAFB] border border-slate-300 focus:border-[#0284C7] focus:bg-white px-4 py-3 pl-11 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none transition-all"
                          placeholder="Ketik ulang sandi baru..."
                        />
                        <Check className="w-4 h-4 text-[#475569] absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs rounded-xl transition-all active:scale-95 shadow-md shadow-[#0284C7]/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Simpan Kata Sandi Baru
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="py-5 text-center text-xs text-[#475569] border-t border-slate-200 bg-white">
        CarbonSense — Sistem Pemantauan Keamanan Udara &amp; Gas
      </footer>
    </div>
  );
}
