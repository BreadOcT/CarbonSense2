import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, Menu, X, ArrowRight, ShieldAlert, Gauge, Zap, ChevronLeft, ChevronRight, ChevronDown, Mail, Star, Activity, Radio, BrainCircuit, Siren, Twitter, Linkedin, Github, TriangleAlert, Users, Home, Flame, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ============================================================
   DATA
   ============================================================ */

const NAV_LINKS = [{
  label: 'Beranda',
  href: '#home'
}, {
  label: 'Fitur',
  href: '#features'
}, {
  label: 'Solusi',
  href: '#solutions'
}, {
  label: 'FAQ',
  href: '#faq'
}] as const;
type StepId = 'step-deploy' | 'step-ai-profile' | 'step-feed' | 'step-alert';
interface StepItem {
  id: StepId;
  n: string;
  icon: React.ComponentType<{
    size?: number;
    style?: React.CSSProperties;
  }>;
  title: string;
  teaser: string;
  body: string;
}
const STEPS: StepItem[] = [{
  id: 'step-deploy',
  n: '01',
  icon: Radio,
  title: 'Pasang & Daftarkan',
  teaser: 'Pasang, nyalakan, hubungkan — selesai dalam 60 detik.',
  body: 'Pasang sensor CarbonSense seri MQ Anda di area target. Nyalakan, hubungkan ke Wi-Fi, dan daftarkan ID perangkat di aplikasi. Kalibrasi sensor selesai secara otomatis dalam 60 detik.'
}, {
  id: 'step-ai-profile',
  n: '02',
  icon: BrainCircuit,
  title: 'Konfigurasikan Profil AI Anda',
  teaser: 'Jawab 4 pertanyaan. AI akan mengkalibrasi sesuai ruangan Anda.',
  body: 'Sebelum pembacaan pertama, CarbonSense AI akan menanyakan kuesioner penyiapan singkat untuk mengkalibrasi model risikonya dengan lingkungan ANDA.'
}, {
  id: 'step-feed',
  n: '03',
  icon: Activity,
  title: 'Aliran Data Langsung',
  teaser: 'Pembacaan data dikirim ke Firebase setiap 15 detik.',
  body: 'Sensor seri MQ Anda mengirimkan pembacaan data ke Firebase setiap 15 detik. Buka aplikasi CarbonSense untuk melihat dasbor data langsung Anda — ppm saat ini, grafik tren, dan status zona. Semua data disimpan dalam Firebase Anda.'
}, {
  id: 'step-alert',
  n: '04',
  icon: Siren,
  title: 'Peringatan AI dalam Aplikasi',
  teaser: 'Pola berbahaya terdeteksi sebelum mencapai puncaknya.',
  body: 'Ketika AI mendeteksi pola berbahaya, peringatan akan muncul di dalam aplikasi CarbonSense. Buka aplikasi untuk melihat temuan AI, tingkat keandalan, tindakan yang direkomendasikan, dan lini masa lonjakan data. Peringatan hanya ada di dalam aplikasi — tidak ada SMS atau email.'
}];
const AI_QUESTIONS = [{
  id: 'q-people',
  icon: Users,
  label: 'Berapa banyak orang yang biasanya menempati ruangan?',
  value: '4–8 orang'
}, {
  id: 'q-space',
  icon: Home,
  label: 'Kegunaan utama ruangan?',
  value: 'Area Industri'
}, {
  id: 'q-combustion',
  icon: Flame,
  label: 'Adakah alat pembakaran di dekatnya?',
  value: 'Pemanas gas (30 kW)'
}, {
  id: 'q-ventilation',
  icon: Wind,
  label: 'Apakah tersedia ventilasi?',
  value: 'Mekanis — 4 ACH'
}] as const;
const TESTIMONIALS = [{
  id: 't-marcus',
  quote: 'CarbonSense memperingatkan kami 8 menit sebelum pembacaan CO memicu evakuasi. Alat ini menyelamatkan nyawa.',
  name: 'Marcus T.',
  role: 'Manajer Keselamatan Pabrik',
  initials: 'MT'
}, {
  id: 't-yuna',
  quote: 'Detail data kualitas udara mereka tidak tertandingi. Tim riset kami memotong waktu analisis hingga 60%.',
  name: 'Dr. Yuna Park',
  role: 'Peneliti Lingkungan',
  initials: 'YP'
}, {
  id: 't-james',
  quote: 'Setelah memasang CarbonSense di seluruh 12 zona kota, kami mengurangi insiden paparan karbon puncak sebesar 73%.',
  name: 'James Oduya',
  role: 'Direktur Lingkungan Kota',
  initials: 'JO'
}] as const;
const FEATURES = [{
  id: 'f-accuracy',
  icon: Gauge,
  title: 'Akurasi Sensor Standar Militer',
  body: 'Presisi ±0.3 ppm. Redundansi sensor ganda menangkap setiap lonjakan — tanpa titik buta, tanpa ambang batas yang terlewat.',
  kind: 'gauge'
}, {
  id: 'f-speed',
  icon: Zap,
  title: 'Pemrosesan Instan — Di Bawah 500ms',
  body: 'Pembacaan data diproses secara real-time. Anda melihat tingkat bahaya sebelum menjadi fatal.',
  kind: 'speed'
}] as const;
const FAQ_ITEMS = [{
  id: 'faq-what',
  q: 'Apa itu CarbonSense?',
  a: 'CarbonSense adalah platform deteksi karbon dan polutan berbasis AI menggunakan jaringan sensor IoT untuk pemantauan kualitas udara real-time dan peringatan bahaya.'
}, {
  id: 'faq-accuracy',
  q: 'Seberapa akurat sensor tersebut?',
  a: 'Sensor redundansi ganda kami mencapai akurasi CO₂ ±0.3 ppm, akurasi CO ±0.05 ppm, dan kesalahan di bawah 5% untuk PM2.5 dan PM10.'
}, {
  id: 'faq-alerts',
  q: 'Peringatan apa saja yang dikirimkan oleh CarbonSense?',
  a: 'CarbonSense memberikan peringatan bertingkat melalui SMS, email, notifikasi push, dan sirene di lokasi. Anda dapat mengonfigurasi ambang batas per polutan — CO₂, CO, PM2.5, PM10 — dan aturan eskalasi per zona fasilitas.'
}] as const;
const FOOTER_COLUMNS = [{
  id: 'col-product',
  title: 'Produk',
  links: ['Fitur', 'Dasbor Langsung', 'Pasang Sensor', 'Harga']
}, {
  id: 'col-resources',
  title: 'Sumber Daya',
  links: ['Studi Kasus', 'Blog', 'Dokumentasi', 'Whitepaper']
}, {
  id: 'col-solutions',
  title: 'Solusi',
  links: ['Industri', 'Perkotaan', 'Penelitian', 'Layanan Darurat']
}, {
  id: 'col-legal',
  title: 'Hukum',
  links: ['Ketentuan Layanan', 'Kebijakan Privasi', 'Dokumen Kepatuhan', 'Kebijakan Cookie']
}] as const;
const SOCIALS = [{
  id: 'soc-tw',
  icon: Twitter,
  label: 'Twitter'
}, {
  id: 'soc-li',
  icon: Linkedin,
  label: 'LinkedIn'
}, {
  id: 'soc-gh',
  icon: Github,
  label: 'GitHub'
}] as const;
const HERO_PATH = 'M0 120 L30 110 L55 118 L80 92 L105 100 L130 70 L160 82 L185 48 L210 60 L235 40 L265 58 L290 30 L320 44 L345 22 L375 36 L400 18';
const HERO_PATH_LEN = 900;
const CTA_STATUSES = ['MEMANTAU...', 'MENGANALISIS...', 'RISIKO TERDETEKSI', 'MEMANTAU...'] as const;

/* ============================================================
   UTILITIES
   ============================================================ */

function generateCtaPath(): string {
  const points: [number, number][] = [[0, 90 + Math.random() * 20]];
  const segments = 13;
  for (let i = 1; i <= segments; i++) {
    const x = Math.round(400 / segments * i);
    const spike = Math.random() > 0.75;
    const y = spike ? 10 + Math.random() * 20 : 40 + Math.random() * 55;
    points.push([x, Math.round(y)]);
  }
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}

/* ============================================================
   SCROLL REVEAL HOOK
   ============================================================ */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return {
    ref,
    visible
  };
}

