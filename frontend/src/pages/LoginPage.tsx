import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, CheckCircle2, Home, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo3D } from '../components/Logo3D';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { apiUrl } from '../config/api';
import { GirlVideoCallCard, BoyVideoCallCard, MobileAuthCallPreview } from '../components/AuthVideoCallPanels';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // OTP flow state
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessBanner(null);
    setLoading(true);

    try {
      let res, data;
      if (isOtpMode) {
        // Submit OTP
        res = await fetch(apiUrl('/api/auth/verify-login-otp'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        });
        data = await res.json();
      } else {
        // Normal Login
        res = await fetch(apiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        data = await res.json();

        if (res.status === 403 && data.requireOtp) {
          setIsOtpMode(true);
          setSuccessBanner(data.message);
          setLoading(false);
          return;
        }
      }

      if (!res.ok) throw new Error(data.error || 'Unable to sign in.');

      login(data.token, data.user);
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(data.user.username ? '/dashboard' : '/setup');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSuccess = (updatedEmail: string) => {
    setShowForgotPassword(false);
    setEmail(updatedEmail);
    setPassword('');
    setIsOtpMode(false);
    setOtp('');
    setSuccessBanner('Your password was updated successfully! You can now sign in.');
  };

  return (
    <div className="auth-shell text-white flex items-center justify-center p-4 sm:p-6 min-h-screen">
      <div className="auth-orb w-[32rem] h-[32rem] -top-48 -left-36 bg-pink-500/20" />
      <div className="auth-orb w-[34rem] h-[34rem] -bottom-56 -right-36 bg-indigo-500/20" />

      <div className="relative z-10 w-full max-w-7xl flex flex-col items-center">
        {/* Mobile / Tablet interactive call preview */}
        <MobileAuthCallPreview />

        {/* 3-Column Luxury Experience: Girl Video Call (Left) | Login Card | Boy Video Call (Right) */}
        <div className="w-full flex items-center justify-center gap-6 xl:gap-8">
          {/* Left: Girl live video call */}
          <GirlVideoCallCard />

          {/* Center: Sign In Card */}
          <main className="w-full max-w-xl auth-card rounded-[2.2rem] p-8 sm:p-11 shadow-2xl border border-white/10 backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <Logo3D size={48} animate={false} />
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-pink-300 transition-colors">
                  VibeMeet
                </span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-pink-400/40 hover:bg-pink-500/10 hover:text-white"
                title="Back to landing page"
              >
                <Home size={14} /> Landing
              </Link>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-400/20 text-pink-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles size={13} />
              <span>Welcome back</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mt-1 leading-tight">
              {isOtpMode ? 'Security Check' : <>Sign in to <span className="gradient-text">VibeMeet</span></>}
            </h1>
            <p className="text-slate-400 mt-2 mb-7 text-sm leading-relaxed">
              {isOtpMode ? 'Please enter the 6-digit verification code sent to your email.' : 'Your next real video conversation could be just one click away.'}
            </p>

            {successBanner && (
              <div className="bg-emerald-500/10 border border-emerald-400/25 text-emerald-200 p-3.5 rounded-xl text-sm mb-5 flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>{successBanner}</span>
              </div>
            )}

            {error && (
              <div role="alert" className="bg-red-500/10 border border-red-400/25 text-red-200 p-3.5 rounded-xl text-sm mb-5 animate-in fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isOtpMode ? (
                <>
                  <label className="block text-sm font-medium text-slate-300">
                    Email address
                    <div className="relative mt-2">
                      <Mail size={18} className="absolute left-4 top-3.5 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        className="auth-input"
                      />
                    </div>
                  </label>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs font-semibold text-pink-400 hover:text-pink-300 hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <LockKeyhole size={18} className="absolute left-4 top-3.5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className="auth-input pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <label className="block text-sm font-medium text-slate-300">
                  Verification Code (OTP)
                  <div className="relative mt-2">
                    <KeyRound size={18} className="absolute left-4 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="000000"
                      required
                      className="auth-input tracking-widest text-center"
                    />
                  </div>
                </label>
              )}

              <button
                disabled={loading}
                className="auth-primary w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50 mt-2 shadow-lg hover:shadow-pink-500/20"
              >
                {loading ? 'Verifying…' : (isOtpMode ? 'Verify Code' : 'Sign in securely')}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-400" /> Verified email community
              </span>
              <Link to="/admin/login" className="hover:text-pink-400 transition-colors">
                Admin Portal →
              </Link>
            </div>

            <p className="text-center text-slate-400 text-sm mt-6">
              New to VibeMeet?{' '}
              <Link className="text-pink-400 font-semibold hover:text-pink-300 hover:underline" to="/register">
                Create your free account
              </Link>
            </p>
          </main>

          {/* Right: Boy live video call */}
          <BoyVideoCallCard />
        </div>
      </div>

      {/* Forgot Password Modal with 6-digit OTP verification */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        initialEmail={email}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={handlePasswordResetSuccess}
      />
    </div>
  );
};

export default LoginPage;
