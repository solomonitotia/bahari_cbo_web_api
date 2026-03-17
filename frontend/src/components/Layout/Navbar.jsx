import React from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/locations': 'Locations',
  '/devices': 'Devices',
  '/alerts': 'Alerts',
  '/users': 'User Management',
  '/profile': 'Profile',
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Bahari CBO';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs bg-ocean-100 text-ocean-700 px-2 py-1 rounded-full font-medium">
          Live
        </span>
      </div>
    </header>
  );
}
