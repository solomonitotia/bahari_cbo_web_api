import React, { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { readingAPI, locationAPI } from '../services/api';
import { connectSocket } from '../services/socket';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const [latest, setLatest] = useState([]);
  const [stats, setStats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [latestRes, alertRes, locRes] = await Promise.all([
        readingAPI.getLatest(selectedLocation ? { location: selectedLocation } : {}),
        readingAPI.getAlerts({ limit: 5 }),
        locationAPI.getAll(),
      ]);
      setLatest(latestRes.data.data);
      setAlerts(alertRes.data.data);
      setLocations(locRes.data.data);

      // Fetch chart stats
      const statsRes = await readingAPI.getStats({
        location: selectedLocation || undefined,
        interval: 'hour',
      });
      const chartData = statsRes.data.data.map((s) => ({
        time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avg: +s.avgTemp.toFixed(1),
        min: +s.minTemp.toFixed(1),
        max: +s.maxTemp.toFixed(1),
      }));
      setStats(chartData);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time socket
  useEffect(() => {
    const socket = connectSocket();
    const handleReading = (reading) => {
      setLatest((prev) => {
        const idx = prev.findIndex((r) => r.device?._id === reading.device?._id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = reading;
          return updated;
        }
        return [reading, ...prev];
      });
      if (reading.alert) {
        toast.error(
          `⚠️ Alert: ${reading.device?.name} — ${reading.temperature}°${reading.unit} (${reading.alertType})`,
          { duration: 6000 }
        );
        setAlerts((prev) => [reading, ...prev.slice(0, 4)]);
      }
    };
    socket.on('reading_update', handleReading);
    return () => socket.off('reading_update', handleReading);
  }, []);

  const alertCount = latest.filter((r) => r.alert).length;
  const avgTemp = latest.length
    ? (latest.reduce((s, r) => s + r.temperature, 0) / latest.length).toFixed(1)
    : '--';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Devices" value={latest.length} icon="📡" color="bg-ocean-100" />
        <StatCard label="Locations" value={locations.length} icon="📍" color="bg-green-100" />
        <StatCard label="Avg Temperature" value={`${avgTemp}°C`} icon="🌡️" color="bg-yellow-100" />
        <StatCard
          label="Active Alerts"
          value={alertCount}
          icon="🔔"
          color={alertCount > 0 ? 'bg-red-100' : 'bg-gray-100'}
        />
      </div>

      {/* Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Temperature Trend (Last 24h)</h2>
          <select
            className="input w-auto text-sm"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {locations.map((l) => (
              <option key={l._id} value={l._id}>{l.name}</option>
            ))}
          </select>
        </div>
        {stats.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} unit="°" />
              <Tooltip formatter={(v) => `${v}°C`} />
              <Legend />
              <Line type="monotone" dataKey="avg" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Avg" />
              <Line type="monotone" dataKey="min" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Min" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Max" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-56 flex items-center justify-center text-gray-400">
            No data for selected period
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest readings */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Latest Readings</h2>
          {latest.length === 0 ? (
            <p className="text-gray-400 text-sm">No readings yet.</p>
          ) : (
            <div className="space-y-2">
              {latest.map((r) => (
                <div key={r._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.device?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{r.location?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${r.alert ? 'text-red-600' : 'text-ocean-600'}`}>
                      {r.temperature}°{r.unit}
                    </p>
                    {r.alert && (
                      <span className="badge-alert">{r.alertType === 'high' ? '⬆ High' : '⬇ Low'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent alerts */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-gray-400 text-sm">No alerts. All temperatures normal.</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a._id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <span className="text-lg">{a.alertType === 'high' ? '🔴' : '🔵'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{a.device?.name}</p>
                    <p className="text-xs text-gray-500">
                      {a.location?.name} &bull; {new Date(a.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-red-600">
                    {a.temperature}°{a.unit}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
