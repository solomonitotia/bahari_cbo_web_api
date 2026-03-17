import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { userAPI } from '../services/api';
import { useAuth } from '../context/useAuth';

export default function Profile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await userAPI.updateProfile(profile);
      login(localStorage.getItem('bahari_token'), res.data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) return toast.error('Passwords do not match');
    setSavingPass(true);
    try {
      await userAPI.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile info */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-ocean-100 text-ocean-700 flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge-active capitalize text-xs mt-1">{user?.role}</span>
          </div>
        </div>

        <h3 className="font-medium text-gray-700 mb-4">Edit Profile</h3>
        <form onSubmit={handleProfileSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input className="input" placeholder="+254 7XX XXX XXX" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card">
        <h3 className="font-medium text-gray-700 mb-4">Change Password</h3>
        <form onSubmit={handlePasswordSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" className="input" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" className="input" placeholder="Min 6 characters" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" className="input" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary" disabled={savingPass}>
            {savingPass ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
