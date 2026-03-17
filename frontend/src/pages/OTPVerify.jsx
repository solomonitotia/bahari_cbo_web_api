import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/useAuth';

export default function OTPVerify({ mode }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/login');
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    text.split('').forEach((c, i) => { if (i < 6) newOtp[i] = c; });
    setOtp(newOtp);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) return toast.error('Please enter the complete 6-digit OTP');

    setLoading(true);
    try {
      if (mode === 'email_verify') {
        await authAPI.verifyEmail({ email, otp: otpString });
        toast.success('Email verified! You can now log in.');
        navigate('/login');
      } else if (mode === 'login_2fa') {
        const res = await authAPI.verifyOTP({ email, otp: otpString });
        const { token, user } = res.data.data;
        login(token, user);
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendOTP({ email, type: mode });
      toast.success('OTP resent successfully!');
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const titles = {
    email_verify: 'Verify Your Email',
    login_2fa: 'Two-Factor Authentication',
  };

  const subtitles = {
    email_verify: 'Enter the 6-digit code sent to your email to verify your account.',
    login_2fa: 'Enter the 6-digit code sent to your email to complete login.',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌊</div>
          <h1 className="text-3xl font-bold text-white">Bahari CBO</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-ocean-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📧</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{titles[mode]}</h2>
            <p className="text-sm text-gray-500 mt-2">{subtitles[mode]}</p>
            <p className="text-sm font-medium text-ocean-600 mt-1">{email}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-200 transition-all"
                />
              ))}
            </div>

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="text-center mt-4">
            {countdown > 0 ? (
              <p className="text-sm text-gray-500">
                Resend OTP in <span className="font-semibold text-ocean-600">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-ocean-600 hover:underline font-medium disabled:opacity-50"
              >
                {resending ? 'Resending...' : 'Resend OTP'}
              </button>
            )}
          </div>

          <div className="text-center mt-4">
            <button onClick={() => navigate('/login')} className="text-sm text-gray-500 hover:text-gray-700">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
