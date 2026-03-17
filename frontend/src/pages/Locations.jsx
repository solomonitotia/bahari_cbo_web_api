import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { locationAPI } from '../services/api';
import { useAuth } from '../context/useAuth';

const EMPTY = { name: '', type: 'fish_cage', description: '', tempMin: 20, tempMax: 32, coordinates: { lat: '', lng: '' } };

export default function Locations() {
  const { isAdmin } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchLocations = async () => {
    try {
      const res = await locationAPI.getAll();
      setLocations(res.data.data);
    } catch {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (loc) => {
    setEditing(loc._id);
    setForm({
      name: loc.name, type: loc.type, description: loc.description || '',
      tempMin: loc.tempMin, tempMax: loc.tempMax,
      coordinates: { lat: loc.coordinates?.lat || '', lng: loc.coordinates?.lng || '' },
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await locationAPI.update(editing, form);
        toast.success('Location updated');
      } else {
        await locationAPI.create(form);
        toast.success('Location created');
      }
      setModal(false);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this location?')) return;
    try {
      await locationAPI.delete(id);
      toast.success('Location deactivated');
      fetchLocations();
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  const typeLabel = { fish_cage: '🐟 Fish Cage', seaweed_farm: '🌿 Seaweed Farm' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{locations.length} location(s)</p>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary">+ Add Location</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
        </div>
      ) : locations.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No locations found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div key={loc._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{loc.name}</h3>
                  <span className="text-xs text-gray-500">{typeLabel[loc.type]}</span>
                </div>
                <span className="badge-active">Active</span>
              </div>
              {loc.description && <p className="text-sm text-gray-500 mb-3">{loc.description}</p>}
              <div className="flex gap-4 text-sm text-gray-600 mb-3">
                <span>🌡️ Min: <strong>{loc.tempMin}°C</strong></span>
                <span>🌡️ Max: <strong>{loc.tempMax}°C</strong></span>
              </div>
              {loc.coordinates?.lat && (
                <p className="text-xs text-gray-400 mb-3">
                  📍 {loc.coordinates.lat}, {loc.coordinates.lng}
                </p>
              )}
              {isAdmin && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button onClick={() => openEdit(loc)} className="btn-secondary text-sm py-1 px-3">Edit</button>
                  <button onClick={() => handleDelete(loc._id)} className="btn-danger text-sm py-1 px-3">Deactivate</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">
              {editing ? 'Edit Location' : 'New Location'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="fish_cage">Fish Cage</option>
                  <option value="seaweed_farm">Seaweed Farm</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Temp (°C)</label>
                  <input type="number" className="input" value={form.tempMin} onChange={(e) => setForm({ ...form, tempMin: +e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Temp (°C)</label>
                  <input type="number" className="input" value={form.tempMax} onChange={(e) => setForm({ ...form, tempMax: +e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input type="number" step="any" className="input" value={form.coordinates.lat} onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lat: e.target.value } })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input type="number" step="any" className="input" value={form.coordinates.lng} onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lng: e.target.value } })} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
