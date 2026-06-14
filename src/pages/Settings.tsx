import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, LogOut, Wind, Brain, Sparkles, Bed, Laptop, Home, User, Users,
  Heart, Minimize2, Maximize2, Shield, Flame, Activity, ShieldCheck, ShieldAlert,
  HelpCircle, UserX, Cigarette, Car, Lock, RotateCw, ExternalLink, ShieldOff
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({
    lokasi: '',
    sirkulasi: '',
    kapasitas: '',
    polutan: [] as string[],
    rentan: '',
    luas_ruang: '',
    detektor_lain: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().profile) {
          const profileData = userDoc.data().profile;
          setAnswers(prev => ({
            ...prev,
            ...profileData,
            polutan: Array.isArray(profileData.polutan) ? profileData.polutan : (profileData.polutan ? [profileData.polutan] : [])
          }));
        }
      } else {
        const stored = localStorage.getItem('cs_ai_personality');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
              setAnswers(prev => ({
                ...prev,
                ...parsed,
                polutan: Array.isArray(parsed.polutan) ? parsed.polutan : (parsed.polutan ? [parsed.polutan] : [])
              }));
            }
          } catch (e) {
            console.error('Failed to parse stored configuration:', e);
          }
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handlePolutanChange = (val: string) => {
    setAnswers(prev => ({
      ...prev,
      polutan: prev.polutan.includes(val) 
        ? prev.polutan.filter(p => p !== val)
        : [...prev.polutan, val]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        profile: answers
      });
    }
    localStorage.setItem('cs_ai_personality', JSON.stringify(answers));
    setSaved(true);
  };

  const isHighRisk = answers.rentan !== 'Tidak Ada' && answers.rentan !== 'Tidak ada' && answers.rentan !== '' || 
                     answers.sirkulasi.includes('Tertutup') || 
                     answers.polutan.includes('Kompor Gas') || 
                     answers.polutan.includes('Aktivitas Merokok') || 
                     answers.polutan.includes('Kompor gas / Peralatan masak') ||
                     answers.polutan.includes('Aktivitas merokok / Vape');

  // Option Helper mappings for premium display
  const lokasiOptions = [
    { name: 'Kamar Tidur', icon: Bed },
    { name: 'Ruang Keluarga', icon: Home },
    { name: 'Dapur / Ruang Makan', icon: Flame },
    { name: 'Ruang Kerja', icon: Laptop },
    { name: 'Lainnya', icon: HelpCircle }
  ];

  const sirkulasiOptions = [
    { name: 'Tertutup ber-AC', desc: 'Jendela jarang dibuka', icon: Lock },
    { name: 'Jendela rutin dibuka', desc: 'Sirkulasi udara alami', icon: Wind },
    { name: 'Ada Exhaust Fan', desc: 'Penyedot udara aktif', icon: RotateCw },
    { name: 'Ruangan semi-terbuka', desc: 'Aliran udara bebas', icon: ExternalLink }
  ];

  const kapasitasOptions = [
    { name: '1-2 Orang', icon: User },
    { name: '3-4 Orang', icon: Users },
    { name: '5+ Orang', icon: Users },
    { name: 'Jarang ditempati', icon: UserX }
  ];

  const polutanOptions = [
    { name: 'Kompor Gas', icon: Flame },
    { name: 'Aktivitas Merokok', icon: Cigarette },
    { name: 'Asap Kendaraan', icon: Car },
    { name: 'Tidak Ada', icon: ShieldCheck }
  ];

  const rentanOptions = [
    { name: 'Bayi / Balita', icon: Heart },
    { name: 'Lansia / Penderita Asma', icon: Activity },
    { name: 'Tidak Ada', icon: Shield }
  ];

  const luasOptions = [
    { name: 'Kecil (< 10 m²)', icon: Minimize2 },
    { name: 'Sedang (10 - 25 m²)', icon: Maximize2 },
    { name: 'Besar (> 25 m²)', icon: Activity }
  ];

  const detektorOptions = [
    { name: 'Ada & Berfungsi Aktif', icon: ShieldCheck },
    { name: 'Ada tapi tidak aktif', icon: ShieldAlert },
    { name: 'Tidak Ada', icon: ShieldOff }
  ];

  if (loading) {
    return (
      <div className="min-h-screen text-[var(--cs-text)] font-sans flex items-center justify-center" style={{ background: 'var(--cs-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <Brain className="w-12 h-12 text-[var(--cs-amber)] animate-pulse" />
          <span className="text-sm font-mono text-[var(--cs-text-dim)] uppercase tracking-widest">Memuat Profil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--cs-text)] font-sans pt-24 pb-12 px-6 relative" style={{ background: 'var(--cs-bg)' }}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] right-[10%] w-[350px] h-[350px] blur-[120px] rounded-full opacity-10" style={{ background: 'var(--cs-amber-glow)' }} />
      </div>

      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{ background: 'color-mix(in oklab, var(--cs-bg) 80%, transparent)', borderColor: 'var(--cs-border)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
            onClick={() => {
              localStorage.removeItem('cs_user_email');
              navigate('/login');
            }}
            className="p-2 hover:bg-zinc-800 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
            title="Keluar Sesi"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Pengaturan AI Assistant</h1>
          <p className="text-sm text-[var(--cs-text-dim)]">Sesuaikan profil ruangan & parameter lingkungan untuk analitik AI Assistant CarbonSense.</p>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Premium Cards */}
          <div className="lg:col-span-8 space-y-8">

            {/* Q1: Lokasi */}
            <div className="p-6 border rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--cs-amber)' }}>1. Lokasi Penempatan Ruangan</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {lokasiOptions.map(opt => {
                  const isSelected = answers.lokasi === opt.name;
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => setAnswers({ ...answers, lokasi: opt.name })}
                      className="p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group"
                      style={{
                        background: isSelected ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface-2))' : 'rgba(0,0,0,0.2)',
                        borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                        color: isSelected ? 'var(--cs-amber)' : 'var(--cs-text-dim)',
                        boxShadow: isSelected ? '0 0 14px -4px var(--cs-amber-glow)' : 'none'
                      }}
                    >
                      <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q2: Sirkulasi */}
            <div className="p-6 border rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--cs-amber)' }}>2. Sirkulasi & Ventilasi Udara</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sirkulasiOptions.map(opt => {
                  const isSelected = answers.sirkulasi.startsWith(opt.name) || answers.sirkulasi === opt.name;
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => setAnswers({ ...answers, sirkulasi: opt.name })}
                      className="p-4 rounded-2xl border text-left transition-all flex items-center gap-4 cursor-pointer group"
                      style={{
                        background: isSelected ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface-2))' : 'rgba(0,0,0,0.2)',
                        borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                        color: isSelected ? 'var(--cs-amber)' : 'var(--cs-text-dim)',
                        boxShadow: isSelected ? '0 0 14px -4px var(--cs-amber-glow)' : 'none'
                      }}
                    >
                      <Icon className="w-7 h-7 flex-shrink-0 transition-transform group-hover:rotate-12" />
                      <div>
                        <div className="text-xs font-bold text-white">{opt.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{opt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q3: Kapasitas */}
            <div className="p-6 border rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--cs-amber)' }}>3. Kapasitas Hunian (Occupancy)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {kapasitasOptions.map(opt => {
                  const isSelected = answers.kapasitas === opt.name;
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => setAnswers({ ...answers, kapasitas: opt.name })}
                      className="p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer group"
                      style={{
                        background: isSelected ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface-2))' : 'rgba(0,0,0,0.2)',
                        borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                        color: isSelected ? 'var(--cs-amber)' : 'var(--cs-text-dim)',
                        boxShadow: isSelected ? '0 0 14px -4px var(--cs-amber-glow)' : 'none'
                      }}
                    >
                      <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q4: Luas Ruangan */}
            <div className="p-6 border rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--cs-amber)' }}>4. Estimasi Ukuran Luas Ruangan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {luasOptions.map(opt => {
                  const isSelected = answers.luas_ruang === opt.name;
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => setAnswers({ ...answers, luas_ruang: opt.name })}
                      className="p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer group"
                      style={{
                        background: isSelected ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface-2))' : 'rgba(0,0,0,0.2)',
                        borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                        color: isSelected ? 'var(--cs-amber)' : 'var(--cs-text-dim)',
                        boxShadow: isSelected ? '0 0 14px -4px var(--cs-amber-glow)' : 'none'
                      }}
                    >
                      <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q5: Polutan */}
            <div className="p-6 border rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--cs-amber)' }}>5. Potensi Polutan Terdekat (Bisa Pilih Beberapa)</h3>
              <p className="text-[10px] text-zinc-500 mb-4">Pilihlah sumber emisi karbon/gas yang berada dekat dengan sensor Anda.</p>
              <div className="grid grid-cols-2 gap-3">
                {polutanOptions.map(opt => {
                  // Compatibility check for singular/plural options
                  const isSelected = answers.polutan.includes(opt.name) || 
                                     (opt.name === 'Kompor Gas' && (answers.polutan.includes('Kompor Gas') || answers.polutan.includes('Kompor gas / Peralatan masak'))) ||
                                     (opt.name === 'Aktivitas Merokok' && (answers.polutan.includes('Aktivitas Merokok') || answers.polutan.includes('Aktivitas merokok / Vape'))) ||
                                     (opt.name === 'Asap Kendaraan' && (answers.polutan.includes('Asap Kendaraan') || answers.polutan.includes('Asap kendaraan (Dekat garasi / pinggir jalan raya)'))) ||
                                     (opt.name === 'Tidak Ada' && (answers.polutan.includes('Tidak Ada') || answers.polutan.includes('Tidak ada sumber asap/gas yang dekat')));
                  
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => handlePolutanChange(opt.name)}
                      className="p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer group"
                      style={{
                        background: isSelected ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface-2))' : 'rgba(0,0,0,0.2)',
                        borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                        color: isSelected ? 'var(--cs-amber)' : 'var(--cs-text-dim)',
                        boxShadow: isSelected ? '0 0 14px -4px var(--cs-amber-glow)' : 'none'
                      }}
                    >
                      <Icon className="w-5 h-5 transition-transform group-hover:scale-115" />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q6: Rentan */}
            <div className="p-6 border rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--cs-amber)' }}>6. Kehadiran Kelompok Kesehatan Rentan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {rentanOptions.map(opt => {
                  const isSelected = answers.rentan === opt.name || 
                                     (opt.name === 'Bayi / Balita' && answers.rentan.includes('Bayi / Balita')) ||
                                     (opt.name === 'Lansia / Penderita Asma' && answers.rentan.includes('Lansia / Penderita Asma')) ||
                                     (opt.name === 'Tidak Ada' && answers.rentan.toLowerCase() === 'tidak ada');
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => setAnswers({ ...answers, rentan: opt.name })}
                      className="p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer group"
                      style={{
                        background: isSelected ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface-2))' : 'rgba(0,0,0,0.2)',
                        borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                        color: isSelected ? 'var(--cs-amber)' : 'var(--cs-text-dim)',
                        boxShadow: isSelected ? '0 0 14px -4px var(--cs-amber-glow)' : 'none'
                      }}
                    >
                      <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q7: Detektor Lain */}
            <div className="p-6 border rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--cs-amber)' }}>7. Detektor Gas/Asap Tambahan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {detektorOptions.map(opt => {
                  const isSelected = answers.detektor_lain === opt.name;
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => setAnswers({ ...answers, detektor_lain: opt.name })}
                      className="p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer group"
                      style={{
                        background: isSelected ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface-2))' : 'rgba(0,0,0,0.2)',
                        borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                        color: isSelected ? 'var(--cs-amber)' : 'var(--cs-text-dim)',
                        boxShadow: isSelected ? '0 0 14px -4px var(--cs-amber-glow)' : 'none'
                      }}
                    >
                      <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-2 flex items-center gap-4">
              <button 
                type="submit" 
                className="px-8 py-4 text-black font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:brightness-110 active:scale-95"
                style={{ background: 'var(--cs-amber)', boxShadow: '0 8px 24px -8px var(--cs-amber-glow)' }}
              >
                <Save className="w-5 h-5" /> Simpan Perubahan
              </button>
              {saved && (
                <span className="text-xs font-mono font-bold animate-pulse text-emerald-400">
                  ✓ Konfigurasi AI Berhasil Diperbarui!
                </span>
              )}
            </div>
          </div>

          {/* Right Column: AI Live Preview Panel (Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="p-6 border rounded-[2rem] space-y-5 shadow-2xl relative overflow-hidden" 
                 style={{ 
                   background: 'linear-gradient(to bottom right, rgba(28,28,28,0.7), rgba(16,16,16,0.5))', 
                   borderColor: 'var(--cs-border)' 
                 }}>
              
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Brain className="w-32 h-32 text-white" />
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl border flex items-center justify-center" style={{ background: 'color-mix(in oklab, var(--cs-amber) 10%, transparent)', borderColor: 'var(--cs-border)' }}>
                  <Brain className="w-5 h-5 text-[var(--cs-amber)] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-white">AI Engine Preview</h3>
                  <p className="text-[9px] text-[var(--cs-amber)] font-mono uppercase tracking-widest mt-0.5">Real-time compilation</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="text-xs text-zinc-400 leading-relaxed font-mono">
                  📍 Penempatan: <span className="text-white font-bold">{answers.lokasi || '—'}</span>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed font-mono">
                  📏 Luas Ruangan: <span className="text-white font-bold">{answers.luas_ruang || '—'}</span>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed font-mono">
                  💨 Sirkulasi: <span className="text-white font-bold">{answers.sirkulasi || '—'}</span>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed font-mono">
                  👥 Hunian: <span className="text-white font-bold">{answers.kapasitas || '—'}</span>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed font-mono">
                  ⚠️ Emisi Terdekat: <span className="text-white font-bold">{answers.polutan.join(', ') || 'Tidak Ada'}</span>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed font-mono">
                  👶 Kelompok Rentan: <span className="text-white font-bold">{answers.rentan || '—'}</span>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed font-mono">
                  🚨 Detektor Lain: <span className="text-white font-bold">{answers.detektor_lain || '—'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border space-y-2" 
                   style={{ 
                     background: isHighRisk ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                     borderColor: isHighRisk ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' 
                   }}>
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase" style={{ color: isHighRisk ? '#f87171' : 'var(--cs-amber)' }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {isHighRisk ? 'Modus Sensitivitas Tinggi' : 'Modus Sensitivitas Normal'}
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-400 font-medium">
                  {isHighRisk 
                    ? 'CarbonSense AI memprogram ambang batas deteksi sensitif untuk mengantisipasi potensi penumpukan gas CO secara cepat.' 
                    : 'Kondisi sirkulasi aman. AI mengaktifkan alarm standar dengan rekomendasi penghematan energi dan ventilasi terjadwal.'}
                </p>
              </div>

              <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between">
                <span>SYSTEM ID: CS-LLM-v2.0</span>
                <span>STATUS: READY</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Success Save Popup */}
      <AnimatePresence>
        {saved && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer pointer-events-auto"
              onClick={() => setSaved(false)}
            />

            {/* Modal */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md border rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(251,191,36,0.15)] text-center flex flex-col items-center justify-between"
              style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
            >
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="relative z-10 space-y-5 flex flex-col items-center">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[var(--cs-amber)] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-white tracking-normal" style={{ fontFamily: 'var(--font-display)' }}>
                    Profil AI Diperbarui!
                  </h3>
                  <p className="text-xs text-[var(--cs-text-dim)] mt-2 leading-relaxed">
                    Parameter penempatan sensor dan lingkungan Anda berhasil disinkronisasi ke asisten AI. Asisten akan memantau telemetri menggunakan preferensi baru ini.
                  </p>
                </div>
              </div>

              <div className="w-full mt-8 relative z-10 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSaved(false)}
                  className="flex-1 py-3.5 hover:bg-zinc-800 border transition-all text-xs font-bold rounded-xl cursor-pointer"
                  style={{ background: 'var(--cs-surface-2)', borderColor: 'var(--cs-border)' }}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3.5 text-black font-black rounded-xl transition-all shadow-lg cursor-pointer hover:brightness-110 active:scale-95"
                  style={{ background: 'var(--cs-amber)', boxShadow: '0 8px 20px -8px var(--cs-amber-glow)' }}
                >
                  Ke Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
