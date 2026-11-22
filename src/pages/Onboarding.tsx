import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert, Activity, Brain, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

interface OnboardingStep {
  id: string;
  title: string;
  desc: string;
  type: 'choice' | 'contacts_list';
  options?: string[];
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'lokasi',
    title: 'Di Ruangan Mana Alat Ini Dipasang?',
    desc: 'Pilih lokasi pemasangan agar sistem bisa memberikan saran keamanan yang paling tepat.',
    type: 'choice',
    options: ['Dapur / Tempat Masak', 'Ruang Tamu / Keluarga', 'Kamar Tidur', 'Ruang Kerja / Usaha', 'Gudang / Penyimpanan', 'Lainnya'],
    allowCustom: true,
    customPlaceholder: 'Tuliskan nama ruangan lainnya (contoh: Garasi / Area Kasir)...'
  },
  {
    id: 'sirkulasi',
    title: 'Bagaimana Kondisi Pertukaran Udara di Ruangan Tersebut?',
    desc: 'Kondisi jendela dan ventilasi sangat mempengaruhi seberapa cepat gas berkumpul.',
    type: 'choice',
    options: ['Ruangan Tertutup Ber-AC', 'Jendela Sering Dibuka', 'Ada Kipas Penyedot Udara (Exhaust Fan)', 'Ruangan Semi-Terbuka', 'Lainnya'],
    allowCustom: true,
    customPlaceholder: 'Tuliskan kondisi ventilasi lainnya...'
  },
  {
    id: 'kapasitas',
    title: 'Berapa Banyak Orang yang Biasanya Ada di Ruangan Ini?',
    desc: 'Perkiraan rata-rata orang yang beraktivitas di ruangan tersebut setiap harinya.',
    type: 'choice',
    options: ['1 - 2 Orang', '3 - 5 Orang', 'Lebih dari 5 Orang', 'Jarang Ada Orang'],
    allowCustom: false
  },
  {
    id: 'polutan',
    title: 'Apa Sumber Asap atau Gas yang Paling Dekat dengan Alat?',
    desc: 'Pilih sumber gas atau asap yang paling sering digunakan di dekat alat.',
    type: 'choice',
    options: ['Kompor Gas / Tabung LPG', 'Asap Rokok', 'Asap Kendaraan / Mesin / Genset', 'Tidak Ada Sumber Asap', 'Lainnya'],
    allowCustom: true,
    customPlaceholder: 'Tuliskan sumber asap/gas lainnya (contoh: Pemanggang Roti / Boiler)...'
  },
  {
    id: 'luas_ruang',
    title: 'Kira-kira Seberapa Luas Ruangan Tempat Alat Dipasang?',
    desc: 'Semakin kecil ruangan, semakin cepat gas berbahaya menumpuk jika terjadi kebocoran.',
    type: 'choice',
    options: ['Kecil (Kurang dari 3x3 meter)', 'Sedang (Sekitar 4x5 meter)', 'Luas (Lebih dari 5x5 meter)', 'Lainnya'],
    allowCustom: true,
    customPlaceholder: 'Tuliskan perkiraan ukuran ruangan (contoh: 6x8 meter)...'
  },
  {
    id: 'detektor_lain',
    title: 'Apakah Sudah Ada Alat Pemadam (APAR) atau Alarm Asap Lain?',
    desc: 'Informasi ini membantu kami menyusun langkah penyelamatan jika terjadi kondisi darurat.',
    type: 'choice',
    options: ['Sudah Ada dan Aktif', 'Ada Tapi Jarang Dicek', 'Belum Ada Sama Sekali', 'Lainnya'],
    allowCustom: true,
    customPlaceholder: 'Tuliskan perlengkapan keamanan lainnya...'
  },
  {
    id: 'wa_darurat',
    title: 'Nomor WhatsApp untuk Peringatan Bahaya',
    desc: 'Masukkan satu atau beberapa nomor WhatsApp (pemilik rumah, anggota keluarga, atau penanggung jawab) yang akan dihubungi saat gas bocor.',
    type: 'contacts_list'
  }
];

