import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      if (res.data.data?.token) {
        const { token, user } = res.data.data;
        login(token, user);
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/dashboard');
      } else if (res.data.requires2FA) {
        toast.success('OTP sent to your email!');
        navigate('/verify-login', { state: { email: res.data.email } });
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresVerification) {
        toast.error('Email not verified. Check your inbox.');
        navigate('/verify-email', { state: { email: data.email } });
      } else {
        toast.error(data?.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      <div className="relative w-full max-w-sm">
        {/* Logo above card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-white">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-xl shadow-lg">🌊</div>
            <div className="text-left">
              <p className="font-bold text-base leading-tight">Bahari CBO</p>
              <p className="text-slate-400 text-xs">Temperature Monitoring</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Green header */}
          <div className="bg-primary-600 px-6 py-5">
            <h2 className="text-white font-bold text-lg">Welcome Back</h2>
            <p className="text-primary-100 text-sm mt-0.5">Sign in to access your dashboard</p>
          </div>

          {/* Form */}
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="input pl-9"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary w-full py-2.5 text-base font-semibold"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
