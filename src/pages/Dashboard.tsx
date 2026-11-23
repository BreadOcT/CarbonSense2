/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, History, AlertTriangle, Wind, Clock, ChevronDown,
  ArrowLeft, Settings as SettingsIcon, Download,
  Table, Brain, ShoppingCart, Info, Clock as ClockIcon, ShieldAlert,
  Maximize2, Minimize2, User, LogOut, Cpu, Cloud, Monitor, CheckCircle, XCircle, X,
  Sparkles, Send, Plug, Wifi, Phone, Menu, Check, MessageSquare, Plus, Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { api } from '../lib/api';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { generateSimpleAdvice, generateChatResponse } from '../lib/ai';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface EmergencyContact {
  name: string;
  phone: string;
}

interface ChatMessageItem {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

interface ChatSession {
  id: string;
  deviceId: string;
  roomName: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessageItem[];
}

const DEFAULT_GREETING_MESSAGE: ChatMessageItem = {
  sender: 'ai',
  text: 'Halo! Saya adalah Asisten Keselamatan CarbonSense. Berdasarkan kondisi ruangan dan pembacaan alat saat ini, saya siap membantu Anda menjaga keamanan udara dan mencegah bahaya kebocoran gas.'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDeviceId = searchParams.get('deviceId');
  const [carbonLevel, setCarbonLevel] = useState<number | null>(null);
  const [showReactivationPopup, setShowReactivationPopup] = useState(false);
  const [hasShownOfflinePopup, setHasShownOfflinePopup] = useState(false);
  const lastKnownPingRef = useRef<number | null>(null);
  const [activationStep, setActivationStep] = useState(0);

  // Simple mode state
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(() => {
    return localStorage.getItem('cs_simple_mode') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: 'Kontak Utama', phone: '+6281234567890' }
  ]);

  const toggleSimpleMode = () => {
    const next = !isSimpleMode;
    setIsSimpleMode(next);
    localStorage.setItem('cs_simple_mode', next ? 'true' : 'false');
  };

  const activationSteps = [
    {
      title: '1. Sambungkan Kabel Listrik Alat',
      desc: 'Colokkan kabel USB ke alat CarbonSense dan hubungkan ke stopkontak listrik. Pastikan lampu indikator pada alat menyala.',
      icon: <Plug className="w-10 h-10 text-[#0284C7]" />
    },
    {
      title: '2. Hubungkan HP ke WiFi Alat',
      desc: 'Buka pengaturan WiFi di HP Anda dan pilih jaringan bernama "Setup_CarbonSense" atau "CarbonSense-AP". Halaman pengaturan akan otomatis terbuka.',
      icon: <Wifi className="w-10 h-10 text-[#0284C7]" />
    },
    {
      title: '3. Masukkan WiFi Rumah / Tempat Usaha',
      desc: 'Pilih nama WiFi rumah Anda, ketikkan kata sandi WiFi, lalu tekan "Simpan". Alat akan otomatis tersambung ke internet.',
      icon: <SettingsIcon className="w-10 h-10 text-[#0284C7]" />
    },
    {
      title: '4. Tunggu Pemanasan Sensor (1-2 Menit)',
      desc: 'Tunggu sekitar 1 hingga 2 menit agar sensor gas siap bekerja dengan stabil.',
      icon: <ClockIcon className="w-10 h-10 text-[#0284C7]" />
    },
    {
      title: '5. Alat Siap Memantau 24 Jam',
      desc: 'Setelah tersambung, status di layar akan berubah menjadi "Terhubung" (Hijau) dan pemantauan berjalan otomatis.',
      icon: <CheckCircle className="w-10 h-10 text-[#16A34A]" />
    }
  ];

