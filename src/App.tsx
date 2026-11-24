import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CarbonSenseLanding } from './components/generated/CarbonSenseLanding';
import UserLogin from './pages/UserLogin';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import SelectDevice from './pages/SelectDevice';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';

// Auth Guards (Business Flow: Login/Register -> Select Device -> 1x Per-Device Onboarding -> Dashboard)
function UserGuard({ children }: { children: React.ReactNode }) {
  const userEmail = localStorage.getItem('cs_user_email');
  
  if (!userEmail) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const userEmail = localStorage.getItem('cs_user_email');
  if (!userEmail) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('cs_admin_token');
  
  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Format token tidak valid');
    }
    const payloadBase64 = parts[1];
    // Base64url decoding
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    
    if (payload.role !== 'admin') {
      throw new Error('Peran bukan admin');
    }
  } catch (error) {
    console.error('Verifikasi admin gagal:', error);
    localStorage.removeItem('cs_admin_token');
    localStorage.removeItem('cs_admin_email');
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  // Normalize pathnames with double slashes (e.g. //login -> /login)
  if (window.location.pathname.includes('//')) {
    const cleanPath = window.location.pathname.replace(/\/+/g, '/');
    window.location.replace(cleanPath + window.location.search);
    return null;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CarbonSenseLanding />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<UserLogin />} />
        <Route path="/register" element={<Register />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        
        {/* Protected User Routes */}
        <Route path="/onboarding" element={<OnboardingGuard><Onboarding /></OnboardingGuard>} />
        <Route path="/select-device" element={<UserGuard><SelectDevice /></UserGuard>} />
        <Route path="/dashboard" element={<UserGuard><Dashboard /></UserGuard>} />
        <Route path="/settings" element={<UserGuard><Settings /></UserGuard>} />
        <Route path="/profile" element={<UserGuard><UserProfile /></UserGuard>} />

        {/* Fallback Wildcard Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
