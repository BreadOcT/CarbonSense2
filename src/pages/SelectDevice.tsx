import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Database, Cpu, Check, ChevronRight, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

export default function SelectDevice() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [devices, setDevices] = useState<{id: string, status: string}[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

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

    // Fetch user devices from backend MySQL
    const fetchUserDevices = async () => {
      try {
        const myDevs = await api.devices.list(storedEmail);
        setDevices(myDevs.map((d: any) => ({ id: d.id, status: d.status })));
        
        // Auto-select all by default to let them have active monitors
        setSelectedDevices(myDevs.map((d: any) => d.id));
      } catch (e) {
        console.error('Error fetching user devices from MySQL:', e);
      }
    };

    fetchUserDevices();
  }, [navigate]);

  const toggleDevice = (id: string) => {
    setSelectedDevices(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Harap isi Nama Lengkap / Username terlebih dahulu agar Admin dapat mendaftarkan perangkat Anda dengan mudah.');
      return;
    }

    if (selectedDevices.length === 0) {
      setErrorMsg('Harap pilih minimal 1 perangkat monitor untuk dibuka di Dashboard.');
      return;
    }

    // Save user profile state
    localStorage.setItem('cs_user', JSON.stringify({ username, email }));
    localStorage.setItem('cs_active_devices', JSON.stringify(selectedDevices));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen text-[var(--cs-text)] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden pt-20" style={{ background: 'var(--cs-bg)' }}>
      {/* Navigation Header */}
      <header className="absolute top-0 left-0 right-0 z-50 border-b" style={{ background: 'color-mix(in oklab, var(--cs-bg) 80%, transparent)', borderColor: 'var(--cs-border)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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
          <div className="flex items-center gap-3">
            <Link to="/onboarding" className="text-xs uppercase tracking-widest font-semibold text-[var(--cs-text-dim)] hover:text-[var(--cs-amber)] transition-colors border px-4 py-2 rounded-xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
              Ulangi Onboarding
            </Link>
            <button 
              onClick={() => {
                localStorage.removeItem('cs_user_email');
                navigate('/login');
              }} 
              className="text-xs uppercase tracking-widest font-semibold text-[var(--cs-text-dim)] hover:text-red-400 transition-colors border px-4 py-2 rounded-xl cursor-pointer" 
              style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
            >
              Keluar Sesi
            </button>
          </div>
        </div>
      </header>
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] blur-[120px] rounded-full opacity-15" style={{ background: 'var(--cs-amber-glow)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] blur-[100px] rounded-full opacity-15" style={{ background: 'var(--cs-amber-glow)' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 border rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'var(--cs-amber)' }}>
            <Database className="w-8 h-8" style={{ color: 'var(--cs-amber)' }} />
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl uppercase font-semibold tracking-tight mb-3 leading-none" style={{ fontFamily: 'var(--font-display)' }}>Pilih Perangkat Monitor</h1>
          <p className="text-[var(--cs-text-dim)] text-sm">
            Tentukan perangkat CarbonSense aktif yang ingin Anda pantau di monitor saat ini.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 border text-xs leading-relaxed rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--cs-danger)', color: 'var(--cs-danger-text)' }}>
            {errorMsg}
          </div>
        )}

        {/* Welcome Greeting Card */}
        <div className="p-6 border rounded-3xl mb-6 flex items-center justify-between shadow-xl" style={{ background: 'linear-gradient(to right, rgba(25, 25, 25, 0.6), rgba(15, 15, 15, 0.4))', borderColor: 'var(--cs-border)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'color-mix(in oklab, var(--cs-amber) 20%, var(--cs-border))' }}>
              <User className="w-6 h-6" style={{ color: 'var(--cs-amber)' }} />
            </div>
            <div>
              <p className="text-xs text-[var(--cs-text-dim)] font-medium">Selamat Datang Kembali,</p>
              <h2 className="text-xl font-bold text-white tracking-tight">{username || 'User'}</h2>
              <p className="text-[10px] text-[var(--cs-text-dim)] font-mono mt-0.5">{email}</p>
            </div>
          </div>
          <div className="px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-lg border" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'color-mix(in oklab, var(--cs-amber) 20%, var(--cs-border))', color: 'var(--cs-amber)' }}>
            TERDAFTAR
          </div>
        </div>

        {/* Devices list block */}
        <div className="p-6 border rounded-3xl mb-8" style={{ background: 'rgba(25, 25, 25, 0.4)', borderColor: 'var(--cs-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5" style={{ color: 'var(--cs-amber)' }} />
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--cs-amber)' }}>Perangkat Milik Anda</h2>
            </div>
            <span className="text-[10px] font-mono text-[var(--cs-text-dim)]">MAX: {devices.length} TERDAFTAR</span>
          </div>

          {devices.length === 0 ? (
            <div className="py-6 text-center">
              <Cpu className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-[var(--cs-text-dim)] mb-4">Belum ada perangkat terdaftar atas email: <strong style={{ color: 'var(--cs-amber)' }}>{email}</strong></p>
              <button 
                type="button"
                className="px-5 py-2 hover:bg-zinc-700 font-bold rounded-lg transition-colors text-xs border text-[var(--cs-text)] cursor-pointer"
                style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
                onClick={() => {
                  localStorage.setItem('cs_purchase_status', 'pending');
                  alert("Permintaan pembelian perangkat dikirim ke Admin!");
                }}
              >
                Minta Pembelian Perangkat Baru
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              <p className="text-xs text-[var(--cs-text-dim)] mb-2">Pilih perangkat yang ingin Anda tampilkan sebagai monitor di Dashboard:</p>
              {devices.map(dev => {
                const isSelected = selectedDevices.includes(dev.id);
                return (
                  <div 
                    key={dev.id}
                    onClick={() => toggleDevice(dev.id)}
                    className="p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between"
                    style={{
                      background: isSelected ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface))' : 'rgba(0, 0, 0, 0.6)',
                      borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                      boxShadow: isSelected ? '0 0 15px rgba(251, 191, 36, 0.05)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-5 h-5 rounded flex items-center justify-center border transition-colors"
                        style={{
                          borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                          background: isSelected ? 'var(--cs-amber)' : 'transparent',
                        }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                      </div>
                      <div>
                        <h4 className="font-bold font-mono text-sm" style={{ color: 'var(--cs-amber)' }}>{dev.id}</h4>
                        <p className="text-[10px] text-[var(--cs-text-dim)]">Status Alat: {dev.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--cs-amber)' }} />
                      <span className="text-[10px] text-[var(--cs-text-dim)] font-bold">Terhubung</span>
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
            className="w-full py-4 text-black font-black rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-95"
            style={{ background: 'var(--cs-amber)', boxShadow: '0 8px 24px -8px var(--cs-amber-glow)' }}
          >
            Masuk ke Monitor Dashboard <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