  const carbonLevelRef = useRef<number | null>(null);
  useEffect(() => {
    carbonLevelRef.current = carbonLevel;
  }, [carbonLevel]);
  const lastSyncedPpmRef = useRef<number | null>(null);
  const lastSyncedStatusRef = useRef<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [aiPersonality, setAiPersonality] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([DEFAULT_GREETING_MESSAGE]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string>('');
  const [showChatHistory, setShowChatHistory] = useState<boolean>(false);
  const [chatHistoryFilter, setChatHistoryFilter] = useState<'device' | 'all'>('device');
  const [isTyping, setIsTyping] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getChatStorageKey = () => {
    const email = localStorage.getItem('cs_user_email') || 'guest';
    return `cs_chat_sessions_${email}`;
  };

  const persistMessagesToSession = (messages: ChatMessageItem[], currentDevId: string, currentRoom: string) => {
    // Only persist if there is at least one user message or emergency analysis beyond initial greeting
    const hasMeaningfulContent = messages.length > 1;
    if (!hasMeaningfulContent || !currentDevId) return;

    const firstUserMsg = messages.find(m => m.sender === 'user')?.text;
    const sessionTitle = firstUserMsg
      ? firstUserMsg.length > 52
        ? firstUserMsg.slice(0, 52) + '...'
        : firstUserMsg
      : 'Analisis Darurat & Keselamatan AI';

    const storageKey = getChatStorageKey();
    setChatSessions(prevSessions => {
      const now = Date.now();
      let targetId = activeChatSessionId;
      let updated: ChatSession[];

      if (targetId && prevSessions.some(s => s.id === targetId)) {
        updated = prevSessions.map(s =>
          s.id === targetId
            ? {
                ...s,
                title: s.title === 'Percakapan Baru' ? sessionTitle : s.title,
                roomName: currentRoom,
                updatedAt: now,
                messages
              }
            : s
        );
      } else {
        targetId = `chat_${now}_${Math.random().toString(36).slice(2, 7)}`;
        setActiveChatSessionId(targetId);
        const newSession: ChatSession = {
          id: targetId,
          deviceId: currentDevId,
          roomName: currentRoom,
          title: sessionTitle,
          createdAt: now,
          updatedAt: now,
          messages
        };
        updated = [newSession, ...prevSessions].slice(0, 50);
      }

      // Sort by most recent
      updated.sort((a, b) => b.updatedAt - a.updatedAt);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleNewChatSession = () => {
    const newId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setActiveChatSessionId(newId);
    setChatMessages([
      {
        ...DEFAULT_GREETING_MESSAGE,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setShowChatHistory(false);
  };

  const handleSelectChatSession = (session: ChatSession) => {
    setActiveChatSessionId(session.id);
    setChatMessages(session.messages && session.messages.length > 0 ? session.messages : [DEFAULT_GREETING_MESSAGE]);
    setShowChatHistory(false);
  };

  const handleDeleteChatSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const storageKey = getChatStorageKey();
    setChatSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      return filtered;
    });
    if (activeChatSessionId === sessionId) {
      setActiveChatSessionId('');
      setChatMessages([DEFAULT_GREETING_MESSAGE]);
    }
  };

  const handleClearAllChatHistory = () => {
    const storageKey = getChatStorageKey();
    setChatSessions([]);
    localStorage.removeItem(storageKey);
    setActiveChatSessionId('');
    setChatMessages([DEFAULT_GREETING_MESSAGE]);
  };

  const [, setConsecutiveDangerCount] = useState<number>(0);
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
    api.ai
      .getRecommendation({
        question: 'Berikan rekomendasi keselamatan evakuasi karena terdeteksi kadar karbon kritis!',
        profile: aiPersonalityRef.current,
        carbonLevel: ppm
      })
      .then(rec => {
        setDangerPopupRecommendation(rec);
        setDangerPopupLoading(false);
        setChatMessages(prev => {
          const hasAlertMessage = prev.some(m => m.text.includes('ANALISIS DARURAT AI'));
          if (hasAlertMessage) return prev;
          const nextMsgs: ChatMessageItem[] = [
            ...prev,
            {
              sender: 'ai',
              text: `**ANALISIS DARURAT AI (Kadar Gas Kritis):**\n\n${rec}`,
              timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            }
          ];
          persistMessagesToSession(
            nextMsgs,
            deviceId,
            aiPersonalityRef.current?.lokasi || 'Ruangan Utama'
          );
          return nextMsgs;
        });
      })
      .catch(err => {
        console.error(err);
        const fallbackRec = `Kadar gas berbahaya terdeteksi tinggi! Segera lakukan tindakan berikut:\n\n1. Buka semua pintu dan jendela lebar-lebar agar gas keluar.\n2. Matikan kompor gas atau lepas regulator tabung LPG. Jangan menyalakan saklar lampu atau korek api.\n3. Bawa seluruh penghuni keluar ruangan menuju tempat terbuka yang segar.`;
        setDangerPopupRecommendation(fallbackRec);
        setDangerPopupLoading(false);
      });
  };

  const [activeDeviceIds, setActiveDeviceIds] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [, setPurchaseStatus] = useState<string>('none');
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

  const [historyRegistry, setHistoryRegistry] = useState<
    Record<string, { timestamp: string; value: number }[]>
  >({});

  const localHistory = historyRegistry[deviceId] || [];

  const [filterOption, setFilterOption] = useState<string>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const handlePrevDay = () => {
    const parts = selectedDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const parts = selectedDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date(Date.now() - 60 * 60 * 1000);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().substring(0, 16);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().substring(0, 16);
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dataPointsLimit, setDataPointsLimit] = useState<number>(10);
  const [, setIsHistoryDropdownOpen] = useState(false);
  const [isPointsDropdownOpen, setIsPointsDropdownOpen] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<'sensor' | 'alert'>('sensor');

  const filterOptionLabels: Record<string, string> = {
    '15': '15 Menit',
    '30': '30 Menit',
    '60': '60 Menit',
    '180': '3 Jam',
    live: 'Live Real-time',
    today: 'Filter Tanggal',
    custom: 'Rentang Kustom'
  };

  // Load Initial Data
  useEffect(() => {
    const savedUser = localStorage.getItem('cs_user');
    const activeDevsStr = localStorage.getItem('cs_active_devices');
    const savedPurchase = localStorage.getItem('cs_purchase_status') || 'none';
    const email = localStorage.getItem('cs_user_email');
    const storedAi =
      (email && localStorage.getItem(`cs_ai_personality_${email}`)) ||
      localStorage.getItem('cs_ai_personality');

    if (savedUser) setUserProfile(JSON.parse(savedUser));
    if (!savedUser && email) setUserProfile({ username: email.split('@')[0], email });

    if (storedAi) {
      try {
        const parsedAi = JSON.parse(storedAi);
        setAiPersonality(parsedAi);
        if (Array.isArray(parsedAi?.emergency_contacts) && parsedAi.emergency_contacts.length > 0) {
          setEmergencyContacts(parsedAi.emergency_contacts);
        }
      } catch (e) {
        console.error('Failed to parse cs_ai_personality in dashboard:', e);
      }
    }

    const storedContacts =
      (email && localStorage.getItem(`cs_emergency_contacts_${email}`)) ||
      localStorage.getItem('cs_emergency_contacts');
    if (storedContacts) {
      try {
        const parsedC = JSON.parse(storedContacts);
        if (Array.isArray(parsedC) && parsedC.length > 0) {
          setEmergencyContacts(parsedC);
        }
      } catch (e) {
        console.error('Failed to parse emergency contacts in dashboard:', e);
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

  // Load history and per-device room profile + chat history when deviceId changes
  useEffect(() => {
    if (!deviceId) return;

    localStorage.setItem('cs_current_device_id', deviceId);

    // Load per-device room profile
    const email = localStorage.getItem('cs_user_email') || '';
    const deviceProfileStr =
      localStorage.getItem(`cs_ai_personality_${deviceId}`) ||
      (email && localStorage.getItem(`cs_ai_personality_${email}`)) ||
      localStorage.getItem('cs_ai_personality');

    if (deviceProfileStr) {
      try {
        const parsedProf = JSON.parse(deviceProfileStr);
        setAiPersonality(parsedProf);
      } catch (e) {
        console.error('Failed to parse device profile:', e);
      }
    }

    const deviceContactsStr =
      localStorage.getItem(`cs_emergency_contacts_${deviceId}`) ||
      (email && localStorage.getItem(`cs_emergency_contacts_${email}`)) ||
      localStorage.getItem('cs_emergency_contacts');

    if (deviceContactsStr) {
      try {
        const parsedC = JSON.parse(deviceContactsStr);
        if (Array.isArray(parsedC) && parsedC.length > 0) {
          setEmergencyContacts(parsedC);
        }
      } catch (e) {
        console.error('Failed to parse device emergency contacts:', e);
      }
    }

    // Load user's saved chat sessions & restore most recent session for this device
    const chatKey = `cs_chat_sessions_${email || 'guest'}`;
    try {
      const rawSessions = localStorage.getItem(chatKey);
      const parsedSessions: ChatSession[] = rawSessions ? JSON.parse(rawSessions) : [];
      if (Array.isArray(parsedSessions)) {
        setChatSessions(parsedSessions);
        const latestForDevice = parsedSessions.find(s => s.deviceId === deviceId);
        if (latestForDevice && Array.isArray(latestForDevice.messages) && latestForDevice.messages.length > 0) {
          setActiveChatSessionId(latestForDevice.id);
          setChatMessages(latestForDevice.messages);
        } else {
          setActiveChatSessionId('');
          setChatMessages([DEFAULT_GREETING_MESSAGE]);
        }
      }
    } catch (e) {
      console.error('Failed to load chat sessions:', e);
    }

    isInitialCheckedRef.current = false;
    initialPingRef.current = null;
    lastKnownPingRef.current = null;

    const key = `cs_history_${deviceId}`;
    const saved = localStorage.getItem(key);
    let hist = saved ? JSON.parse(saved) : [];

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    hist = hist.filter((item: any) => parseInt(item.timestamp) > sevenDaysAgo);
    localStorage.setItem(key, JSON.stringify(hist));

    setHistoryRegistry(prev => ({ ...prev, [deviceId]: hist }));

    const checkInitialDeviceStatus = async () => {
      try {
        const email = localStorage.getItem('cs_user_email') || '';
        const myDevs = await api.devices.list(email);
        const activeDev = myDevs.find((d: any) => d.id === deviceId);
        if (activeDev) {
          if (activeDev.status === 'Offline') {
            setIsDeviceOffline(true);
          } else {
            setIsDeviceOffline(false);
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

    let isInitialLoad = true;
    const deviceRef = ref(rtdb, deviceId);

    const unsubscribe = onValue(deviceRef, snapshot => {
      const data = snapshot.val();
      if (!data) return;

      const ppmVal =
        data.nilai_ppm !== undefined && data.nilai_ppm !== '--' ? Number(data.nilai_ppm) : null;
      const statusVal = data.status || 'Offline';
      const isFbOffline = statusVal === 'Offline';

      setIsDeviceOffline(isFbOffline);

      if (ppmVal !== null && carbonLevelRef.current === null) {
        setCarbonLevel(ppmVal);
      }

      if (!isInitialLoad && isFbOffline && ppmVal !== null) {
        api.devices
          .updateTelemetry({
            id: deviceId,
            ppm: ppmVal,
            status: ppmVal > 1200 ? 'Warning' : 'Online'
          })
          .catch(err =>
            console.error('Failed to automatically transition offline device to online:', err)
          );
      }

      isInitialLoad = false;

      if (ppmVal !== null) {
        setCarbonLevel(ppmVal);

        setHistoryRegistry(registry => {
          const hist = registry[deviceId] || [];
          const nowStr = Date.now().toString();
          const lastEntry = hist[hist.length - 1];
          if (
            lastEntry &&
            Date.now() - Number(lastEntry.timestamp) < 2000 &&
            lastEntry.value === ppmVal
          ) {
            return registry;
          }
          const newEntry = { timestamp: nowStr, value: ppmVal };

          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const updated = [...hist, newEntry]
            .filter(item => parseInt(item.timestamp) > sevenDaysAgo)
            .slice(-5000);

          localStorage.setItem(`cs_history_${deviceId}`, JSON.stringify(updated));
          return { ...registry, [deviceId]: updated };
        });

        if (!isFbOffline) {
          setLastUpdateTime(Date.now());

          if (ppmVal > 1200) {
            setConsecutiveDangerCount(c => {
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

          const targetStatus = ppmVal > 1200 ? 'Warning' : 'Online';
          if (
            ppmVal !== lastSyncedPpmRef.current ||
            targetStatus !== lastSyncedStatusRef.current
          ) {
            lastSyncedPpmRef.current = ppmVal;
            lastSyncedStatusRef.current = targetStatus;

            api.devices
              .updateTelemetry({
                id: deviceId,
                ppm: ppmVal,
                status: targetStatus,
                skipFirebaseSync: true
              })
              .catch(err => console.error('Failed to sync telemetry to MySQL:', err));
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [deviceId, accessDenied]);

  // Client-side 5-minute inactivity check
  useEffect(() => {
    if (!deviceId || accessDenied || isDeviceOffline) return;

    const interval = setInterval(() => {
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - lastUpdateTime > fiveMinutes) {
        setIsDeviceOffline(true);

        api.devices
          .updateTelemetry({
            id: deviceId,
            ppm: carbonLevel !== null ? carbonLevel : 0,
            status: 'Offline'
          })
          .catch(err => console.error('Failed to sync offline status to MySQL:', err));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [deviceId, accessDenied, isDeviceOffline, lastUpdateTime, carbonLevel]);

  // Reactivation guide auto-open trigger
  useEffect(() => {
    if (isDeviceOffline && !hasShownOfflinePopup) {
      setShowReactivationPopup(true);
      setHasShownOfflinePopup(true);
    } else if (!isDeviceOffline) {
      setHasShownOfflinePopup(false);
    }
  }, [isDeviceOffline, hasShownOfflinePopup]);

  const handlePurchase = () => {
    localStorage.setItem('cs_purchase_status', 'pending');
    setPurchaseStatus('pending');
  };

  useMemo(() => {
    return generateSimpleAdvice(aiPersonality, carbonLevel, isDeviceOffline);
  }, [carbonLevel, aiPersonality, isDeviceOffline]);

  const handleAskAI = (questionText: string) => {
    if (!questionText.trim() || isTyping) return;

    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessageItem = { sender: 'user', text: questionText, timestamp: timeNow };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    persistMessagesToSession(updatedMessages, deviceId, aiPersonality?.lokasi || 'Ruangan Utama');
    setIsTyping(true);

    setTimeout(async () => {
      const currentPpm = carbonLevelRef.current;
      try {
        const aiResponse = await generateChatResponse(
          questionText,
          aiPersonality,
          currentPpm,
          isDeviceOffline,
          updatedMessages
        );
        const replyTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const finalMessages: ChatMessageItem[] = [
          ...updatedMessages,
          { sender: 'ai', text: aiResponse, timestamp: replyTime }
        ];
        setChatMessages(finalMessages);
        persistMessagesToSession(finalMessages, deviceId, aiPersonality?.lokasi || 'Ruangan Utama');
      } catch (err) {
        console.error(err);
        const errMessages: ChatMessageItem[] = [
          ...updatedMessages,
          {
            sender: 'ai',
            text: 'Gagal memproses respons asisten AI.',
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          }
        ];
        setChatMessages(errMessages);
        persistMessagesToSession(errMessages, deviceId, aiPersonality?.lokasi || 'Ruangan Utama');
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
      return endMs - startMs >= 60 * 60 * 1000;
    }
    return false;
  }, [filterOption, customStart, customEnd]);

  const processedChartData = useMemo(() => {
    let filtered = [...localHistory];

    let startTime = Date.now() - 30 * 60 * 1000;
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
      const dateParts = selectedDate.split('-');
      const dStart = new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2]),
        0,
        0,
        0,
        0
      );
      const dEnd = new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2]),
        23,
        59,
        59,
        999
      );
      startTime = dStart.getTime();
      endTime = dEnd.getTime();
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
            timeFormatted: d.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          };
        });
    }

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
        timeFormatted = d.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }

      if (pointsInSlot.length > 0) {
        const avg = Math.round(
          pointsInSlot.reduce((sum, item) => sum + item.value, 0) / pointsInSlot.length
        );
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
  }, [
    localHistory,
    filterOption,
    dataPointsLimit,
    isGreaterOrEqual60Min,
    customStart,
    customEnd,
    selectedDate
  ]);

  const displayedHistory = useMemo(() => {
    let filtered = [...localHistory];
    let startTime = 0;
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
      const dateParts = selectedDate.split('-');
      const dStart = new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2]),
        0,
        0,
        0,
        0
      );
      const dEnd = new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2]),
        23,
        59,
        59,
        999
      );
      startTime = dStart.getTime();
      endTime = dEnd.getTime();
    } else if (filterOption === 'custom') {
      if (customStart && customEnd) {
        startTime = new Date(customStart).getTime();
        endTime = new Date(customEnd).getTime();
      }
    } else if (filterOption === 'live') {
      startTime = Date.now() - 5 * 60 * 1000;
    }

    filtered = filtered.filter(item => {
      const ts = parseInt(item.timestamp);
      return ts >= startTime && ts <= endTime;
    });

    return filtered
      .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp))
      .slice(0, 50);
  }, [localHistory, filterOption, selectedDate, customStart, customEnd]);

  const hasChartData = useMemo(() => {
    if (filterOption === 'live') {
      return processedChartData.length > 0;
    }
    return processedChartData.some(item => item.value !== null);
  }, [processedChartData, filterOption]);

  const isAlert = carbonLevel !== null && carbonLevel > 1200;
  const isWarning = carbonLevel !== null && carbonLevel >= 700 && carbonLevel <= 1200;

  // WhatsApp Emergency Message Helper
  const sendWhatsAppEmergency = (contact?: EmergencyContact) => {
    const target = contact || emergencyContacts[0] || { name: 'Kontak Darurat', phone: '+6281234567890' };
    const cleanPhone = (target.phone || '').replace(/[^0-9]/g, '');
    const roomName = aiPersonality?.lokasi || 'Ruangan Utama';
    const currentPpm = carbonLevel !== null ? carbonLevel : 1200;
    const message = encodeURIComponent(
      `[PERINGATAN DARURAT CARBONSENSE]\nHalo ${target.name}, terdeteksi indikasi KEBOCORAN GAS / UDARA BERBAHAYA di *${roomName}* (Alat: ${deviceId}) dengan kadar *${currentPpm} PPM* pada pukul ${new Date().toLocaleTimeString('id-ID')}.\n\nMohon segera bantu periksa kondisi ruangan, buka ventilasi, dan matikan sumber gas!`
    );
    window.open(`https://wa.me/${cleanPhone || '6281234567890'}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  // Export functions
  const exportToExcel = () => {
    const data = displayedHistory.map(item => ({
      Waktu: new Date(parseInt(item.timestamp)).toLocaleString(),
      'Kadar CO (ppm)': item.value,
      Status: item.value < 700 ? 'Aman' : item.value <= 1200 ? 'Waspada' : 'Bahaya'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CarbonSense Data');
    XLSX.writeFile(wb, `Report_CarbonSense_${deviceId}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(2, 132, 199); // Ocean Blue #0284C7
    doc.text('Laporan Pemantauan CarbonSense', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Pengguna: ${userProfile?.username || 'Pelanggan'}`, 14, 30);
    doc.text(`Kode Alat: ${deviceId}`, 14, 35);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 40);

    const tableData = displayedHistory.map(item => [
      new Date(parseInt(item.timestamp)).toLocaleString('id-ID'),
      `${item.value} ppm`,
      item.value < 700
        ? 'Aman (Normal)'
        : item.value <= 1200
        ? 'Waspada (Perlu Ventilasi)'
        : 'Bahaya (Indikasi Gas Bocor!)'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Waktu Pencatatan', 'Kadar PPM', 'Status Keamanan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199], textColor: 255 },
      styles: { fontSize: 9 },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 2) {
          const txt = data.cell.text[0];
          if (txt.includes('Bahaya')) doc.setTextColor(220, 38, 38);
          else if (txt.includes('Waspada')) doc.setTextColor(234, 88, 12);
          else doc.setTextColor(22, 163, 74);
        }
      }
    });

    doc.save(`Report_CarbonSense_${deviceId}.pdf`);
  };

  const roomName = aiPersonality?.lokasi || 'Ruangan Utama';

  return (
    <div className="min-h-screen bg-[#F0F9FF] text-[#0F172A] font-sans overflow-x-hidden flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Left: Back & Brand + Device Switcher */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              to="/select-device"
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-[#475569] hover:text-[#0284C7] group shrink-0"
              title="Kembali ke Pilih Alat"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link to="/" className="flex items-center gap-2 shrink-0">
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
              <span className="font-black text-base tracking-tight hidden sm:block text-[#0F172A]">
                CARBONSENSE
              </span>
            </Link>

            {/* Quick Device Dropdown */}
            {!accessDenied && activeDeviceIds.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#F9FAFB] border border-slate-200 px-2.5 py-1.5 rounded-xl max-w-[165px] sm:max-w-[270px]">
                <Cpu className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                <select
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  aria-label="Pilih Perangkat"
                  className="bg-transparent text-xs font-mono font-bold text-[#0F172A] focus:outline-none cursor-pointer truncate w-full"
                >
                  {activeDeviceIds.map(id => {
                    let devRoom = 'Ruangan Utama';
                    try {
                      const p = localStorage.getItem(`cs_ai_personality_${id}`);
                      if (p) devRoom = JSON.parse(p).lokasi || devRoom;
                    } catch {
                      // ignore
                    }
                    return (
                      <option key={id} value={id}>
                        {id} ({id === deviceId ? roomName : devRoom})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Center Network Status Pill (Desktop) */}
          {deviceId && !accessDenied && (
            <div ref={diagnosticRef} className="hidden lg:block relative shrink-0">
              <button
                type="button"
                onClick={() => setIsDiagnosticOpen(!isDiagnosticOpen)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#F9FAFB] hover:bg-slate-100 border border-slate-200 text-xs transition cursor-pointer"
                title="Klik untuk melihat detail jalur koneksi alat"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isDeviceOffline ? 'bg-[#DC2626]' : 'bg-[#16A34A] animate-pulse'
                  }`}
                />
                <span className="text-[#0F172A] font-semibold">
                  {isDeviceOffline ? 'ESP32 Offline • Terputus' : 'ESP32 Online • Aktif'}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[#475569] font-mono text-[11px]">
                  Sinkron: {new Date(lastUpdateTime).toLocaleTimeString('id-ID')}
                </span>
              </button>

              <AnimatePresence>
                {isDiagnosticOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 p-5 rounded-3xl bg-white border border-slate-200 shadow-2xl z-50 text-left"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="text-[11px] font-mono text-[#475569] uppercase tracking-wider font-bold">
                        Pemeriksaan Jalur Koneksi Alat
                      </div>

                      <div className="flex items-center justify-between px-2 py-3 relative">
                        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0 rounded-full">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              isDeviceOffline ? 'w-0' : 'w-full bg-[#16A34A]'
                            }`}
                          />
                        </div>

                        <div className="flex flex-col items-center gap-1 z-10">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                              isDeviceOffline
                                ? 'bg-slate-100 border-slate-300 text-slate-400'
                                : 'bg-[#DCFCE7] border-[#16A34A] text-[#16A34A]'
                            }`}
                          >
                            <Cpu className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold text-[#0F172A]">Alat</span>
                        </div>

                        {isDeviceOffline && (
                          <div className="absolute left-[30%] top-1/2 -translate-y-1/2 z-20">
                            <div className="w-5 h-5 bg-[#DC2626] rounded-full flex items-center justify-center shadow">
                              <X className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col items-center gap-1 z-10">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                              isDeviceOffline
                                ? 'bg-slate-100 border-slate-300 text-slate-400'
                                : 'bg-[#DCFCE7] border-[#16A34A] text-[#16A34A]'
                            }`}
                          >
                            <Cloud className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold text-[#0F172A]">Server</span>
                        </div>

                        <div className="flex flex-col items-center gap-1 z-10">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                              isDeviceOffline
                                ? 'bg-slate-100 border-slate-300 text-slate-400'
                                : 'bg-[#DCFCE7] border-[#16A34A] text-[#16A34A]'
                            }`}
                          >
                            <Monitor className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold text-[#0F172A]">Layar</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3 text-xs leading-relaxed">
                        {isDeviceOffline ? (
                          <div className="text-[#DC2626] space-y-1.5">
                            <div className="font-bold flex items-center gap-1.5">
                              <XCircle className="w-4 h-4" /> Alat Sedang Mati / Terputus
                            </div>
                            <p className="text-[11px] text-[#475569]">
                              Alat tidak mengirim data dalam 5 menit terakhir. Pastikan kabel daya menyala dan WiFi rumah aktif.
                            </p>
                          </div>
                        ) : (
                          <div className="text-[#16A34A] space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4" /> Koneksi Alat Lancar &amp; Aktif
                            </div>
                            <p className="text-[11px] text-[#475569]">
                              Data kualitas udara dikirim secara langsung dari sensor ke layar Anda.
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

          {/* Right: Mode Toggle, Navigation Links, Mobile Menu Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
            {deviceId && !accessDenied && (
              <button
                type="button"
                onClick={toggleSimpleMode}
                className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                  isSimpleMode
                    ? 'border-[#0284C7] bg-[#E0F2FE] text-[#0284C7]'
                    : 'border-slate-200 bg-white text-[#475569] hover:border-[#0284C7] hover:text-[#0284C7]'
                }`}
                title="Ganti Mode Tampilan (Sederhana / Detail Teknis)"
              >
                <span>{isSimpleMode ? 'Mode Sederhana' : 'Mode Detail'}</span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-2">
              <Link
                to="/select-device"
                className="px-3 py-1.5 rounded-xl text-[#475569] hover:text-[#0284C7] border border-slate-200 bg-white hover:bg-[#F0F9FF] font-semibold transition"
              >
                Ganti Alat
              </Link>
              <Link
                to={deviceId ? `/settings?deviceId=${encodeURIComponent(deviceId)}` : '/settings'}
                className="px-3 py-1.5 rounded-xl text-[#475569] hover:text-[#0284C7] border border-slate-200 bg-white hover:bg-[#F0F9FF] font-semibold transition"
              >
                Pengaturan AI
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E0F2FE] text-[#0284C7] border border-[#0284C7]/30 hover:bg-[#0284C7] hover:text-white transition font-bold"
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>{userProfile?.username || 'Pelanggan'}</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowReactivationPopup(true)}
                className="px-2.5 py-1.5 rounded-xl text-[#0284C7] border border-[#0284C7]/30 bg-white hover:bg-[#E0F2FE] font-semibold transition cursor-pointer"
              >
                Panduan WiFi
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-300 bg-white text-[#0F172A] cursor-pointer"
              aria-label="Menu Navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2"
            >
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-[#F9FAFB] text-[#0F172A] font-semibold text-center"
                >
                  Pengaturan Ruangan
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs px-3 py-2.5 rounded-xl border border-[#0284C7]/30 bg-[#E0F2FE] text-[#0284C7] font-bold text-center"
                >
                  Profil ({userProfile?.username || 'Akun'})
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowReactivationPopup(true);
                  }}
                  className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-[#F9FAFB] text-[#0F172A] font-semibold text-center cursor-pointer"
                >
                  Panduan WiFi Alat
                </button>
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
                  className="text-xs px-3 py-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] font-bold text-center cursor-pointer"
                >
                  Keluar Akun
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {accessDenied ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="max-w-md w-full p-8 bg-white border-2 border-[#DC2626] rounded-3xl shadow-xl">
              <div className="w-16 h-16 bg-[#FEE2E2] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#DC2626]">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#DC2626] mb-2">Akses Alat Ditolak</h2>
              <p className="text-[#475569] text-xs leading-relaxed mb-6">
                Perangkat ini belum ditautkan ke akun Anda. Silakan pilih perangkat yang terdaftar pada akun Anda.
              </p>
              <button
                onClick={() => setSearchParams({})}
                className="w-full py-3.5 px-6 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Kembali ke Perangkat Saya
              </button>
            </div>
          </div>
        ) : !deviceId ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center w-full">
            <header className="mb-6">
              <h1 className="text-3xl font-extrabold text-[#0F172A] mb-1">
                Halo, {userProfile?.username || 'Pelanggan'}!
              </h1>
              <p className="text-[#475569] text-xs">
                Ikuti panduan singkat berikut untuk menyalakan alat CarbonSense Anda.
              </p>
            </header>

            <div className="max-w-md w-full p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-left">
              <h3 className="text-xs font-mono text-[#0284C7] uppercase tracking-widest font-bold mb-4">
                Panduan Menyalakan Alat
              </h3>

              <div className="space-y-4 min-h-[140px] flex flex-col justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD]">
                    {activationSteps[activationStep].icon}
                  </div>
                  <h4 className="text-sm font-extrabold text-[#0F172A]">
                    {activationSteps[activationStep].title}
                  </h4>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {activationSteps[activationStep].desc}
                </p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setActivationStep(prev => Math.max(0, prev - 1))}
                  disabled={activationStep === 0}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-[#475569] disabled:opacity-40 cursor-pointer"
                >
                  Sebelumnya
                </button>
                <span className="text-[11px] font-mono text-[#475569]">
                  Langkah {activationStep + 1} / {activationSteps.length}
                </span>
                {activationStep < activationSteps.length - 1 ? (
                  <button
                    onClick={() => setActivationStep(prev => prev + 1)}
                    className="px-4 py-2 bg-[#0284C7] text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Lanjut
                  </button>
                ) : (
                  <button
                    onClick={() => setActivationStep(0)}
                    className="px-4 py-2 border border-[#0284C7] text-[#0284C7] font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Ulangi
                  </button>
                )}
              </div>

              <div className="border-t border-slate-200 mt-6 pt-5 text-center">
                <p className="text-xs text-[#475569] mb-3">Belum memiliki alat fisik CarbonSense?</p>
                <button
                  onClick={handlePurchase}
                  className="w-full py-3 px-6 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Pesan Perangkat Sekarang
                </button>
              </div>
            </div>
          </div>
        ) : isSimpleMode ? (
          /* ============================================================================
             SIMPLE MODE VIEW (CLEAN & FOCUSED — ONLY THIS SECTION + NAVBAR)
             ============================================================================ */
          <div className="max-w-2xl mx-auto my-2">
            {/* Big Status Card */}
            <div
              className={`rounded-3xl p-8 sm:p-10 text-center border-2 transition-all duration-300 shadow-lg mb-5 ${
                isDeviceOffline
                  ? 'bg-[#FEF2F2] border-[#FECACA]'
                  : isAlert
                  ? 'bg-[#FEF2F2] border-[#DC2626]'
                  : isWarning
                  ? 'bg-[#FFF7ED] border-[#FDBA74]'
                  : 'bg-[#F0FDF4] border-[#86EFAC]'
              }`}
            >
              {/* Status Icon */}
              <div
                className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-5 border-2 ${
                  isDeviceOffline
                    ? 'bg-[#FEE2E2] border-[#DC2626]/30 text-[#DC2626]'
                    : isAlert
                    ? 'bg-[#FEE2E2] border-[#DC2626] text-[#DC2626] animate-bounce'
                    : isWarning
                    ? 'bg-[#FFEDD5] border-[#EA580C]/40 text-[#EA580C]'
                    : 'bg-[#DCFCE7] border-[#16A34A]/30 text-[#16A34A]'
                }`}
              >
                {isDeviceOffline ? (
                  <Wifi className="w-12 h-12" />
                ) : isAlert || isWarning ? (
                  <AlertTriangle className="w-12 h-12" />
                ) : (
                  <Check className="w-12 h-12 stroke-[3]" />
                )}
              </div>

              {/* Giant Status Label */}
              <h2
                className={`text-4xl sm:text-5xl font-black tracking-tight mb-3 ${
                  isDeviceOffline || isAlert
                    ? 'text-[#DC2626]'
                    : isWarning
                    ? 'text-[#EA580C]'
                    : 'text-[#16A34A]'
                }`}
              >
                {isDeviceOffline
                  ? 'ALAT MATI'
                  : isAlert
                  ? 'BAHAYA!'
                  : isWarning
                  ? 'WASPADA'
                  : 'AMAN'}
              </h2>

              {/* Plain Layman Explanation */}
              <p className="text-base sm:text-lg text-[#0F172A] font-semibold max-w-md mx-auto leading-relaxed">
                {isDeviceOffline
                  ? 'Alat pemantau sedang mati atau terputus dari WiFi rumah. Pastikan kabel listrik alat menyala.'
                  : isAlert
                  ? 'TERDETEKSI KEBOCORAN GAS! Segera buka pintu dan jendela, matikan kompor, dan keluar ruangan!'
                  : isWarning
                  ? 'Udara mulai kurang bersih. Sebaiknya segera buka jendela atau pintu agar udara segar masuk.'
                  : 'Udara di ruangan ini bersih dan tidak berbahaya. Anda dan keluarga aman.'}
              </p>

              {/* Room / Device Pill */}
              <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-[#475569] font-semibold shadow-sm">
                <span>Alat di:</span>
                <strong className="text-[#0F172A]">{roomName}</strong>
                <span className="font-mono text-[11px] text-[#0284C7]">({deviceId})</span>
              </div>

              {/* Action Button if Offline or Danger */}
              {isDeviceOffline && (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setShowReactivationPopup(true)}
                    className="px-6 py-3 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
                  >
                    Lihat Cara Menyambungkan Alat
                  </button>
                </div>
              )}

              {isAlert && !isDeviceOffline && (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDangerPopupOpen(true);
                      if (!dangerPopupRecommendation) {
                        loadDangerRecommendation(carbonLevel || 1200);
                      }
                    }}
                    className="px-6 py-3 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white font-extrabold text-xs shadow-md cursor-pointer animate-pulse"
                  >
                    Buka Langkah Penyelamatan Darurat
                  </button>
                </div>
              )}
            </div>

            {/* 2 Action Cards: Tips & WhatsApp Help */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Safety Tips Card */}
              <div
                className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isAlert
                    ? 'bg-[#FEF2F2] border-[#FECACA]'
                    : isWarning
                    ? 'bg-[#FFF7ED] border-[#FED7AA]'
                    : 'bg-[#F0FDF4] border-[#BBF7D0]'
                }`}
              >
                <div>
                  <p
                    className={`text-sm font-extrabold mb-3 flex items-center gap-2 ${
                      isAlert
                        ? 'text-[#DC2626]'
                        : isWarning
                        ? 'text-[#EA580C]'
                        : 'text-[#16A34A]'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {isAlert
                        ? 'TINDAKAN DARURAT SEKARANG:'
                        : isWarning
                        ? 'Langkah Pencegahan Sekarang:'
                        : 'Tips Keselamatan Hari Ini:'}
                    </span>
                  </p>
                  <ul className="text-xs sm:text-sm text-[#0F172A] space-y-2 leading-relaxed font-medium">
                    {isAlert ? (
                      <>
                        <li>• <strong>Buka semua pintu &amp; jendela</strong> lebar-lebar</li>
                        <li>• <strong>Matikan kompor</strong> &amp; jangan nyalakan saklar listrik</li>
                        <li>• <strong>Segera keluar ruangan</strong> ke tempat terbuka</li>
                      </>
                    ) : isWarning ? (
                      <>
                        <li>• Buka jendela dan pintu ruangan sekarang</li>
                        <li>• Nyalakan kipas angin atau penghisap asap dapur</li>
                        <li>• Periksa apakah kompor gas masih menyala</li>
                      </>
                    ) : (
                      <>
                        <li>• Buka jendela setiap pagi minimal 15 menit</li>
                        <li>• Pastikan lubang udara tidak terhalang barang</li>
                        <li>• Periksa selang &amp; regulator tabung gas secara rutin</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* WhatsApp Quick Emergency Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-sm font-extrabold text-[#0F172A] mb-1">Butuh Bantuan Cepat?</p>
                  <p className="text-xs text-[#475569] mb-4 leading-relaxed">
                    Kirim pesan peringatan otomatis ke nomor WhatsApp keluarga yang sudah terdaftar (
                    <strong className="text-[#0F172A]">{emergencyContacts[0]?.name || 'Kontak Utama'}</strong>).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => sendWhatsAppEmergency(emergencyContacts[0])}
                  className="w-full py-4 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-[#16A34A]/20 cursor-pointer active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>Kirim Pesan Darurat WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Footer Info & Switch to Technical Mode */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569] px-2 pt-2">
              <span>
                Terakhir diperbarui: {new Date(lastUpdateTime).toLocaleTimeString('id-ID')}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDangerPopupOpen(true);
                    if (!dangerPopupRecommendation) {
                      loadDangerRecommendation(carbonLevel || 1200);
                    }
                  }}
                  className="text-[#DC2626] font-bold hover:underline cursor-pointer"
                >
                  Uji Tampilan Peringatan Bahaya
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={toggleSimpleMode}
                  className="text-[#0284C7] font-bold hover:underline cursor-pointer"
                >
                  Beralih ke Mode Detail Teknis -&gt;
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================================
             DETAILED TECHNICAL MODE VIEW (FOLLOWING TESTING-SITE DASHBOARD SCREENSHOT)
             ============================================================================ */
          <div className="space-y-6">
            {/* ROW 1: Primary Telemetry Card (2 Cols) + AI Advice & Hardware Status (1 Col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Gas Telemetry Widget (2 Cols) */}
              <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md relative overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] text-[#0284C7] border border-[#0284C7]/20 flex items-center justify-center font-bold">
                        <Wind className="w-5 h-5" />
                      </div>
                      <div>
                        <h2
                          className="text-lg font-bold text-[#0F172A] tracking-wider uppercase"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          Kondisi Kualitas Udara
                        </h2>
                        <p className="text-xs text-[#475569]">Lokasi: {roomName}</p>
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        isDeviceOffline
                          ? 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/30'
                          : isAlert
                          ? 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/40 animate-pulse'
                          : isWarning
                          ? 'bg-[#FFEDD5] text-[#EA580C] border-[#EA580C]/30'
                          : 'bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/30'
                      }`}
                    >
                      {isDeviceOffline
                        ? 'Alat Offline'
                        : isAlert
                        ? 'Bahaya Kebocoran!'
                        : isWarning
                        ? 'Waspada Ventilasi'
                        : 'Aman & Stabil'}
                    </div>
                  </div>

                  {/* Metric Display & Auxiliary Parameters (Replaced Temp/Humidity with Status Online & Batas Bahaya) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-6">
                    {/* Big PPM Counter with Range Bar */}
                    <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[#F9FAFB] border border-slate-200 text-center relative">
                      <span className="text-xs uppercase font-bold tracking-widest text-[#475569] mb-1">
                        Konsentrasi Gas Terkini
                      </span>
                      <div
                        className="text-7xl tracking-wider my-2 font-bold leading-none"
                        style={{
                          fontFamily: 'var(--font-display)',
                          color: isDeviceOffline
                            ? '#94A3B8'
                            : isAlert
                            ? '#DC2626'
                            : isWarning
                            ? '#EA580C'
                            : '#16A34A'
                        }}
                      >
                        {carbonLevel !== null ? carbonLevel : 0}
                      </div>
                      <span className="text-xs font-mono text-[#475569] uppercase tracking-wider">
                        PPM (Kadar Gas di Udara)
                      </span>

                      {/* Safety Range Indicator Bar */}
                      <div className="w-full mt-5">
                        <div className="flex justify-between text-[10px] text-[#475569] mb-1 font-mono font-semibold">
                          <span>0</span>
                          <span className="text-[#16A34A]">Aman (&lt;700)</span>
                          <span className="text-[#EA580C]">Waspada (700)</span>
                          <span className="text-[#DC2626]">Bahaya (&gt;1200)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                          <div className="h-full bg-[#16A34A] w-[40%]" />
                          <div className="h-full bg-[#EA580C] w-[25%]" />
                          <div className="h-full bg-[#DC2626] w-[35%]" />
                        </div>
                      </div>
                    </div>

                    {/* 2x2 Parameter Cards (Status Koneksi, Batas Waspada, Status Keamanan, Batas Bahaya) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-slate-200">
                        <div className="flex items-center justify-between text-[#475569] text-xs mb-1">
                          <span>Status Alat</span>
                          <span
                            className={`text-[11px] font-bold ${
                              isDeviceOffline ? 'text-[#DC2626]' : 'text-[#16A34A]'
                            }`}
                          >
                            KONEKSI
                          </span>
                        </div>
                        <div
                          className={`text-2xl font-bold font-mono ${
                            isDeviceOffline ? 'text-[#DC2626]' : 'text-[#16A34A]'
                          }`}
                        >
                          {isDeviceOffline ? 'Offline' : 'Online'}
                        </div>
                        <span className="text-[10px] text-[#475569]">
                          {isDeviceOffline ? 'Terputus dari WiFi' : 'Terhubung aktif'}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-slate-200">
                        <div className="flex items-center justify-between text-[#475569] text-xs mb-1">
                          <span>Batas Waspada</span>
                          <span className="text-[#EA580C] text-[11px] font-bold">WARN</span>
                        </div>
                        <div className="text-2xl font-bold text-[#0F172A] font-mono">700</div>
                        <span className="text-[10px] text-[#475569]">PPM (Buka ventilasi)</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-slate-200">
                        <div className="flex items-center justify-between text-[#475569] text-xs mb-1">
                          <span>Status Udara</span>
                          <span className="text-[#0284C7] text-[11px] font-bold">LEVEL</span>
                        </div>
                        <div
                          className={`text-2xl font-bold font-mono ${
                            isDeviceOffline
                              ? 'text-[#475569]'
                              : isAlert
                              ? 'text-[#DC2626]'
                              : isWarning
                              ? 'text-[#EA580C]'
                              : 'text-[#16A34A]'
                          }`}
                        >
                          {isDeviceOffline
                            ? 'Mati'
                            : isAlert
                            ? 'Bahaya'
                            : isWarning
                            ? 'Waspada'
                            : 'Aman'}
                        </div>
                        <span className="text-[10px] text-[#475569]">Indikasi sensor MQ</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-slate-200">
                        <div className="flex items-center justify-between text-[#475569] text-xs mb-1">
                          <span>Batas Bahaya Alarm</span>
                          <span className="text-[#DC2626] text-[11px] font-bold">LIMIT</span>
                        </div>
                        <div className="text-2xl font-bold text-[#0F172A] font-mono">1200</div>
                        <span className="text-[10px] text-[#475569]">PPM (Batas evakuasi)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action & Info Bar */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#475569] font-semibold">Indikator Ambang Gas:</span>
                    <span className="px-3 py-1 rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/30 font-bold">
                      Aman (&lt;700)
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-[#FFF7ED] text-[#EA580C] border border-[#EA580C]/30 font-bold">
                      Waspada (700–1200)
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/30 font-bold">
                      Bahaya (&gt;1200)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {isDeviceOffline && (
                      <button
                        type="button"
                        onClick={() => setShowReactivationPopup(true)}
                        className="px-3 py-1.5 rounded-lg bg-[#E0F2FE] text-[#0284C7] border border-[#0284C7]/30 hover:bg-[#BAE6FD] font-bold transition cursor-pointer"
                      >
                        Panduan Reaktivasi WiFi
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsDangerPopupOpen(true);
                        if (!dangerPopupRecommendation) {
                          loadDangerRecommendation(carbonLevel || 1200);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30 hover:bg-red-200 font-bold transition cursor-pointer"
                    >
                      Uji Sirene Alarm
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column of Row 1: Petunjuk Keselamatan Udara & Status Alat Pendeteksi */}
              <div className="space-y-6 flex flex-col justify-between">
                {/* Petunjuk Keselamatan Udara Box */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-pulse" />
                        <h3 className="text-xs font-bold text-[#0284C7] uppercase tracking-wider">
                          Petunjuk Keselamatan Udara
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] border border-[#0284C7]/20">
                        Otomatis
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#0F172A] mb-2">
                      {isDeviceOffline
                        ? 'Alat Pemantau Sedang Offline'
                        : isAlert
                        ? 'BAHAYA: Indikasi Kebocoran Gas!'
                        : isWarning
                        ? 'Waspada: Perlu Ventilasi Tambahan'
                        : 'Kualitas Udara Bersih & Aman'}
                    </h4>
                    <p className="text-xs text-[#475569] leading-relaxed mb-4">
                      {isDeviceOffline
                        ? `Alat ${deviceId} sedang tidak mengirim data ke server. Pastikan catu daya menyala dan WiFi terhubung.`
                        : `Kadar gas saat ini ${
                            carbonLevel !== null ? carbonLevel : 0
                          } PPM (${
                            isAlert
                              ? 'berbahaya — segera buka seluruh pintu/jendela dan matikan sumber gas'
                              : isWarning
                              ? 'mulai meningkat — sebaiknya segera buka jendela atau pintu ruangan'
                              : 'sangat aman'
                          }). Sirkulasi di ${roomName} berjalan baik.`}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-[#475569] font-medium truncate max-w-[180px]">
                      Lokasi: {roomName}
                    </span>
                    <Link
                      to={deviceId ? `/settings?deviceId=${encodeURIComponent(deviceId)}` : '/settings'}
                      className="text-[#0284C7] font-bold hover:underline shrink-0"
                    >
                      Ubah Pengaturan &rarr;
                    </Link>
                  </div>
                </div>

                {/* Status Alat Pendeteksi Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] mb-4 flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-[#0284C7]" />
                    <span>Status Alat Pendeteksi</span>
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#475569]">ID Perangkat:</span>
                      <span className="font-mono font-semibold text-[#0F172A]">{deviceId}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#475569]">Status Online:</span>
                      <span
                        className={`font-bold ${
                          isDeviceOffline ? 'text-[#DC2626]' : 'text-[#16A34A]'
                        }`}
                      >
                        {isDeviceOffline ? 'Terputus (Offline)' : 'Aktif & Stabil (Online)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#475569]">Batas Bahaya Gas:</span>
                      <span className="text-[#DC2626] font-mono font-bold text-[11px]">
                        &gt; 1200 PPM
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#475569]">Koneksi Data:</span>
                      <span className="font-mono font-bold text-[#0284C7]">
                        {isDeviceOffline ? 'Menunggu Sinyal' : 'Firebase Real-time'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: Historical PPM Line Chart (2 Cols) + Interactive AI Chat Assistant (1 Col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Historical PPM Line Chart (2 Cols) */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-4">
                    <div>
                      <h3
                        className="text-base font-bold text-[#0F172A] tracking-wider uppercase"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        Grafik Tren Konsentrasi Gas Historis
                      </h3>
                      <p className="text-xs text-[#475569]">
                        Analisis fluktuasi PPM terhadap waktu
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap rounded-xl bg-[#F9FAFB] border border-slate-200 p-1 text-xs gap-0.5">
                        {[
                          { key: 'live', label: 'Live' },
                          { key: '60', label: '1 Jam' },
                          { key: 'today', label: '24 Jam / Tanggal' },
                          { key: 'custom', label: 'Kustom' }
                        ].map(tab => (
                          <button
                            type="button"
                            key={tab.key}
                            onClick={() => setFilterOption(tab.key)}
                            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                              filterOption === tab.key
                                ? 'bg-[#0284C7] text-white font-bold'
                                : 'text-[#475569] hover:text-[#0284C7] font-medium'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Points Limit Selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsPointsDropdownOpen(!isPointsDropdownOpen)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#F9FAFB] border border-slate-200 text-xs font-bold text-[#0284C7] flex items-center gap-1 cursor-pointer"
                          title="Jumlah titik sampel grafik"
                        >
                          <span>{dataPointsLimit} Titik</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <AnimatePresence>
                          {isPointsDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
                            >
                              {[5, 10, 20, 50, 100].map(p => (
                                <button
                                  type="button"
                                  key={p}
                                  onClick={() => {
                                    setDataPointsLimit(p);
                                    setIsPointsDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F0F9FF] hover:text-[#0284C7] border-b border-slate-100 last:border-0 cursor-pointer"
                                >
                                  {p} Titik Data
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsFullscreen(true)}
                        className="p-1.5 rounded-xl bg-[#F9FAFB] border border-slate-200 text-[#475569] hover:text-[#0284C7] transition cursor-pointer"
                        title="Lihat Grafik Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Optional Date or Custom Range Sub-bar */}
                  {filterOption === 'today' && (
                    <div className="flex items-center justify-between gap-2 mb-4 px-3 py-2 rounded-xl bg-[#F9FAFB] border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={handlePrevDay}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0F172A] rounded-lg font-bold border border-slate-200 cursor-pointer"
                      >
                        &larr; Kemarin
                      </button>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-white border border-slate-300 px-3 py-1 rounded-lg text-xs font-bold text-[#0F172A] text-center cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={handleNextDay}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0F172A] rounded-lg font-bold border border-slate-200 cursor-pointer"
                      >
                        Besok &rarr;
                      </button>
                    </div>
                  )}

                  {filterOption === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 p-3 rounded-xl bg-[#F9FAFB] border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#475569] w-12">Mulai:</span>
                        <input
                          type="datetime-local"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="flex-1 bg-white border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0F172A]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#475569] w-12">Hingga:</span>
                        <input
                          type="datetime-local"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="flex-1 bg-white border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0F172A]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend Pill */}
                <div className="flex items-center justify-center gap-2 mb-2 text-xs text-[#475569] font-semibold">
                  <span className="inline-block w-6 h-2.5 rounded-sm bg-[#0284C7]/20 border-2 border-[#0284C7]" />
                  <span>Konsentrasi Gas MQ-135 (PPM)</span>
                </div>

                {/* Chart Container */}
                <div className="h-64 sm:h-72 w-full relative">
                  {!hasChartData ? (
                    <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-2xl bg-[#F9FAFB]">
                      <Wind className="w-9 h-9 text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-[#0F172A]">Belum Ada Riwayat Data</p>
                      <p className="text-[11px] text-[#475569] mt-1 text-center px-4">
                        {filterOption === 'today'
                          ? (() => {
                              const parts = selectedDate.split('-');
                              const d = new Date(
                                Number(parts[0]),
                                Number(parts[1]) - 1,
                                Number(parts[2])
                              );
                              return `Belum ada pencatatan data pada ${d.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}`;
                            })()
                          : 'Coba pilih rentang waktu atau tanggal lainnya'}
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis
                          dataKey="timeFormatted"
                          stroke="#475569"
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                        />
                        <YAxis
                          stroke="#475569"
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: '12px',
                            color: '#0F172A',
                            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)'
                          }}
                          itemStyle={{ color: '#0284C7', fontWeight: 'bold' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          connectNulls={true}
                          stroke="#0284C7"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#0284C7', strokeWidth: 0 }}
                          activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2, fill: '#0284C7' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Interactive AI Chat Assistant (1 Col) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md flex flex-col h-[420px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-xs">
                      AI
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">Tanya Asisten AI</h4>
                      <p className="text-[10px] text-[#475569]">Analisis &amp; Riwayat Chat</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleNewChatSession}
                      className="px-2 py-1 rounded-lg bg-[#F9FAFB] border border-slate-200 hover:border-[#0284C7] text-[#475569] hover:text-[#0284C7] text-[10px] font-bold transition cursor-pointer"
                    >
                      + Chat Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowChatHistory(!showChatHistory)}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                        showChatHistory
                          ? 'bg-[#0284C7] border-[#0284C7] text-white'
                          : 'bg-[#E0F2FE] border-[#0284C7]/30 text-[#0284C7] hover:bg-[#0284C7] hover:text-white'
                      }`}
                    >
                      Riwayat ({chatSessions.length})
                    </button>
                  </div>
                </div>

                {/* Collapsible Chat History Panel */}
                {showChatHistory ? (
                  <div className="flex-1 overflow-y-auto mb-3 p-3 rounded-2xl bg-[#F0F9FF] border border-[#0284C7]/30 space-y-2 text-xs text-left custom-scrollbar">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#0284C7]/20">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setChatHistoryFilter('device')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            chatHistoryFilter === 'device'
                              ? 'bg-[#0284C7] text-white'
                              : 'bg-white text-[#475569]'
                          }`}
                        >
                          Alat Ini ({chatSessions.filter(s => s.deviceId === deviceId).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setChatHistoryFilter('all')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            chatHistoryFilter === 'all'
                              ? 'bg-[#0284C7] text-white'
                              : 'bg-white text-[#475569]'
                          }`}
                        >
                          Semua ({chatSessions.length})
                        </button>
                      </div>
                      {chatSessions.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllChatHistory}
                          className="text-[10px] font-bold text-[#DC2626] hover:underline cursor-pointer"
                        >
                          Hapus Semua
                        </button>
                      )}
                    </div>

                    {(() => {
                      const filteredSessions =
                        chatHistoryFilter === 'device'
                          ? chatSessions.filter(s => s.deviceId === deviceId)
                          : chatSessions;

                      if (filteredSessions.length === 0) {
                        return (
                          <div className="p-4 text-center text-[#475569] bg-white rounded-xl border border-slate-200">
                            Belum ada riwayat chat tersimpan.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1.5">
                          {filteredSessions.map(session => {
                            const isCurrent = session.id === activeChatSessionId;
                            const dateStr = new Date(session.updatedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            return (
                              <div
                                key={session.id}
                                onClick={() => handleSelectChatSession(session)}
                                className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-2 ${
                                  isCurrent
                                    ? 'bg-[#E0F2FE] border-[#0284C7]'
                                    : 'bg-white border-slate-200 hover:border-[#0284C7]'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-[#0F172A] truncate">
                                    {session.title}
                                  </div>
                                  <div className="text-[10px] text-[#0284C7] font-mono mt-0.5">
                                    {session.deviceId} ({session.roomName}) &bull; {dateStr} &bull;{' '}
                                    {session.messages.length} pesan
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteChatSession(session.id, e)}
                                  className="text-[#DC2626] font-bold text-xs px-1.5 hover:bg-[#FEE2E2] rounded cursor-pointer"
                                  title="Hapus"
                                >
                                  &times;
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* Chat message thread */
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3 text-left custom-scrollbar">
                    {chatMessages.map((msg, idx) => {
                      const isAi = msg.sender === 'ai';
                      return (
                        <div
                          key={idx}
                          className={
                            isAi
                              ? 'bg-[#F9FAFB] text-[#0F172A] p-3 rounded-2xl rounded-tl-none border border-slate-200 mr-4 leading-relaxed'
                              : 'bg-[#0284C7] text-white p-3 rounded-2xl rounded-tr-none border border-[#0284C7] ml-4 leading-relaxed'
                          }
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: msg.text
                                .replace(/\n/g, '<br/>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                            }}
                          />
                          {msg.timestamp && (
                            <div className="text-[9px] opacity-70 mt-1 font-mono text-right">
                              {msg.timestamp}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isTyping && (
                      <div className="bg-[#F0F9FF] text-[#0284C7] p-3 rounded-2xl rounded-tl-none border border-[#BAE6FD] mr-4 text-xs font-semibold">
                        Asisten sedang menganalisis...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}

                {/* Suggested Prompt Chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 text-[10px]">
                  {[
                    {
                      text: 'Cara turunkan PPM?',
                      label: 'Bagaimana cara menurunkan PPM saat ini?'
                    },
                    {
                      text: 'Cara atasi bau gas?',
                      label: 'Apa tindakan pertama yang harus saya lakukan jika tercium bau gas?'
                    },
                    {
                      text: 'Kapan evakuasi?',
                      label: 'Kapan sirene evakuasi berbunyi dan apa yang harus dilakukan?'
                    }
                  ].map(chip => (
                    <button
                      type="button"
                      key={chip.text}
                      onClick={() => handleAskAI(chip.label)}
                      disabled={isTyping}
                      className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#F0F9FF] border border-[#0284C7]/30 text-[#0284C7] font-semibold hover:bg-[#E0F2FE] cursor-pointer disabled:opacity-50"
                    >
                      {chip.text}
                    </button>
                  ))}
                </div>

                {/* Chat Input Form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ketik pertanyaan Anda..."
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAskAI(customQuestion);
                        setCustomQuestion('');
                      }
                    }}
                    disabled={isTyping}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#0284C7]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleAskAI(customQuestion);
                      setCustomQuestion('');
                    }}
                    disabled={isTyping || !customQuestion.trim()}
                    className="px-3.5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    Kirim
                  </button>
                </div>
              </div>
            </div>

            {/* ROW 3: Data Logs & Report Export Section (Full Width) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => setActiveLogTab('sensor')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activeLogTab === 'sensor'
                          ? 'bg-[#0284C7] text-white'
                          : 'bg-[#F9FAFB] text-[#475569] border border-slate-200 hover:text-[#0284C7]'
                      }`}
                    >
                      Catatan Rutin Udara (Sensor Logs)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLogTab('alert')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                        activeLogTab === 'alert'
                          ? 'bg-[#0284C7] text-white font-bold'
                          : 'bg-[#F9FAFB] text-[#475569] border border-slate-200 hover:text-[#0284C7]'
                      }`}
                    >
                      <span>Catatan Kejadian Bahaya (Alert Logs)</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-[#DC2626] text-white text-[10px] font-bold">
                        {displayedHistory.filter(i => i.value > 1200).length}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-[#475569]">
                    Riwayat pencatatan kadar udara untuk keamanan ruangan ({roomName})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportToExcel}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-[#F0F9FF] text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Table className="w-4 h-4 text-[#16A34A]" />
                    <span>Ekspor CSV / Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportToPDF}
                    className="px-3.5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0284C7]/20 cursor-pointer transition"
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span>Ekspor Laporan PDF</span>
                  </button>
                </div>
              </div>

              {/* Table Content */}
              {(() => {
                const rowsToShow =
                  activeLogTab === 'alert'
                    ? displayedHistory.filter(i => i.value > 1200)
                    : displayedHistory;

                if (rowsToShow.length === 0) {
                  return (
                    <div className="py-10 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-[#F9FAFB]">
                      <Info className="w-6 h-6 text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-[#0F172A]">
                        {activeLogTab === 'alert'
                          ? 'Tidak Ada Kejadian Bahaya (> 1200 PPM) Tercatat'
                          : 'Belum Ada Catatan Pembacaan pada Rentang Ini'}
                      </p>
                      <p className="text-[11px] text-[#475569] mt-0.5">
                        Data pembacaan dari sensor {deviceId} akan otomatis tercatat di tabel ini.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[#475569] uppercase tracking-wider font-bold">
                          <th className="py-3 px-4">Waktu Perekaman</th>
                          <th className="py-3 px-4">PPM Terbaca</th>
                          <th className="py-3 px-4">Batas Bahaya</th>
                          <th className="py-3 px-4">Status Alat</th>
                          <th className="py-3 px-4">Status Udara</th>
                          <th className="py-3 px-4">Keterangan AI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[#0F172A]">
                        {rowsToShow.slice(0, 15).map((item, idx) => {
                          const tsNum = parseInt(item.timestamp);
                          const d = new Date(tsNum);
                          const formattedDate = d.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short'
                          });
                          const formattedTime = d.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          const isItemDanger = item.value > 1200;
                          const isItemWarn = item.value >= 700 && item.value <= 1200;

                          return (
                            <tr key={idx} className="hover:bg-[#F0F9FF] transition">
                              <td className="py-3 px-4 font-mono text-[11px] text-[#475569]">
                                {formattedDate} {formattedTime}
                              </td>
                              <td
                                className={`py-3 px-4 font-bold ${
                                  isItemDanger
                                    ? 'text-[#DC2626]'
                                    : isItemWarn
                                    ? 'text-[#EA580C]'
                                    : 'text-[#16A34A]'
                                }`}
                              >
                                {item.value} PPM
                              </td>
                              <td className="py-3 px-4 font-mono text-[#475569]">1200 PPM</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`font-semibold ${
                                    isDeviceOffline ? 'text-[#DC2626]' : 'text-[#16A34A]'
                                  }`}
                                >
                                  {isDeviceOffline ? 'Offline' : 'Online'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {isItemDanger ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/40">
                                    Bahaya
                                  </span>
                                ) : isItemWarn ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFEDD5] text-[#EA580C] border border-[#EA580C]/30">
                                    Waspada
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/30">
                                    Aman
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-[#475569] text-[11px]">
                                {isItemDanger
                                  ? 'Peringatan kebocoran gas - buka ventilasi & evakuasi!'
                                  : isItemWarn
                                  ? 'Buka ventilasi atau jendela segera'
                                  : 'Kondisi udara normal'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
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
            className="fixed inset-0 bg-[#F0F9FF]/98 backdrop-blur-md z-[1000] p-6 md:p-10 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0284C7]" />
                  Grafik Riwayat Kadar Gas Fullscreen — {deviceId}
                </h3>
                <p className="text-xs text-[#475569] mt-1">
                  Rentang: <span className="font-bold text-[#0284C7]">{filterOptionLabels[filterOption]}</span> |{' '}
                  {processedChartData.length} titik data
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-[#0F172A] rounded-xl transition-all font-bold flex items-center gap-2 text-xs border border-slate-300 cursor-pointer shadow-sm"
              >
                <Minimize2 className="w-4 h-4" /> Tutup Fullscreen
              </button>
            </div>

            <div className="flex-1 w-full flex items-center justify-center bg-white border border-slate-200 rounded-3xl p-6 min-h-0 shadow-lg">
              {!hasChartData ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <Wind className="w-12 h-12 text-slate-400 mb-3" />
                  <h4 className="text-base font-bold text-[#0F172A]">Tidak Ada Data Terpantau</h4>
                  <p className="text-xs text-[#475569] mt-1">
                    Silakan pilih rentang waktu atau navigasi ke hari lain.
                  </p>
                </div>
              ) : (
                <div className="w-full h-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processedChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="timeFormatted"
                        stroke="#475569"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={12}
                      />
                      <YAxis
                        stroke="#475569"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '16px',
                          padding: '12px',
                          color: '#0F172A'
                        }}
                        itemStyle={{ color: '#0284C7', fontWeight: 'bold' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        connectNulls={true}
                        stroke="#0284C7"
                        strokeWidth={4}
                        dot={{ r: 5, fill: '#0284C7', strokeWidth: 0 }}
                        activeDot={{ r: 7, stroke: '#FFFFFF', strokeWidth: 2, fill: '#0284C7' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================================
         HIGH-CONTRAST READABLE DANGER EMERGENCY ALERT MODAL (SIMPLE & DETAILED)
         ============================================================================ */}
      <AnimatePresence>
        {isDangerPopupOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/75 backdrop-blur-md pointer-events-auto"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-xl bg-white border-[3px] border-[#DC2626] rounded-3xl p-6 sm:p-8 relative z-10 shadow-2xl my-auto"
            >
              {isSimpleMode ? (
                /* ---------- SIMPLE MODE DANGER ALERT (SINGKAT, TEPAT, TEGAS) ---------- */
                <div className="text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] border-2 border-[#DC2626] flex items-center justify-center mx-auto text-[#DC2626]">
                    <AlertTriangle className="w-9 h-9" />
                  </div>

                  <div>
                    <span className="inline-block px-3.5 py-1 rounded-full bg-[#DC2626] text-white text-xs font-extrabold uppercase tracking-wider mb-2">
                      PERINGATAN DARURAT
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-[#DC2626] tracking-tight">
                      BAHAYA! GAS BOCOR!
                    </h2>
                    <p className="text-sm font-bold text-[#0F172A] mt-1">
                      Terdeteksi di <span>{roomName}</span> — Segera Bertindak!
                    </p>
                  </div>

                  {/* 3 Direct Steps */}
                  <div className="p-5 rounded-2xl bg-[#FEF2F2] border-2 border-[#FCA5A5] text-left space-y-3">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#DC2626]">
                      LAKUKAN 3 HAL INI SEKARANG:
                    </p>
                    <ol className="space-y-2.5 text-sm sm:text-base font-bold text-[#0F172A]">
                      <li className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#DC2626] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span>Buka semua pintu dan jendela sekarang.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#DC2626] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span>Matikan kompor, jangan nyalakan listrik atau api.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#DC2626] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <span>Segera keluar ruangan ke tempat terbuka.</span>
                      </li>
                    </ol>
                  </div>

                  {/* 2 Clear Action Buttons */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => sendWhatsAppEmergency(emergencyContacts[0])}
                      className="w-full py-4 rounded-2xl bg-[#16A34A] hover:bg-green-700 text-white font-black text-base transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Phone className="w-5 h-5" />
                      <span>Kirim Pesan Darurat WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDangerPopupOpen(false)}
                      className="w-full py-3.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm transition-all cursor-pointer"
                    >
                      Sudah Aman / Tutup Peringatan
                    </button>
                  </div>
                </div>
              ) : (
                /* ---------- DETAILED MODE DANGER ALERT (HIGH-CONTRAST & EASY TO READ) ---------- */
                <div className="space-y-5 text-left">
                  {/* Top Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] text-xs font-extrabold uppercase tracking-wider">
                      PERINGATAN EVAKUASI DARURAT
                    </span>
                    <span className="text-xs font-mono font-bold text-[#475569]">
                      Pukul: {new Date().toLocaleTimeString('id-ID')}
                    </span>
                  </div>

                  {/* Center Alert Title & PPM */}
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] border-2 border-[#DC2626] flex items-center justify-center mx-auto mb-3 text-[#DC2626]">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#DC2626] tracking-tight">
                      KEBOCORAN GAS BERBAHAYA TERDETEKSI!
                    </h2>
                    <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#F8FAFC] border border-slate-300">
                      <span className="text-xs font-semibold text-[#475569]">Kadar gas terukur:</span>
                      <strong className="text-base font-black text-[#0F172A]">
                        {carbonLevel || '1200+'} PPM
                      </strong>
                      <span className="text-xs font-semibold text-[#475569]">di {roomName}</span>
                    </div>
                  </div>

                  {/* Ordered Emergency Steps */}
                  <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FDBA74] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#9A3412] uppercase tracking-wider">
                        LANGKAH DARURAT YANG HARUS SEGERA DILAKUKAN:
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#475569] uppercase">
                        IKUTI URUTAN BERIKUT
                      </span>
                    </div>
                    <ol className="text-xs text-[#0F172A] space-y-2 leading-relaxed">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#EA580C] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          <strong>Buka Semua Jendela &amp; Pintu:</strong> Segera buat ventilasi agar gas keluar ke udara bebas.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#EA580C] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span>
                          <strong>Matikan Kompor &amp; Lepas Regulator Gas:</strong> Jangan nyalakan saklar lampu atau korek api.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#EA580C] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <span>
                          <strong>Evakuasi Semua Orang:</strong> Segera bawa semua keluarga dan karyawan keluar ruangan ke tempat terbuka.
                        </span>
                      </li>
                    </ol>
                  </div>

                  {/* AI Recommendation Box */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-extrabold text-[#0284C7] uppercase tracking-wider block">
                      Analisis &amp; Rekomendasi Asisten AI:
                    </span>
                    {dangerPopupLoading ? (
                      <div className="py-4 flex items-center gap-2 text-xs text-[#475569] font-semibold">
                        <Brain className="w-4 h-4 text-[#0284C7] animate-spin" />
                        <span>Menyusun protokol evakuasi ruangan...</span>
                      </div>
                    ) : (
                      <div className="max-h-[110px] overflow-y-auto custom-scrollbar text-xs text-[#0F172A] leading-relaxed">
                        <p
                          className="whitespace-pre-line"
                          dangerouslySetInnerHTML={{
                            __html: (
                              dangerPopupRecommendation ||
                              'Segera buka pintu dan jendela, matikan sumber gas, dan evakuasi penghuni ke area terbuka.'
                            ).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Emergency Contacts Box */}
                  <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#86EFAC] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#14532D] uppercase tracking-wider">
                        KONTAK WHATSAPP TANGGAP DARURAT:
                      </span>
                      <span className="text-[10px] font-mono bg-[#DCFCE7] text-[#15803D] px-2.5 py-0.5 rounded-full font-bold">
                        {emergencyContacts.length} Kontak Terdaftar
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {emergencyContacts.map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                        >
                          <div>
                            <strong className="text-[#0F172A]">{c.name || `Kontak #${idx + 1}`}</strong>
                            <span className="font-mono text-[#475569] ml-2">{c.phone}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => sendWhatsAppEmergency(c)}
                            className="px-3 py-1 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Kirim WA
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => sendWhatsAppEmergency(emergencyContacts[0])}
                      className="w-full py-3 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Kirim Pesan Bahaya ke WhatsApp Kontak Utama</span>
                    </button>
                  </div>

                  {/* Bottom Dismiss / Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsDangerPopupOpen(false)}
                      className="py-3.5 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold text-xs transition-all cursor-pointer"
                    >
                      Langkah Selesai &amp; Tutup Peringatan
                    </button>
                    <button
                      type="button"
                      onClick={() => sendWhatsAppEmergency(emergencyContacts[0])}
                      className="py-3.5 px-4 rounded-xl bg-[#EA580C] hover:bg-orange-700 text-white font-extrabold text-xs transition-all cursor-pointer"
                    >
                      Minta Bantuan ke Orang Terdekat
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reactivation Guide Modal Popup */}
      <AnimatePresence>
        {showReactivationPopup && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReactivationPopup(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-7 relative overflow-hidden shadow-2xl flex flex-col justify-between"
            >
              <button
                type="button"
                onClick={() => setShowReactivationPopup(false)}
                className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10 space-y-5 text-left">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <div className="w-10 h-10 bg-[#E0F2FE] border border-[#0284C7]/30 rounded-xl flex items-center justify-center shrink-0 text-[#0284C7]">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#0F172A]">
                      Panduan Menyambungkan Alat ke WiFi
                    </h3>
                    <p className="text-[10px] font-mono text-[#0284C7] uppercase tracking-wider font-bold">
                      Langkah Mudah Aktivasi Perangkat
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activationStep}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3 min-h-[140px] flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF]">
                        {activationSteps[activationStep].icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-[#0F172A]">
                          {activationSteps[activationStep].title}
                        </h4>
                        <span className="text-[11px] font-mono text-[#475569]">
                          Langkah {activationStep + 1} dari {activationSteps.length}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      {activationSteps[activationStep].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActivationStep(prev => Math.max(0, prev - 1))}
                    disabled={activationStep === 0}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-[#475569] hover:text-[#0F172A] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  {activationStep < activationSteps.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setActivationStep(prev => prev + 1)}
                      className="px-5 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Lanjut
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowReactivationPopup(false)}
                      className="px-5 py-2 bg-[#16A34A] hover:bg-green-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Saya Mengerti
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-5 text-center text-xs text-[#475569] border-t border-slate-200 bg-white">
        CarbonSense — Sistem Pemantauan Keamanan Udara &amp; Gas Real-time
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
