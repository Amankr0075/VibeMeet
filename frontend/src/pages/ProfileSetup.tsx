import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCircle } from 'lucide-react';

import { apiUrl } from '../config/api';

const ProfileSetup: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [preferredGender, setPreferredGender] = useState(user?.preferredGender || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !gender || !preferredGender) {
      setError('Please fill in all fields');
      return;
    }
    if (!agreedToTerms || !agreedToPrivacy) {
      setError('You must agree to the Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl('/api/users/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, gender, preferredGender })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      updateUser(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg glass-panel p-8 sm:p-10 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
        
        <div className="text-center mb-8">
          <div className="mx-auto bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-white/10">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserCircle className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold">Complete Your Profile</h2>
          <p className="text-slate-400 text-sm mt-2">We need a few more details before you can start meeting people.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              placeholder="e.g. coolperson99"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">I identify as</label>
            <select 
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
            >
              <option value="" disabled>Select your gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">I want to meet</label>
            <select 
              value={preferredGender}
              onChange={(e) => setPreferredGender(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
            >
              <option value="" disabled>Select preference</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Everyone">Everyone</option>
            </select>
          </div>

          {/* Legal agreement checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 accent-pink-500 cursor-pointer"
              />
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline underline-offset-2">
                  Terms &amp; Conditions
                </a>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={e => setAgreedToPrivacy(e.target.checked)}
                className="mt-1 w-4 h-4 accent-pink-500 cursor-pointer"
              />
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                I agree to the{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline underline-offset-2">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !agreedToTerms || !agreedToPrivacy}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Start Matching'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
