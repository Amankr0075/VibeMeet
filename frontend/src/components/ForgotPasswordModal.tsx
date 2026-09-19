import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Mail, LockKeyhole, Eye, EyeOff, X, 
  ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Sparkles 
} from 'lucide-react';
import { apiUrl } from '../config/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  initialEmail?: string;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  initialEmail = '',
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'REQUEST_OTP' | 'VERIFY_AND_RESET' | 'SUCCESS'>('REQUEST_OTP');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync initial email when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setStep('REQUEST_OTP');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [isOpen, initialEmail]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }

      setStep('VERIFY_AND_RESET');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code.');
      }

      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please check and re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    onSuccess(email.trim().toLowerCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-6 sm:p-8 shadow-2xl text-white">
        
        {/* Close Button */}
        {step !== 'SUCCESS' && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* STEP 1: REQUEST OTP */}
        {step === 'REQUEST_OTP' && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <KeyRound size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Forgot Password</h3>
                <p className="text-xs text-slate-400">Recover your VibeMeet account</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Enter the email address registered with your account. We'll dispatch a <strong>6-digit verification code</strong> to verify your identity.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
                <div className="relative mt-2">
                  <Mail size={17} className="absolute left-4 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="auth-input text-sm"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-[1.01] active:scale-[0.99] text-white shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Sending 6-Digit Code...
                  </>
                ) : (
                  <>Send Verification Code</>
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel and return to sign in
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: VERIFY OTP & RESET */}
        {step === 'VERIFY_AND_RESET' && (
          <div>
            <button
              onClick={() => setStep('REQUEST_OTP')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft size={14} /> Change email
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Enter 6-Digit Code</h3>
                <p className="text-xs text-slate-400">Sent to: <span className="text-pink-300 font-mono">{email}</span></p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                6-Digit Verification Code
                <div className="relative mt-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    required
                    className="auth-input text-center font-mono text-xl tracking-[0.4em] uppercase"
                  />
                </div>
              </label>

              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                New Password (min. 8 characters)
                <div className="relative mt-2">
                  <LockKeyhole size={17} className="absolute left-4 top-3 text-slate-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    required
                    className="auth-input pr-12 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Confirm New Password
                <div className="relative mt-2">
                  <LockKeyhole size={17} className="absolute left-4 top-3 text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    required
                    className="auth-input pr-12 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-[1.01] active:scale-[0.99] text-white shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Verifying &amp; Resetting...
                  </>
                ) : (
                  <>Reset Password</>
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Didn't receive the code?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className="text-pink-400 hover:text-pink-300 disabled:text-slate-600 font-semibold transition-colors"
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="text-2xl font-black text-white mb-2">Password Reset!</h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Your password has been successfully updated. You can now sign in to your VibeMeet account with your new password.
            </p>

            <button
              onClick={handleSuccessClose}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:scale-[1.01] active:scale-[0.99] text-white shadow-lg shadow-emerald-500/25 transition-all"
            >
              Sign In Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