function generateDynamicFallbackSummary(answers: { id: string; value: string }[]): string {
  const lokasi = answers.find(a => a?.id === 'lokasi')?.value || 'Ruangan';
  const sirkulasi = answers.find(a => a?.id === 'sirkulasi')?.value || 'sirkulasi standar';
  const kapasitas = answers.find(a => a?.id === 'kapasitas')?.value || '1 - 2 Orang';
  const polutan = answers.find(a => a?.id === 'polutan')?.value || 'Tidak Ada Sumber Asap';
  const luas = answers.find(a => a?.id === 'luas_ruang')?.value || 'Sedang';

  let summary = `Halo! Saya **CarbonSense AI**. Saya telah menganalisis profil ruangan Anda. Alat pemantau dipasang di **${lokasi}** dengan perkiraan ukuran **${luas}**. `;

  if (sirkulasi.toLowerCase().includes('tertutup')) {
    summary += `Karena kondisi ruangan **${sirkulasi}**, gas atau asap berpotensi lebih cepat berkumpul dengan aktivitas sekitar **${kapasitas}**. `;
  } else {
    summary += `Didukung oleh kondisi **${sirkulasi}**, pertukaran udara akan membantu menjaga kenyamanan bagi **${kapasitas}** di ruangan ini. `;
  }

  if (polutan !== 'Tidak Ada Sumber Asap' && polutan !== 'Tidak Ada') {
    summary += `Adanya sumber gas/asap dari **${polutan}** di sekitar area ini membuat sistem menyiagakan pemantauan kebocoran secara aktif agar Anda selalu aman.`;
  } else {
    summary += `Pemantauan kualitas udara akan berjalan secara otomatis guna memastikan keamanan harian keluarga dan ruangan Anda.`;
  }

  return summary;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('cs_user_email');
  const onboardingCompleted = userEmail ? localStorage.getItem(`cs_onboarding_completed_${userEmail}`) === 'true' : false;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ id: string; value: string }[]>([]);
  const [customInputMode, setCustomInputMode] = useState<Record<string, boolean>>({});
  const [customTextValue, setCustomTextValue] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { name: 'Kontak Utama', phone: '+6281234567890' }
  ]);
  const [contactError, setContactError] = useState('');

  const [isFinishing, setIsFinishing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Load previous answers & emergency contacts if repeating onboarding
  useEffect(() => {
    if (userEmail) {
      const savedAnswers = localStorage.getItem(`cs_onboarding_answers_${userEmail}`);
      if (savedAnswers) {
        try {
          const parsed = JSON.parse(savedAnswers);
          if (Array.isArray(parsed)) {
            setAnswers(parsed);
          }
        } catch (e) {
          console.error('Failed to parse saved onboarding answers:', e);
        }
      }
      const savedContacts = localStorage.getItem(`cs_emergency_contacts_${userEmail}`) || localStorage.getItem('cs_emergency_contacts');
      if (savedContacts) {
        try {
          const parsedC = JSON.parse(savedContacts);
          if (Array.isArray(parsedC) && parsedC.length > 0) {
            setContacts(parsedC);
          }
        } catch (e) {
          console.error('Failed to parse saved emergency contacts:', e);
        }
      }
    }
  }, [userEmail]);

  useEffect(() => {
    if (currentStep === steps.length) {
      setLoadingSummary(true);
      const lokasiVal = answers.find(a => a?.id === 'lokasi')?.value || 'Dapur / Tempat Masak';
      const sirkulasiVal = answers.find(a => a?.id === 'sirkulasi')?.value || 'Jendela Sering Dibuka';
      const kapasitasVal = answers.find(a => a?.id === 'kapasitas')?.value || '1 - 2 Orang';
      const polutanVal = answers.find(a => a?.id === 'polutan')?.value || 'Kompor Gas / Tabung LPG';
      const luasVal = answers.find(a => a?.id === 'luas_ruang')?.value || 'Sedang (Sekitar 4x5 meter)';
      const detektorVal = answers.find(a => a?.id === 'detektor_lain')?.value || 'Belum Ada Sama Sekali';

      const queryText = "Berikan kalimat kesimpulan analisis profil ruangan asisten AI pintar dalam bahasa Indonesia yang ramah dan mudah dipahami orang awam. Perkenalkan diri Anda sebagai CarbonSense AI pendeteksi gas karbon. Sebutkan secara ringkas (maksimal 3 kalimat) tentang lokasi pemasangan alat, luas ruangan, kondisi sirkulasi udara, jumlah orang, dan sumber gas terdekat.";

      api.ai.getRecommendation({
        question: queryText,
        profile: {
          lokasi: lokasiVal,
          sirkulasi: sirkulasiVal,
          kapasitas: kapasitasVal,
          polutan: [polutanVal].filter(Boolean),
          rentan: 'Tidak Ada',
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
        const staticText = generateDynamicFallbackSummary(answers);
        setAiSummary(staticText);
        setLoadingSummary(false);
      });
    }
  }, [currentStep, answers]);

  const setAnswerForStep = (stepId: string, val: string) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a?.id !== stepId);
      return [...filtered, { id: stepId, value: val }];
    });
  };

  const handleSelectOption = (option: string) => {
    const step = steps[currentStep];
    if (!step) return;

    if (option === 'Lainnya' && step.allowCustom) {
      setCustomInputMode(prev => ({ ...prev, [step.id]: true }));
      return;
    }

    setCustomInputMode(prev => ({ ...prev, [step.id]: false }));
    setAnswerForStep(step.id, option);

    setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }, 220);
  };

  const handleSaveCustomOption = (stepId: string) => {
    const val = (customTextValue[stepId] || '').trim();
    if (!val) return;
    setAnswerForStep(stepId, val);
    setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }, 150);
  };

  const handleContactChange = (index: number, field: 'name' | 'phone', val: string) => {
    setContactError('');
    setContacts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleAddContactRow = () => {
    setContacts(prev => [...prev, { name: '', phone: '+62' }]);
  };

  const handleRemoveContactRow = (index: number) => {
    if (contacts.length <= 1) return;
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveContactsStep = () => {
    const validContacts = contacts
      .map(c => ({ name: c.name.trim() || 'Kontak Darurat', phone: c.phone.trim() }))
      .filter(c => c.phone.length >= 6);

    if (validContacts.length === 0) {
      setContactError('Mohon isi minimal 1 nomor WhatsApp darurat yang aktif (contoh: +6281234567890).');
      return;
    }

    setContacts(validContacts);
    setAnswerForStep('wa_darurat', validContacts.map(c => `${c.name} (${c.phone})`).join(', '));
    setCurrentStep(steps.length);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleFinish = () => {
    setIsFinishing(true);

    const lokasiVal = answers.find(a => a?.id === 'lokasi')?.value || 'Dapur / Tempat Masak';
    const sirkulasiVal = answers.find(a => a?.id === 'sirkulasi')?.value || 'Jendela Sering Dibuka';
    const kapasitasVal = answers.find(a => a?.id === 'kapasitas')?.value || '1 - 2 Orang';
    const polutanVal = answers.find(a => a?.id === 'polutan')?.value || 'Kompor Gas / Tabung LPG';
    const luasVal = answers.find(a => a?.id === 'luas_ruang')?.value || 'Sedang (Sekitar 4x5 meter)';
    const detektorVal = answers.find(a => a?.id === 'detektor_lain')?.value || 'Belum Ada Sama Sekali';

    const profile = {
      lokasi: lokasiVal,
      sirkulasi: sirkulasiVal,
      kapasitas: kapasitasVal,
      polutan: [polutanVal].filter(Boolean) as string[],
      rentan: 'Tidak Ada',
      luas_ruang: luasVal,
      detektor_lain: detektorVal,
      wa_darurat: contacts[0]?.phone || '+6281234567890',
      emergency_contacts: contacts
    };

    localStorage.setItem('cs_onboarding_answers', JSON.stringify(answers));
    localStorage.setItem('cs_ai_personality', JSON.stringify(profile));
    localStorage.setItem('cs_emergency_contacts', JSON.stringify(contacts));

    if (userEmail) {
      localStorage.setItem(`cs_onboarding_answers_${userEmail}`, JSON.stringify(answers));
      localStorage.setItem(`cs_ai_personality_${userEmail}`, JSON.stringify(profile));
      localStorage.setItem(`cs_emergency_contacts_${userEmail}`, JSON.stringify(contacts));
      localStorage.setItem(`cs_onboarding_completed_${userEmail}`, 'true');
    }

    setTimeout(() => {
      navigate('/select-device');
    }, 1000);
  };

  const isSummaryPage = currentStep === steps.length;
  const progress = isSummaryPage ? 100 : Math.round(((currentStep + 1) / (steps.length + 1)) * 100);

  const sirkulasiVal = answers.find(a => a?.id === 'sirkulasi')?.value || '';
  const polutanVal = answers.find(a => a?.id === 'polutan')?.value || '';
  const isHighRisk =
    sirkulasiVal.toLowerCase().includes('tertutup') ||
    polutanVal.toLowerCase().includes('kompor') ||
    polutanVal.toLowerCase().includes('rokok');

  const currentStepObj = steps[currentStep];
  const currentAnswerVal = currentStepObj ? answers.find(a => a?.id === currentStepObj.id)?.value || '' : '';
  const isCurrentAnswerPreset = currentStepObj?.options ? currentStepObj.options.filter(o => o !== 'Lainnya').includes(currentAnswerVal) : false;
  const showCustomBox = currentStepObj?.allowCustom && (customInputMode[currentStepObj.id] || (Boolean(currentAnswerVal) && !isCurrentAnswerPreset));

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F0F9FF] text-[#0F172A] font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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
              <span className="text-[10px] text-[#0284C7] font-mono tracking-widest uppercase font-bold">PENGATURAN AWAL RUANGAN</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {onboardingCompleted && (
              <button
                onClick={() => navigate('/select-device')}
                className="text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:border-[#0284C7] text-[#475569] hover:text-[#0284C7] transition-all font-semibold cursor-pointer"
              >
                Lewati ke Pilih Alat
              </button>
            )}
            <button
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
              Keluar Sesi
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="max-w-xl w-full">
          {/* Header Intro */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] border border-[#0284C7]/30 flex items-center justify-center mx-auto mb-3 text-[#0284C7] shadow-sm">
              <BrainCircuit className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A]">Kenali Kondisi Ruangan Anda</h1>
            <p className="text-xs text-[#475569] mt-1">
              Jawab beberapa pertanyaan singkat ini agar peringatan bahaya dan pesan WhatsApp bekerja sesuai kondisi ruangan Anda.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-[#0284C7] transition-all duration-300"
              />
            </div>
            <div className="flex justify-between mt-2 text-[11px] font-mono text-[#475569] uppercase tracking-wider font-semibold">
              <span>{isSummaryPage ? 'Ringkasan Pengaturan Ruangan' : `Langkah ${currentStep + 1} dari ${steps.length}`}</span>
              <span>{progress}% Selesai</span>
            </div>
          </div>

          {/* Step Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl min-h-[380px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {isFinishing ? (
                <motion.div
                  key="finishing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-[#E0F2FE] flex items-center justify-center mb-5">
                    <Activity className="w-8 h-8 text-[#0284C7] animate-bounce" />
                  </div>
                  <h3 className="text-xl font-extrabold text-[#0F172A]">Menyimpan Pengaturan Ruangan...</h3>
                  <p className="text-xs text-[#475569] mt-2">Menyiapkan halaman pemilihan perangkat pemantau Anda.</p>
                </motion.div>
              ) : isSummaryPage ? (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-5"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#16A34A] font-bold">Pengaturan Selesai</span>
                    <h2 className="text-xl font-extrabold text-[#0F172A] mt-1">Ringkasan Kondisi Ruangan Anda</h2>
                    <p className="text-xs text-[#475569] mt-1">Periksa kembali data ruangan dan nomor WhatsApp darurat Anda.</p>
                  </div>

                  {/* AI Analysis Box */}
                  <div className="p-5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD]">
                    {loadingSummary ? (
                      <div className="py-6 flex flex-col items-center justify-center gap-2.5">
                        <Brain className="w-7 h-7 text-[#0284C7] animate-spin" />
                        <span className="text-xs font-mono text-[#0284C7] uppercase tracking-wider font-bold">
                          Menyusun Analisis Profil Ruangan...
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs leading-relaxed text-[#0F172A] text-left">
                        <span className="font-bold text-[#0284C7] block mb-1 uppercase tracking-wider text-[11px]">
                          Analisis CarbonSense AI:
                        </span>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: aiSummary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Sensitivity Badge */}
                  <div
                    className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                      isHighRisk ? 'bg-[#FFF7ED] border-[#FED7AA]' : 'bg-[#F0FDF4] border-[#BBF7D0]'
                    }`}
                  >
                    {isHighRisk ? (
                      <ShieldAlert className="w-6 h-6 text-[#EA580C] shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`font-bold text-xs ${isHighRisk ? 'text-[#EA580C]' : 'text-[#16A34A]'}`}>
                        {isHighRisk ? 'Mode Peringatan Dini Lebih Cepat Aktif' : 'Mode Pemantauan Standar Aktif'}
                      </h4>
                      <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                        {isHighRisk
                          ? 'Karena ruangan tertutup atau dekat dengan sumber gas/asap, sistem akan memberikan peringatan lebih awal saat udara mulai kurang bersih.'
                          : 'Kondisi sirkulasi udara ruangan tergolong baik. Sistem akan memantau kebocoran gas secara terus-menerus 24 jam.'}
                      </p>
                    </div>
                  </div>

                  {/* Saved Room Options Pills */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    {[
                      { label: 'Lokasi Alat', val: answers.find(a => a?.id === 'lokasi')?.value || 'Dapur / Tempat Masak' },
                      { label: 'Pertukaran Udara', val: answers.find(a => a?.id === 'sirkulasi')?.value || 'Jendela Sering Dibuka' },
                      { label: 'Jumlah Orang', val: answers.find(a => a?.id === 'kapasitas')?.value || '1 - 2 Orang' },
                      { label: 'Sumber Gas/Asap', val: answers.find(a => a?.id === 'polutan')?.value || 'Kompor Gas / Tabung LPG' },
                      { label: 'Ukuran Ruangan', val: answers.find(a => a?.id === 'luas_ruang')?.value || 'Sedang' },
                      { label: 'Alat Pengaman Lain', val: answers.find(a => a?.id === 'detektor_lain')?.value || 'Belum Ada' }
                    ].map(item => (
                      <div key={item.label} className="p-3 rounded-xl bg-[#F9FAFB] border border-slate-200">
                        <span className="text-[10px] text-[#475569] block">{item.label}</span>
                        <span className="font-bold text-[#0F172A]">{item.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Registered WhatsApp Contacts */}
                  <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#16A34A] block mb-2 font-bold">
                      Kontak Darurat WhatsApp Terdaftar ({contacts.length} Nomor):
                    </span>
                    <div className="space-y-1.5">
                      {contacts.map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#BBF7D0]/60 last:border-0">
                          <span className="font-bold text-[#0F172A]">{c.name || `Kontak ${idx + 1}`}</span>
                          <span className="font-mono text-[#16A34A] font-semibold">{c.phone}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-xs font-bold text-[#475569] hover:text-[#0F172A] flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Ubah Jawaban
                    </button>
                    <button
                      type="button"
                      onClick={handleFinish}
                      className="px-6 py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs transition-all shadow-lg shadow-[#0284C7]/25 flex items-center gap-2 cursor-pointer"
                    >
                      Simpan &amp; Pilih Perangkat <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : currentStepObj?.type === 'contacts_list' ? (
                <motion.div
                  key="contacts_step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 flex flex-col justify-between h-full"
                >
                  <div>
                    <h2 className="text-xl font-extrabold text-[#0F172A]">{currentStepObj.title}</h2>
                    <p className="text-xs text-[#475569] mt-1">{currentStepObj.desc}</p>
                  </div>

                  {contactError && (
                    <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold">
                      {contactError}
                    </div>
                  )}

                  <div className="space-y-3 my-2">
                    {contacts.map((contact, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-[#F9FAFB] border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#0284C7] font-bold">
                            Kontak Darurat #{idx + 1}
                          </span>
                          {contacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveContactRow(idx)}
                              className="text-[11px] text-[#DC2626] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] text-[#475569] mb-1 font-semibold">
                              Nama Kontak (Misal: Suami / Ibu / Satpam)
                            </label>
                            <input
                              type="text"
                              value={contact.name}
                              onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                              placeholder="Contoh: Bpk. Budi"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#475569] mb-1 font-semibold">
                              Nomor WhatsApp (Format +62 / 08)
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
                      onClick={handleAddContactRow}
                      className="w-full py-2.5 rounded-xl border border-dashed border-[#0284C7]/50 text-[#0284C7] hover:bg-[#F0F9FF] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Tambah Nomor WhatsApp Lain
                    </button>
                    <p className="text-[11px] text-[#475569] leading-relaxed">
                      Saat terdeteksi kebocoran gas berbahaya, Anda dapat langsung menekan tombol darurat untuk mengirim pesan peringatan ke nomor-nomor di atas.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-xs font-bold text-[#475569] hover:text-[#0F172A] flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveContactsStep}
                      className="px-6 py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs transition-all shadow-lg shadow-[#0284C7]/25 flex items-center gap-2 cursor-pointer"
                    >
                      Lihat Ringkasan <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 flex flex-col justify-between h-full"
                >
                  <div>
                    <h2 className="text-xl font-extrabold text-[#0F172A]">{currentStepObj?.title}</h2>
                    <p className="text-xs text-[#475569] mt-1">{currentStepObj?.desc}</p>
                  </div>

                  <div className="space-y-2.5 my-3">
                    {currentStepObj?.options?.map((opt) => {
                      const isSelected =
                        opt === 'Lainnya'
                          ? Boolean(showCustomBox)
                          : currentAnswerVal === opt && !showCustomBox;
                      return (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => handleSelectOption(opt)}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] shadow-sm'
                              : 'bg-[#F9FAFB] border-slate-200 text-[#0F172A] hover:border-[#0284C7]/50 hover:bg-white'
                          }`}
                        >
                          <span className="font-bold text-sm">
                            {opt === 'Lainnya' ? 'Lainnya (Tulis Sendiri)...' : opt}
                          </span>
                          <span
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-[#0284C7] bg-[#0284C7]' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </span>
                        </button>
                      );
                    })}

                    {showCustomBox && currentStepObj && (
                      <div className="p-4 rounded-2xl bg-[#F0F9FF] border border-[#0284C7]/40 space-y-3 mt-2">
                        <label className="block text-xs font-bold text-[#0284C7]">Tuliskan Jawaban Anda:</label>
                        <input
                          type="text"
                          value={
                            customTextValue[currentStepObj.id] !== undefined
                              ? customTextValue[currentStepObj.id]
                              : !isCurrentAnswerPreset
                              ? currentAnswerVal
                              : ''
                          }
                          onChange={(e) =>
                            setCustomTextValue(prev => ({ ...prev, [currentStepObj.id]: e.target.value }))
                          }
                          placeholder={currentStepObj.customPlaceholder || 'Ketik jawaban Anda...'}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCustomOption(currentStepObj.id)}
                          className="w-full py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs transition-all cursor-pointer"
                        >
                          Simpan Jawaban &amp; Lanjut -&gt;
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    {currentStep > 0 ? (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="text-xs font-bold text-[#475569] hover:text-[#0F172A] flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" /> Kembali
                      </button>
                    ) : (
                      <span />
                    )}
                    {currentAnswerVal && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(prev => Math.min(prev + 1, steps.length))}
                        className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Langkah Berikutnya <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-[#475569] border-t border-slate-200 bg-white">
        CarbonSense — Sistem Pemantauan Keamanan Udara &amp; Gas
      </footer>
    </div>
  );
}
