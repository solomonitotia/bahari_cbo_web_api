import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Anchor, Leaf, Users, GraduationCap, Landmark,
  BarChart2, Settings, LogOut, Newspaper, Shield, Bell,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import toast from 'react-hot-toast';

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
      { to: '/locations', label: 'Ocean Cages',  icon: Anchor },
      { to: '/devices',   label: 'Seaweed Farms',icon: Leaf },
      { to: '/alerts',    label: 'Alerts',        icon: Bell },
    ],
  },
  {
    label: 'EMPOWERMENT',
    items: [
      { to: '/groups',  label: 'Farmer Groups',     icon: Users },
      { to: null,       label: 'Training Programs',  icon: GraduationCap, soon: true },
      { to: null,       label: 'Microfinance',       icon: Landmark,      soon: true },
    ],
  },
];

const SYSTEM_NAV = [
  { to: '/profile', label: 'Settings', icon: Settings },
];

const ADMIN_NAV = [
  { to: '/users', label: 'User Management', icon: Users },
  { to: '/posts', label: 'News & Posts',    icon: Newspaper },
];

export default function Sidebar({ onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  const linkClass = (isActive) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none
     ${isActive
       ? 'bg-primary-600 text-white shadow-sm'
       : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
     }`;

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">

      {/* ── Logo ── */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-lg">🌊</span>
          </div>
          <div>
            <p className="text-gray-900 font-black text-sm leading-tight tracking-wide">BAHARI CBO</p>
            <p className="text-gray-400 text-xs">Kwale County</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600 p-1">✕</button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, soon }) =>
                soon ? (
                  <div key={label}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-semibold">Soon</span>
                  </div>
                ) : (
                  <NavLink key={to} to={to} onClick={onClose}
                    className={({ isActive }) => linkClass(isActive)}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                )
              )}
            </div>
          </div>
        ))}

        {/* System */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">SYSTEM</p>
          <div className="space-y-0.5">
            {SYSTEM_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={onClose}
                className={({ isActive }) => linkClass(isActive)}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
            {isAdmin && ADMIN_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={onClose}
                className={({ isActive }) => linkClass(isActive)}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* ── User card ── */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-primary-500" />
              <p className="text-xs text-gray-400">{user?.role === 'admin' ? 'CBO Administrator' : 'Monitor'}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
