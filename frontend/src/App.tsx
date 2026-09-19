import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProfileSetup from './pages/ProfileSetup';
import MatchPage from './pages/MatchPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import RegistrationPage from './pages/RegistrationPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import { useAuth } from './context/AuthContext';

// Protected Route Wrapper for Users
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN' && (!user.username || !user.gender)) return <Navigate to="/setup" replace />;  
  return <>{children}</>;
};

// Protected Route Wrapper strictly for Admins
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Verifying Admin Privileges...</div>;
  if (!token || !user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/setup" element={<ProfileSetup />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MatchPage />
          </ProtectedRoute>
        } />
        <Route path="/match" element={
          <ProtectedRoute>
            <MatchPage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
