import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MapPin, Radio, Bell, Users, Newspaper,
  Settings, LogOut, ChevronLeft, ChevronRight, UserCircle, Shield, Layers
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard', label: 'Overview',  icon: LayoutDashboard },
  { to: '/locations', label: 'Locations', icon: MapPin },
  { to: '/devices',   label: 'Devices',   icon: Radio },
  { to: '/alerts',    label: 'Alerts',    icon: Bell },
  { to: '/groups',    label: 'Groups',    icon: Layers },
];

const ADMIN_NAV = [
  { to: '/users', label: 'Users',      icon: Users },
  { to: '/posts', label: 'News Posts', icon: Newspaper },
];

export default function Sidebar({ onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  const linkClass = (isActive) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none
     ${isActive
       ? 'bg-primary-600 text-white shadow-sm'
       : 'text-slate-400 hover:bg-slate-800 hover:text-white'
     } ${collapsed ? 'justify-center' : ''}`;

  return (
    <div className={`flex flex-col h-full bg-sidebar-bg transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>

      {/* Logo */}
      <div className={`flex items-center border-b border-slate-800 h-16 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-base shadow flex-shrink-0">🌊</div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Bahari CBO</p>
              <p className="text-slate-500 text-xs">Monitoring System</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-base">🌊</div>
        )}
        <button
          onClick={() => { setCollapsed(!collapsed); onClose?.(); }}
          className="hidden lg:flex text-slate-500 hover:text-white p-1 rounded transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white p-1 rounded">✕</button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => linkClass(isActive)} title={collapsed ? label : undefined}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className={`pt-5 pb-1 ${collapsed ? 'px-0 text-center' : 'px-3'}`}>
              {!collapsed
                ? <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Admin</p>
                : <div className="border-t border-slate-800 mx-2" />
              }
            </div>
            {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => linkClass(isActive)} title={collapsed ? label : undefined}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User + bottom links */}
      <div className="border-t border-slate-800 p-2 space-y-0.5">
        <NavLink to="/profile" onClick={onClose} className={({ isActive }) => linkClass(isActive)} title={collapsed ? 'Profile' : undefined}>
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Settings & Profile</span>}
        </NavLink>
        <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/40 hover:text-red-300 transition-all ${collapsed ? 'justify-center' : ''}`} title={collapsed ? 'Logout' : undefined}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* User card */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 mt-2 px-2 py-2 border-t border-slate-800">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-primary-400" />
                <p className="text-slate-400 text-xs capitalize">{user?.role === 'admin' ? 'Super Admin' : 'Monitor'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