/* ============================================================
   ANIMATED CHARACTERS (for h2 headings)
   ============================================================ */

function AnimatedHeading({
  text,
  visible,
  className,
  style
}: {
  text: string;
  visible: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return <h2 className={className} style={style} aria-label={text}>
      {text.split('').map((char, i) => <span key={`ch-${i}`} aria-hidden="true" style={{
      display: 'inline-block',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.4s ease ${i * 20}ms, transform 0.4s ease ${i * 20}ms`,
      whiteSpace: char === ' ' ? 'pre' : 'normal'
    }}>
          {char}
        </span>)}
    </h2>;
}

/* ============================================================
   CO2 LOGO
   ============================================================ */

function CO2Logo() {
  return <a href="#home" className="group flex items-center gap-2.5">
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
      <span className="flex flex-col leading-none">
        <span className="text-[19px] font-semibold tracking-wide text-[var(--cs-text)]" style={{
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.04em'
      }}>
          CARBONSENSE
        </span>
        <span className="text-[9px] uppercase tracking-[0.28em] text-[var(--cs-amber)]">
          sistem pemantauan udara
        </span>
      </span>
    </a>;
}

/* ============================================================
   INTERACTIVE HERO DASHBOARD
   ============================================================ */

function HeroDashboard() {
  const [co2Reading, setCo2Reading] = useState(380);
  const [aqiDashOffset, setAqiDashOffset] = useState(157);
  const [hovered, setHovered] = useState(false);

  // Count up CO2 from 380 to 421 on mount
  useEffect(() => {
    let current = 380;
    const interval = setInterval(() => {
      if (current < 421) {
        current += 1;
        setCo2Reading(current);
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Animate AQI gauge arc
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAqiDashOffset(45);
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  // Occasional jitter after reaching 421
  useEffect(() => {
    const jitter = () => {
      const delay = 3000 + Math.random() * 2000;
      const timer = setTimeout(() => {
        const spike = 421 + Math.floor(Math.random() * 3);
        setCo2Reading(spike);
        setTimeout(() => setCo2Reading(421), 600);
        jitter();
      }, delay);
      return timer;
    };
    const tid = jitter();
    return () => clearTimeout(tid);
  }, []);
  const arcCircumference = 157;
  return <div className="relative w-full rounded-2xl border p-5 sm:p-6" style={{
    background: 'linear-gradient(160deg, var(--cs-surface), color-mix(in oklab, var(--cs-surface) 70%, #000))',
    borderColor: hovered ? 'color-mix(in oklab, var(--cs-amber) 60%, var(--cs-border))' : 'var(--cs-border)',
    boxShadow: hovered ? '0 40px 80px -40px rgba(0,0,0,0.9), 0 0 60px -20px var(--cs-amber-glow), inset 0 1px 0 rgba(255,255,255,0.03)' : '0 40px 80px -40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.03)',
    transform: hovered ? 'scale(1.025) translateY(-6px)' : 'scale(1) translateY(0)',
    transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 400ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 400ms ease',
    cursor: 'default'
  }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute h-2.5 w-2.5 rounded-full" style={{
            background: 'var(--cs-danger)',
            opacity: 0.6
          }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{
            background: 'var(--cs-danger)'
          }} />
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--cs-text-dim)]">
            Pemantauan Langsung · Zona B-04
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--cs-text-dim)]">
          Segarkan 15d
        </span>
      </div>

      {/* primary reading + AQI gauge */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border p-4" style={{
        borderColor: 'var(--cs-border)',
        background: 'rgba(0,0,0,0.25)'
      }}>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--cs-text-dim)]">
            Konsentrasi CO₂
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-semibold leading-none" style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--cs-danger-text)'
          }}>
              {co2Reading}
            </span>
            <span className="mb-1 text-xs text-[var(--cs-text-dim)]">ppm</span>
            <span className="mb-1 ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style={{
            background: 'color-mix(in oklab, var(--cs-danger) 18%, transparent)',
            color: 'var(--cs-danger-text)'
          }}>
              ▲ 12%
            </span>
          </div>
          {/* animated waveform graph */}
          <div className="mt-3">
            <svg viewBox="0 0 400 140" className="w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--cs-amber)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--cs-amber)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="34" x2="400" y2="34" stroke="var(--cs-danger)" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.7" />
              <text x="2" y="28" fontSize="9" fill="var(--cs-danger-text)">
                KRITIS 400ppm
              </text>
              <path d={`${HERO_PATH} L400 140 L0 140 Z`} fill="url(#heroFill)" style={{
              animation: 'heroBreath 3s ease-in-out infinite'
            }} />
              <path d={HERO_PATH} fill="none" stroke="var(--cs-amber)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={HERO_PATH_LEN} style={{
              animation: 'heroDraw 2.5s linear infinite'
            }} />
              {/* pulsing danger dot */}
              <g>
                <circle cx="400" cy="18" r="8" fill="var(--cs-danger)" opacity="0" style={{
                animation: 'dangerPing 1.2s ease-out infinite'
              }} />
                <circle cx="400" cy="18" r="3.5" fill="var(--cs-danger)" />
              </g>
            </svg>
          </div>
        </div>

        {/* AQI gauge */}
        <div className="flex flex-col items-center justify-center rounded-xl border p-4" style={{
        borderColor: 'var(--cs-border)',
        background: 'rgba(0,0,0,0.25)'
      }}>
          <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[var(--cs-text-dim)]">
            Indeks Kualitas Udara
          </p>
          <svg width="120" height="72" viewBox="0 0 120 72">
            <defs>
              <linearGradient id="aqiGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--cs-amber)" />
                <stop offset="100%" stopColor="var(--cs-danger)" />
              </linearGradient>
            </defs>
            <path d="M10 66 A50 50 0 0 1 110 66" fill="none" stroke="var(--cs-border)" strokeWidth="9" strokeLinecap="round" />
            <path d="M10 66 A50 50 0 0 1 96 30" fill="none" stroke="url(#aqiGrad)" strokeWidth="9" strokeLinecap="round" strokeDasharray={arcCircumference} strokeDashoffset={aqiDashOffset} style={{
            transition: 'stroke-dashoffset 1.5s ease-out'
          }} />
          </svg>
          <span className="-mt-3 text-3xl font-semibold" style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--cs-amber)'
        }}>
            168
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--cs-danger-text)]">
            Tidak Sehat
          </span>
        </div>
      </div>

      {/* mini stat row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[{
        k: 'CO',
        v: '34 ppm',
        warn: true
      }, {
        k: 'PM2.5',
        v: '88 µg',
        warn: true
      }, {
        k: 'PM10',
        v: '52 µg',
        warn: false
      }].map(s => <div key={s.k} className="rounded-lg border p-2.5" style={{
        borderColor: 'var(--cs-border)',
        background: 'rgba(0,0,0,0.2)'
      }}>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--cs-text-dim)]">
              {s.k}
            </p>
            <p className="text-sm font-semibold" style={{
          color: s.warn ? 'var(--cs-danger-text)' : 'var(--cs-text)'
        }}>
              {s.v}
            </p>
          </div>)}
      </div>
    </div>;
}

/* ============================================================
   AI PROFILE QUESTIONNAIRE MOCK
   ============================================================ */

function AIProfileForm() {
  const [focused, setFocused] = useState<string | null>('q-people');
  useEffect(() => {
    const ids = AI_QUESTIONS.map(q => q.id);
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % ids.length;
      setFocused(ids[i]);
    }, 1800);
    return () => clearInterval(interval);
  }, []);
  return <div className="w-full rounded-2xl border p-5" style={{
    background: 'rgba(0,0,0,0.35)',
    borderColor: 'var(--cs-border)'
  }}>
      <div className="mb-4 flex items-center gap-2">
        <BrainCircuit size={16} style={{
        color: 'var(--cs-amber)'
      }} />
        <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{
        color: 'var(--cs-amber)'
      }}>
          Kuesioner Pengaturan AI
        </span>
      </div>
      <div className="space-y-3">
        {AI_QUESTIONS.map(q => {
        const isFocused = focused === q.id;
        return <div key={q.id} className="rounded-xl border p-3 transition-all duration-300" style={{
          borderColor: isFocused ? 'color-mix(in oklab, var(--cs-amber) 70%, transparent)' : 'var(--cs-border)',
          background: isFocused ? 'color-mix(in oklab, var(--cs-amber) 6%, rgba(0,0,0,0.3))' : 'rgba(0,0,0,0.2)',
          boxShadow: isFocused ? '0 0 16px -6px var(--cs-amber-glow)' : 'none'
        }}>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--cs-text-dim)]">
                {q.label}
              </p>
              <p className="mt-1 text-sm font-medium" style={{
            color: isFocused ? 'var(--cs-amber)' : 'var(--cs-text)'
          }}>
                {q.value}
              </p>
            </div>;
      })}
      </div>
      <div className="mt-4 rounded-lg px-3 py-2 text-xs font-medium" style={{
      background: 'color-mix(in oklab, var(--cs-amber) 14%, transparent)',
      color: 'var(--cs-amber)'
    }}>
        ✓ Kalibrasi model AI ke lingkungan Anda...
      </div>
    </div>;
}

/* ============================================================
   STEP 1 — DEPLOY MOCK VISUAL
   ============================================================ */

function DeployMockVisual() {
  const SCAN_DOTS = ['Memindai perangkat.', 'Memindai perangkat..', 'Memindai perangkat...'];
  const [scanIdx, setScanIdx] = useState(0);
  const [calibWidth, setCalibWidth] = useState(0);
  const [deviceId, setDeviceId] = useState('');
  const FULL_ID = 'CS-MQ135-0047';
  useEffect(() => {
    const interval = setInterval(() => {
      setScanIdx(p => (p + 1) % SCAN_DOTS.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => setCalibWidth(78), 300);
    return () => clearTimeout(timeout);
  }, []);
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDeviceId(FULL_ID.slice(0, i));
      if (i >= FULL_ID.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, []);
  return <div className="rounded-xl border p-4" style={{
    borderColor: 'var(--cs-border)',
    background: 'var(--cs-surface)'
  }}>
      {/* Top — device scan row */}
      <div className="flex items-center gap-3">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          {/* MQ-series chip footprint: 12 squares around a central core */}
          {[[14, 4], [20, 4], [26, 4], [4, 14], [4, 20], [4, 26], [14, 36], [20, 36], [26, 36], [36, 14], [36, 20], [36, 26]].map(([x, y]) => <rect key={`pin-${x}-${y}`} x={x - 2} y={y - 2} width="4" height="4" stroke="var(--cs-amber)" strokeWidth="1.2" fill="none" />)}
          <rect x="11" y="11" width="18" height="18" rx="2" stroke="var(--cs-amber)" strokeWidth="1.4" fill="none" />
          <circle cx="20" cy="20" r="4" stroke="var(--cs-amber)" strokeWidth="1.2" fill="none" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--cs-text)]">Sensor MQ-135</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-2 w-2 rounded-full" style={{
              background: 'var(--cs-amber)',
              opacity: 0.6
            }} />
              <span className="h-2 w-2 rounded-full" style={{
              background: 'var(--cs-amber)'
            }} />
            </span>
            <span className="text-xs text-[var(--cs-text-dim)]">{SCAN_DOTS[scanIdx]}</span>
          </div>
        </div>
      </div>

      {/* Calibration progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--cs-text-dim)]">
            Kalibrasi
          </span>
          <span className="text-[10px] font-semibold text-[var(--cs-amber)]">78%</span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full" style={{
        background: 'var(--cs-border)'
      }}>
          <div className="h-full rounded-full" style={{
          width: `${calibWidth}%`,
          background: 'linear-gradient(90deg, var(--cs-amber), var(--cs-danger))',
          transition: 'width 1.8s ease-out'
        }} />
        </div>
      </div>

      {/* Divider */}
      <div className="my-3" style={{
      borderTop: '1px solid var(--cs-border)'
    }} />

      {/* Bottom — registration form */}
      <div className="space-y-2.5">
        {[{
        k: 'ID Perangkat',
        v: deviceId,
        mono: true
      }, {
        k: 'Lokasi',
        v: 'Zona B — Lantai 2',
        mono: false
      }].map(row => <div key={row.k} className="flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--cs-text-dim)]">{row.k}</span>
            <span className="rounded-md px-2.5 py-1 text-xs font-medium text-[var(--cs-text)]" style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--cs-border)',
          fontFamily: row.mono ? 'monospace' : 'inherit',
          minHeight: '26px',
          minWidth: row.mono ? '110px' : 'auto',
          textAlign: 'right'
        }}>
              {row.v}
            </span>
          </div>)}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--cs-text-dim)]">Ambang Batas Peringatan</span>
          <span className="rounded-md px-2.5 py-1 text-xs font-semibold" style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--cs-border)',
          color: 'var(--cs-amber)',
          animation: 'deployPulse 1.5s ease-in-out infinite'
        }}>
            350 ppm
          </span>
        </div>
      </div>

      {/* Confirm row */}
      <div className="mt-4 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-[#0c0a08]" style={{
      background: 'linear-gradient(100deg, var(--cs-amber) 0%, color-mix(in oklab, var(--cs-amber) 70%, #fff) 50%, var(--cs-amber) 100%)',
      backgroundSize: '200% 100%',
      animation: 'deployShimmer 2.2s linear infinite'
    }}>
        Konfirmasi Pendaftaran
      </div>

      <style>{`
        @keyframes deployPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes deployShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>;
}

/* ============================================================
   STEP 3 — LIVE DATA FEED MOCK VISUAL
   ============================================================ */

interface FeedRow {
  id: number;
  time: string;
  key: string;
  value: string;
  warn: boolean;
}
const FEED_KEYS = ['CO_ppm', 'CO2_ppm', 'temp_C', 'humidity', 'AQI'] as const;
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}
function makeFeedRow(id: number, keyIdx: number, seconds: number): FeedRow {
  const key = FEED_KEYS[keyIdx];
  let raw = 0;
  let warn = false;
  if (key === 'CO_ppm') {
    raw = 5 + Math.random() * 13;
    warn = raw > 8;
  } else if (key === 'CO2_ppm') {
    raw = 360 + Math.random() * 120;
    warn = raw > 400;
  } else if (key === 'temp_C') {
    raw = 22 + Math.random() * 13;
  } else if (key === 'humidity') {
    raw = 40 + Math.random() * 30;
  } else {
    raw = 80 + Math.random() * 80;
    warn = raw > 100;
  }
  const value = key === 'CO_ppm' || key === 'temp_C' ? raw.toFixed(1) : Math.round(raw).toString();
  const base = 14 * 3600 + 32 * 60 + 7 + seconds;
  const hh = Math.floor(base / 3600) % 24;
  const mm = Math.floor(base % 3600 / 60);
  const ss = base % 60;
  return {
    id,
    time: `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`,
    key,
    value,
    warn
  };
}
function FeedMockVisual() {
  const [rows, setRows] = useState<FeedRow[]>(() => {
    const init: FeedRow[] = [];
    for (let i = 0; i < 5; i++) {
      init.push(makeFeedRow(i, i % FEED_KEYS.length, i * 15));
    }
    return init.reverse();
  });
  const [lastMs, setLastMs] = useState(0);
  const counterRef = useRef(5);
  const secondsRef = useRef(75);
  const keyRef = useRef(0);
  useEffect(() => {
    const interval = setInterval(() => {
      keyRef.current = (keyRef.current + 1) % FEED_KEYS.length;
      secondsRef.current += 15;
      const newRow = makeFeedRow(counterRef.current, keyRef.current, secondsRef.current);
      counterRef.current += 1;
      setRows(prev => [newRow, ...prev].slice(0, 5));
      setLastMs(0);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      setLastMs(p => p + 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return <div className="rounded-xl border p-4" style={{
    borderColor: 'var(--cs-border)',
    background: 'var(--cs-surface)'
  }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute h-2 w-2 rounded-full" style={{
            background: 'var(--cs-danger)',
            opacity: 0.6
          }} />
            <span className="h-2 w-2 rounded-full" style={{
            background: 'var(--cs-danger)'
          }} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{
          color: 'var(--cs-amber)'
        }}>
            Aliran Langsung
          </span>
        </div>
        <span className="text-xs text-[var(--cs-text-dim)]" style={{
        fontFamily: 'monospace'
      }}>
          Firebase / cs-sensors / zone-b
        </span>
      </div>

      {/* Stream feed */}
      <div className="mt-3 space-y-1">
        {rows.map((row, i) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5" style={{
        background: i === 0 ? 'color-mix(in oklab, var(--cs-amber) 6%, rgba(0,0,0,0.25))' : 'rgba(0,0,0,0.2)',
        animation: i === 0 ? 'feedSlideIn 400ms ease-out' : 'none'
      }}>
            <span className="text-[11px] text-[var(--cs-text-dim)]" style={{
          fontFamily: 'monospace'
        }}>
              {row.time}
            </span>
            <span className="flex-1 text-[11px] text-[var(--cs-text-dim)]" style={{
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
              {row.key}
            </span>
            <span className="text-xs font-semibold" style={{
          fontFamily: 'monospace',
          color: row.warn ? 'var(--cs-amber)' : 'var(--cs-text-dim)'
        }}>
              {row.value}
            </span>
          </div>)}
      </div>

      {/* Bottom bar */}
      <div className="mt-3 text-xs text-[var(--cs-text-dim)]">
        Pembaruan terakhir: {lastMs} ms lalu
      </div>

      <style>{`
        @keyframes feedSlideIn {
          0% { opacity: 0; transform: translateY(-12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>;
}

/* ============================================================
   STEP 4 — AI ALERTS MOCK VISUAL
   ============================================================ */

function AlertMockVisual() {
  const [reading, setReading] = useState(14.2);
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      const next = 13.8 + Math.random() * (15.1 - 13.8);
      setReading(parseFloat(next.toFixed(1)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => setBarWidth(85), 50);
    return () => clearTimeout(timeout);
  }, []);
  return <div className="rounded-xl border p-4" style={{
    borderColor: 'var(--cs-border)',
    background: 'var(--cs-surface)'
  }}>
      {/* App header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{
        color: 'var(--cs-amber)'
      }}>
          CarbonSense
        </span>
        <span className="relative flex h-6 w-6 items-center justify-center">
          <Bell size={16} style={{
          color: 'var(--cs-text-dim)'
        }} />
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full" style={{
          background: 'var(--cs-danger)'
        }} />
        </span>
      </div>

      {/* Main alert card */}
      <div className="mt-3 rounded-lg p-4" style={{
      borderLeft: '3px solid var(--cs-danger)',
      background: 'color-mix(in oklab, var(--cs-danger) 5%, var(--cs-surface))',
      animation: 'alertGlow 2s ease-in-out infinite'
    }}>
        <div className="flex items-center gap-2">
          <TriangleAlert size={16} style={{
          color: 'var(--cs-danger-text)'
        }} />
          <span className="text-xs font-bold uppercase tracking-wide" style={{
          color: 'var(--cs-danger-text)'
        }}>
            Tingkat Bahaya Terdeteksi
          </span>
          <span className="ml-auto text-[10px] text-[var(--cs-text-dim)]">2 mnt lalu</span>
        </div>

        {/* Reading */}
        <div className="mt-3 flex items-end gap-2">
          <span className="text-2xl font-bold leading-none text-[var(--cs-text)]" style={{
          fontFamily: 'var(--font-display)'
        }}>
            {reading.toFixed(1)} ppm
          </span>
          <span className="mb-0.5 rounded px-1.5 py-0.5 text-xs font-semibold text-[#0c0a08]" style={{
          background: 'var(--cs-danger)'
        }}>
            CO
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full" style={{
          background: 'var(--cs-border)'
        }}>
            <div className="h-full rounded-full" style={{
            width: `${barWidth}%`,
            background: 'var(--cs-danger)',
            transition: 'width 1.5s ease-out'
          }} />
          </div>
          <p className="mt-1.5 text-xs text-[var(--cs-text-dim)]">Ambang Batas Bahaya: 85%</p>
        </div>

        {/* Confidence */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[var(--cs-text-dim)]">Keandalan AI</span>
          <span className="text-sm font-semibold" style={{
          color: 'var(--cs-amber)'
        }}>
            94%
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-2">
        <span className="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-semibold" style={{
        borderColor: 'var(--cs-amber)',
        color: 'var(--cs-amber)'
      }}>
          Lihat Lini Masa Lonjakan
        </span>
        <span className="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium" style={{
        borderColor: 'var(--cs-border)',
        background: 'var(--cs-surface)',
        color: 'var(--cs-text-dim)'
      }}>
          Tandai Telah Ditinjau
        </span>
      </div>

      <style>{`
        @keyframes alertGlow {
          0%, 100% { box-shadow: 0 0 0px 0px color-mix(in oklab, var(--cs-danger) 0%, transparent); }
          50% { box-shadow: 0 0 20px -6px var(--cs-danger); }
        }
      `}</style>
    </div>;
}

/* ============================================================
   HOW IT WORKS SECTION
   ============================================================ */

function HowItWorksSection({
  visible
}: {
  visible: boolean;
}) {
  const [openSteps, setOpenSteps] = useState<Set<StepId>>(new Set(['step-deploy']));
  const cardRefs = useRef<Map<StepId, HTMLDivElement | null>>(new Map());
  const toggleStep = useCallback((id: StepId) => {
    setOpenSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setTimeout(() => {
          const el = cardRefs.current.get(id);
          if (el) {
            el.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }
        }, 50);
      }
      return next;
    });
  }, []);
  return <div>
      <div className="mx-auto max-w-2xl text-center">
        <AnimatedHeading text="4 Langkah untuk Kepastian Udara Bersih" visible={visible} className="text-4xl tracking-tight sm:text-5xl" style={{
        fontFamily: 'var(--font-display)'
      }} />
        <p className="mt-3 text-[var(--cs-text-dim)]" style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.6s ease 200ms, transform 0.6s ease 200ms'
      }}>
          Dari sensor hingga sirene — siklus tertutup yang tidak pernah tidur.
        </p>
      </div>

      <div className="mt-12 rounded-2xl border" style={{
      background: 'var(--cs-surface-2)',
      borderColor: 'var(--cs-border)'
    }}>
        <div className="p-5 sm:p-7">
          <div className="flex flex-col">
            {STEPS.map((s, idx) => {
            const isOpen = openSteps.has(s.id);
            return <div key={s.id}>
                  {/* Card */}
                  <div ref={el => {
                cardRefs.current.set(s.id, el);
              }} className="rounded-xl border transition-all duration-300" style={{
                borderColor: isOpen ? 'color-mix(in oklab, var(--cs-amber) 55%, var(--cs-border))' : 'var(--cs-border)',
                background: isOpen ? 'color-mix(in oklab, var(--cs-amber) 8%, var(--cs-surface))' : 'var(--cs-surface-2)',
                boxShadow: isOpen ? '0 0 24px -10px var(--cs-amber-glow)' : 'none',
                opacity: isOpen ? 1 : 0.75,
                position: 'relative',
                overflow: 'hidden'
              }}>
                    {/* Accent bar */}
                    <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  background: 'var(--cs-amber)',
                  borderRadius: '2px 0 0 2px',
                  opacity: isOpen ? 1 : 0,
                  transition: 'opacity 300ms ease'
                }} />

                    {/* Header row (clickable) */}
                    <button onClick={() => toggleStep(s.id)} className="flex w-full items-center gap-4 p-4 text-left" style={{
                  position: 'relative'
                }}>
                      {/* Step number circle */}
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{
                    background: isOpen ? 'var(--cs-amber)' : 'var(--cs-border)',
                    color: isOpen ? '#0c0a08' : 'var(--cs-text-dim)',
                    transition: 'background 0.3s, color 0.3s'
                  }}>
                        {s.n}
                      </span>

                      {/* Icon + title + teaser */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <s.icon size={14} style={{
                        color: isOpen ? 'var(--cs-amber)' : 'var(--cs-text-dim)',
                        transition: 'color 0.3s'
                      }} />
                          <h3 className="text-sm font-semibold" style={{
                        color: isOpen ? 'var(--cs-text)' : 'var(--cs-text-dim)',
                        transition: 'color 0.3s'
                      }}>
                            {s.title}
                          </h3>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--cs-text-dim)]">
                          {s.teaser}
                        </p>
                      </div>

                      {/* Chevron */}
                      <ChevronDown size={18} className="shrink-0" style={{
                    color: isOpen ? 'var(--cs-amber)' : 'var(--cs-text-dim)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 300ms ease, color 300ms ease'
                  }} />
                    </button>

                    {/* Expandable body */}
                    <div className="grid" style={{
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 400ms cubic-bezier(0.4,0,0.2,1)'
                }}>
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5 pt-1 pl-[4.5rem]">
                          <p className="text-sm leading-relaxed text-[var(--cs-text-dim)]">
                            {s.body}
                          </p>
                          {s.id === 'step-deploy' && <div className="mt-4">
                              <DeployMockVisual />
                            </div>}
                          {s.id === 'step-ai-profile' && <div className="mt-4">
                              <AIProfileForm />
                            </div>}
                          {s.id === 'step-feed' && <div className="mt-4">
                              <FeedMockVisual />
                            </div>}
                          {s.id === 'step-alert' && <div className="mt-4">
                              <AlertMockVisual />
                            </div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dashed connector between cards */}
                  {idx < STEPS.length - 1 && <div style={{
                paddingLeft: '36px',
                height: '24px',
                display: 'flex',
                alignItems: 'center'
              }}>
                      <svg width="2" height="24" viewBox="0 0 2 24" style={{
                  display: 'block'
                }}>
                        <line x1="1" y1="0" x2="1" y2="24" stroke="var(--cs-amber)" strokeWidth="2" strokeDasharray="4 4" opacity="0.45" style={{
                    animation: 'dashFlow 2s linear infinite'
                  }} />
                      </svg>
                    </div>}
                </div>;
          })}
          </div>
        </div>
      </div>
    </div>;
}

/* ============================================================
   TESTIMONIALS CAROUSEL
   ============================================================ */

function TestimonialsSection({
  visible
}: {
  visible: boolean;
}) {
  const [center, setCenter] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const total = TESTIMONIALS.length;
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCenter(p => (p + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, total]);
  const prev = (center - 1 + total) % total;
  const next = (center + 1) % total;
  const getCardProps = (idx: number) => {
    const isCenter = idx === center;
    const isPrev = idx === prev;
    const isNext = idx === next;
    return {
      scale: isCenter ? 1.0 : 0.88,
      opacity: isCenter ? 1 : 0.55,
      blur: isCenter ? 0 : 1,
      borderGlow: isCenter,
      zIndex: isCenter ? 2 : 1,
      isPrev,
      isNext,
      isCenter
    };
  };
  return <div>
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end" style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease'
    }}>
        <div className="max-w-xl">
          <AnimatedHeading text="Apa Kata Rekanan Kami" visible={visible} className="text-4xl tracking-tight sm:text-5xl" style={{
          fontFamily: 'var(--font-display)'
        }} />
          <p className="mt-3 text-[var(--cs-text-dim)]">
            Dipercaya oleh fasilitas industri, pemerintah kota, dan lembaga penelitian.
          </p>
        </div>
        <div className="flex gap-2">
          <button aria-label="Testimoni sebelumnya" onClick={() => setCenter(p => (p - 1 + total) % total)} className="flex h-11 w-11 items-center justify-center rounded-lg border transition-colors hover:border-[var(--cs-amber)] hover:text-[var(--cs-amber)]" style={{
          borderColor: 'var(--cs-border)',
          color: 'var(--cs-text)'
        }}>
            <ChevronLeft size={18} />
          </button>
          <button aria-label="Testimoni berikutnya" onClick={() => setCenter(p => (p + 1) % total)} className="flex h-11 w-11 items-center justify-center rounded-lg border transition-colors hover:border-[var(--cs-amber)] hover:text-[var(--cs-amber)]" style={{
          borderColor: 'var(--cs-border)',
          color: 'var(--cs-text)'
        }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: 'opacity 0.6s ease 100ms, transform 0.6s ease 100ms'
    }}>
        {TESTIMONIALS.map((item, i) => {
        const props = getCardProps(i);
        return <div key={item.id} onClick={() => setCenter(i)} className="flex flex-col rounded-2xl border p-6" style={{
          background: 'var(--cs-surface)',
          borderColor: props.borderGlow ? 'color-mix(in oklab, var(--cs-amber) 50%, var(--cs-border))' : 'var(--cs-border)',
          boxShadow: props.borderGlow ? '0 24px 50px -28px var(--cs-amber-glow), inset -3px 0 0 var(--cs-amber)' : '0 18px 40px -30px rgba(0,0,0,0.8)',
          transform: `scale(${props.scale})`,
          opacity: props.opacity,
          filter: props.blur > 0 ? `blur(${props.blur}px)` : 'none',
          transition: 'transform 500ms cubic-bezier(0.4,0,0.2,1), opacity 500ms cubic-bezier(0.4,0,0.2,1), box-shadow 500ms ease, filter 500ms ease, border-color 500ms ease',
          cursor: props.isCenter ? 'default' : 'pointer',
          zIndex: props.zIndex
        }}>
              <div className="flex gap-0.5">
                {Array.from({
              length: 5
            }).map((_, si) => <Star key={`${item.id}-star-${si}`} size={15} fill="var(--cs-amber)" style={{
              color: 'var(--cs-amber)'
            }} />)}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--cs-text)]">
                <span>"{item.quote}"</span>
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-[#0c0a08]" style={{
              background: 'var(--cs-amber)'
            }}>
                  {item.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--cs-text)]">{item.name}</p>
                  <p className="text-xs text-[var(--cs-text-dim)]">{item.role}</p>
                </div>
              </div>
            </div>;
      })}
      </div>

      {/* Dot indicators */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {TESTIMONIALS.map((item, i) => <button key={item.id} onClick={() => setCenter(i)} aria-label={`Buka testimoni ${i + 1}`} style={{
        height: '6px',
        width: i === center ? '24px' : '6px',
        borderRadius: '3px',
        background: i === center ? 'var(--cs-amber)' : 'var(--cs-border)',
        transition: 'width 400ms ease, background 400ms ease',
        border: 'none',
        padding: 0,
        cursor: 'pointer'
      }} />)}
      </div>
    </div>;
}

/* ============================================================
   LIVE CTA DASHBOARD
   ============================================================ */

function LiveCtaDashboard() {
  const [pathA, setPathA] = useState(() => generateCtaPath());
  const [pathB, setPathB] = useState(() => generateCtaPath());
  const [showA, setShowA] = useState(true);
  const [reading, setReading] = useState(412);
  const [statusIdx, setStatusIdx] = useState(0);
  const [statusVisible, setStatusVisible] = useState(true);

  // Swap paths every 2s
  useEffect(() => {
    const timer = setInterval(() => {
      if (showA) {
        setPathB(generateCtaPath());
      } else {
        setPathA(generateCtaPath());
      }
      setShowA(p => !p);
    }, 2000);
    return () => clearInterval(timer);
  }, [showA]);

  // Tick reading
  useEffect(() => {
    const timer = setInterval(() => {
      setReading(r => {
        const delta = Math.floor(Math.random() * 21) - 10;
        const next = r + delta;
        return Math.max(380, Math.min(450, next));
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Cycle status
  useEffect(() => {
    const timer = setInterval(() => {
      setStatusVisible(false);
      setTimeout(() => {
        setStatusIdx(p => (p + 1) % CTA_STATUSES.length);
        setStatusVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, []);
  const currentStatus = CTA_STATUSES[statusIdx];
  const isDanger = reading > 420;
  return <div className="rounded-2xl border p-5" style={{
    background: 'var(--cs-surface)',
    borderColor: 'var(--cs-border)',
    boxShadow: '0 40px 80px -40px rgba(0,0,0,0.9)'
  }}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--cs-text-dim)]">
          Kadar CO · Zona A-01
        </span>
        <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{
        background: currentStatus === 'RISIKO TERDETEKSI' ? 'var(--cs-danger)' : 'color-mix(in oklab, var(--cs-amber) 22%, transparent)',
        color: currentStatus === 'RISIKO TERDETEKSI' ? '#0c0a08' : 'var(--cs-amber)',
        opacity: statusVisible ? 1 : 0,
        transition: 'opacity 300ms ease, background 300ms ease'
      }}>
          {currentStatus}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-semibold leading-none" style={{
        fontFamily: 'var(--font-display)',
        color: isDanger ? 'var(--cs-danger-text)' : 'var(--cs-amber)',
        transition: 'color 600ms ease'
      }}>
          {reading}
        </span>
        <span className="mb-1 text-xs text-[var(--cs-text-dim)]">ppm CO</span>
      </div>

      <svg viewBox="0 0 400 120" className="mt-3 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ctaFillA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cs-danger)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--cs-danger)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ctaFillB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cs-danger)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--cs-danger)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Animated danger threshold line */}
        <line x1="0" y1="30" x2="400" y2="30" stroke="var(--cs-danger)" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.8" style={{
        animation: 'thresholdDrift 2s ease-in-out infinite'
      }} />
        <text x="2" y="24" fontSize="9" fill="var(--cs-danger-text)">
          ZONA BAHAYA
        </text>

        {/* Path A */}
        <path d={`${pathA} L400 120 L0 120 Z`} fill="url(#ctaFillA)" style={{
        opacity: showA ? 1 : 0,
        transition: 'opacity 600ms ease'
      }} />
        <path d={pathA} fill="none" stroke="var(--cs-danger-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{
        opacity: showA ? 1 : 0,
        transition: 'opacity 600ms ease'
      }} />

        {/* Path B */}
        <path d={`${pathB} L400 120 L0 120 Z`} fill="url(#ctaFillB)" style={{
        opacity: showA ? 0 : 1,
        transition: 'opacity 600ms ease'
      }} />
        <path d={pathB} fill="none" stroke="var(--cs-danger-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{
        opacity: showA ? 0 : 1,
        transition: 'opacity 600ms ease'
      }} />
      </svg>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-2.5" style={{
        background: 'rgba(0,0,0,0.25)',
        borderColor: 'var(--cs-border)'
      }}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--cs-text-dim)]">AQI</p>
          <p className="text-sm font-semibold" style={{
          color: 'var(--cs-danger-text)'
        }}>
            212 · Sangat Berbahaya
          </p>
        </div>
        <div className="rounded-lg border p-2.5" style={{
        background: 'rgba(0,0,0,0.25)',
        borderColor: 'var(--cs-border)'
      }}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--cs-text-dim)]">Tren</p>
          <p className="text-sm font-semibold" style={{
          color: 'var(--cs-amber)'
        }}>
            ▲ Meningkat cepat
          </p>
        </div>
      </div>
    </div>;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export function CarbonSenseLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [openFaq, setOpenFaq] = useState<string>('faq-alerts');
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const el = document.documentElement;
      const progress = window.scrollY / (el.scrollHeight - el.clientHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const hero = useReveal<HTMLDivElement>();
  const steps = useReveal<HTMLDivElement>();
  const testi = useReveal<HTMLDivElement>();
  const feats = useReveal<HTMLDivElement>();
  const faq = useReveal<HTMLDivElement>();
  const cta = useReveal<HTMLDivElement>();
  return <div className="cs-root min-h-screen w-full overflow-x-hidden" style={{
    background: 'var(--cs-bg)',
    color: 'var(--cs-text)',
    fontFamily: 'var(--font-body)'
  }}>
      {/* ============ STYLES ============ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        .cs-root {
          --cs-bg: oklch(12% 0.012 60);
          --cs-surface: oklch(18% 0.015 60);
          --cs-surface-2: oklch(15% 0.013 60);
          --cs-amber: oklch(74% 0.16 65);
          --cs-amber-glow: oklch(74% 0.16 65 / 0.55);
          --cs-danger: oklch(58% 0.22 25);
          --cs-danger-text: oklch(70% 0.19 30);
          --cs-text: oklch(92% 0.01 80);
          --cs-text-dim: oklch(62% 0.02 70);
          --cs-border: oklch(25% 0.02 60);
          --font-display: 'Bebas Neue', sans-serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
        }

        .cs-reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1); }
        .cs-reveal.is-visible { opacity: 1; transform: translateY(0); }

        .cs-feat-card {
          transition: transform 250ms ease, box-shadow 250ms ease;
        }
        .cs-feat-card:hover {
          transform: scale(1.02) translateY(-4px);
          box-shadow: 0 0 30px -8px var(--cs-amber-glow), 0 18px 40px -20px rgba(0,0,0,0.8) !important;
        }

        .cs-nav-link {
          position: relative;
        }
        .cs-nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: var(--cs-amber);
          transition: width 200ms ease;
        }
        .cs-nav-link:hover::after {
          width: 100%;
        }

        @keyframes heroDraw {
          0% { stroke-dashoffset: ${HERO_PATH_LEN}; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes heroBreath {
          0%, 100% { transform: scaleY(0.97); }
          50% { transform: scaleY(1.03); }
        }
        @keyframes dangerPing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes floatA {
          0%, 100% { transform: rotate(-4deg) translateY(0px); }
          50% { transform: rotate(-4deg) translateY(-8px); }
        }
        @keyframes floatB {
          0%, 100% { transform: rotate(5deg) translateY(-8px); }
          50% { transform: rotate(5deg) translateY(0px); }
        }
        @keyframes orbDriftA {
          0% { transform: translate(0px, 0px); }
          100% { transform: translate(30px, -20px); }
        }
        @keyframes orbDriftB {
          0% { transform: translate(0px, 0px); }
          100% { transform: translate(-25px, 30px); }
        }
        @keyframes orbDriftC {
          0% { transform: translate(0px, 0px); }
          100% { transform: translate(20px, 15px); }
        }
        @keyframes dashFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -24; }
        }
        @keyframes thresholdDrift {
          0%, 100% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
        }
      `}</style>

      {/* ============ SCROLL PROGRESS BAR ============ */}
      <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      height: '2px',
      width: `${scrollProgress}%`,
      background: 'var(--cs-amber)',
      zIndex: 999,
      transition: 'width 50ms linear',
      pointerEvents: 'none'
    }} />

      {/* ============ AMBIENT ORB BACKGROUND ============ */}
      <div aria-hidden="true" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
        {/* Orb 1 — amber, top-left */}
        <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, oklch(74% 0.16 65 / 0.07) 0%, transparent 70%)',
        animation: 'orbDriftA 10s ease-in-out infinite alternate'
      }} />
        {/* Orb 2 — danger red, bottom-right */}
        <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '45vw',
        height: '45vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, oklch(58% 0.22 25 / 0.07) 0%, transparent 70%)',
        animation: 'orbDriftB 12s ease-in-out infinite alternate'
      }} />
        {/* Orb 3 — dark amber, center */}
        <div style={{
        position: 'absolute',
        top: '40%',
        left: '35%',
        width: '30vw',
        height: '30vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, oklch(50% 0.10 55 / 0.05) 0%, transparent 70%)',
        animation: 'orbDriftC 8s ease-in-out infinite alternate'
      }} />
      </div>

      {/* ============ NAV ============ */}
      <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300" style={{
      background: scrolled ? 'color-mix(in oklab, var(--cs-bg) 78%, transparent)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
      borderBottom: scrolled ? '1px solid var(--cs-border)' : '1px solid transparent',
      top: '2px' // below scroll bar
    }}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <CO2Logo />

          <ul className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map(link => <li key={link.href}>
                <a href={link.href} className="cs-nav-link text-sm font-medium text-[var(--cs-text-dim)] transition-colors hover:text-[var(--cs-amber)]">
                  {link.label}
                </a>
              </li>)}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            <button aria-label="Peringatan" className="relative flex h-10 w-10 items-center justify-center rounded-lg border transition-colors hover:border-[var(--cs-amber)]" style={{
            borderColor: 'var(--cs-border)',
            color: 'var(--cs-text-dim)'
          }}>
              <Bell size={18} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full" style={{
              background: 'var(--cs-danger)'
            }} />
            </button>
            <Link to="/login" className="group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#0c0a08] transition-all hover:brightness-110" style={{
            background: 'var(--cs-amber)',
            boxShadow: '0 8px 24px -8px var(--cs-amber-glow)'
          }}>
              Dapatkan Peringatan
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <button className="flex h-10 w-10 items-center justify-center rounded-lg border md:hidden" style={{
          borderColor: 'var(--cs-border)',
          color: 'var(--cs-text)'
        }} onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {menuOpen && <div className="md:hidden" style={{
        background: 'color-mix(in oklab, var(--cs-bg) 92%, transparent)',
        borderBottom: '1px solid var(--cs-border)',
        backdropFilter: 'blur(14px)'
      }}>
            <ul className="flex flex-col gap-1 px-5 py-4">
              {NAV_LINKS.map(link => <li key={link.href}>
                  <a href={link.href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--cs-text-dim)] hover:bg-[var(--cs-surface)] hover:text-[var(--cs-amber)]">
                    {link.label}
                  </a>
                </li>)}
              <li>
                <Link to="/login" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#0c0a08]" style={{
              background: 'var(--cs-amber)'
            }}>
                  <span>Dapatkan Peringatan</span>
                  <ArrowRight size={16} />
                </Link>
              </li>
            </ul>
          </div>}
      </header>

      {/* ============ HERO ============ */}
      <section id="home" className="relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 sm:pt-40" style={{
      zIndex: 1
    }}>
        {/* smoke/haze background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
        background: 'radial-gradient(circle at 50% 12%, oklch(28% 0.05 55 / 0.55), transparent 55%), radial-gradient(circle at 80% 40%, oklch(22% 0.06 30 / 0.35), transparent 45%), radial-gradient(circle at 18% 60%, oklch(20% 0.04 65 / 0.4), transparent 50%)'
      }} />
        <div ref={hero.ref} className={`cs-reveal relative mx-auto max-w-5xl text-center ${hero.visible ? 'is-visible' : ''}`}>
          <h1 className="leading-[0.86]" style={{
          fontFamily: 'var(--font-display)'
        }}>
            <span className="block text-[15vw] tracking-tight text-[var(--cs-text)] sm:text-[80px] lg:text-[96px]" style={{
            opacity: hero.visible ? 1 : 0,
            transform: hero.visible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.7s ease 80ms, transform 0.7s ease 80ms'
          }}>
              DETEKSI KARBON
            </span>
            <span className="block text-[15vw] tracking-tight sm:text-[80px] lg:text-[96px]" style={{
            color: 'var(--cs-amber)',
            opacity: hero.visible ? 1 : 0,
            transform: hero.visible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.7s ease 160ms, transform 0.7s ease 160ms'
          }}>
              SEBELUM MEMATIKAN
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--cs-text-dim)] sm:text-lg" style={{
          opacity: hero.visible ? 1 : 0,
          transform: hero.visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease 240ms, transform 0.6s ease 240ms'
        }}>
            CarbonSense menggunakan jaringan sensor AI real-time untuk memantau CO₂, CO, dan materi
            partikulat — memberikan Anda peringatan instan sebelum konsentrasi berbahaya menumpuk.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{
          opacity: hero.visible ? 1 : 0,
          transform: hero.visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease 320ms, transform 0.6s ease 320ms'
        }}>
            <Link to="/login" className="group inline-flex w-full items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold text-[#0c0a08] transition-all hover:brightness-110 sm:w-auto" style={{
            background: 'var(--cs-amber)',
            boxShadow: '0 14px 36px -12px var(--cs-amber-glow)'
          }}>
              Pasang Sensor
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* dashboard + floating alerts */}
        <div className="relative mx-auto mt-16 max-w-4xl" style={{
        zIndex: 1
      }}>
          <div className={`cs-reveal ${hero.visible ? 'is-visible' : ''}`} style={{
          transitionDelay: '0.15s'
        }}>
            <HeroDashboard />
          </div>

          {/* Floating alert card — left */}
          <div className="absolute -left-2 top-10 hidden rounded-xl border px-3.5 py-2.5 sm:block lg:-left-12" style={{
          background: 'var(--cs-surface)',
          borderColor: 'color-mix(in oklab, var(--cs-amber) 40%, var(--cs-border))',
          boxShadow: '0 20px 40px -20px rgba(0,0,0,0.8)',
          animation: 'floatA 3s ease-in-out infinite'
        }}>
            <div className="flex items-center gap-2">
              <TriangleAlert size={15} style={{
              color: 'var(--cs-amber)'
            }} />
              <span className="text-xs font-semibold text-[var(--cs-text)]">Lonjakan CO₂ terdeteksi</span>
            </div>
            <p className="mt-0.5 text-[10px] text-[var(--cs-text-dim)]">Zona B-04 · +52 ppm dalam 4 mnt</p>
          </div>

          {/* Floating alert card — right */}
          <div className="absolute -right-2 bottom-16 hidden rounded-xl border px-3.5 py-2.5 sm:block lg:-right-12" style={{
          background: 'var(--cs-surface)',
          borderColor: 'color-mix(in oklab, var(--cs-danger) 45%, var(--cs-border))',
          boxShadow: '0 20px 40px -20px rgba(0,0,0,0.8)',
          animation: 'floatB 3s ease-in-out infinite',
          animationDelay: '0.8s'
        }}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{
              background: 'var(--cs-danger)'
            }} />
              <span className="text-xs font-semibold" style={{
              color: 'var(--cs-danger-text)'
            }}>
                PM2.5 tinggi
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-[var(--cs-text-dim)]">88 µg/m³ · Sangat Berbahaya</p>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="solutions" className="px-5 py-20 sm:px-8 sm:py-28" style={{
      zIndex: 1,
      position: 'relative'
    }}>
        <div ref={steps.ref} className={`cs-reveal mx-auto max-w-6xl ${steps.visible ? 'is-visible' : ''}`}>
          <HowItWorksSection visible={steps.visible} />
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="px-5 py-20 sm:px-8 sm:py-28" style={{
      background: 'var(--cs-surface-2)',
      zIndex: 1,
      position: 'relative'
    }}>
        <div ref={testi.ref} className="mx-auto max-w-6xl">
          <TestimonialsSection visible={testi.visible} />
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="px-5 py-20 sm:px-8 sm:py-28" style={{
      zIndex: 1,
      position: 'relative'
    }}>
        <div ref={feats.ref} className={`cs-reveal mx-auto max-w-6xl ${feats.visible ? 'is-visible' : ''}`}>
          <div className="mx-auto max-w-2xl text-center">
            <AnimatedHeading text="Akurasi. Kecepatan. Keandalan." visible={feats.visible} className="text-4xl tracking-tight sm:text-5xl" style={{
            fontFamily: 'var(--font-display)'
          }} />
            <p className="mt-3 text-[var(--cs-text-dim)]" style={{
            opacity: feats.visible ? 1 : 0,
            transform: feats.visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.6s ease 160ms, transform 0.6s ease 160ms'
          }}>
              Tiga pilar utama yang wajib dimiliki setiap jaringan sensor.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            {FEATURES.map((f, fi) => <div key={f.id} className="cs-feat-card overflow-hidden rounded-2xl border p-6" style={{
            background: 'var(--cs-surface)',
            borderColor: 'var(--cs-border)',
            borderLeft: '3px solid var(--cs-danger)',
            boxShadow: '0 18px 40px -30px rgba(0,0,0,0.8)',
            opacity: feats.visible ? 1 : 0,
            transform: feats.visible ? 'translateY(0)' : 'translateY(28px)',
            transition: `opacity 0.6s ease ${fi * 80 + 200}ms, transform 0.6s ease ${fi * 80 + 200}ms`
          }}>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{
              background: 'color-mix(in oklab, var(--cs-amber) 18%, transparent)'
            }}>
                  <f.icon size={20} style={{
                color: 'var(--cs-amber)'
              }} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[var(--cs-text)]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--cs-text-dim)]">{f.body}</p>

                <div className="mt-5 rounded-xl border p-4" style={{
              background: 'rgba(0,0,0,0.25)',
              borderColor: 'var(--cs-border)'
            }}>
                  {f.kind === 'gauge' ? <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--cs-text-dim)]">
                          Presisi sensor
                        </p>
                        <p className="text-2xl font-semibold" style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--cs-amber)'
                  }}>
                          ±0.3 ppm
                        </p>
                      </div>
                      <svg width="90" height="56" viewBox="0 0 90 56">
                        <path d="M8 50 A37 37 0 0 1 82 50" fill="none" stroke="var(--cs-border)" strokeWidth="7" strokeLinecap="round" />
                        <path d="M8 50 A37 37 0 0 1 78 28" fill="none" stroke="var(--cs-amber)" strokeWidth="7" strokeLinecap="round" />
                      </svg>
                    </div> : <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--cs-text-dim)]">
                          Latensi pemrosesan
                        </p>
                        <p className="text-lg font-semibold" style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--cs-amber)'
                  }}>
                          480ms
                        </p>
                      </div>
                      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full" style={{
                  background: 'var(--cs-border)'
                }}>
                        <div className="h-full rounded-full" style={{
                    width: '88%',
                    background: 'linear-gradient(90deg, var(--cs-amber), var(--cs-danger))'
                  }} />
                      </div>
                      <p className="mt-1.5 text-[10px] text-[var(--cs-text-dim)]">
                        Deteksi pelanggaran ambang batas secara real-time
                      </p>
                    </div>}
                </div>
              </div>)}

            {/* full-width feature — Mission Critical */}
            <div className="cs-feat-card overflow-hidden rounded-2xl border p-6 md:col-span-2" style={{
            background: 'linear-gradient(120deg, var(--cs-surface), color-mix(in oklab, var(--cs-surface) 80%, var(--cs-danger)))',
            borderColor: 'var(--cs-border)',
            borderLeft: '3px solid var(--cs-danger)',
            opacity: feats.visible ? 1 : 0,
            transform: feats.visible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.6s ease 360ms, transform 0.6s ease 360ms'
          }}>
              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div className="max-w-xl">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{
                  background: 'color-mix(in oklab, var(--cs-amber) 18%, transparent)'
                }}>
                    <ShieldAlert size={20} style={{
                    color: 'var(--cs-amber)'
                  }} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-[var(--cs-text)]">
                    Dukungan Kritis Utama
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--cs-text-dim)]">
                    Dukungan teknisi 24/7 untuk insiden kritis. Tim kami memantau kesehatan jaringan
                    terus-menerus agar Anda tidak pernah menghadapi krisis karbon sendirian.
                  </p>
                  <a href="mailto:support@carbonsense.io" className="mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-[#0c0a08] transition-all hover:brightness-110" style={{
                  background: 'var(--cs-amber)'
                }}>
                    Hubungi Dukungan
                    <ArrowRight size={15} />
                  </a>
                </div>
                <div className="flex items-center gap-4">
                  {[{
                  k: 'Waktu Aktif',
                  v: '99.98%'
                }, {
                  k: 'Respons',
                  v: '<4 mnt'
                }, {
                  k: 'Cakupan',
                  v: '24/7'
                }].map(stat => <div key={stat.k} className="rounded-xl border px-4 py-3 text-center" style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderColor: 'var(--cs-border)'
                }}>
                      <p className="text-xl font-semibold" style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--cs-amber)'
                  }}>
                        {stat.v}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--cs-text-dim)]">
                        {stat.k}
                      </p>
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="px-5 py-20 sm:px-8 sm:py-28" style={{
      background: 'var(--cs-surface-2)',
      zIndex: 1,
      position: 'relative'
    }}>
        <div ref={faq.ref} className={`cs-reveal mx-auto max-w-6xl ${faq.visible ? 'is-visible' : ''}`}>
          <div className="text-center">
            <span className="inline-block rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{
            background: 'color-mix(in oklab, var(--cs-amber) 16%, transparent)',
            color: 'var(--cs-amber)'
          }}>
              Dukungan &amp; Dokumen
            </span>
            <AnimatedHeading text="Pertanyaan yang Sering Diajukan" visible={faq.visible} className="mt-4 text-4xl tracking-tight sm:text-5xl" style={{
            fontFamily: 'var(--font-display)'
          }} />
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.4fr]">
            {/* help card */}
            <div className="h-fit rounded-2xl border p-6" style={{
            background: 'var(--cs-surface)',
            borderColor: 'var(--cs-border)'
          }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{
              background: 'color-mix(in oklab, var(--cs-amber) 18%, transparent)'
            }}>
                <Mail size={18} style={{
                color: 'var(--cs-amber)'
              }} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-[var(--cs-text)]">
                Butuh Bantuan Teknis?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--cs-text-dim)]">
                Tim dukungan teknisi kami tersedia sepanjang waktu untuk insiden kritis.
              </p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-[#0c0a08] transition-all hover:brightness-110" style={{
              background: 'var(--cs-amber)'
            }}>
                Hubungi Dukungan
                <ArrowRight size={15} />
              </button>
            </div>

            {/* accordion */}
            <div className="space-y-3">
              {FAQ_ITEMS.map(item => {
              const open = openFaq === item.id;
              return <div key={item.id} className="overflow-hidden rounded-xl border transition-colors" style={{
                background: 'var(--cs-surface)',
                borderColor: open ? 'color-mix(in oklab, var(--cs-amber) 45%, var(--cs-border))' : 'var(--cs-border)'
              }}>
                    <button onClick={() => setOpenFaq(open ? '' : item.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                      <span className="text-sm font-semibold text-[var(--cs-text)]">{item.q}</span>
                      <ChevronDown size={18} className="shrink-0 transition-transform duration-300" style={{
                    color: 'var(--cs-amber)',
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
                  }} />
                    </button>
                    <div className="grid transition-all duration-300 ease-out" style={{
                  gridTemplateRows: open ? '1fr' : '0fr'
                }}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-4 text-sm leading-relaxed text-[var(--cs-text-dim)]">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>;
            })}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="px-5 py-20 sm:px-8 sm:py-24" style={{
      zIndex: 1,
      position: 'relative'
    }}>
        <div ref={cta.ref} className={`cs-reveal relative mx-auto max-w-6xl overflow-hidden rounded-3xl border p-8 sm:p-12 ${cta.visible ? 'is-visible' : ''}`} style={{
        background: 'oklch(9% 0.012 60)',
        borderColor: 'var(--cs-border)'
      }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
          background: 'radial-gradient(circle at 15% 20%, oklch(58% 0.22 25 / 0.28), transparent 45%), radial-gradient(circle at 85% 80%, oklch(74% 0.16 65 / 0.22), transparent 45%)'
        }} />
          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-4xl leading-[0.92] tracking-tight sm:text-5xl" style={{
              fontFamily: 'var(--font-display)'
            }}>
                Setiap menit{' '}
                <span style={{
                color: 'var(--cs-amber)'
              }}>paparan</span> sangat berarti.
              </h2>
              <p className="mt-4 max-w-md text-[var(--cs-text-dim)]">
                Pasang CarbonSense hari ini dan mulai lindungi apa yang berharga. Jangan menunggu krisis
                untuk bertindak.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold text-[#0c0a08] transition-all hover:brightness-110" style={{
                background: 'var(--cs-amber)',
                boxShadow: '0 14px 36px -12px var(--cs-amber-glow)'
              }}>
                  Pasang Sekarang — Uji Coba Gratis
                  <ArrowRight size={16} />
                </Link>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3.5 text-sm font-semibold transition-colors" style={{
                borderColor: 'var(--cs-danger)',
                color: 'var(--cs-danger-text)'
              }}>
                  Hubungi Ahli Kami
                </button>
              </div>
            </div>

            <LiveCtaDashboard />
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="px-5 pb-10 pt-16 sm:px-8" style={{
      background: 'oklch(9% 0.012 60)',
      zIndex: 1,
      position: 'relative'
    }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-6">
            <div className="col-span-2">
              <CO2Logo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--cs-text-dim)]">
                Deteksi karbon secara real-time untuk dunia yang lebih aman.
              </p>
              <div className="mt-6 flex gap-8">
                <div>
                  <p className="text-2xl font-semibold" style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--cs-amber)'
                }}>
                    2,1 Jt+
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--cs-text-dim)]">
                    Pembacaan Sensor/Hari
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold" style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--cs-amber)'
                }}>
                    4,9 ★
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--cs-text-dim)]">
                    Peringkat Rata-rata
                  </p>
                </div>
              </div>
            </div>

            {FOOTER_COLUMNS.map(col => <div key={col.id}>
                <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--cs-text)]">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(link => <li key={link}>
                      <a href="#" className="text-sm text-[var(--cs-text-dim)] transition-colors hover:text-[var(--cs-amber)]">
                        {link}
                      </a>
                    </li>)}
                </ul>
              </div>)}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row" style={{
          borderColor: 'var(--cs-border)'
        }}>
            <p className="text-xs text-[var(--cs-text-dim)]">
              © 2025 CarbonSense. Hak cipta dilindungi undang-undang.
            </p>
            <div className="flex items-center gap-2">
              {SOCIALS.map(s => <a key={s.id} href="#" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:border-[var(--cs-amber)] hover:text-[var(--cs-amber)]" style={{
              borderColor: 'var(--cs-border)',
              color: 'var(--cs-text-dim)'
            }}>
                  <s.icon size={16} />
                </a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>;
}