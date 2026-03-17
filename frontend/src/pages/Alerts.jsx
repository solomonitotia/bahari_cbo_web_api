import React, { useEffect, useState } from 'react';
import { readingAPI, locationAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const params = { limit: 100 };
      if (selectedLocation) params.location = selectedLocation;
      const [alertRes, locRes] = await Promise.all([
        readingAPI.getAlerts(params),
        locationAPI.getAll(),
      ]);
      setAlerts(alertRes.data.data);
      setLocations(locRes.data.data);
    } catch {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [selectedLocation]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{alerts.length} alert(s)</p>
        <select
          className="input w-auto text-sm"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-600 font-medium">No alerts! All temperatures are within safe range.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Alert</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Device</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Location</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Temperature</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Safe Range</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a._id} className="border-b border-gray-50 hover:bg-red-50">
                  <td className="py-3 px-3">
                    {a.alertType === 'high' ? (
                      <span className="badge-alert">⬆ Too High</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">⬇ Too Low</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-800">{a.device?.name || '-'}</p>
                    <p className="text-xs text-gray-400">{a.device?.deviceId}</p>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{a.location?.name || '-'}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-red-600">{a.temperature}°{a.unit}</span>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-500">
                    {a.location?.tempMin}°C – {a.location?.tempMax}°C
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-400">
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
