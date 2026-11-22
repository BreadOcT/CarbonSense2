import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Database, Cpu, Check, ChevronRight, User, Plus, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

export default function SelectDevice() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [devices, setDevices] = useState<{ id: string; status: string }[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(() => {
    return localStorage.getItem('cs_simple_mode') === 'true';
  });

  // Manual bind modal state
  const [showBindModal, setShowBindModal] = useState(false);
  const [manualDeviceId, setManualDeviceId] = useState('');
  const [bindLoading, setBindLoading] = useState(false);
  const [bindError, setBindError] = useState('');

  const fetchUserDevices = async (userEmail: string) => {
    try {
      const myDevs = await api.devices.list(userEmail);
      const mapped = myDevs.map((d: any) => ({ id: d.id, status: d.status }));
      setDevices(mapped);
      setSelectedDevices(mapped.map((d: any) => d.id));
    } catch (e) {
      console.error('Error fetching user devices from MySQL:', e);
    }
  };

  useEffect(() => {
    const storedEmail = localStorage.getItem('cs_user_email');
    if (!storedEmail) {
      navigate('/login');
      return;
    }
    setEmail(storedEmail);

    const storedUser = localStorage.getItem('cs_user');
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        setUsername(userObj.username || '');
      } catch (e) {
        setUsername(storedEmail.split('@')[0]);
      }
    } else {
      setUsername(storedEmail.split('@')[0]);
    }

    const pendingDevice = localStorage.getItem('cs_pending_bind_device');

    if (pendingDevice) {
      api.devices.bind({ deviceId: pendingDevice, userEmail: storedEmail })
        .then(() => {
          localStorage.removeItem('cs_pending_bind_device');
          fetchUserDevices(storedEmail);
        })
        .catch(err => {
          console.error('Failed to auto-bind device from QR Code:', err);
          fetchUserDevices(storedEmail);
        });
    } else {
      fetchUserDevices(storedEmail);
    }
  }, [navigate]);

  const toggleSimpleMode = () => {
    const next = !isSimpleMode;
    setIsSimpleMode(next);
    localStorage.setItem('cs_simple_mode', next ? 'true' : 'false');
  };

  const toggleDevice = (id: string) => {
    setSelectedDevices(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleManualBind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDeviceId.trim()) return;
    setBindLoading(true);
    setBindError('');
    try {
      await api.devices.bind({ deviceId: manualDeviceId.trim().toUpperCase(), userEmail: email });
      await fetchUserDevices(email);
      setManualDeviceId('');
      setShowBindModal(false);
    } catch (err: any) {
      setBindError(err.message || 'Gagal menautkan perangkat. Pastikan ID perangkat sudah terdaftar oleh Admin.');
    } finally {
      setBindLoading(false);
    }
  };

  const handleContinue = () => {
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Harap isi Nama Lengkap terlebih dahulu agar sistem dapat mengenali profil Anda.');
      return;
    }

    if (selectedDevices.length === 0) {
      setErrorMsg('Harap pilih minimal 1 perangkat pemantau untuk dibuka di Dashboard.');
      return;
    }

    localStorage.setItem('cs_user', JSON.stringify({ username, email }));
    localStorage.setItem('cs_active_devices', JSON.stringify(selectedDevices));
    navigate('/dashboard');
  };

  const aiPersonality = (() => {
    try {
      const raw = localStorage.getItem('cs_ai_personality');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F0F9FF] text-[#0F172A] font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
              <span className="text-[10px] text-[#0284C7] font-mono tracking-widest uppercase font-bold">PILIH ALAT PEMANTAU</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleSimpleMode}
              className={`text-xs px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                isSimpleMode
                  ? 'border-[#0284C7] bg-[#E0F2FE] text-[#0284C7]'
                  : 'border-slate-300 bg-white text-[#475569] hover:border-[#0284C7]'
              }`}
              title="Ubah Mode Tampilan"
            >
              <span>Mode Sederhana:</span>
              <span className="font-extrabold">{isSimpleMode ? 'AKTIF' : 'NONAKTIF'}</span>
            </button>
            <Link
              to="/onboarding"
              className="hidden sm:inline-flex text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:border-[#0284C7] text-[#475569] hover:text-[#0284C7] transition-all font-semibold"
            >
              Atur Ulang Ruangan
            </Link>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('cs_user');
                localStorage.removeItem('cs_user_email');
                localStorage.removeItem('cs_user_token');
                localStorage.removeItem('cs_active_devices');
                localStorage.removeItem('cs_ai_personality');
                localStorage.removeItem('cs_onboarding_answers');
                localStorage.removeItem('cs_purchase_status');
                navigate('/login');
              }}
              className="text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:border-[#DC2626] text-[#475569] hover:text-[#DC2626] transition-all font-semibold cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full"
        >
          {errorMsg && (
            <div className="mb-5 p-4 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] text-xs font-semibold rounded-2xl">
              {errorMsg}
            </div>
          )}

          {isSimpleMode ? (
            /* ==================== SIMPLE MODE UI ==================== */
            <div>
              <div className="text-center mb-6">
                <span className="inline-block px-3.5 py-1 rounded-full bg-[#DCFCE7] border border-[#16A34A]/30 text-[#16A34A] text-xs font-bold mb-3">
                  Tampilan Mudah (Mode Sederhana)
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">Pilih Ruangan yang Dipantau</h1>
                <p className="text-sm text-[#475569] mt-2 leading-relaxed">
                  Halo <strong className="text-[#0F172A]">{username || 'Ibu/Bapak'}</strong>, sentuh ruangan yang ingin Anda lihat kondisi keamanannya, lalu tekan tombol biru di bawah.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg mb-6">
                {devices.length === 0 ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center mx-auto text-[#0284C7]">
                      <Home className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[#0F172A]">Belum Ada Alat Terhubung</h3>
                      <p className="text-xs text-[#475569] mt-1">
                        Akun <strong>{email}</strong> belum memiliki alat pemantau yang ditautkan.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => setShowBindModal(true)}
                        className="px-5 py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs transition-all cursor-pointer"
                      >
                        + Masukkan Kode Alat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('cs_purchase_status', 'pending');
                          alert('Permintaan pembelian perangkat telah dikirim ke Admin!');
                        }}
                        className="px-5 py-3 rounded-xl border border-slate-300 bg-[#F9FAFB] hover:bg-slate-100 text-[#0F172A] font-bold text-xs transition-all cursor-pointer"
                      >
                        Pesan Alat Baru
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {devices.map((dev, idx) => {
                      const isSelected = selectedDevices.includes(dev.id);
                      const isOffline = dev.status === 'Offline';
                      const roomLabel = idx === 0 && aiPersonality?.lokasi ? aiPersonality.lokasi : `Ruangan (${dev.id})`;
                      return (
                        <div
                          key={dev.id}
                          onClick={() => toggleDevice(dev.id)}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                            isSelected
                              ? 'border-[#0284C7] bg-[#F0F9FF] shadow-sm'
                              : 'border-slate-200 bg-[#F9FAFB] hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#0284C7] text-white' : 'bg-slate-200 text-[#475569]'
                              }`}
                            >
                              <Home className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-extrabold text-[#0F172A]">{roomLabel}</h3>
                              <p className="text-xs text-[#475569] mt-0.5 font-mono">Kode Alat: {dev.id}</p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    isOffline ? 'bg-[#DC2626]' : 'bg-[#16A34A]'
                                  }`}
                                />
                                <span
                                  className={`text-xs font-bold ${
                                    isOffline ? 'text-[#DC2626]' : 'text-[#16A34A]'
                                  }`}
                                >
                                  {isOffline ? 'Alat Sedang Mati / Terputus' : 'Alat Menyala & Siap Memantau'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-[#0284C7] bg-[#0284C7] text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {devices.length > 0 && (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full py-5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-base transition-all shadow-lg shadow-[#0284C7]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span>Mulai Pantau Ruangan Ini</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <div className="mt-4 text-center flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowBindModal(true)}
                  className="text-xs text-[#0284C7] font-bold hover:underline cursor-pointer"
                >
                  + Tambah Alat Baru
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={toggleSimpleMode}
                  className="text-xs text-[#475569] hover:text-[#0284C7] underline cursor-pointer"
                >
                  Ingin melihat daftar kode teknis alat? Klik di sini
                </button>
              </div>
            </div>
          ) : (
            /* ==================== DETAILED MODE UI ==================== */
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] border border-[#0284C7]/30 flex items-center justify-center mx-auto mb-3 text-[#0284C7]">
                  <Database className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-extrabold text-[#0F172A]">Pilih Alat Pemantau Aktif</h1>
                <p className="text-xs text-[#475569] mt-1">
                  Centang alat CarbonSense yang ingin Anda tampilkan di layar pemantauan utama.
                </p>
              </div>

              {/* User Greeting Card */}
              <div className="bg-white rounded-3xl p-5 mb-5 flex items-center justify-between border border-slate-200 shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] border border-[#0284C7]/30 flex items-center justify-center text-[#0284C7] font-extrabold text-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#475569]">Selamat Datang,</p>
                    <h2 className="text-base font-extrabold text-[#0F172A]">{username || 'Pengguna'}</h2>
                    <p className="text-[11px] text-[#475569] font-mono">{email}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-[#DCFCE7] border border-[#16A34A]/30 text-[#16A34A] text-[10px] font-mono font-bold uppercase tracking-wider">
                  Akun Aktif
                </span>
              </div>

              {/* Device List Card */}
              <div className="bg-white rounded-3xl p-6 mb-6 border border-slate-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#0284C7]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0284C7]">
                      Daftar Alat Terdaftar ({devices.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBindModal(true)}
                    className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tautkan Alat Baru
                  </button>
                </div>

                {devices.length === 0 ? (
                  <div className="py-6 text-center">
                    <Cpu className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-xs text-[#475569] mb-4">
                      Belum ada perangkat terdaftar atas email: <strong className="text-[#0284C7]">{email}</strong>
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowBindModal(true)}
                        className="px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl transition-colors text-xs cursor-pointer"
                      >
                        + Tautkan ID Perangkat
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2.5 bg-[#F9FAFB] hover:bg-slate-100 font-bold rounded-xl transition-colors text-xs border border-slate-300 text-[#0F172A] cursor-pointer"
                        onClick={() => {
                          localStorage.setItem('cs_purchase_status', 'pending');
                          alert('Permintaan pembelian perangkat dikirim ke Admin!');
                        }}
                      >
                        Minta Pembelian Perangkat Baru
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {devices.map(dev => {
                      const isSelected = selectedDevices.includes(dev.id);
                      const isOffline = dev.status === 'Offline';
                      return (
                        <div
                          key={dev.id}
                          onClick={() => toggleDevice(dev.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#F0F9FF] border-[#0284C7] shadow-sm'
                              : 'bg-[#F9FAFB] border-slate-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                isSelected ? 'border-[#0284C7] bg-[#0284C7] text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div>
                              <h4 className="font-bold font-mono text-sm text-[#0F172A]">{dev.id}</h4>
                              <p className="text-[11px] text-[#475569]">Status Alat: {dev.status}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isOffline ? 'bg-[#DC2626]' : 'bg-[#16A34A] animate-pulse'
                              }`}
                            />
                            <span
                              className={`text-[11px] font-bold ${
                                isOffline ? 'text-[#DC2626]' : 'text-[#16A34A]'
                              }`}
                            >
                              {isOffline ? 'Terputus' : 'Terhubung'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {devices.length > 0 && (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full py-4 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#0284C7]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span>Buka Dashboard Pemantauan</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Manual Bind Device Modal */}
      <AnimatePresence>
        {showBindModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-[#0F172A]">Tautkan Alat Baru</h3>
                <button
                  type="button"
                  onClick={() => setShowBindModal(false)}
                  className="text-[#475569] hover:text-[#0F172A] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[#475569] mb-4">
                Masukkan Kode ID Perangkat yang tertera pada stiker kotak alat CarbonSense Anda.
              </p>
              {bindError && (
                <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-medium">
                  {bindError}
                </div>
              )}
              <form onSubmit={handleManualBind} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Kode ID Perangkat</label>
                  <input
                    type="text"
                    required
                    value={manualDeviceId}
                    onChange={(e) => setManualDeviceId(e.target.value)}
                    placeholder="Contoh: CS-DAPUR-01"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F9FAFB] border border-slate-300 text-sm font-mono uppercase text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={bindLoading}
                  className="w-full py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {bindLoading ? 'Menautkan...' : 'Simpan & Tautkan Alat'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-5 text-center text-xs text-[#475569] border-t border-slate-200 bg-white">
        CarbonSense — Sistem Pemantauan Keamanan Udara &amp; Gas
      </footer>
    </div>
  );
}
