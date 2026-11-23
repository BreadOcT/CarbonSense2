import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, LogOut, Wind, Brain, Sparkles, Bed, Laptop, Home, User, Users,
  Minimize2, Maximize2, Flame, Activity, ShieldCheck, ShieldAlert,
  HelpCircle, UserX, Cigarette, Car, Lock, RotateCw, ExternalLink, ShieldOff,
  Plus, Trash2, Phone, Send, Cpu
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

interface EmergencyContact {
  name: string;
  phone: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    const qDev = searchParams.get('deviceId');
    if (qDev) return qDev;
    const curDev = localStorage.getItem('cs_current_device_id');
    if (curDev) return curDev;
    try {
      const act = JSON.parse(localStorage.getItem('cs_active_devices') || '[]');
      if (Array.isArray(act) && act.length > 0) return act[0];
    } catch {
      // ignore
    }
    return '';
  });
  const [answers, setAnswers] = useState({
    lokasi: 'Dapur / Tempat Masak',
    sirkulasi: 'Jendela Sering Dibuka',
    kapasitas: '1 - 2 Orang',
    polutan: ['Kompor Gas / Tabung LPG'] as string[],
    rentan: 'Tidak Ada',
    luas_ruang: 'Sedang (Sekitar 4x5 meter)',
    detektor_lain: 'Belum Ada Sama Sekali'
  });
  const [customLokasi, setCustomLokasi] = useState('');
  const [showCustomLokasi, setShowCustomLokasi] = useState(false);
  const [customPolutanInput, setCustomPolutanInput] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: 'Kontak Utama', phone: '+6281234567890' }
  ]);
  const [saved, setSaved] = useState(false);

  const lokasiOptions = [
    { name: 'Dapur / Tempat Masak', icon: Flame },
    { name: 'Ruang Tamu / Keluarga', icon: Home },
    { name: 'Kamar Tidur', icon: Bed },
    { name: 'Ruang Kerja / Usaha', icon: Laptop },
    { name: 'Gudang / Penyimpanan', icon: Lock },
    { name: 'Lainnya', icon: HelpCircle }
  ];

  const sirkulasiOptions = [
    { name: 'Ruangan Tertutup Ber-AC', desc: 'Jendela jarang dibuka', icon: Lock },
    { name: 'Jendela Sering Dibuka', desc: 'Pertukaran udara alami', icon: Wind },
    { name: 'Ada Kipas Penyedot Udara (Exhaust Fan)', desc: 'Penyedot udara aktif', icon: RotateCw },
    { name: 'Ruangan Semi-Terbuka', desc: 'Aliran udara bebas', icon: ExternalLink }
  ];

  const kapasitasOptions = [
    { name: '1 - 2 Orang', icon: User },
    { name: '3 - 5 Orang', icon: Users },
    { name: 'Lebih dari 5 Orang', icon: Users },
    { name: 'Jarang Ada Orang', icon: UserX }
  ];

  const luasOptions = [
    { name: 'Kecil (Kurang dari 3x3 meter)', icon: Minimize2 },
    { name: 'Sedang (Sekitar 4x5 meter)', icon: Maximize2 },
    { name: 'Luas (Lebih dari 5x5 meter)', icon: Activity }
  ];

  const polutanOptions = [
    { name: 'Kompor Gas / Tabung LPG', icon: Flame },
    { name: 'Asap Rokok', icon: Cigarette },
    { name: 'Asap Kendaraan / Mesin / Genset', icon: Car },
    { name: 'Tidak Ada Sumber Asap', icon: ShieldCheck }
  ];

  const detektorOptions = [
    { name: 'Sudah Ada dan Aktif', icon: ShieldCheck },
    { name: 'Ada Tapi Jarang Dicek', icon: ShieldAlert },
    { name: 'Belum Ada Sama Sekali', icon: ShieldOff }
  ];

  useEffect(() => {
    const userEmail = localStorage.getItem('cs_user_email') || '';
    let initialDevs: string[] = [];
    try {
      const act = JSON.parse(localStorage.getItem('cs_active_devices') || '[]');
      if (Array.isArray(act)) initialDevs = act;
    } catch {
      // ignore
    }
    setAvailableDevices(initialDevs);

    if (userEmail) {
      api.devices.list(userEmail)
        .then(myDevs => {
          const allIds = Array.from(new Set([...initialDevs, ...myDevs.map((d: any) => d.id)]));
          setAvailableDevices(allIds);
          if (!selectedDeviceId && allIds.length > 0) {
            setSelectedDeviceId(allIds[0]);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const userEmail = localStorage.getItem('cs_user_email');
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const docData = userDoc.data();
            const profileData =
              (selectedDeviceId && docData.deviceProfiles?.[selectedDeviceId]) ||
              docData.profile;
            if (profileData) {
              setAnswers(prev => ({
                ...prev,
                ...profileData,
                rentan: profileData.rentan || 'Tidak Ada',
                polutan: Array.isArray(profileData.polutan)
                  ? profileData.polutan
                  : profileData.polutan
                  ? [profileData.polutan]
                  : []
              }));
            }
          }
        } catch (err) {
          console.error('Error loading Firestore profile:', err);
        }
      }

      const stored =
        (selectedDeviceId && localStorage.getItem(`cs_ai_personality_${selectedDeviceId}`)) ||
        (userEmail && localStorage.getItem(`cs_ai_personality_${userEmail}`)) ||
        localStorage.getItem('cs_ai_personality');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            const loadedLokasi = parsed.lokasi || 'Dapur / Tempat Masak';
            const presetNames = lokasiOptions.filter(o => o.name !== 'Lainnya').map(o => o.name);
            if (loadedLokasi && !presetNames.includes(loadedLokasi)) {
              setShowCustomLokasi(true);
              setCustomLokasi(loadedLokasi);
            } else {
              setShowCustomLokasi(false);
              setCustomLokasi('');
            }
            setAnswers(prev => ({
              ...prev,
              ...parsed,
              rentan: parsed.rentan || 'Tidak Ada',
              polutan: Array.isArray(parsed.polutan)
                ? parsed.polutan
                : parsed.polutan
                ? [parsed.polutan]
                : []
            }));
          }
        } catch (e) {
          console.error('Failed to parse stored configuration:', e);
        }
      } else {
        // Default values for a not-yet-configured device
        setShowCustomLokasi(false);
        setCustomLokasi('');
        setAnswers({
          lokasi: 'Dapur / Tempat Masak',
          sirkulasi: 'Jendela Sering Dibuka',
          kapasitas: '1 - 2 Orang',
          polutan: ['Kompor Gas / Tabung LPG'],
          rentan: 'Tidak Ada',
          luas_ruang: 'Sedang (Sekitar 4x5 meter)',
          detektor_lain: 'Belum Ada Sama Sekali'
        });
      }

      const storedContacts =
        (selectedDeviceId && localStorage.getItem(`cs_emergency_contacts_${selectedDeviceId}`)) ||
        (userEmail && localStorage.getItem(`cs_emergency_contacts_${userEmail}`)) ||
        localStorage.getItem('cs_emergency_contacts');
      if (storedContacts) {
        try {
          const parsedC = JSON.parse(storedContacts);
          if (Array.isArray(parsedC) && parsedC.length > 0) {
            setEmergencyContacts(parsedC);
          }
        } catch (e) {
          console.error('Failed to parse emergency contacts:', e);
        }
      }

      setLoading(false);
    };
    fetchProfile();
  }, [selectedDeviceId]);

  const handlePolutanChange = (val: string) => {
    setAnswers(prev => ({
      ...prev,
      polutan: prev.polutan.includes(val)
        ? prev.polutan.filter(p => p !== val)
        : [...prev.polutan, val]
    }));
  };

  const handleAddCustomPolutan = () => {
    const val = customPolutanInput.trim();
    if (!val) return;
    if (!answers.polutan.includes(val)) {
      setAnswers(prev => ({
        ...prev,
        polutan: [...prev.polutan.filter(p => p !== 'Tidak Ada Sumber Asap' && p !== 'Tidak Ada'), val]
      }));
    }
    setCustomPolutanInput('');
  };

  const handleContactChange = (idx: number, field: 'name' | 'phone', val: string) => {
    setEmergencyContacts(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleAddContact = () => {
    setEmergencyContacts(prev => [...prev, { name: '', phone: '+62' }]);
  };

  const handleRemoveContact = (idx: number) => {
    if (emergencyContacts.length <= 1) return;
    setEmergencyContacts(prev => prev.filter((_, i) => i !== idx));
  };

  const handleTestWhatsApp = (contact: EmergencyContact) => {
    const cleanPhone = (contact.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) return;
    const msg = encodeURIComponent(
      `Halo ${contact.name || 'Kontak Darurat'}, ini adalah pesan uji coba dari Sistem Pemantau Gas CarbonSense di ruangan (${answers.lokasi || 'Ruangan Utama'}). Nomor Anda telah terdaftar sebagai penerima peringatan darurat kebocoran gas.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalLokasi = showCustomLokasi && customLokasi.trim() ? customLokasi.trim() : answers.lokasi;
    const validContacts = emergencyContacts
      .map(c => ({ name: c.name.trim() || 'Kontak Darurat', phone: c.phone.trim() }))
      .filter(c => c.phone.length >= 5);
    const finalContacts = validContacts.length > 0 ? validContacts : [{ name: 'Kontak Utama', phone: '+6281234567890' }];

    const updatedProfile = {
      ...answers,
      deviceId: selectedDeviceId || undefined,
      lokasi: finalLokasi,
      rentan: answers.rentan || 'Tidak Ada',
      wa_darurat: finalContacts[0].phone,
      emergency_contacts: finalContacts
    };

    const user = auth.currentUser;
    if (user) {
      try {
        const updatePayload: Record<string, any> = {
          profile: updatedProfile
        };
        if (selectedDeviceId) {
          updatePayload[`deviceProfiles.${selectedDeviceId}`] = updatedProfile;
        }
        await updateDoc(doc(db, 'users', user.uid), updatePayload);
      } catch (err) {
        console.error('Error updating Firestore profile:', err);
      }
    }

    const userEmail = localStorage.getItem('cs_user_email');
    if (selectedDeviceId) {
      localStorage.setItem(`cs_ai_personality_${selectedDeviceId}`, JSON.stringify(updatedProfile));
      localStorage.setItem(`cs_emergency_contacts_${selectedDeviceId}`, JSON.stringify(finalContacts));
      localStorage.setItem(`cs_device_onboarding_completed_${selectedDeviceId}`, 'true');
    }
    localStorage.setItem('cs_ai_personality', JSON.stringify(updatedProfile));
    localStorage.setItem('cs_emergency_contacts', JSON.stringify(finalContacts));
    if (userEmail) {
      localStorage.setItem(`cs_ai_personality_${userEmail}`, JSON.stringify(updatedProfile));
      localStorage.setItem(`cs_emergency_contacts_${userEmail}`, JSON.stringify(finalContacts));
    }

    setAnswers(prev => ({ ...prev, lokasi: finalLokasi }));
    setEmergencyContacts(finalContacts);
    setSaved(true);
  };

  const isHighRisk =
    answers.sirkulasi.toLowerCase().includes('tertutup') ||
    answers.polutan.some(p => p.toLowerCase().includes('kompor') || p.toLowerCase().includes('rokok'));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] text-[#0F172A] font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Brain className="w-10 h-10 text-[#0284C7] animate-pulse" />
          <span className="text-xs font-mono text-[#475569] uppercase tracking-widest font-bold">
            Memuat Pengaturan Ruangan...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] text-[#0F172A] font-sans pt-24 pb-12 px-4 sm:px-6 relative">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
                PENGATURAN RUANGAN &amp; KONTAK DARURAT
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/dashboard"
              className="text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:border-[#0284C7] text-[#475569] hover:text-[#0284C7] transition-all font-semibold"
            >
              &lt;- Kembali ke Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('cs_user_email');
                navigate('/login');
              }}
              className="p-2 hover:bg-[#FEF2F2] text-[#DC2626] rounded-xl transition-colors cursor-pointer"
              title="Keluar Sesi"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#0284C7] font-bold">
              KONFIGURASI PER PERANGKAT
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-0.5">
              Pengaturan Kondisi Ruangan &amp; Kontak Darurat
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] mt-1">
              Setiap alat memiliki pengaturan ruangan tersendiri karena ditempatkan di kamar/area yang berbeda.
            </p>
          </div>

          {availableDevices.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-[#F0F9FF] p-3.5 rounded-2xl border border-[#BAE6FD] shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0284C7]">
                <Cpu className="w-4 h-4" />
                <span>Pilih Alat:</span>
              </div>
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedDeviceId(nextId);
                  setSearchParams({ deviceId: nextId });
                }}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#0284C7]/40 text-xs font-mono font-bold text-[#0F172A] focus:outline-none focus:border-[#0284C7] cursor-pointer"
              >
                {availableDevices.map(devId => (
                  <option key={devId} value={devId}>
                    {devId}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Cards */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Lokasi */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-[#0284C7]">
                1. Lokasi Pemasangan Alat
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {lokasiOptions.map(opt => {
                  const isSelected =
                    opt.name === 'Lainnya'
                      ? showCustomLokasi
                      : answers.lokasi === opt.name && !showCustomLokasi;
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => {
                        if (opt.name === 'Lainnya') {
                          setShowCustomLokasi(true);
                        } else {
                          setShowCustomLokasi(false);
                          setAnswers({ ...answers, lokasi: opt.name });
                        }
                      }}
                      className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] shadow-sm'
                          : 'bg-[#F9FAFB] border-slate-200 text-[#475569] hover:border-[#0284C7]/50 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
              {showCustomLokasi && (
                <div className="mt-3 p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD]">
                  <label className="block text-[11px] font-bold text-[#0284C7] mb-1.5">
                    Tuliskan Nama Ruangan Lainnya:
                  </label>
                  <input
                    type="text"
                    value={customLokasi}
                    onChange={(e) => {
                      setCustomLokasi(e.target.value);
                      setAnswers(prev => ({ ...prev, lokasi: e.target.value }));
                    }}
                    placeholder="Contoh: Area Kasir / Gudang Belakang"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              )}
            </div>

            {/* 2. Sirkulasi */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-[#0284C7]">
                2. Kondisi Pertukaran Udara (Ventilasi)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sirkulasiOptions.map(opt => {
                  const isSelected = answers.sirkulasi === opt.name || answers.sirkulasi.startsWith(opt.name);
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => setAnswers({ ...answers, sirkulasi: opt.name })}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] shadow-sm'
                          : 'bg-[#F9FAFB] border-slate-200 text-[#475569] hover:border-[#0284C7]/50 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-6 h-6 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-[#0F172A]">{opt.name}</div>
                        <div className="text-[11px] text-[#475569] mt-0.5">{opt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Kapasitas */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-[#0284C7]">
                3. Rata-rata Jumlah Orang di Ruangan
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {kapasitasOptions.map(opt => {
                  const isSelected = answers.kapasitas === opt.name;
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => setAnswers({ ...answers, kapasitas: opt.name })}
                      className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] shadow-sm'
                          : 'bg-[#F9FAFB] border-slate-200 text-[#475569] hover:border-[#0284C7]/50 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Luas Ruangan */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-[#0284C7]">
                4. Perkiraan Ukuran Luas Ruangan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {luasOptions.map(opt => {
                  const isSelected = answers.luas_ruang === opt.name;
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => setAnswers({ ...answers, luas_ruang: opt.name })}
                      className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] shadow-sm'
                          : 'bg-[#F9FAFB] border-slate-200 text-[#475569] hover:border-[#0284C7]/50 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Polutan */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-1 text-[#0284C7]">
                5. Sumber Asap atau Gas di Dekat Alat (Bisa Pilih Lebih dari Satu)
              </h3>
              <p className="text-[11px] text-[#475569] mb-4">
                Pilih sumber gas atau asap yang berada di sekitar alat pemantau.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {polutanOptions.map(opt => {
                  const isSelected = answers.polutan.includes(opt.name);
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => handlePolutanChange(opt.name)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] shadow-sm'
                          : 'bg-[#F9FAFB] border-slate-200 text-[#475569] hover:border-[#0284C7]/50 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Polutan Pills & Input */}
              {answers.polutan.filter(p => !polutanOptions.some(o => o.name === p)).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {answers.polutan
                    .filter(p => !polutanOptions.some(o => o.name === p))
                    .map(customP => (
                      <span
                        key={customP}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E0F2FE] border border-[#0284C7] text-[#0284C7] text-xs font-bold"
                      >
                        {customP}
                        <button
                          type="button"
                          onClick={() => handlePolutanChange(customP)}
                          className="hover:text-[#DC2626] cursor-pointer font-extrabold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={customPolutanInput}
                  onChange={(e) => setCustomPolutanInput(e.target.value)}
                  placeholder="Tambah sumber asap/gas lainnya (contoh: Oven / Genset)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F9FAFB] border border-slate-300 text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPolutan}
                  className="px-4 py-2.5 rounded-xl bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] font-bold text-xs transition-colors cursor-pointer"
                >
                  + Tambah
                </button>
              </div>
            </div>

            {/* 6. Detektor Lain */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-[#0284C7]">
                6. Kesiapan Alat Pemadam (APAR) atau Alarm Asap Lain
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {detektorOptions.map(opt => {
                  const isSelected = answers.detektor_lain === opt.name;
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.name}
                      onClick={() => setAnswers({ ...answers, detektor_lain: opt.name })}
                      className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] shadow-sm'
                          : 'bg-[#F9FAFB] border-slate-200 text-[#475569] hover:border-[#0284C7]/50 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. Daftar Kontak WhatsApp untuk Peringatan Bahaya */}
            <div className="p-6 bg-white border-2 border-[#16A34A]/30 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#16A34A]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#16A34A]">
                    7. Daftar Kontak WhatsApp untuk Peringatan Bahaya
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-bold">
                  {emergencyContacts.length} Kontak
                </span>
              </div>
              <p className="text-xs text-[#475569] mb-4 leading-relaxed">
                Tambahkan nomor WhatsApp pemilik rumah, anggota keluarga, atau teknisi yang akan menerima pesan darurat saat terjadi kebocoran gas.
              </p>

              <div className="space-y-3">
                {emergencyContacts.map((contact, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#F9FAFB] border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#0284C7] font-bold">
                        Kontak Darurat #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTestWhatsApp(contact)}
                          className="px-2.5 py-1 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#16A34A] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Send className="w-3 h-3" /> Uji WA
                        </button>
                        {emergencyContacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContact(idx)}
                            className="px-2.5 py-1 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#475569] mb-1">
                          Nama Kontak (Misal: Suami / Ibu / Teknisi)
                        </label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                          placeholder="Contoh: Ibu Sari"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#475569] mb-1">
                          Nomor WhatsApp (Gunakan +62 atau 08)
                        </label>
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                          placeholder="+6281234567890"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddContact}
                  className="w-full py-3 rounded-2xl border border-dashed border-[#16A34A] text-[#16A34A] hover:bg-[#F0FDF4] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Kontak WhatsApp Baru
                </button>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-2 flex items-center gap-4">
              <button
                type="submit"
                className="px-8 py-4 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#0284C7]/25 active:scale-95 text-sm"
              >
                <Save className="w-5 h-5" /> Simpan Semua Pengaturan
              </button>
              {saved && (
                <span className="text-xs font-bold text-[#16A34A]">
                  ✓ Pengaturan Ruangan &amp; Kontak Berhasil Disimpan!
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Live Summary Panel (Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#E0F2FE] border border-[#0284C7]/30 flex items-center justify-center text-[#0284C7]">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold tracking-wider uppercase text-[#0F172A]">
                    Ringkasan Pengaturan Ruangan
                  </h3>
                  <p className="text-[10px] text-[#0284C7] font-mono uppercase tracking-wider font-bold mt-0.5">
                    Profil Asisten Keselamatan
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-[#475569]">Lokasi Alat:</span>
                  <span className="text-[#0F172A] font-bold text-right">
                    {(showCustomLokasi && customLokasi) || answers.lokasi || '—'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#475569]">Ukuran Ruangan:</span>
                  <span className="text-[#0F172A] font-bold text-right">{answers.luas_ruang || '—'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#475569]">Pertukaran Udara:</span>
                  <span className="text-[#0F172A] font-bold text-right">{answers.sirkulasi || '—'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#475569]">Jumlah Orang:</span>
                  <span className="text-[#0F172A] font-bold text-right">{answers.kapasitas || '—'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#475569]">Sumber Gas/Asap:</span>
                  <span className="text-[#0F172A] font-bold text-right">
                    {answers.polutan.join(', ') || 'Tidak Ada'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#475569]">Alat Pengaman Lain:</span>
                  <span className="text-[#0F172A] font-bold text-right">{answers.detektor_lain || '—'}</span>
                </div>
                <div className="flex justify-between gap-2 pt-2 border-t border-slate-200">
                  <span className="text-[#16A34A] font-bold">Kontak WhatsApp:</span>
                  <span className="text-[#16A34A] font-extrabold text-right">
                    {emergencyContacts.length} Nomor Aktif
                  </span>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-1.5 ${
                  isHighRisk ? 'bg-[#FFF7ED] border-[#FED7AA]' : 'bg-[#F0FDF4] border-[#BBF7D0]'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase ${
                    isHighRisk ? 'text-[#EA580C]' : 'text-[#16A34A]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isHighRisk ? 'Mode Peringatan Dini Aktif' : 'Mode Pemantauan Standar'}
                </div>
                <p className="text-xs leading-relaxed text-[#475569]">
                  {isHighRisk
                    ? 'Asisten memantau potensi penumpukan gas lebih ketat karena ruangan tertutup atau dekat sumber gas.'
                    : 'Kondisi sirkulasi udara baik. Asisten memantau kebocoran gas secara otomatis sepanjang hari.'}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Success Save Popup */}
      <AnimatePresence>
        {saved && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
              onClick={() => setSaved(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden shadow-2xl text-center flex flex-col items-center justify-between"
            >
              <div className="relative z-10 space-y-4 flex flex-col items-center">
                <div className="w-16 h-16 bg-[#DCFCE7] border border-[#16A34A]/30 rounded-2xl flex items-center justify-center text-[#16A34A]">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#0F172A]">
                    Pengaturan Berhasil Disimpan!
                  </h3>
                  <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                    Kondisi ruangan dan daftar nomor WhatsApp darurat Anda telah diperbarui. Sistem akan menggunakan pengaturan baru ini saat memantau keamanan udara.
                  </p>
                </div>
              </div>

              <div className="w-full mt-7 relative z-10 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSaved(false)}
                  className="flex-1 py-3 bg-[#F9FAFB] hover:bg-slate-100 border border-slate-300 text-[#0F172A] transition-all text-xs font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold rounded-xl transition-all shadow-md shadow-[#0284C7]/25 cursor-pointer text-xs"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
