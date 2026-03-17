import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { deviceAPI, locationAPI } from '../services/api';
import { useAuth } from '../context/useAuth';

const EMPTY = { name: '', type: 'fish_cage', location: '', firmware: '1.0.0' };

export default function Devices() {
  const { isAdmin } = useAuth();
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);

  const fetchAll = async () => {
    try {
      const [devRes, locRes] = await Promise.all([deviceAPI.getAll(), locationAPI.getAll()]);
      setDevices(devRes.data.data);
      setLocations(locRes.data.data);
    } catch {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await deviceAPI.create(form);
      setNewApiKey({ device: res.data.data, key: res.data.data.apiKey });
      setModal(false);
      fetchAll();
      toast.success('Device registered!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register device');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await deviceAPI.update(id, { status });
      toast.success(`Device ${status}`);
      fetchAll();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleRegenerateKey = async (id) => {
    if (!window.confirm('Regenerate API key? The old key will stop working.')) return;
    try {
      const res = await deviceAPI.regenerateKey(id);
      setNewApiKey({ key: res.data.data.apiKey, deviceId: res.data.data.deviceId });
      toast.success('API key regenerated');
    } catch {
      toast.error('Failed to regenerate key');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this device?')) return;
    try {
      await deviceAPI.delete(id);
      toast.success('Device deleted');
      fetchAll();
    } catch {
      toast.error('Failed to delete device');
    }
  };

  const statusColors = { active: 'badge-active', inactive: 'badge-inactive', maintenance: 'bg-yellow-100 text-yellow-700 px-2.5 py-0.5 rounded-full text-xs font-medium' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{devices.length} device(s)</p>
        {isAdmin && (
          <button onClick={() => { setForm(EMPTY); setModal(true); }} className="btn-primary">+ Register Device</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Device</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Type</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Location</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Last Seen</th>
                {isAdmin && <th className="text-left py-2 px-3 text-gray-500 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No devices registered.</td></tr>
              ) : devices.map((d) => (
                <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-800">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.deviceId}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs text-gray-600">{d.type === 'fish_cage' ? '🐟 Fish Cage' : '🌿 Seaweed Farm'}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{d.location?.name || '-'}</td>
                  <td className="py-3 px-3">
                    <span className={statusColors[d.status]}>{d.status}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-400 text-xs">
                    {d.lastSeen ? new Date(d.lastSeen).toLocaleString() : 'Never'}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <select
                          className="text-xs border border-gray-200 rounded px-1 py-0.5"
                          value={d.status}
                          onChange={(e) => handleStatusChange(d._id, e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                        <button onClick={() => handleRegenerateKey(d._id)} className="text-xs text-ocean-600 hover:underline px-1">🔑 Key</button>
                        <button onClick={() => handleDelete(d._id)} className="text-xs text-red-600 hover:underline px-1">Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Register Device</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
                <input className="input" placeholder="Cage A - Sensor 1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="fish_cage">Fish Cage</option>
                  <option value="seaweed_farm">Seaweed Farm</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required>
                  <option value="">Select location</option>
                  {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firmware</label>
                <input className="input" value={form.firmware} onChange={(e) => setForm({ ...form, firmware: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Registering...' : 'Register'}</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* API Key reveal modal */}
      {newApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-semibold text-gray-800 text-lg mb-2">🔑 Device API Key</h3>
            <p className="text-sm text-red-600 mb-4 font-medium">⚠️ Save this key now. It will not be shown again.</p>
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm break-all select-all mb-4">
              {newApiKey.key}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Use this as the <code className="bg-gray-100 px-1 rounded">x-device-key</code> header in POST requests to <code className="bg-gray-100 px-1 rounded">/api/readings</code>.
            </p>
            <button className="btn-primary w-full" onClick={() => setNewApiKey(null)}>I've saved the key</button>
          </div>
        </div>
      )}
    </div>
  );
}
