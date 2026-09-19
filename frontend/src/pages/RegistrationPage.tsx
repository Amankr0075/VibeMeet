import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Home, KeyRound, LockKeyhole, Mail, ShieldCheck, UserRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo3D } from '../components/Logo3D';
import { apiUrl } from '../config/api';
import { GirlVideoCallCard, BoyVideoCallCard, MobileAuthCallPreview } from '../components/AuthVideoCallPanels';

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isCollegeStudent, setIsCollegeStudent] = useState(false);
  const [institutionName, setInstitutionName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (isCollegeStudent && !institutionName.trim()) {
      setError('Please enter your college or university name.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, isCollegeStudent, institutionName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to send the verification code.');

      // Demo accounts (@demo.com) are created instantly — skip OTP step
      if (data.demo && data.token) {
        login(data.token, data.user);
        navigate('/setup');
        return;
      }

      setStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to verify the code.');
      login(data.token, data.user);
      navigate('/setup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Your details', 'Verify email', 'Set your vibe'];

  return (
    <div className="auth-shell text-white flex items-center justify-center p-4 sm:p-6 min-h-screen">
      <div className="auth-orb w-[30rem] h-[30rem] -top-40 -right-32 bg-purple-500/20" />
      <div className="auth-orb w-[28rem] h-[28rem] -bottom-48 -left-28 bg-pink-500/20" />

      <div className="relative z-10 w-full max-w-7xl flex flex-col items-center">
        {/* Mobile / Tablet interactive call preview */}
        <MobileAuthCallPreview />

        {/* 3-Column Luxury Experience: Girl Video Call (Left) | Register Card | Boy Video Call (Right) */}
        <div className="w-full flex items-center justify-center gap-6 xl:gap-8">
          {/* Left: Girl live video call */}
          <GirlVideoCallCard />

          {/* Center: Register Card */}
          <main className="w-full max-w-xl auth-card rounded-[2.2rem] p-7 sm:p-10 shadow-2xl border border-white/10 backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-6">
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

            {/* Stepper indicator */}
            <div className="flex items-center justify-between mb-6">
              {steps.map((item, i) => (
                <React.Fragment key={item}>
                  <div className="text-center">
                    <div
                      className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        i === 0 || (step === 'verify' && i === 1)
                          ? 'bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/30'
                          : 'bg-white/10 text-slate-500'
                      }`}
                    >
                      {i === 0 && step === 'verify' ? <Check size={16} /> : i + 1}
                    </div>
                    <span className="hidden sm:block text-[11px] mt-1.5 text-slate-400 font-medium">
                      {item}
                    </span>
                  </div>
                  {i < 2 && <div className="h-px flex-1 mx-2 bg-white/10" />}
                </React.Fragment>
              ))}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-400/20 text-pink-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles size={13} />
              <span>{step === 'register' ? 'Join VibeMeet' : 'One last step'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black mt-1 leading-tight">
              {step === 'register' ? (
                <>Your next vibe <span className="gradient-text">starts here.</span></>
              ) : (
                'Check your inbox.'
              )}
            </h1>

            <p className="text-slate-400 mt-1.5 mb-6 text-xs sm:text-sm leading-relaxed">
              {step === 'register' ? (
                'Create an account in under a minute. We verify every email to keep conversations authentic.'
              ) : (
                <>We sent a six-digit verification code to <strong className="text-slate-200">{email}</strong>.</>
              )}
            </p>

            {error && (
              <div role="alert" className="bg-red-500/10 border border-red-400/25 text-red-200 p-3 rounded-xl text-sm mb-5 animate-in fade-in">
                {error}
              </div>
            )}

            {step === 'register' ? (
              <form onSubmit={requestOtp} className="space-y-4">
                <label className="block text-xs sm:text-sm font-medium text-slate-300">
                  Your name
                  <div className="relative mt-1.5">
                    <UserRound size={18} className="absolute left-4 top-3 text-slate-500" />
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="How should we call you?"
                      autoComplete="name"
                      required
                      className="auth-input !py-2.5"
                    />
                  </div>
                </label>

                <label className="block text-xs sm:text-sm font-medium text-slate-300">
                  Email address
                  <div className="relative mt-1.5">
                    <Mail size={18} className="absolute left-4 top-3 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="auth-input !py-2.5"
                    />
                  </div>
                </label>

                <label className="block text-xs sm:text-sm font-medium text-slate-300">
                  Create a password
                  <div className="relative mt-1.5">
                    <LockKeyhole size={18} className="absolute left-4 top-3 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                      autoComplete="new-password"
                      required
                      className="auth-input !py-2.5"
                    />
                  </div>
                </label>

                <div className="rounded-2xl p-3.5 bg-white/[.035] border border-white/10">
                  <label className="flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-slate-200 cursor-pointer">
                    <span>Are you a college student?</span>
                    <input
                      type="checkbox"
                      checked={isCollegeStudent}
                      onChange={e => {
                        setIsCollegeStudent(e.target.checked);
                        if (!e.target.checked) setInstitutionName('');
                      }}
                      className="w-4 h-4 accent-pink-500 rounded"
                    />
                  </label>
                  {isCollegeStudent && (
                    <label className="block text-xs text-slate-300 mt-3 animate-in fade-in">
                      College or university name
                      <input
                        value={institutionName}
                        onChange={e => setInstitutionName(e.target.value)}
                        placeholder="e.g. Parul University"
                        required
                        className="auth-input mt-1.5 !pl-4 !py-2"
                      />
                    </label>
                  )}
                  <p className="text-[11px] text-slate-500 mt-2">
                    Used only to help you connect with verified students when you choose college preference.
                  </p>
                </div>

                <label className="flex gap-2.5 text-xs leading-relaxed text-slate-400 pt-0.5 cursor-pointer">
                  <input type="checkbox" required className="mt-0.5 accent-pink-500 rounded" />
                  <span>
                    I agree to the{' '}
                    <Link to="/terms" className="text-pink-300 underline">Terms</Link> and{' '}
                    <Link to="/privacy" className="text-pink-300 underline">Privacy Policy</Link>.
                  </span>
                </label>

                <button
                  disabled={loading}
                  className="auth-primary w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50 shadow-lg hover:shadow-pink-500/20"
                >
                  {loading ? 'Sending code…' : 'Continue with email'}
                </button>
              </form>
            ) : (
              <form onSubmit={verify} className="space-y-4">
                <div className="auth-step rounded-2xl p-5 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-300 flex items-center justify-center mx-auto mb-3 border border-pink-500/20">
                    <KeyRound size={22} />
                  </div>
                  <input
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    required
                    className="auth-input text-center text-2xl tracking-[.42em] pl-8 font-mono"
                  />
                </div>

                <button
                  disabled={loading || otp.length !== 6}
                  className="auth-primary w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50 shadow-lg"
                >
                  {loading ? 'Verifying…' : 'Verify & create account'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtp('');
                    setStep('register');
                  }}
                  className="w-full text-xs text-slate-400 hover:text-white py-1 transition-colors"
                >
                  ← Use a different email
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>We use email verification to help keep VibeMeet genuine and safe.</span>
            </div>

            <p className="text-center text-slate-400 text-xs sm:text-sm mt-5">
              Already a member?{' '}
              <Link className="text-pink-400 font-semibold hover:text-pink-300 hover:underline" to="/login">
                Sign in
              </Link>
            </p>
          </main>

          {/* Right: Boy live video call */}
          <BoyVideoCallCard />
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
