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

// Auth Guards (Business Flow)
function UserGuard({ children }: { children: React.ReactNode }) {
  const userEmail = localStorage.getItem('cs_user_email');
  const hasOnboarded = userEmail ? localStorage.getItem(`cs_onboarding_completed_${userEmail}`) === 'true' : false;
  
  if (!userEmail) return <Navigate to="/login" replace />;
  if (!hasOnboarded) return <Navigate to="/onboarding" replace />;
  
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const userEmail = localStorage.getItem('cs_user_email');
  if (!userEmail) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const isAdmin = localStorage.getItem('cs_admin_token'); // Mock admin token
  if (!isAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export default function App() {
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
        <Route path="/dashboard" element={<UserGuard><Dashboard /></UserGuard>} /> {/* Redirecting to Select Device if dashboard is accessed directly without device, or UserGuard handles it */}
        <Route path="/settings" element={<UserGuard><Settings /></UserGuard>} />
        <Route path="/profile" element={<UserGuard><UserProfile /></UserGuard>} />
      </Routes>
    </BrowserRouter>
  );
}
