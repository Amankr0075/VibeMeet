import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      // Store token and user using existing auth context
      login(data.token, data.user);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Sign In</h2>
        {error && <p className="text-red-400 mb-4 text-center">{error}</p>}
        <div className="mb-4">
          <label className="block mb-1 text-sm">Email</label>
          <input
            type="email"
            className="w-full bg-slate-700 border border-white/10 rounded px-3 py-2 focus:outline-none focus:border-pink-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 text-sm">Password</label>
          <input
            type="password"
            className="w-full bg-slate-700 border border-white/10 rounded px-3 py-2 focus:outline-none focus:border-pink-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-pink-600 hover:bg-pink-500 transition-colors py-2 rounded font-medium"
        >
          Sign In
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
