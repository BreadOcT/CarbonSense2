import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert, Heart, Activity, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

const steps = [
  {
    id: 'lokasi',
    title: 'Lokasi Penempatan',
    desc: 'Di ruangan manakah perangkat diletakkan?',
    options: ['Kamar Tidur', 'Ruang Keluarga', 'Dapur / Ruang Makan', 'Ruang Kerja', 'Lainnya']
  },
  {
    id: 'sirkulasi',
    title: 'Sirkulasi Udara',
    desc: 'Bagaimana kondisi ventilasi udara utama?',
    options: ['Tertutup ber-AC', 'Jendela rutin dibuka', 'Ada Exhaust Fan', 'Ruangan semi-terbuka']
  },
  {
    id: 'kapasitas',
    title: 'Kapasitas Hunian',
    desc: 'Jumlah orang rata-rata di ruangan ini?',
    options: ['1-2 Orang', '3-4 Orang', '5+ Orang', 'Jarang ditempati']
  },
  {
    id: 'polutan',
    title: 'Sumber Polutan',
    desc: 'Apa saja sumber asap/gas terdekat? (Pilih satu yang utama)',
    options: ['Kompor Gas', 'Aktivitas Merokok', 'Asap Kendaraan', 'Tidak Ada']
  },
  {
    id: 'rentan',
    title: 'Kelompok Rentan',
    desc: 'Ada penghuni dengan risiko kesehatan tinggi?',
    options: ['Bayi / Balita', 'Lansia / Penderita Asma', 'Tidak Ada']
  },
  {
    id: 'luas_ruang',
    title: 'Estimasi Luas Ruangan',
    desc: 'Berapakah ukuran ruangan tempat sensor berada?',
    options: ['Kecil (< 10 m²)', 'Sedang (10 - 25 m²)', 'Besar (> 25 m²)']
  },
  {
    id: 'detektor_lain',
    title: 'Detektor Tambahan',
    desc: 'Apakah terdapat detektor gas/asap lain yang terpasang?',
    options: ['Ada & Berfungsi Aktif', 'Ada tapi tidak aktif', 'Tidak Ada']
  }
];

