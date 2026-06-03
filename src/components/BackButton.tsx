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
        className="fixed bottom-6 lg:bottom-10 left-6 lg:left-10 z-[100] p-4 rounded-full text-[var(--cs-text-dim)] transition-all flex items-center justify-center group shadow-xl border cursor-pointer"
        style={{
          background: 'var(--cs-surface)',
          borderColor: 'var(--cs-border)',
        }}
        whileHover={{
          borderColor: 'var(--cs-amber)',
          color: 'var(--cs-amber)',
          boxShadow: '0 0 15px -4px var(--cs-amber-glow)',
          y: -2
        }}
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      </motion.button>
    </AnimatePresence>
  );
}
