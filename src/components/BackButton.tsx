import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/') return null;

  return (
    <AnimatePresence>
      <motion.button 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={() => {
          if (location.pathname === '/dashboard') {
            navigate('/select-device');
          } else {
            navigate(-1);
          }
        }} 
        className="fixed bottom-6 lg:bottom-10 left-6 lg:left-10 z-[100] p-4 rounded-full text-[#475569] hover:text-[#0284C7] bg-white border border-slate-200 transition-all flex items-center justify-center group shadow-lg cursor-pointer"
        whileHover={{
          borderColor: '#0284C7',
          color: '#0284C7',
          boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.25)',
          y: -2
        }}
        title="Kembali ke Halaman Sebelumnya"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      </motion.button>
    </AnimatePresence>
  );
}