function generateDynamicFallbackSummary(answers: any[]): string {
  const lokasi = answers.find(a => a?.id === 'lokasi')?.value || 'Ruangan';
  const sirkulasi = answers.find(a => a?.id === 'sirkulasi')?.value || 'sirkulasi standar';
  const kapasitas = answers.find(a => a?.id === 'kapasitas')?.value || '1-2 Orang';
  const polutan = answers.find(a => a?.id === 'polutan')?.value || 'Tidak Ada';
  const rentan = answers.find(a => a?.id === 'rentan')?.value || 'Tidak Ada';
  const luas = answers.find(a => a?.id === 'luas_ruang')?.value || 'Sedang';
  const detektor = answers.find(a => a?.id === 'detektor_lain')?.value || 'Tidak Ada';

  let summary = `Halo! Saya **CarbonSense AI**. Saya telah menganalisis profil ruangan Anda. Alat pemantau diposisikan pada **${lokasi}** dengan estimasi ukuran **${luas}**. `;

  if (sirkulasi === 'Tertutup ber-AC') {
    summary += `Karena pola sirkulasi tergolong **${sirkulasi}**, akumulasi karbon berpotensi lebih cepat mengendap dengan kapasitas hunian **${kapasitas}**. `;
  } else {
    summary += `Didukung oleh ventilasi **${sirkulasi}**, perputaran udara akan berjalan baik bagi kenyamanan **${kapasitas}** penghuni. `;
  }

  if (polutan !== 'Tidak Ada') {
    summary += `Adanya potensi emisi dari **${polutan}** di sekitar area ini mengharuskan kita tetap waspada terhadap perubahan ppm gas karbon. `;
  } else {
    summary += `Tanpa adanya polutan utama di sekitar sensor, stabilitas kualitas udara awal akan relatif terjaga. `;
  }

  if (rentan !== 'Tidak Ada') {
    summary += `Karena terdeteksi kelompok rentan (**${rentan}**), saya mengaktifkan **Modus Sensitivitas Tinggi** untuk memberikan peringatan dini evakuasi lebih cepat jika terjadi anomali kadar udara.`;
  } else {
    summary += `Pemantauan kualitas udara akan berjalan menggunakan parameter sensitivitas **Normal** guna memastikan efisiensi dan keamanan harian Anda.`;
  }

  return summary;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('cs_user_email');
  const onboardingCompleted = userEmail ? localStorage.getItem(`cs_onboarding_completed_${userEmail}`) === 'true' : false;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Load previous answers if repeating onboarding
  useEffect(() => {
    if (userEmail) {
      const savedAnswers = localStorage.getItem(`cs_onboarding_answers_${userEmail}`);
      if (savedAnswers) {
        try {
          setAnswers(JSON.parse(savedAnswers));
        } catch (e) {
          console.error('Failed to parse saved onboarding answers:', e);
        }
      }
    }
  }, [userEmail]);

  useEffect(() => {
    if (currentStep === steps.length && answers.length >= steps.length) {
      setLoadingSummary(true);
      const lokasiVal = answers.find(a => a?.id === 'lokasi')?.value || '';
      const sirkulasiVal = answers.find(a => a?.id === 'sirkulasi')?.value || '';
      const kapasitasVal = answers.find(a => a?.id === 'kapasitas')?.value || '';
      const polutanVal = answers.find(a => a?.id === 'polutan')?.value || '';
      const rentanVal = answers.find(a => a?.id === 'rentan')?.value || '';
      const luasVal = answers.find(a => a?.id === 'luas_ruang')?.value || '';
      const detektorVal = answers.find(a => a?.id === 'detektor_lain')?.value || '';

      const queryText = "Berikan kalimat kesimpulan analisis profil ruangan asisten AI pintar dalam bahasa Indonesia. Perkenalkan diri Anda sebagai CarbonSense AI pendeteksi gas karbon. Sebutkan secara ramah, ringkas (maksimal 3 kalimat), dan komprehensif tentang penempatan sensor, luas ruangan, kondisi sirkulasi udara, hunian, potensi polutan, risiko kesehatan, dan detektor tambahan yang telah terdaftar.";

      api.ai.getRecommendation({
        question: queryText,
        profile: {
          lokasi: lokasiVal,
          sirkulasi: sirkulasiVal,
          kapasitas: kapasitasVal,
          polutan: [polutanVal].filter(Boolean),
          rentan: rentanVal,
          luas_ruang: luasVal,
          detektor_lain: detektorVal
        },
        carbonLevel: 0,
        type: 'profile_summary'
      }).then(res => {
        setAiSummary(res);
        setLoadingSummary(false);
      }).catch(err => {
        console.error('Failed to load AI summary:', err);
        // Fallback dynamic summary
        const staticText = generateDynamicFallbackSummary(answers);
        setAiSummary(staticText);
        setLoadingSummary(false);
      });
    }
  }, [currentStep, answers]);

  const handleSelect = (option: string) => {
    if (!steps[currentStep]) return;
    const newAnswers = [...answers];
    newAnswers[currentStep] = { id: steps[currentStep].id, value: option };
    setAnswers(newAnswers);

    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(prev => Math.min(prev + 1, steps.length)), 300);
    } else {
      setTimeout(() => setCurrentStep(steps.length), 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleFinish = () => {
    setIsFinishing(true);
    localStorage.setItem('cs_onboarding_answers', JSON.stringify(answers));
    
    // Construct real profile from choices
    const profile = {
      lokasi: answers.find(a => a?.id === 'lokasi')?.value || '',
      sirkulasi: answers.find(a => a?.id === 'sirkulasi')?.value || '',
      kapasitas: answers.find(a => a?.id === 'kapasitas')?.value || '',
      polutan: [answers.find(a => a?.id === 'polutan')?.value].filter(Boolean) as string[],
      rentan: answers.find(a => a?.id === 'rentan')?.value || '',
      luas_ruang: answers.find(a => a?.id === 'luas_ruang')?.value || '',
      detektor_lain: answers.find(a => a?.id === 'detektor_lain')?.value || ''
    };
    localStorage.setItem('cs_ai_personality', JSON.stringify(profile));
    
    if (userEmail) {
      localStorage.setItem(`cs_onboarding_answers_${userEmail}`, JSON.stringify(answers));
      localStorage.setItem(`cs_ai_personality_${userEmail}`, JSON.stringify(profile));
      localStorage.setItem(`cs_onboarding_completed_${userEmail}`, 'true');
    }
    
    setTimeout(() => {
      navigate('/select-device');
    }, 1500);
  };

  const isSummaryPage = currentStep === steps.length;
  const progress = isSummaryPage ? 100 : ((currentStep + 1) / (steps.length + 1)) * 100;

  // Synthesize Summary text
  const lokasiVal = answers.find(a => a?.id === 'lokasi')?.value || '';
  const sirkulasiVal = answers.find(a => a?.id === 'sirkulasi')?.value || '';
  const kapasitasVal = answers.find(a => a?.id === 'kapasitas')?.value || '';
  const polutanVal = answers.find(a => a?.id === 'polutan')?.value || '';
  const rentanVal = answers.find(a => a?.id === 'rentan')?.value || '';
  const luasVal = answers.find(a => a?.id === 'luas_ruang')?.value || '';
  const detektorVal = answers.find(a => a?.id === 'detektor_lain')?.value || '';

  const isHighRisk = rentanVal !== 'Tidak Ada' || sirkulasiVal === 'Tertutup ber-AC' || polutanVal === 'Kompor Gas' || polutanVal === 'Aktivitas Merokok';

  return (
    <div className="min-h-screen text-[var(--cs-text)] font-sans flex flex-col items-center justify-center p-6 overflow-hidden pt-20" style={{ background: 'var(--cs-bg)' }}>
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
            {onboardingCompleted && (
              <button 
                onClick={() => {
                  navigate('/select-device');
                }} 
                className="text-xs uppercase tracking-widest font-semibold text-[var(--cs-text-dim)] hover:text-[var(--cs-amber)] transition-colors border px-4 py-2 rounded-xl cursor-pointer" 
                style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
              >
                Batal
              </button>
            )}
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
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] blur-[100px] rounded-full" style={{ background: 'var(--cs-amber-glow)', opacity: 0.15 }} />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <header className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
            style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'var(--cs-amber)' }}
          >
            <BrainCircuit className="w-8 h-8" style={{ color: 'var(--cs-amber)' }} />
          </motion.div>
          <h1 className="text-3xl font-black tracking-normal mb-2 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Simulasi AI Assistant</h1>
          <p className="text-[var(--cs-text-dim)] text-sm">Bantu CarbonSense AI mengenali profil lingkungan Anda secara akurat.</p>
        </header>

        <div className="mb-8">
           <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--cs-surface-2)' }}>
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               className="h-full"
               style={{ background: 'var(--cs-amber)' }}
             />
           </div>
           <div className="flex justify-between mt-3 text-[10px] font-mono text-[var(--cs-text-dim)] uppercase tracking-widest">
             <span>{isSummaryPage ? 'Kesimpulan Profil' : `Pertanyaan ${currentStep + 1} dari ${steps.length}`}</span>
             <span>{Math.round(progress)}% Selesai</span>
           </div>
        </div>

        <div className="min-h-[420px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {isFinishing ? (
              <motion.div 
                key="finishing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-pulse" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)' }}>
                   <Activity className="w-10 h-10 animate-bounce" style={{ color: 'var(--cs-amber)' }} />
                </div>
                <h3 className="text-2xl font-black tracking-normal uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Mempersiapkan Dashboard...</h3>
                <p className="text-[var(--cs-text-dim)] mt-2">Menyinkronkan parameter profil lingkungan ke asisten AI...</p>
              </motion.div>
            ) : isSummaryPage ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-black tracking-normal bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent uppercase" style={{ fontFamily: 'var(--font-display)' }}>Kesimpulan Analisis Profil AI</h3>
                  <p className="text-[var(--cs-text-dim)] mt-1">Harap tinjau ringkasan profil sebelum masuk ke Dashboard CarbonSense.</p>
                </div>

                {/* Synthesis Card */}
                <div className="p-6 rounded-3xl border space-y-4 relative overflow-hidden" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Brain className="w-32 h-32 text-white" />
                  </div>
                  <div className="relative z-10">
                    {loadingSummary ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <Brain className="w-8 h-8 text-[var(--cs-amber)] animate-spin" />
                        <span className="text-xs font-mono text-[var(--cs-text-dim)] uppercase tracking-wider animate-pulse">Menghubungi CarbonSense AI...</span>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed text-zinc-300 font-medium text-left">
                        🤖 <span className="font-bold text-[var(--cs-amber)]">CarbonSense AI:</span>{" "}
                        <span 
                          className="italic" 
                          dangerouslySetInnerHTML={{ 
                            __html: aiSummary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Assessment Badge Card */}
                <div className="p-5 rounded-2xl border flex items-start gap-4 transition-all duration-300" 
                     style={{ 
                       background: isHighRisk ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)', 
                       borderColor: isHighRisk ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' 
                     }}>
                  {isHighRisk ? (
                    <ShieldAlert className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-1" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm" style={{ color: isHighRisk ? 'var(--cs-danger-text)' : 'var(--cs-amber)' }}>
                      {isHighRisk ? 'Profil Sensitivitas Tinggi' : 'Profil Sensitivitas Normal'}
                    </h4>
                    <p className="text-xs text-[var(--cs-text-dim)] mt-1.5 leading-relaxed">
                      {isHighRisk 
                        ? 'AI mendeteksi potensi kerentanan akumulasi gas karbon. Alarm akan merespons lebih sensitif dan panduan evakuasi darurat akan disesuaikan secara ketat.'
                        : 'Kondisi lingkungan diproyeksikan stabil. AI akan memantau dengan ambang batas normal dan menyarankan tindakan ventilasi preventif biasa.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: 'var(--cs-border)' }}>
                  <button onClick={handleBack} className="flex items-center gap-2 text-[var(--cs-text-dim)] hover:text-white transition-colors text-sm font-bold cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> Kembali
                  </button>

                  <button 
                    onClick={handleFinish}
                    className="px-8 py-3 text-black font-black rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer hover:brightness-110 active:scale-95"
                    style={{ background: 'var(--cs-amber)', boxShadow: '0 8px 24px -8px var(--cs-amber-glow)' }}
                  >
                    Accept & Lanjutkan <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 flex flex-col justify-between h-full"
              >
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent uppercase tracking-tight">{steps[currentStep]?.title}</h3>
                  <p className="text-[var(--cs-text-dim)] mt-1">{steps[currentStep]?.desc}</p>
                </div>

                <div className="space-y-3 my-4">
                  {steps[currentStep]?.options?.map((opt) => {
                    const isSelected = answers[currentStep]?.value === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelect(opt)}
                        className="w-full p-5 rounded-2xl border text-left transition-all duration-350 flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                        style={{
                          background: isSelected ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface))' : 'var(--cs-surface)',
                          borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                          color: isSelected ? 'var(--cs-amber)' : 'var(--cs-text-dim)',
                          boxShadow: isSelected ? '0 0 16px -4px var(--cs-amber-glow)' : 'none'
                        }}
                      >
                        <span className="font-semibold text-sm sm:text-base">{opt}</span>
                        <div 
                          className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
                          style={{
                            borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                            background: isSelected ? 'var(--cs-amber)' : 'transparent',
                          }}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-black" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: 'var(--cs-border)' }}>
                  {currentStep > 0 ? (
                    <button onClick={handleBack} className="flex items-center gap-2 text-[var(--cs-text-dim)] hover:text-white transition-colors text-sm font-bold cursor-pointer">
                      <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                  ) : <div/>}

                  {currentStep === steps.length - 1 && answers[currentStep] && (
                    <button 
                      onClick={() => setCurrentStep(steps.length)}
                      className="px-8 py-3 text-black font-black rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer hover:brightness-110"
                      style={{ background: 'var(--cs-amber)', boxShadow: '0 8px 24px -8px var(--cs-amber-glow)' }}
                    >
                      Lihat Kesimpulan <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
