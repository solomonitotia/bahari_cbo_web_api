import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { confirm, ...payload } = form;
      await authAPI.register(payload);
      toast.success('Account created! Check your email for verification.');
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-white">
            <div className="w-10 h-10 bg-ocean-600 rounded-xl flex items-center justify-center text-xl shadow-lg">🌊</div>
            <div className="text-left">
              <p className="font-bold text-base leading-tight">Bahari CBO</p>
              <p className="text-slate-400 text-xs">Temperature Monitoring</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-ocean-600 px-6 py-5">
            <h2 className="text-white font-bold text-lg">Create Account</h2>
            <p className="text-primary-100 text-sm mt-0.5">Join the Bahari CBO community</p>
          </div>

          <div className="px-6 py-6 space-y-3">
            {[
              { label: 'Full Name', key: 'name', type: 'text', icon: User, placeholder: 'John Kamau' },
              { label: 'Email Address', key: 'email', type: 'email', icon: Mail, placeholder: 'you@example.com' },
              { label: 'Phone (optional)', key: 'phone', type: 'tel', icon: Phone, placeholder: '+254 7XX XXX XXX' },
            ].map(({ label, key, type, icon: Icon, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={type}
                    className="input pl-9"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required={key !== 'phone'}
                  />
                </div>
              </div>
            ))}

            {['password', 'confirm'].map((key) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {key === 'password' ? 'Password' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pl-9 pr-10"
                    placeholder="Min 6 characters"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                  />
                  {key === 'confirm' && (
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button onClick={handleSubmit} className="btn-primary w-full py-2.5 text-base font-semibold" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-ocean-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
