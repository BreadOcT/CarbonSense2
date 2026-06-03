import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleSelect = (option: string) => {
    if (!steps[currentStep]) return;
    const newAnswers = [...answers];
    newAnswers[currentStep] = { id: steps[currentStep].id, value: option };
    setAnswers(newAnswers);

    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1)), 300);
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
      rentan: answers.find(a => a?.id === 'rentan')?.value || ''
    };
    localStorage.setItem('cs_ai_personality', JSON.stringify(profile));
    
    setTimeout(() => {
      navigate('/select-device');
    }, 1500);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

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
      </header>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] blur-[100px] rounded-full" style={{ background: 'var(--cs-amber-glow)', opacity: 0.15 }} />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <header className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border"
            style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'var(--cs-amber)' }}
          >
            <BrainCircuit className="w-8 h-8" style={{ color: 'var(--cs-amber)' }} />
          </motion.div>
          <h1 className="text-3xl font-black tracking-normal mb-2 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Simulasi AI Assistant</h1>
          <p className="text-[var(--cs-text-dim)] text-sm">Bantu CarbonSense AI mengenali profil lingkungan Anda.</p>
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
             <span>Step {currentStep + 1} of {steps.length}</span>
             <span>{Math.round(progress)}% Complete</span>
           </div>
        </div>

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {!isFinishing ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{steps[currentStep]?.title}</h3>
                  <p className="text-[var(--cs-text-dim)] mt-1">{steps[currentStep]?.desc}</p>
                </div>

                <div className="space-y-3">
                  {steps[currentStep]?.options?.map((opt) => {
                    const isSelected = answers[currentStep]?.value === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelect(opt)}
                        className="w-full p-5 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group cursor-pointer"
                        style={{
                          background: isSelected ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface))' : 'var(--cs-surface)',
                          borderColor: isSelected ? 'var(--cs-amber)' : 'var(--cs-border)',
                          color: isSelected ? 'var(--cs-amber)' : 'var(--cs-text-dim)',
                        }}
                      >
                        <span className="font-semibold">{opt}</span>
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

                <div className="flex items-center justify-between pt-6">
                  {currentStep > 0 ? (
                    <button onClick={handleBack} className="flex items-center gap-2 text-[var(--cs-text-dim)] hover:text-white transition-colors text-sm font-bold cursor-pointer">
                      <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                  ) : <div/>}

                  {currentStep === steps.length - 1 && answers[currentStep] && (
                    <button 
                      onClick={handleFinish}
                      className="px-8 py-3 text-black font-black rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer hover:brightness-110"
                      style={{ background: 'var(--cs-amber)', boxShadow: '0 8px 24px -8px var(--cs-amber-glow)' }}
                    >
                      Selesai <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-pulse" style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)' }}>
                   <Activity className="w-10 h-10" style={{ color: 'var(--cs-amber)' }} />
                </div>
                <h3 className="text-2xl font-black tracking-normal uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Mempersiapkan Dashboard...</h3>
                <p className="text-[var(--cs-text-dim)] mt-2">Menganalisis profil lingkungan dan menghubungkan AI assistant.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Activity icon for the final screen
function Activity({ className, style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <svg 
      className={className} 
      style={style}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
