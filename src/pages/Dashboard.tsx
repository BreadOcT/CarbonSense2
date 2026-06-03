/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, History, AlertTriangle, Wind, Clock, ChevronDown, 
  Trash2, ArrowLeft, Settings as SettingsIcon, Download, 
  Table, Brain, LayoutDashboard, Database, ShoppingCart, Info, Clock as ClockIcon, ShieldAlert,
  Maximize2, Minimize2, User, LogOut
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { api } from '../lib/api';

// Extend jsPDF with autotable types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDeviceId = searchParams.get('deviceId');
  const [carbonLevel, setCarbonLevel] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeDeviceIds, setActiveDeviceIds] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [purchaseStatus, setPurchaseStatus] = useState<string>('none');
  const [accessDenied, setAccessDenied] = useState(false);
  
  const [historyRegistry, setHistoryRegistry] = useState<Record<string, { timestamp: string; value: number }[]>>({});
  
  const localHistory = historyRegistry[deviceId] || [];
  
  const [filterOption, setFilterOption] = useState<string>('30'); // '15', '30', '60', '180', 'live', 'today', 'custom'
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date(Date.now() - 60 * 60 * 1000);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset*60*1000));
    return localDate.toISOString().substring(0, 16);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset*60*1000));
    return localDate.toISOString().substring(0, 16);
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dataPointsLimit, setDataPointsLimit] = useState<number>(10);
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false);
  const [isPointsDropdownOpen, setIsPointsDropdownOpen] = useState(false);

  const filterOptionLabels: Record<string, string> = {
    '15': '15 Menit',
    '30': '30 Menit',
    '60': '60 Menit',
    '180': '3 Jam',
    'live': 'Live Real-time',
    'today': 'Hari Ini',
    'custom': 'Custom Range'
  };

  // Load Initial Data
  useEffect(() => {
    const savedUser = localStorage.getItem('cs_user');
    const activeDevsStr = localStorage.getItem('cs_active_devices');
    const savedPurchase = localStorage.getItem('cs_purchase_status') || 'none';
    const email = localStorage.getItem('cs_user_email');

    if (savedUser) setUserProfile(JSON.parse(savedUser));
    if (!savedUser && email) setUserProfile({ username: email.split('@')[0], email });

    let activeDevs: string[] = [];
    try {
      const parsed = activeDevsStr ? JSON.parse(activeDevsStr) : [];
      activeDevs = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(e);
    }
    setActiveDeviceIds(activeDevs);

    if (activeDevs.length === 0) {
      navigate('/select-device');
      return;
    }

    if (!deviceId && activeDevs.length > 0) {
      setDeviceId(activeDevs[0]);
    }

    if (urlDeviceId && !activeDevs.includes(urlDeviceId)) {
      setAccessDenied(true);
      return;
    }

    setPurchaseStatus(savedPurchase);
  }, [urlDeviceId, navigate]);

  // Load history when deviceId changes
  useEffect(() => {
    if (!deviceId) return;
    const key = `cs_history_${deviceId}`;
    const saved = localStorage.getItem(key);
    let hist = saved ? JSON.parse(saved) : [];
    
    if (hist.length === 0) {
      hist = Array.from({ length: 50 }, (_, i) => ({
        timestamp: (Date.now() - (i * 60000)).toString(),
        value: Math.floor(Math.random() * (1400 - 400) + 400)
      })).reverse();
      localStorage.setItem(key, JSON.stringify(hist));
    }
    setHistoryRegistry(prev => ({ ...prev, [deviceId]: hist }));
    
    if (hist.length > 0) {
      setCarbonLevel(hist[hist.length - 1].value);
    }
  }, [deviceId]);

  // Live Data Simulation & Telemetry Push to MySQL
  useEffect(() => {
    if (!deviceId || accessDenied) return;

    const interval = setInterval(() => {
      setCarbonLevel(prev => {
        const baseChange = Math.floor(Math.random() * 40) - 20;
        const newValue = (prev || 450) + baseChange;
        const finalValue = Math.max(300, Math.min(2000, newValue));
        
        // Push telemetry value to backend MySQL DB
        api.devices.updateTelemetry({
          id: deviceId,
          ppm: finalValue,
          status: finalValue > 1200 ? 'Warning' : 'Online'
        }).catch(err => console.error('Failed to update telemetry in MySQL:', err));

        setHistoryRegistry(registry => {
          const hist = registry[deviceId] || [];
          const newEntry = { timestamp: Date.now().toString(), value: finalValue };
          const updated = [...hist, newEntry].slice(-1000);
          localStorage.setItem(`cs_history_${deviceId}`, JSON.stringify(updated));
          return { ...registry, [deviceId]: updated };
        });
        
        return finalValue;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [deviceId, accessDenied]);

  // Handling Purchase
  const handlePurchase = () => {
     localStorage.setItem('cs_purchase_status', 'pending');
     setPurchaseStatus('pending');
  };

  // AI Recommendations based on onboarding
  const aiAdvice = useMemo(() => {
    const savedAnswers = localStorage.getItem('cs_onboarding_answers');
    if (!savedAnswers) return "Silakan lengkapi profil onboarding untuk mendapatkan rekomendasi personal dari CarbonSense AI.";
    
    const answers = JSON.parse(savedAnswers);
    const location = answers[0]?.value || "Ruangan";
    
    if (carbonLevel && carbonLevel > 1200) {
      return `Peringatan! Kadar CO di ${location} terdeteksi kritis (${carbonLevel} ppm). Segera buka jendela dan nyalakan sirkulasi udara tambahan.`;
    }
    return `Kondisi udara di ${location} saat ini stabil. Tetap jaga sirkulasi udara yang baik untuk kesehatan penghuni.`;
  }, [carbonLevel]);

  const isGreaterOrEqual60Min = useMemo(() => {
    if (filterOption === '60' || filterOption === '180' || filterOption === 'today') {
      return true;
    }
    if (filterOption === 'custom' && customStart && customEnd) {
      const startMs = new Date(customStart).getTime();
      const endMs = new Date(customEnd).getTime();
      return (endMs - startMs) >= 60 * 60 * 1000;
    }
    return false;
  }, [filterOption, customStart, customEnd]);

  // Aggregation Logic
  const processedChartData = useMemo(() => {
    let filtered = [...localHistory];

    if (filterOption === '15') {
      const cutoff = Date.now() - 15 * 60 * 1000;
      filtered = filtered.filter(item => parseInt(item.timestamp) >= cutoff);
    } else if (filterOption === '30') {
      const cutoff = Date.now() - 30 * 60 * 1000;
      filtered = filtered.filter(item => parseInt(item.timestamp) >= cutoff);
    } else if (filterOption === '60') {
      const cutoff = Date.now() - 60 * 60 * 1000;
      filtered = filtered.filter(item => parseInt(item.timestamp) >= cutoff);
    } else if (filterOption === '180') {
      const cutoff = Date.now() - 180 * 60 * 1000;
      filtered = filtered.filter(item => parseInt(item.timestamp) >= cutoff);
    } else if (filterOption === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => {
        const ts = parseInt(item.timestamp);
        return ts >= startOfToday.getTime() && ts <= endOfToday.getTime();
      });
    } else if (filterOption === 'custom') {
      if (customStart && customEnd) {
        const startMs = new Date(customStart).getTime();
        const endMs = new Date(customEnd).getTime();
        filtered = filtered.filter(item => {
          const ts = parseInt(item.timestamp);
          return ts >= startMs && ts <= endMs;
        });
      } else {
        return [];
      }
    } else if (filterOption === 'live') {
      return filtered
        .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp))
        .slice(-dataPointsLimit)
        .map(item => {
          const ts = parseInt(item.timestamp);
          const d = new Date(ts);
          return {
            timestamp: item.timestamp,
            value: item.value,
            timeFormatted: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
        });
    }

    if (filtered.length === 0) return [];

    const totalPoints = filtered.length;
    const blockSize = Math.max(1, Math.floor(totalPoints / dataPointsLimit));
    const aggregated: { timestamp: string; value: number; timeFormatted: string }[] = [];

    for (let i = 0; i < totalPoints; i += blockSize) {
      const chunk = filtered.slice(i, i + blockSize);
      if (chunk.length === 0) continue;
      const avg = Math.round(chunk.reduce((sum, item) => sum + item.value, 0) / chunk.length);
      const timestamp = chunk[Math.floor(chunk.length / 2)].timestamp;
      
      const d = new Date(parseInt(timestamp));
      let timeFormatted = '';
      if (isGreaterOrEqual60Min) {
        const hours = d.getHours().toString().padStart(2, '0');
        timeFormatted = `Jam ${hours}:00`;
      } else {
        timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }

      aggregated.push({
        timestamp,
        value: avg,
        timeFormatted
      });
    }

    return aggregated.slice(-dataPointsLimit);
  }, [localHistory, filterOption, dataPointsLimit, isGreaterOrEqual60Min, customStart, customEnd]);

  const displayedHistory = useMemo(() => {
    return [...localHistory]
      .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp))
      .slice(0, 50);
  }, [localHistory]);

  const isAlert = carbonLevel !== null && carbonLevel > 1200;

  // Export functions
  const exportToExcel = () => {
    const data = displayedHistory.map(item => ({
      Waktu: new Date(parseInt(item.timestamp)).toLocaleString(),
      'Kadar CO (ppm)': item.value,
      Status: item.value < 700 ? 'Aman' : item.value < 1200 ? 'Waspada' : 'Bahaya'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CarbonSense Data');
    XLSX.writeFile(wb, `Report_CarbonSense_${deviceId}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    // Use orange/amber (RGB: 245, 158, 11) for title header
    doc.setTextColor(245, 158, 11);
    doc.text('Laporan Monitoring CarbonSense', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`User: ${userProfile?.username || 'Guest'}`, 14, 30);
    doc.text(`Device ID: ${deviceId}`, 14, 35);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString()}`, 14, 40);

    const tableData = displayedHistory.map((item) => [
      new Date(parseInt(item.timestamp)).toLocaleString(),
      `${item.value} ppm`,
      item.value < 700 ? 'Aman (Normal)' : item.value < 1200 ? 'Waspada (Meningkat)' : 'Bahaya (Gas Leak Detected!)'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Waktu Kontrol', 'Kadar PPM', 'Analisis Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      styles: { fontSize: 9 },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 2) {
          const txt = data.cell.text[0];
          if (txt.includes('Bahaya')) doc.setTextColor(220, 38, 38);
          else if (txt.includes('Waspada')) doc.setTextColor(217, 119, 6);
          else doc.setTextColor(5, 150, 105);
        }
      }
    });

    doc.save(`Report_CarbonSense_${deviceId}.pdf`);
  };

  return (
    <div className="min-h-screen text-[var(--cs-text)] font-sans overflow-x-hidden" style={{ background: 'var(--cs-bg)' }}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {accessDenied ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600 blur-[150px] rounded-full opacity-10" />
        ) : deviceId ? (
          <>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] transition-colors duration-1000 blur-[120px] rounded-full opacity-20" style={{ background: isAlert ? 'var(--cs-danger)' : 'var(--cs-amber-glow)' }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] transition-colors duration-1000 blur-[100px] rounded-full opacity-10" style={{ background: isAlert ? 'var(--cs-danger)' : 'var(--cs-amber-glow)' }} />
          </>
        ) : (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[150px] rounded-full opacity-5" style={{ background: 'var(--cs-amber-glow)' }} />
        )}
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{ background: 'color-mix(in oklab, var(--cs-bg) 80%, transparent)', borderColor: 'var(--cs-border)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/select-device" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-[var(--cs-text-dim)] group" title="Kembalilah ke Pilih Perangkat">
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
          <div className="flex items-center gap-3">
            {deviceId && !accessDenied && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 border rounded-full" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
                 <Database className="w-3 h-3 animate-pulse" style={{ color: 'var(--cs-amber)' }} />
                 <span className="text-[10px] font-mono text-[var(--cs-text-dim)] uppercase">Simulated Mode</span>
              </div>
            )}
            <Link to="/profile" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-[var(--cs-text-dim)]" title="Profil Pengguna">
              <User className="w-5 h-5 animate-pulse" style={{ color: 'var(--cs-amber)' }} />
            </Link>
            <Link to="/settings" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-[var(--cs-text-dim)]" title="Pengaturan">
              <SettingsIcon className="w-5 h-5" />
            </Link>
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
        </div>
      </nav>

      <main className="relative pt-24 pb-20 px-6 max-w-6xl mx-auto">
        
        {/* Device Tabs */}
        {!accessDenied && activeDeviceIds.length > 1 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            {activeDeviceIds.map(id => (
              <button
                key={id}
                onClick={() => setDeviceId(id)}
                className="px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap text-sm border cursor-pointer"
                style={{
                  background: deviceId === id ? 'var(--cs-amber)' : 'var(--cs-surface)',
                  color: deviceId === id ? '#0c0a08' : 'var(--cs-text-dim)',
                  borderColor: deviceId === id ? 'var(--cs-amber)' : 'var(--cs-border)',
                  boxShadow: deviceId === id ? '0 8px 24px -8px var(--cs-amber-glow)' : 'none'
                }}
              >
                {id}
              </button>
            ))}
          </div>
        )}

        {accessDenied ? (
           <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="max-w-md w-full p-10 border rounded-[2rem] shadow-2xl relative overflow-hidden"
               style={{ background: 'color-mix(in oklab, var(--cs-danger) 5%, var(--cs-surface))', borderColor: 'color-mix(in oklab, var(--cs-danger) 30%, var(--cs-border))' }}
             >
               <div className="flex flex-col items-center">
                 <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
                   <ShieldAlert className="w-10 h-10 text-red-500" />
                 </div>
                 <h2 className="text-2xl font-bold mb-3 tracking-normal text-red-500" style={{ fontFamily: 'var(--font-display)' }}>Akses Ditolak</h2>
                 <p className="text-red-200/70 text-sm leading-relaxed mb-8">
                   Perangkat ini tidak terdaftar pada akun Anda. Sistem keamanan memblokir akses ke ID Perangkat yang tidak sesuai dengan otorisasi Anda.
                 </p>
                 <button 
                   onClick={() => setSearchParams({})}
                   className="w-full py-4 px-6 bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-3 rounded-xl transition-all active:scale-95 shadow-xl shadow-red-900/20 cursor-pointer"
                 >
                   Kembali ke Dashboard Anda
                 </button>
               </div>
             </motion.div>
           </div>
        ) : !deviceId ? (
           <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
             <header className="mb-12">
               <h1 className="text-5xl sm:text-6xl lg:text-7xl uppercase font-semibold tracking-tight mb-3 leading-none" style={{ fontFamily: 'var(--font-display)' }}>Halo, {userProfile?.username || 'Pahlawan Udara'}!</h1>
             </header>

             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-w-md w-full p-10 border rounded-[2rem] shadow-2xl relative overflow-hidden"
               style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
             >
               {purchaseStatus === 'pending' ? (
                 <div className="flex flex-col items-center">
                   <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-6">
                     <ClockIcon className="w-10 h-10 text-amber-500 animate-pulse" />
                   </div>
                   <h2 className="text-2xl font-bold mb-3 tracking-normal" style={{ fontFamily: 'var(--font-display)' }}>Menunggu Konfirmasi Admin</h2>
                   <p className="text-[var(--cs-text-dim)] text-sm leading-relaxed mb-6">
                     Anda telah menyelesaikan pembelian, namun pihak Admin belum memproses pendaftaran perangkat ke dalam basis data. Mohon tunggu proses sinkronisasi selesai, atau hubungi admin.
                   </p>
                 </div>
               ) : (
                 <div className="flex flex-col items-center">
                   <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 border" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'var(--cs-amber)' }}>
                     <Info className="w-10 h-10" style={{ color: 'var(--cs-amber)' }} />
                   </div>
                   <h2 className="text-2xl font-bold mb-3 tracking-normal" style={{ fontFamily: 'var(--font-display)' }}>Belum Ada Perangkat</h2>
                   <p className="text-[var(--cs-text-dim)] text-sm leading-relaxed mb-8">
                     Sistem mendeteksi bahwa akun Anda belum memiliki relasi dengan perangkat fisik CarbonSense mana pun. Silakan melakukan pembelian alat.
                   </p>
                   
                   <button 
                     onClick={handlePurchase}
                     className="w-full py-4 px-6 text-black font-bold flex items-center justify-center gap-3 rounded-xl transition-all active:scale-95 shadow-xl cursor-pointer hover:brightness-110"
                     style={{ background: 'var(--cs-amber)', boxShadow: '0 8px 24px -8px var(--cs-amber-glow)' }}
                   >
                     <ShoppingCart className="w-5 h-5" />
                     Beli Perangkat Sekarang
                   </button>
                 </div>
               )}
             </motion.div>
           </div>
         ) : (
           /* State: Full Access (Device Bound) */
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             {/* Main Visual & Stats */}
             <div className="lg:col-span-12 xl:col-span-7 space-y-8">
               <header>
                 <h1 className="text-5xl sm:text-6xl lg:text-7xl uppercase font-semibold tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>Halo, {userProfile?.username || 'Pahlawan Udara'}!</h1>
                 <p className="text-[var(--cs-text-dim)] mt-2">Berikut adalah kondisi udara real-time di area monitor Anda (ID: {deviceId}).</p>
               </header>

               <motion.div 
                  animate={isAlert ? { 
                    boxShadow: ["0 0 20px rgba(220, 38, 38, 0.1)", "0 0 60px rgba(220, 38, 38, 0.5)", "0 0 20px rgba(220, 38, 38, 0.1)"],
                    borderColor: ["rgba(220, 38, 38, 0.2)", "rgba(220, 38, 38, 0.8)", "rgba(220, 38, 38, 0.2)"],
                    backgroundColor: ["rgba(24, 24, 27, 0.4)", "rgba(127, 29, 29, 0.2)", "rgba(24, 24, 27, 0.4)"]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="p-10 rounded-[3rem] border relative overflow-hidden flex flex-col items-center justify-center min-h-[350px] shadow-2xl transition-colors duration-500"
                  style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
               >
                 <div className="absolute top-8 left-8 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: isAlert ? 'var(--cs-danger)' : 'var(--cs-amber)' }} />
                   <span className="text-[10px] font-bold text-[var(--cs-text-dim)] uppercase tracking-widest">Active Monitoring</span>
                 </div>

                 <div className="text-center relative z-10">
                   <p className="text-xs font-mono text-[var(--cs-text-dim)] uppercase tracking-[0.3em] mb-6">Carbon Level Intensity</p>
                   
                   <div className="flex items-baseline justify-center">
                     <motion.h2 
                       key={carbonLevel}
                       animate={isAlert ? { scale: [1, 1.1, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] } : {}}
                       className="text-[9rem] leading-none font-black tracking-tight"
                       style={{ fontFamily: 'var(--font-display)', color: isAlert ? 'var(--cs-danger-text)' : 'var(--cs-text)' }}
                     >
                       {carbonLevel || '--'}
                     </motion.h2>
                     <span className="text-2xl font-bold text-zinc-700 ml-4">ppm</span>
                   </div>

                   <div className="mt-8 flex justify-center">
                     {isAlert ? (
                       <div className="px-6 py-2 bg-red-600 text-white rounded-full font-bold flex items-center gap-2 animate-bounce">
                         <AlertTriangle className="w-5 h-5" />
                         Danger: Gas Leak Detected!
                       </div>
                     ) : (
                       <div className="px-6 py-2 rounded-full font-bold flex items-center gap-2 border" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'color-mix(in oklab, var(--cs-amber) 30%, var(--cs-border))', color: 'var(--cs-amber)' }}>
                         <Activity className="w-5 h-5 animate-pulse" />
                         Status: Udara Aman & Terjamin
                       </div>
                     )}
                   </div>
                 </div>
               </motion.div>

               {/* AI Insight Card */}
               <div className="p-8 rounded-[2rem] border relative overflow-hidden group" style={{ background: 'linear-gradient(to bottom right, rgba(25,25,25,0.6), rgba(15,15,15,0.4))', borderColor: 'var(--cs-border)' }}>
                 <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10 group-hover:scale-110 transition-transform">
                   <Brain className="w-32 h-32" style={{ color: 'var(--cs-amber)' }} />
                 </div>
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl border" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'color-mix(in oklab, var(--cs-amber) 20%, var(--cs-border))' }}>
                         <Brain className="w-5 h-5 font-bold" style={{ color: 'var(--cs-amber)' }} />
                      </div>
                      <h3 className="font-bold uppercase tracking-widest text-sm" style={{ color: 'var(--cs-amber)' }}>CarbonSense AI Recommendation</h3>
                    </div>
                    <p className="text-zinc-300 text-lg leading-relaxed font-medium italic">
                      "{aiAdvice}"
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                      <LayoutDashboard className="w-3 h-3" /> Based on your Quiz Profile
                    </div>
                 </div>
               </div>
             </div>

             {/* Controls & History */}
             <div className="lg:col-span-12 xl:col-span-5 space-y-6">
               
               {/* Action Bar */}
               <div className="grid grid-cols-2 gap-4">
                 {/* Dropdown Periods */}
                 <div className="relative">
                   <button 
                     onClick={() => setIsHistoryDropdownOpen(!isHistoryDropdownOpen)}
                     className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-800 transition-colors text-xs text-left border cursor-pointer"
                     style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
                   >
                     <span className="flex items-center gap-2 text-[var(--cs-text-dim)]"><Clock className="w-4 h-4"/> Rentang:</span>
                     <span className="font-bold truncate max-w-[80px]" style={{ color: 'var(--cs-amber)' }}>{filterOptionLabels[filterOption]}</span>
                     <ChevronDown className={`w-3 h-3 text-zinc-600 flex-shrink-0 transition-transform ${isHistoryDropdownOpen ? 'rotate-180' : ''}`} />
                   </button>
                   <AnimatePresence>
                     {isHistoryDropdownOpen && (
                       <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 border rounded-xl overflow-hidden shadow-2xl z-50" style={{ background: '#121212', borderColor: 'var(--cs-border)' }}>
                         {Object.entries(filterOptionLabels).map(([key, label]) => (
                           <button key={key} onClick={() => { setFilterOption(key); setIsHistoryDropdownOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs border-b last:border-0 font-medium cursor-pointer" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                             {label}
                           </button>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>

                 {/* Dropdown Points */}
                 <div className="relative">
                   <button 
                     onClick={() => setIsPointsDropdownOpen(!isPointsDropdownOpen)}
                     className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-800 transition-colors text-xs text-left border cursor-pointer"
                     style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
                   >
                     <span className="flex items-center gap-2 text-[var(--cs-text-dim)]"><Activity className="w-4 h-4"/> Titik:</span>
                     <span className="font-bold" style={{ color: 'var(--cs-amber)' }}>{dataPointsLimit}</span>
                     <ChevronDown className={`w-3 h-3 text-zinc-600 flex-shrink-0 transition-transform ${isPointsDropdownOpen ? 'rotate-180' : ''}`} />
                   </button>
                   <AnimatePresence>
                     {isPointsDropdownOpen && (
                       <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 border rounded-xl overflow-hidden shadow-2xl z-50" style={{ background: '#121212', borderColor: 'var(--cs-border)' }}>
                         {[5, 10, 20, 50, 100].map(p => (
                           <button key={p} onClick={() => { setDataPointsLimit(p); setIsPointsDropdownOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs border-b last:border-0 font-medium cursor-pointer" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                             Tampilkan {p} Titik Data
                           </button>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>

                 {/* Reports */}
                 <button onClick={exportToExcel} className="p-4 border rounded-2xl hover:brightness-110 transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'color-mix(in oklab, var(--cs-amber) 20%, var(--cs-border))', color: 'var(--cs-amber)' }}>
                   <Table className="w-4 h-4" /> Download XLSX
                 </button>
                 <button onClick={exportToPDF} className="p-4 rounded-2xl hover:bg-zinc-800 border transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}>
                   <Download className="w-4 h-4" /> Save PDF
                 </button>
               </div>

               {/* Custom Datetime Input Fields */}
               {filterOption === 'custom' && (
                 <div className="p-5 border rounded-2xl space-y-3" style={{ background: 'rgba(25, 25, 25, 0.6)', borderColor: 'var(--cs-border)' }}>
                   <p className="text-xs font-bold text-[var(--cs-text-dim)] uppercase tracking-wider">Pilih Rentang Waktu Kustom</p>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">Mulai</label>
                       <input 
                         type="datetime-local"
                         value={customStart}
                         onChange={(e) => setCustomStart(e.target.value)}
                         className="w-full bg-black/40 border px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--cs-amber)] text-white"
                         style={{ borderColor: 'var(--cs-border)' }}
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">Hingga</label>
                       <input 
                         type="datetime-local"
                         value={customEnd}
                         onChange={(e) => setCustomEnd(e.target.value)}
                         className="w-full bg-black/40 border px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--cs-amber)] text-white"
                         style={{ borderColor: 'var(--cs-border)' }}
                       />
                     </div>
                   </div>
                 </div>
               )}

               {/* Chart Area */}
               <div className="p-6 border rounded-[2rem]" style={{ background: 'rgba(25, 25, 25, 0.4)', borderColor: 'var(--cs-border)' }}>
                 <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-2">
                      <History className="w-4 h-4 animate-pulse" style={{ color: 'var(--cs-amber)' }} />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Live Historical Data</h3>
                   </div>
                   <div className="flex items-center gap-2">
                     <button 
                       onClick={() => setIsFullscreen(true)}
                       className="text-zinc-500 hover:text-[var(--cs-amber)] p-1.5 hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                       title="Lihat Fullscreen"
                     >
                       <Maximize2 className="w-4 h-4" />
                     </button>
                     <button onClick={() => setHistoryRegistry(prev => ({ ...prev, [deviceId]: [] }))} className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer">
                       <Trash2 className="w-4 h-4"/>
                     </button>
                   </div>
                 </div>
                 
                 <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={processedChartData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                       <XAxis 
                         dataKey="timeFormatted" 
                         stroke="#4b5563" 
                         fontSize={10} 
                         axisLine={false} 
                         tickLine={false} 
                         tickMargin={10}
                       />
                       <YAxis 
                         stroke="#4b5563" 
                         fontSize={10} 
                         axisLine={false} 
                         tickLine={false}
                       />
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#000', border: '1px solid var(--cs-border)', borderRadius: '12px' }}
                         itemStyle={{ color: '#fbbf24', fontWeight: 'bold' }} // Using gold hex fallback for tooltip text
                       />
                       <Line 
                         type="monotone" 
                         dataKey="value" 
                         stroke="#fbbf24" // Using gold hex fallback for line stroke
                         strokeWidth={4} 
                         dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }}
                         activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }}
                       />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
               </div>

               {/* Recent Log Table */}
               <div className="p-6 border rounded-[2rem]" style={{ background: 'rgba(25, 25, 25, 0.4)', borderColor: 'var(--cs-border)' }}>
                 <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Aktivitas Terakhir</h3>
                 <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                   {displayedHistory.map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 border rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                       <span className="text-[10px] font-mono text-zinc-500">{new Date(parseInt(item.timestamp)).toLocaleTimeString()}</span>
                       <span className="text-sm font-black" style={{ color: item.value > 1200 ? 'var(--cs-danger)' : 'var(--cs-amber)' }}>
                         {item.value} <span className="text-[10px] font-normal text-zinc-600">ppm</span>
                       </span>
                     </div>
                   ))}
                 </div>
               </div>
             </div>

           </div>
         )}
       </main>

       {/* Fullscreen Chart Modal */}
       <AnimatePresence>
         {isFullscreen && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-[#070707]/95 backdrop-blur-md z-[1000] p-6 md:p-10 flex flex-col justify-between"
           >
             <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: 'var(--cs-border)' }}>
               <div>
                 <h3 className="text-xl font-black tracking-normal text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                   <Activity className="w-5 h-5 animate-pulse" style={{ color: 'var(--cs-amber)' }} />
                   Grafik Monitor Historis Fullscreen — {deviceId}
                 </h3>
                 <p className="text-xs text-zinc-400 mt-1">
                   Rentang: <span className="font-bold" style={{ color: 'var(--cs-amber)' }}>{filterOptionLabels[filterOption]}</span> | {processedChartData.length} sampel titik data | {filterOption === 'live' ? 'Data Asli Real-time' : 'Nilai Rata-rata Interval'}
                 </p>
               </div>
               <button 
                 onClick={() => setIsFullscreen(false)}
                 className="p-3 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all font-bold flex items-center gap-2 text-sm active:scale-95 border cursor-pointer"
                 style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
               >
                 <Minimize2 className="w-4 h-4" /> Tutup Fullscreen
               </button>
             </div>

             <div className="flex-1 w-full flex items-center justify-center border rounded-3xl p-6 min-h-0" style={{ background: 'rgba(25, 25, 25, 0.2)', borderColor: 'var(--cs-border)' }}>
               <div className="w-full h-full min-h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={processedChartData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                     <XAxis 
                       dataKey="timeFormatted" 
                       stroke="#9ca3af" 
                       fontSize={11} 
                       axisLine={false} 
                       tickLine={false} 
                       tickMargin={12}
                     />
                     <YAxis 
                       stroke="#9ca3af" 
                       fontSize={11} 
                       axisLine={false} 
                       tickLine={false}
                     />
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#000', border: '1px solid var(--cs-border)', borderRadius: '16px', padding: '12px' }}
                       itemStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                     />
                     <Line 
                       type="monotone" 
                       dataKey="value" 
                       stroke="#fbbf24"
                       strokeWidth={5} 
                       dot={{ r: 6, fill: '#fbbf24', strokeWidth: 0 }}
                       activeDot={{ r: 8, stroke: '#000', strokeWidth: 3 }}
                     />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
             </div>

             <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-zinc-500 mt-6 border-t pt-4" style={{ borderColor: 'var(--cs-border)' }}>
               <span>*Tampilan dimutakhirkan secara otomatis seiring berjalan waktu</span>
               <span>CarbonSense High Precision Visualization Engine</span>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

       <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
       `}</style>
     </div>
   );
}
