/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, History, AlertTriangle, Wind, Clock, ChevronDown, 
  Trash2, ArrowLeft, Settings as SettingsIcon, Download, 
  Table, Brain, LayoutDashboard, Database, ShoppingCart, Info, Clock as ClockIcon, ShieldAlert,
  Maximize2, Minimize2, User, LogOut, Cpu, Cloud, Monitor, CheckCircle, XCircle, X,
  Sparkles, Send, MessageSquare
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { api } from '../lib/api';
import { ref, onValue, update } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { generateSimpleAdvice, generateChatResponse } from '../lib/ai';

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
  const carbonLevelRef = useRef<number | null>(null);
  useEffect(() => {
    carbonLevelRef.current = carbonLevel;
  }, [carbonLevel]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [aiPersonality, setAiPersonality] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'ai', text: 'Halo! Saya adalah CarbonSense AI Assistant. Berdasarkan profil penempatan sensor dan data telemetri real-time, saya siap membantu Anda menganalisis kelayakan udara dan keselamatan ruangan.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [consecutiveDangerCount, setConsecutiveDangerCount] = useState<number>(0);
  const [isDangerPopupOpen, setIsDangerPopupOpen] = useState<boolean>(false);
  const [dangerPopupRecommendation, setDangerPopupRecommendation] = useState<string>('');
  const [dangerPopupLoading, setDangerPopupLoading] = useState<boolean>(false);
  const [hasTriggeredDanger, setHasTriggeredDanger] = useState<boolean>(false);

  const hasTriggeredDangerRef = useRef(false);
  useEffect(() => {
    hasTriggeredDangerRef.current = hasTriggeredDanger;
  }, [hasTriggeredDanger]);

  const aiPersonalityRef = useRef<any>(null);
  useEffect(() => {
    aiPersonalityRef.current = aiPersonality;
  }, [aiPersonality]);

  const loadDangerRecommendation = (ppm: number) => {
    setDangerPopupLoading(true);
    api.ai.getRecommendation({
      question: "Berikan rekomendasi keselamatan evakuasi karena terdeteksi kadar karbon kritis!",
      profile: aiPersonalityRef.current,
      carbonLevel: ppm
    }).then(rec => {
      setDangerPopupRecommendation(rec);
      setDangerPopupLoading(false);
      setChatMessages(prev => {
        const hasAlertMessage = prev.some(m => m.text.includes("ANALISIS DARURAT AI"));
        if (hasAlertMessage) return prev;
        return [...prev, {
          sender: 'ai',
          text: `🚨 **ANALISIS DARURAT AI (Kadar CO Kritis):**\n\n${rec}`
        }];
      });
    }).catch(err => {
      console.error(err);
      const fallbackRec = `Kadar karbon monoksida mendesak! Segera lakukan tindakan berikut:\n\na. Evakuasi: Pindahkan seluruh penghuni (terutama kelompok rentan) ke area terbuka berudara segar.\nb. Sirkulasi: Buka semua pintu dan jendela lebar-lebar untuk membuang akumulasi gas.\nc. Sumber Gas: Matikan kompor gas atau peralatan masak terdekat.\nd. Pemantauan: Pantau terus sensor ini hingga kadar CO kembali aman di bawah 700 ppm.`;
      setDangerPopupRecommendation(fallbackRec);
      setDangerPopupLoading(false);
    });
  };

  const [activeDeviceIds, setActiveDeviceIds] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [purchaseStatus, setPurchaseStatus] = useState<string>('none');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);
  
  const [isDeviceOffline, setIsDeviceOffline] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const initialPingRef = useRef<number | null>(null);
  const isInitialCheckedRef = useRef(false);
  const diagnosticRef = useRef<HTMLDivElement>(null);
  
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
    const storedAi = localStorage.getItem('cs_ai_personality');

    if (savedUser) setUserProfile(JSON.parse(savedUser));
    if (!savedUser && email) setUserProfile({ username: email.split('@')[0], email });
    
    if (storedAi) {
      try {
        setAiPersonality(JSON.parse(storedAi));
      } catch (e) {
        console.error('Failed to parse cs_ai_personality in dashboard:', e);
      }
    }

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

  // Handle click outside diagnostics dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (diagnosticRef.current && !diagnosticRef.current.contains(event.target as Node)) {
        setIsDiagnosticOpen(false);
      }
    };
    if (isDiagnosticOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDiagnosticOpen]);

  // Load history when deviceId changes and fetch initial status from MySQL
  useEffect(() => {
    if (!deviceId) return;
    
    // Reset initial check states
    isInitialCheckedRef.current = false;
    initialPingRef.current = null;
    
    const key = `cs_history_${deviceId}`;
    const saved = localStorage.getItem(key);
    let hist = saved ? JSON.parse(saved) : [];
    
    setHistoryRegistry(prev => ({ ...prev, [deviceId]: hist }));
    
    // Fetch user devices from backend MySQL to get initial status
    const checkInitialDeviceStatus = async () => {
      try {
        const email = localStorage.getItem('cs_user_email') || '';
        const myDevs = await api.devices.list(email);
        const activeDev = myDevs.find((d: any) => d.id === deviceId);
        if (activeDev) {
          if (activeDev.status === 'Offline') {
            setIsDeviceOffline(true);
            setCarbonLevel(null);
          } else {
            setIsDeviceOffline(false);
            const ppmNum = activeDev.ppm !== '--' ? Number(activeDev.ppm) : null;
            setCarbonLevel(ppmNum);
            setLastUpdateTime(Date.now());
          }
        }
      } catch (err) {
        console.error('Gagal mengambil status awal device:', err);
      } finally {
        isInitialCheckedRef.current = true;
      }
    };

    checkInitialDeviceStatus();
  }, [deviceId]);

  // Listen to Firebase Realtime Database for device telemetry in real-time
  useEffect(() => {
    if (!deviceId || accessDenied) return;

    const deviceRef = ref(rtdb, deviceId);
    
    const unsubscribe = onValue(deviceRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const ppmVal = data.nilai_ppm !== undefined ? Number(data.nilai_ppm) : null;
      const pingVal = data.ping !== undefined ? Number(data.ping) : null;

      // Handle offline reactivation check
      if (isDeviceOffline) {
        // If we are currently marked offline, we only go online if the ping counter has changed/incremented
        if (initialPingRef.current === null) {
          initialPingRef.current = pingVal;
          return; // Ignore this first fire if we're marked offline, wait for it to change
        }

        if (pingVal !== null && pingVal !== initialPingRef.current) {
          // Heartbeat detected! Reactivate the device
          setIsDeviceOffline(false);
          initialPingRef.current = pingVal;
        } else {
          // No ping change, keep offline
          return;
        }
      } else {
        // If we're already online, update our heartbeat record
        if (pingVal !== null) {
          initialPingRef.current = pingVal;
        }
      }

      if (ppmVal !== null) {
        setCarbonLevel(ppmVal);
        setLastUpdateTime(Date.now());

        // Hysteresis & Danger threshold checks
        if (ppmVal > 1200) {
          setConsecutiveDangerCount((c) => {
            const nextCount = c + 1;
            if (nextCount >= 3 && !hasTriggeredDangerRef.current) {
              setHasTriggeredDanger(true);
              setIsDangerPopupOpen(true);
              loadDangerRecommendation(ppmVal);
            }
            return nextCount;
          });
        } else {
          setConsecutiveDangerCount(0);
          if (ppmVal < 900) {
            setHasTriggeredDanger(false);
          }
        }

        // Sync with MySQL DB so admin dashboard sees it
        api.devices.updateTelemetry({
          id: deviceId,
          ppm: ppmVal,
          status: ppmVal > 1200 ? 'Warning' : 'Online'
        }).catch(err => console.error('Failed to sync telemetry to MySQL:', err));

        // Add to historical chart registry
        setHistoryRegistry(registry => {
          const hist = registry[deviceId] || [];
          const nowStr = Date.now().toString();
          const lastEntry = hist[hist.length - 1];
          if (lastEntry && (Date.now() - Number(lastEntry.timestamp) < 2000) && lastEntry.value === ppmVal) {
            return registry;
          }
          const newEntry = { timestamp: nowStr, value: ppmVal };
          const updated = [...hist, newEntry].slice(-1000);
          localStorage.setItem(`cs_history_${deviceId}`, JSON.stringify(updated));
          return { ...registry, [deviceId]: updated };
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [deviceId, accessDenied, isDeviceOffline]);

  // Client-side 5-minute inactivity check (timeout to Offline)
  useEffect(() => {
    if (!deviceId || accessDenied || isDeviceOffline) return;

    const interval = setInterval(() => {
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - lastUpdateTime > fiveMinutes) {
        // Timeout exceeded! Go offline
        setIsDeviceOffline(true);
        setCarbonLevel(null);
        
        // Sync the offline status to the MySQL backend
        api.devices.updateTelemetry({
          id: deviceId,
          ppm: '--',
          status: 'Offline'
        }).catch(err => console.error('Failed to sync offline status to MySQL:', err));
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [deviceId, accessDenied, isDeviceOffline, lastUpdateTime]);

  // Handling Purchase
  const handlePurchase = () => {
     localStorage.setItem('cs_purchase_status', 'pending');
     setPurchaseStatus('pending');
  };

  // Dynamic AI Advice text generator for the header indicator
  const aiAdvice = useMemo(() => {
    return generateSimpleAdvice(aiPersonality, carbonLevel);
  }, [carbonLevel, aiPersonality]);

  // AI LLM generator for Chat messages
  const handleAskAI = (questionText: string) => {
    if (!questionText.trim() || isTyping) return;

    // Add User Message
    const updatedMessages = [...chatMessages, { sender: 'user', text: questionText }];
    setChatMessages(updatedMessages);
    setIsTyping(true);

    // Simulated LLM delay
    setTimeout(async () => {
      const currentPpm = carbonLevelRef.current;
      try {
        const aiResponse = await generateChatResponse(questionText, aiPersonality, currentPpm);
        setChatMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      } catch (err) {
        console.error(err);
        setChatMessages(prev => [...prev, { sender: 'ai', text: "Gagal memproses respons asisten AI." }]);
      }
      setIsTyping(false);
    }, 800);
  };

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

  // Aggregation Logic based on dynamic Time Buckets
  const processedChartData = useMemo(() => {
    let filtered = [...localHistory];
    
    let startTime = Date.now() - 30 * 60 * 1000; // default 30 mins
    let endTime = Date.now();

    if (filterOption === '15') {
      startTime = Date.now() - 15 * 60 * 1000;
    } else if (filterOption === '30') {
      startTime = Date.now() - 30 * 60 * 1000;
    } else if (filterOption === '60') {
      startTime = Date.now() - 60 * 60 * 1000;
    } else if (filterOption === '180') {
      startTime = Date.now() - 180 * 60 * 1000;
    } else if (filterOption === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      startTime = startOfToday.getTime();
      endTime = Date.now();
    } else if (filterOption === 'custom') {
      if (customStart && customEnd) {
        startTime = new Date(customStart).getTime();
        endTime = new Date(customEnd).getTime();
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

    // Filter points in selected range
    filtered = filtered.filter(item => {
      const ts = parseInt(item.timestamp);
      return ts >= startTime && ts <= endTime;
    });

    const totalDuration = endTime - startTime;
    const N = dataPointsLimit;
    const slotSize = totalDuration / N;
    const aggregated: { timestamp: string; value: number | null; timeFormatted: string }[] = [];

    for (let i = 0; i < N; i++) {
      const slotStart = startTime + i * slotSize;
      const slotEnd = slotStart + slotSize;
      const pointsInSlot = filtered.filter(item => {
        const ts = parseInt(item.timestamp);
        return ts >= slotStart && ts < slotEnd;
      });

      const slotMid = slotStart + slotSize / 2;
      const d = new Date(slotMid);
      
      let timeFormatted = '';
      if (isGreaterOrEqual60Min) {
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        timeFormatted = `${hours}:${minutes}`;
      } else {
        timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }

      if (pointsInSlot.length > 0) {
        const avg = Math.round(pointsInSlot.reduce((sum, item) => sum + item.value, 0) / pointsInSlot.length);
        aggregated.push({
          timestamp: slotMid.toString(),
          value: avg,
          timeFormatted
        });
      } else {
        aggregated.push({
          timestamp: slotMid.toString(),
          value: null as any,
          timeFormatted
        });
      }
    }

    return aggregated;
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
              <div ref={diagnosticRef} className="relative">
                <button 
                  onClick={() => setIsDiagnosticOpen(!isDiagnosticOpen)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-full text-[10px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer select-none active:scale-95 shadow-md ${
                    isDeviceOffline 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450 hover:bg-emerald-500/20'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isDeviceOffline ? 'bg-red-500' : 'bg-emerald-500 animate-ping'}`} />
                  Device: {isDeviceOffline ? 'Offline' : 'Online'}
                </button>

                <AnimatePresence>
                  {isDiagnosticOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-80 p-5 rounded-[2rem] border shadow-2xl z-50 overflow-hidden"
                      style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="text-[10px] font-mono text-[var(--cs-text-dim)] uppercase tracking-wider">
                          Status Koneksi Jalur Data
                        </div>
                        
                        <div className="flex items-center justify-between px-2 py-4 relative">
                          {/* Background Connecting Lines */}
                          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-800 z-0">
                            {/* Active Line (Green if online) */}
                            <div 
                              className={`h-full transition-all duration-500 ${isDeviceOffline ? 'w-0' : 'w-full bg-emerald-500'}`} 
                            />
                          </div>

                          {/* Node 1: Device */}
                          <div className="flex flex-col items-center gap-1.5 z-10">
                            <div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                                isDeviceOffline 
                                  ? 'border-zinc-800 text-zinc-500' 
                                  : 'border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              }`}
                              style={{
                                backgroundColor: isDeviceOffline 
                                  ? 'var(--cs-surface-2)' 
                                  : 'color-mix(in oklab, var(--cs-surface) 88%, #10b981)'
                              }}
                            >
                              <Cpu className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Alat</span>
                          </div>

                          {/* X indicator on connection 1 if offline */}
                          {isDeviceOffline && (
                            <div className="absolute left-[30%] top-1/2 -translate-y-1/2 z-20">
                              <div className="w-5 h-5 bg-red-950 border border-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <X className="w-3 h-3 text-red-500" />
                              </div>
                            </div>
                          )}

                          {/* Node 2: Firebase */}
                          <div className="flex flex-col items-center gap-1.5 z-10">
                            <div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                                isDeviceOffline 
                                  ? 'border-zinc-800 text-zinc-500' 
                                  : 'border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              }`}
                              style={{
                                backgroundColor: isDeviceOffline 
                                  ? 'var(--cs-surface-2)' 
                                  : 'color-mix(in oklab, var(--cs-surface) 88%, #10b981)'
                              }}
                            >
                              <Cloud className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Firebase</span>
                          </div>

                          {/* X indicator on connection 2 if offline */}
                          {isDeviceOffline && (
                            <div className="absolute right-[30%] top-1/2 -translate-y-1/2 z-20">
                              <div className="w-5 h-5 bg-red-950 border border-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce delay-150">
                                <X className="w-3 h-3 text-red-500" />
                              </div>
                            </div>
                          )}

                          {/* Node 3: Dashboard */}
                          <div className="flex flex-col items-center gap-1.5 z-10">
                            <div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                                isDeviceOffline 
                                  ? 'border-zinc-800 text-zinc-500' 
                                  : 'border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              }`}
                              style={{
                                backgroundColor: isDeviceOffline 
                                  ? 'var(--cs-surface-2)' 
                                  : 'color-mix(in oklab, var(--cs-surface) 88%, #10b981)'
                              }}
                            >
                              <Monitor className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Monitor</span>
                          </div>
                        </div>

                        <div className="border-t pt-3 text-xs leading-relaxed" style={{ borderColor: 'var(--cs-border)' }}>
                          {isDeviceOffline ? (
                            <div className="text-red-400 flex flex-col gap-1">
                              <div className="font-bold flex items-center gap-1">
                                <XCircle className="w-4 h-4" /> Alat Terputus / Offline
                              </div>
                              <p className="text-[11px] text-zinc-400">
                                Sensor terdeteksi mati atau tidak mengirim data dalam 5 menit terakhir.
                              </p>
                              <div className="text-[10px] text-zinc-500 mt-2 font-mono list-decimal pl-4">
                                <li>Pastikan catu daya ESP32 menyala</li>
                                <li>Pastikan ESP32 terhubung ke WiFi</li>
                                <li>Unggah firmware terbaru dari tab Admin</li>
                              </div>
                            </div>
                          ) : (
                            <div className="text-emerald-400 flex flex-col gap-1">
                              <div className="font-bold flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Koneksi Terjamin & Aman
                              </div>
                              <p className="text-[11px] text-zinc-400">
                                Seluruh jalur transmisi data berfungsi dengan baik. Telemetri aktif disinkronkan ke monitor.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                   animate={isDeviceOffline ? {
                     borderColor: ["rgba(220, 38, 38, 0.2)", "rgba(220, 38, 38, 0.4)", "rgba(220, 38, 38, 0.2)"],
                     backgroundColor: ["rgba(24, 24, 27, 0.4)", "rgba(127, 29, 29, 0.05)", "rgba(24, 24, 27, 0.4)"]
                   } : isAlert ? { 
                     boxShadow: ["0 0 20px rgba(220, 38, 38, 0.1)", "0 0 60px rgba(220, 38, 38, 0.5)", "0 0 20px rgba(220, 38, 38, 0.1)"],
                     borderColor: ["rgba(220, 38, 38, 0.2)", "rgba(220, 38, 38, 0.8)", "rgba(220, 38, 38, 0.2)"],
                     backgroundColor: ["rgba(24, 24, 27, 0.4)", "rgba(127, 29, 29, 0.2)", "rgba(24, 24, 27, 0.4)"]
                   } : {}}
                   transition={{ repeat: Infinity, duration: 1.5 }}
                   className="p-10 rounded-[3rem] border relative overflow-hidden flex flex-col items-center justify-center min-h-[350px] shadow-2xl transition-colors duration-500"
                   style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
                >
                  <div className="absolute top-8 left-8 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: isDeviceOffline ? 'var(--cs-danger)' : isAlert ? 'var(--cs-danger)' : 'var(--cs-amber)' }} />
                    <span className="text-[10px] font-bold text-[var(--cs-text-dim)] uppercase tracking-widest">
                      {isDeviceOffline ? 'Offline Mode' : 'Active Monitoring'}
                    </span>
                  </div>

                  <div className="text-center relative z-10">
                    <p className="text-xs font-mono text-[var(--cs-text-dim)] uppercase tracking-[0.3em] mb-6">Carbon Level Intensity</p>
                    
                    <div className="flex items-baseline justify-center">
                      <motion.h2 
                        key={carbonLevel}
                        animate={isAlert ? { scale: [1, 1.1, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] } : {}}
                        className="text-[9rem] leading-none font-black tracking-tight"
                        style={{ fontFamily: 'var(--font-display)', color: isDeviceOffline ? 'var(--cs-danger-text)' : isAlert ? 'var(--cs-danger-text)' : 'var(--cs-text)' }}
                      >
                        {carbonLevel || '--'}
                      </motion.h2>
                      <span className="text-2xl font-bold text-zinc-700 ml-4">ppm</span>
                    </div>

                    <div className="mt-8 flex justify-center">
                      {isDeviceOffline ? (
                        <div className="px-6 py-2 bg-red-950/20 border border-red-500/30 text-red-400 rounded-full font-bold flex items-center gap-2 animate-pulse">
                          <AlertTriangle className="w-5 h-5" />
                          Status: Alat Terputus / Offline
                        </div>
                      ) : isAlert ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="px-6 py-2 bg-red-600 text-white rounded-full font-bold flex items-center gap-2 animate-bounce">
                            <AlertTriangle className="w-5 h-5" />
                            Danger: Gas Leak Detected!
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setIsDangerPopupOpen(true);
                              if (!dangerPopupRecommendation) {
                                loadDangerRecommendation(carbonLevel || 1200);
                              }
                            }}
                            className="px-4 py-1.5 bg-red-950/40 border border-red-500/35 text-red-400 hover:bg-red-900/20 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                            Lihat Rekomendasi Evakuasi AI
                          </button>
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

               {/* Premium Interactive AI LLM Assistant Widget */}
               <div className="p-6 md:p-8 rounded-[2.5rem] border relative overflow-hidden flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, rgba(28,28,28,0.7) 0%, rgba(16,16,16,0.5) 100%)', borderColor: 'var(--cs-border)', minHeight: '520px' }}>
                 
                 {/* Card Background Ambient Sparkles */}
                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                   <Brain className="w-40 h-40 text-white" />
                 </div>

                 {/* Card Header */}
                 <div className="flex items-center justify-between border-b pb-4 mb-4 relative z-10" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-xl border flex items-center justify-center" style={{ background: 'color-mix(in oklab, var(--cs-amber) 10%, transparent)', borderColor: 'var(--cs-border)' }}>
                       <Brain className="w-5 h-5 text-[var(--cs-amber)] animate-pulse" />
                     </div>
                     <div>
                       <h3 className="font-bold uppercase tracking-wider text-sm text-white flex items-center gap-1.5">
                         CarbonSense LLM AI Assistant
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                       </h3>
                       <p className="text-[9px] font-mono text-[var(--cs-amber)] uppercase tracking-wider mt-0.5">Model: CarbonSensing-v2.0</p>
                     </div>
                   </div>
                   {/* Risk Level Badge */}
                   <div className="px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest"
                        style={{
                          background: isAlert ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          borderColor: isAlert ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                          color: isAlert ? '#f87171' : '#10b981'
                        }}>
                     {isAlert ? 'BAHAYA KRITIS' : carbonLevel && carbonLevel > 700 ? 'WASPADA' : 'UDARA AMAN'}
                   </div>
                 </div>

                 {/* URGENT EVACUATION PROTOCOL PANEL (Active Warning Overlay if PPM > 700) */}
                 {(carbonLevel !== null && carbonLevel > 700) && (
                   <motion.div 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="p-4 rounded-2xl border mb-4 space-y-3 animate-pulse text-left"
                     style={{ 
                       background: 'rgba(239, 68, 68, 0.08)', 
                       borderColor: 'rgba(239, 68, 68, 0.35)' 
                     }}
                   >
                     <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-widest">
                       <ShieldAlert className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                       ⚠️ PROTOKOL KESELAMATAN & EVAKUASI AI AKTIF
                     </div>
                     <div className="text-[11px] text-zinc-300 space-y-2 leading-relaxed font-medium">
                       {aiPersonality?.rentan && aiPersonality.rentan !== 'Tidak Ada' && (
                         <div className="flex items-start gap-1.5">
                           <span className="text-red-400 flex-shrink-0">•</span>
                           <span><strong>Kelompok Rentan:</strong> Segera evakuasi <span className="text-white underline">{aiPersonality.rentan}</span> dari area {aiPersonality.lokasi || 'ini'} ke tempat berudara terbuka segar.</span>
                         </div>
                       )}
                       <div className="flex items-start gap-1.5">
                         <span className="text-red-400 flex-shrink-0">•</span>
                         <span><strong>Sirkulasi:</strong> Status ventilasi saat ini '{aiPersonality?.sirkulasi || 'AC Tertutup'}'. Segera buka pintu/jendela selebar mungkin dan matikan pendingin ruangan (AC).</span>
                       </div>
                        {aiPersonality?.luas_ruang === 'Kecil (< 10 m²)' && (
                          <div className="flex items-start gap-1.5">
                            <span className="text-red-400 flex-shrink-0">•</span>
                            <span><strong>Dimensi Ruang:</strong> Ruangan dinilai <strong>Kecil</strong>. Akumulasi gas CO terjadi 3x lebih cepat. Batasi jumlah orang ({aiPersonality?.kapasitas}) di dalam ruangan.</span>
                          </div>
                        )}
                       {aiPersonality?.polutan && aiPersonality.polutan.length > 0 && aiPersonality.polutan[0] !== 'Tidak Ada' && (
                         <div className="flex items-start gap-1.5">
                           <span className="text-red-400 flex-shrink-0">•</span>
                           <span><strong>Sumber Emisi:</strong> Matikan kompor gas atau jauhkan aktivitas merokok/kendaraan ({aiPersonality.polutan.join(', ')}) dari sekitar sensor.</span>
                         </div>
                       )}
                       {carbonLevel !== null && carbonLevel > 1200 && (
                         <div className="mt-3 border-t border-red-900/30 pt-3">
                           <button
                             type="button"
                             onClick={() => {
                               setIsDangerPopupOpen(true);
                               if (!dangerPopupRecommendation) {
                                 loadDangerRecommendation(carbonLevel || 1200);
                               }
                             }}
                             className="w-full py-2 bg-red-950/30 hover:bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                           >
                             <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                             Buka Kembali Popup Evakuasi AI
                           </button>
                         </div>
                       )}
                     </div>
                   </motion.div>
                 )}

                 {/* Message Window */}
                 <div className="flex-1 overflow-y-auto max-h-[220px] mb-4 space-y-3.5 pr-2 custom-scrollbar text-left relative z-10" style={{ minHeight: '160px' }}>
                   {chatMessages.map((msg, idx) => {
                     const isAi = msg.sender === 'ai';
                     return (
                       <div key={idx} className={`flex items-start gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}>
                         {isAi && (
                           <div className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
                             <Brain className="w-4 h-4 text-[var(--cs-amber)]" />
                           </div>
                         )}
                         <div 
                           className="p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed font-medium"
                           style={{
                             background: isAi ? 'var(--cs-surface-2)' : 'color-mix(in oklab, var(--cs-amber) 15%, var(--cs-surface-2))',
                             border: isAi ? '1px solid rgba(255,255,255,0.04)' : '1px solid var(--cs-amber)',
                             color: isAi ? 'rgba(255,255,255,0.9)' : '#fff',
                             borderRadius: isAi ? '0px 16px 16px 16px' : '16px 0px 16px 16px'
                           }}
                           dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                         />
                         {!isAi && (
                           <div className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in oklab, var(--cs-amber) 10%, transparent)', borderColor: 'var(--cs-amber)' }}>
                             <User className="w-4 h-4 text-[var(--cs-amber)]" />
                           </div>
                         )}
                       </div>
                     );
                   })}
                   
                   {/* Typing Indicator */}
                   {isTyping && (
                     <div className="flex items-start gap-2.5 justify-start">
                       <div className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
                         <Brain className="w-4 h-4 text-[var(--cs-amber)] animate-spin" />
                       </div>
                       <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-[var(--cs-amber)] flex items-center gap-1.5 rounded-tl-none animate-pulse">
                         Asisten sedang menganalisis kondisi udara...
                       </div>
                     </div>
                   )}
                   <div ref={chatEndRef} />
                 </div>

                 {/* Quick Chips Row */}
                 <div className="mb-4 relative z-10 text-left">
                   <div className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 mb-2 flex items-center gap-1">
                     <Sparkles className="w-3 h-3 text-[var(--cs-amber)]" /> Rekomendasi Pertanyaan Cepat:
                   </div>
                   <div className="flex flex-wrap gap-1.5">
                     {[
                       { text: '📊 Kualitas Udara Saat Ini', label: 'Bagaimana status kelayakan udara saat ini?' },
                       { text: '👶 Analisis Kelompok Rentan', label: 'Adakah kelompok rentan yang perlu diwaspadai di ruangan ini?' },
                       { text: '🚨 Panduan Kebocoran Gas', label: 'Apa tindakan yang harus saya lakukan jika terdeteksi kebocoran gas?' },
                       { text: '📐 Dampak Luas & Ventilasi', label: 'Bagaimana pengaruh ventilasi dan luas ruangan terhadap gas karbon?' }
                     ].map((chip) => (
                       <button
                         type="button"
                         key={chip.text}
                         onClick={() => handleAskAI(chip.label)}
                         disabled={isTyping}
                         className="px-3 py-1.5 rounded-full border text-[10px] font-semibold text-zinc-400 hover:text-white hover:border-[var(--cs-amber)] hover:bg-zinc-800/40 transition-all cursor-pointer disabled:opacity-50"
                         style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
                       >
                         {chip.text}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Input form */}
                 <div className="flex gap-2 relative z-10">
                   <input
                     type="text"
                     placeholder="Tanyakan sesuatu ke asisten AI..."
                     value={customQuestion}
                     onChange={(e) => setCustomQuestion(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         handleAskAI(customQuestion);
                         setCustomQuestion('');
                       }
                     }}
                     disabled={isTyping}
                     className="flex-1 bg-black/40 border px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--cs-amber)] text-white focus:ring-1 focus:ring-[var(--cs-amber-glow)] transition-all disabled:opacity-50"
                     style={{ borderColor: 'var(--cs-border)' }}
                   />
                   <button
                     type="button"
                     onClick={() => {
                       handleAskAI(customQuestion);
                       setCustomQuestion('');
                     }}
                     disabled={isTyping || !customQuestion.trim()}
                     className="px-4 py-3 rounded-xl text-black font-black flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                     style={{ background: 'var(--cs-amber)' }}
                   >
                     <Send className="w-4 h-4" />
                   </button>
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
                         connectNulls={true}
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
                       connectNulls={true}
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

       {/* Danger Emergency Alert Modal Popup */}
       <AnimatePresence>
         {isDangerPopupOpen && (
           <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
             {/* Blur Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-[#0c0505]/90 backdrop-blur-lg pointer-events-auto"
             />

             {/* Warning Modal Container */}
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               transition={{ duration: 0.35, ease: "easeOut" }}
               className="w-full max-w-2xl border rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-[0_0_60px_rgba(239,68,68,0.25)] flex flex-col justify-between"
               style={{ 
                 background: 'linear-gradient(145deg, #180909 0%, #0a0303 100%)', 
                 borderColor: 'rgba(239, 68, 68, 0.4)'
               }}
             >
               {/* Visual Hazard Overlay Glow */}
               <div className="absolute -top-12 -right-12 w-64 h-64 bg-red-600 blur-[120px] rounded-full opacity-25 pointer-events-none" />

               <div className="relative z-10 space-y-6">
                 {/* Title Bar */}
                 <div className="flex items-center gap-3 border-b border-red-900/40 pb-4">
                   <div className="w-12 h-12 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center justify-center flex-shrink-0">
                     <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                   </div>
                   <div className="text-left">
                     <h2 className="text-xl font-black text-red-500 tracking-normal uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                       Peringatan Evakuasi Darurat
                     </h2>
                     <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Status: Kebocoran Karbon Monoksida</p>
                   </div>
                 </div>

                 {/* Carbon Level Display */}
                 <div className="p-6 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center justify-between">
                   <div className="text-left">
                     <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Kadar Terdeteksi (Real-time)</span>
                     <h3 className="text-4xl font-black text-red-400 mt-1">{carbonLevel || '1200+'} <span className="text-lg font-bold text-red-700 ml-1">ppm</span></h3>
                   </div>
                   <div className="px-4 py-2 bg-red-600 text-white text-[10px] font-black tracking-widest uppercase rounded-lg animate-bounce">
                     KRITIS
                   </div>
                 </div>

                 {/* Recommendation Content */}
                 <div className="space-y-4">
                   <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-widest text-left">Rekomendasi Tindakan AI (DeepSeek AI Engine):</h4>
                   
                   {dangerPopupLoading ? (
                     <div className="py-12 flex flex-col items-center justify-center gap-3">
                       <Brain className="w-10 h-10 text-red-500 animate-spin" />
                       <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider animate-pulse">Menghubungi DeepSeek AI untuk merumuskan protokol evakuasi...</span>
                     </div>
                   ) : (
                     <div className="p-5 rounded-2xl border border-red-900/20 bg-black/40 max-h-[260px] overflow-y-auto custom-scrollbar text-left text-zinc-300 text-sm leading-relaxed font-medium">
                       <p className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: dangerPopupRecommendation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                     </div>
                   )}
                 </div>

                 {/* Environmental Metadata Checked */}
                 <div className="text-[10px] font-mono text-zinc-500 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-zinc-900 pt-4 text-left">
                   <span>LOKASI: {aiPersonality?.lokasi || '—'}</span>
                   <span>SIRKULASI: {aiPersonality?.sirkulasi || '—'}</span>
                   <span>RISIKO: {aiPersonality?.rentan || '—'}</span>
                   <span>LUAS: {aiPersonality?.luas_ruang || '—'}</span>
                 </div>
               </div>

               {/* Dismiss Action Button */}
               <div className="relative z-10 mt-8 pt-4 border-t border-red-950/40">
                 <button 
                   type="button"
                   onClick={() => setIsDangerPopupOpen(false)}
                   disabled={dangerPopupLoading}
                   className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-xl shadow-red-950/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                 >
                   Saya Mengerti & Mulai Evakuasi
                 </button>
               </div>
             </motion.div>
           </div>
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
