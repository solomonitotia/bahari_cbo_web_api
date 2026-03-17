import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Layout from './components/Layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerify from './pages/OTPVerify';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import Devices from './pages/Devices';
import Alerts from './pages/Alerts';
import Users from './pages/Users';
import Groups from './pages/Groups';
import Posts from './pages/Posts';
import Profile from './pages/Profile';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean-600" />
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public landing page */}
    <Route path="/" element={<Landing />} />

    {/* Auth */}
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/verify-email" element={<OTPVerify mode="email_verify" />} />
    <Route path="/verify-login" element={<OTPVerify mode="login_2fa" />} />
    <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

    {/* App (protected) */}
    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/locations" element={<Locations />} />
      <Route path="/devices" element={<Devices />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="/groups" element={<Groups />} />
      <Route path="/profile" element={<Profile />} />

      {/* Admin only */}
      <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
      <Route path="/posts" element={<ProtectedRoute adminOnly><Posts /></ProtectedRoute>} />
    </Route>
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
