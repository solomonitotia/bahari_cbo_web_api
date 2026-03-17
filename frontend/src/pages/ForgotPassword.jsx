import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp+new password
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ otp: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      toast.success('Reset OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp: form.otp, newPassword: form.newPassword });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌊</div>
          <h1 className="text-3xl font-bold text-white">Bahari CBO</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Reset Password</h2>
          <p className="text-sm text-gray-500 mb-6">
            {step === 1 ? 'Enter your email to receive a reset OTP.' : `Enter the OTP sent to ${email}.`}
          </p>

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                <input
                  className="input"
                  placeholder="6-digit code"
                  maxLength={6}
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min 6 characters"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            <Link to="/login" className="text-ocean-600 font-medium hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
