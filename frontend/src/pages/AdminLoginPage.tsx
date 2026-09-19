import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LockKeyhole, Mail, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo3D } from '../components/Logo3D';
import { apiUrl } from '../config/api';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Admin verification failed.');
      }

      if (data.user?.role !== 'ADMIN') {
        throw new Error('Access denied. Administrator privileges required.');
      }

      login(data.token, data.user);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell text-white flex items-center justify-center p-5 relative min-h-screen bg-slate-950">
      <div className="auth-orb w-[32rem] h-[32rem] -top-48 -left-36 bg-purple-600/20" />
      <div className="auth-orb w-[34rem] h-[34rem] -bottom-56 -right-36 bg-pink-600/20" />

      <div className="relative z-10 w-full max-w-md auth-card rounded-[2.5rem] border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl">
        
        {/* Back Link */}
        <Link to="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to User Login
        </Link>

        {/* Brand & Badge */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-lg" />
            <Logo3D size={56} animate={false} className="relative z-10" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" /> Admin Portal Access
          </div>
          <h1 className="text-2xl font-black text-white">VibeMeet Operations</h1>
          <p className="text-xs text-slate-400 mt-1">Authorized personnel and system administrators only</p>
        </div>

        {error && (
          <div role="alert" className="bg-red-500/10 border border-red-400/25 text-red-200 p-3.5 rounded-xl text-xs flex items-start gap-2.5 mb-5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Admin Email
            <div className="relative mt-2">
              <Mail size={17} className="absolute left-4 top-3 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@domain.com"
                autoComplete="email"
                required
                className="auth-input text-sm"
              />
            </div>
          </label>

          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Admin Password
            <div className="relative mt-2">
              <LockKeyhole size={17} className="absolute left-4 top-3 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                className="auth-input pr-12 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl font-extrabold text-sm bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:opacity-95 text-white shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all"
          >
            {loading ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
