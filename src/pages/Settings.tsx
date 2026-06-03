import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, LogOut, Wind } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({
    lokasi: '',
    sirkulasi: '',
    kapasitas: '',
    polutan: [] as string[],
    rentan: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().profile) {
          setAnswers(userDoc.data().profile);
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
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen text-[var(--cs-text)] font-sans pt-24 pb-12 px-6 relative" style={{ background: 'var(--cs-bg)' }}>
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{ background: 'color-mix(in oklab, var(--cs-bg) 80%, transparent)', borderColor: 'var(--cs-border)' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
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

      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Pengaturan AI Assistant</h1>
            <p className="text-sm text-[var(--cs-text-dim)]">Sesuaikan konteks lingkungan untuk analisis AI assistant</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Q1 */}
          <div className="p-6 border rounded-3xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--cs-amber)', letterSpacing: '0.05em' }}>1. Lokasi Penempatan Ruangan</h3>
            <div className="space-y-2">
              {['Kamar Tidur', 'Ruang Keluarga / Ruang Tamu', 'Dapur / Ruang Makan', 'Ruang Kerja / Belajar', 'Lainnya'].map(opt => (
                <label key={opt} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/30 cursor-pointer border border-transparent hover:border-[var(--cs-border)] transition-all">
                  <input 
                    type="radio" 
                    name="lokasi" 
                    required 
                    value={opt} 
                    checked={answers.lokasi === opt} 
                    onChange={(e) => setAnswers({...answers, lokasi: e.target.value})} 
                    className="w-4 h-4 cursor-pointer" 
                    style={{ accentColor: 'var(--cs-amber)' }}
                  />
                  <span className="text-sm text-[var(--cs-text)]">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Q2 */}
          <div className="p-6 border rounded-3xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--cs-amber)', letterSpacing: '0.05em' }}>2. Sirkulasi & Ventilasi Udara</h3>
            <div className="space-y-2">
              {[
                'Ruangan tertutup ber-AC (Jendela jarang/tidak pernah dibuka)',
                'Ada jendela yang rutin dibuka setiap hari',
                'Menggunakan sistem Exhaust Fan (Kipas penyedot udara)',
                'Ruangan semi-terbuka / tanpa pintu tertutup',
                'Lainnya'
              ].map(opt => (
                <label key={opt} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/30 cursor-pointer border border-transparent hover:border-[var(--cs-border)] transition-all">
                  <input 
                    type="radio" 
                    name="sirkulasi" 
                    required 
                    value={opt} 
                    checked={answers.sirkulasi === opt} 
                    onChange={(e) => setAnswers({...answers, sirkulasi: e.target.value})} 
                    className="w-4 h-4 cursor-pointer" 
                    style={{ accentColor: 'var(--cs-amber)' }}
                  />
                  <span className="text-sm text-[var(--cs-text)]">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Q3 */}
          <div className="p-6 border rounded-3xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--cs-amber)', letterSpacing: '0.05em' }}>3. Kapasitas Hunian (Occupancy)</h3>
            <div className="space-y-2">
              {['1 - 2 Orang', '3 - 4 Orang', '5 Orang atau lebih', 'Jarang ditempati (Hanya ruang singgah)'].map(opt => (
                <label key={opt} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/30 cursor-pointer border border-transparent hover:border-[var(--cs-border)] transition-all">
                  <input 
                    type="radio" 
                    name="kapasitas" 
                    required 
                    value={opt} 
                    checked={answers.kapasitas === opt} 
                    onChange={(e) => setAnswers({...answers, kapasitas: e.target.value})} 
                    className="w-4 h-4 cursor-pointer" 
                    style={{ accentColor: 'var(--cs-amber)' }}
                  />
                  <span className="text-sm text-[var(--cs-text)]">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Q4 */}
          <div className="p-6 border rounded-3xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--cs-amber)', letterSpacing: '0.05em' }}>4. Potensi Polutan Terdekat</h3>
            <div className="space-y-2">
              {[
                'Kompor gas / Peralatan masak',
                'Aktivitas merokok / Vape',
                'Asap kendaraan (Dekat garasi / pinggir jalan raya)',
                'Tidak ada sumber asap/gas yang dekat',
                'Lainnya'
              ].map(opt => (
                <label key={opt} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/30 cursor-pointer border border-transparent hover:border-[var(--cs-border)] transition-all">
                  <input 
                    type="checkbox" 
                    value={opt} 
                    checked={answers.polutan.includes(opt)} 
                    onChange={() => handlePolutanChange(opt)} 
                    className="w-4 h-4 cursor-pointer rounded" 
                    style={{ accentColor: 'var(--cs-amber)' }}
                  />
                  <span className="text-sm text-[var(--cs-text)]">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Q5 */}
          <div className="p-6 border rounded-3xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--cs-amber)', letterSpacing: '0.05em' }}>5. Kehadiran Kelompok Rentan</h3>
            <div className="space-y-2">
              {['Ya, ada Bayi / Balita', 'Ya, ada Lansia / Penderita Asma', 'Tidak ada'].map(opt => (
                <label key={opt} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/30 cursor-pointer border border-transparent hover:border-[var(--cs-border)] transition-all">
                  <input 
                    type="radio" 
                    name="rentan" 
                    required 
                    value={opt} 
                    checked={answers.rentan === opt} 
                    onChange={(e) => setAnswers({...answers, rentan: e.target.value})} 
                    className="w-4 h-4 cursor-pointer" 
                    style={{ accentColor: 'var(--cs-amber)' }}
                  />
                  <span className="text-sm text-[var(--cs-text)]">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6 flex items-center gap-4">
            <button 
              type="submit" 
              className="px-8 py-4 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:brightness-110 active:scale-95"
              style={{ background: 'var(--cs-amber)', boxShadow: '0 8px 24px -8px var(--cs-amber-glow)' }}
            >
              <Save className="w-5 h-5" /> Simpan Perubahan
            </button>
            {saved && <span className="text-sm font-medium" style={{ color: 'var(--cs-amber)' }}>✓ Berhasil disimpan!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
