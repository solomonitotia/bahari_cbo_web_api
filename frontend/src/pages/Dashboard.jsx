import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, ReferenceLine,
} from 'recharts';
import {
  Anchor, Users, Thermometer, Wheat, Wifi, WifiOff,
  ChevronUp, ChevronDown, Clock, AlertTriangle, CheckCircle2,
  RefreshCw, TrendingUp, Calendar, Activity, Battery, Signal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { locationAPI } from '../services/api';
import { connectSocket } from '../services/socket';

const iotAPI = {
  getStats:    ()  => api.get('/iot/stats'),
  getChart:    (p) => api.get('/iot/chart',    { params: p }),
  getReadings: (p) => api.get('/iot/readings', { params: p }),
};

/* ── helpers ── */
const timeAgo = (iso) => {
  if (!iso) return '--';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

const tempStatus = (t) => {
  if (t == null) return { label: 'No Data', color: 'gray' };
  if (t < 20)   return { label: 'Too Cold',  color: 'blue'   };
  if (t <= 28)  return { label: 'Optimal',   color: 'green'  };
  if (t <= 32)  return { label: 'Inspect',   color: 'yellow' };
  return               { label: 'Critical',  color: 'red'    };
};

const statusBadge = {
  green:  'bg-green-100 text-green-700 border border-green-200',
  blue:   'bg-blue-100 text-blue-700 border border-blue-200',
  yellow: 'bg-amber-100 text-amber-700 border border-amber-200',
  red:    'bg-red-100 text-red-600 border border-red-200',
  gray:   'bg-gray-100 text-gray-500 border border-gray-200',
};

/* ── Stat card (reference style) ── */
const StatCard = ({ label, value, sub, subColor = '', icon: Icon, iconBg = 'bg-blue-50', iconColor = 'text-blue-500' }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between">
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 leading-tight">{value}</p>
      {sub && (
        <p className={`text-xs mt-2 flex items-center gap-1 font-medium ${subColor || 'text-gray-400'}`}>
          {sub}
        </p>
      )}
    </div>
    <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 ml-4`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
  </div>
);

/* ── Cage row ── */
const CageRow = ({ device }) => {
  const { device_id, temperature: t, battery, network, isOnline, lastSeen } = device;
  const temp    = t?.current;
  const status  = tempStatus(temp);
  const hasNet  = network?.operator && network.operator !== 'Offline';

  return (
    <div className="flex items-center justify-between py-4 px-5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isOnline ? 'bg-primary-50' : 'bg-gray-50'
        }`}>
          <Anchor className={`w-5 h-5 ${isOnline ? 'text-primary-600' : 'text-gray-300'}`} />
        </div>
        {/* Info */}
        <div className="min-w-0">
          <p className="font-bold text-gray-800 text-sm font-mono truncate">{device_id}</p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeAgo(lastSeen)}
            {hasNet && <span className="ml-2 text-green-500 font-medium">· {network.operator}</span>}
          </p>
        </div>
      </div>

      {/* Temperature */}
      <div className="flex items-center gap-2 mx-4">
        <Thermometer className="w-4 h-4 text-gray-400" />
        <span className="font-bold text-gray-800">{temp != null ? `${temp}°C` : '--'}</span>
      </div>

      {/* Battery */}
      <div className="hidden sm:flex items-center gap-1.5 mr-4">
        <Battery className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-600 font-medium">{battery?.current ?? '--'}%</span>
      </div>

      {/* Status badge */}
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${statusBadge[status.color]}`}>
        {status.color === 'green' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        {status.label}
      </span>
    </div>
  );
};

/* ── Custom tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-gray-600 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}{typeof p.value === 'number' && p.dataKey === 'avg' ? '°C' : ''}
        </p>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [stats,     setStats]     = useState({ devices: [], totalDevices: 0, onlineDevices: 0, avgTemperature: null, totalReadings: 0 });
  const [chart,     setChart]     = useState([]);
  const [readings,  setReadings]  = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, chartRes, rowsRes, locRes] = await Promise.all([
        iotAPI.getStats(),
        iotAPI.getChart(),
        iotAPI.getReadings({ limit: 8 }),
        locationAPI.getAll(),
      ]);
      setStats(statsRes.data.data   || {});
      setChart(chartRes.data.data   || []);
      setReadings(rowsRes.data.data || []);
      setLocations(locRes.data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const socket = connectSocket();
    socket.on('reading_update', r => {
      if (r.alert) toast.error(`⚠️ ${r.device_id} — ${r.temperature}°C`, { duration: 6000 });
      fetchData();
    });
    return () => socket.off('reading_update');
  }, [fetchData]);

  const devices = stats.devices || [];

  /* chart domain */
  const allTemps = chart.flatMap(d => [d.min, d.avg, d.max]).filter(v => v != null);
  const yMin = allTemps.length ? Math.floor((Math.min(...allTemps) - 0.5) * 10) / 10 : 18;
  const yMax = allTemps.length ? Math.ceil ((Math.max(...allTemps) + 0.5) * 10) / 10 : 35;
  const chartAvg = chart.length ? +(chart.reduce((s, r) => s + r.avg, 0) / chart.length).toFixed(2) : null;

  /* monthly mock yield for bar chart (would be real data later) */
  const yieldData = [
    { month: 'Aug', tons: 0 }, { month: 'Sep', tons: 0 },
    { month: 'Oct', tons: 0 }, { month: 'Nov', tons: 0 },
    { month: 'Dec', tons: 0 }, { month: today.toLocaleDateString('en', { month: 'short' }), tons: stats.totalReadings || 0 },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Kwale Ocean &amp; Farmers Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Empowering communities through sustainable seaweed farming and ocean monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm flex-shrink-0 ml-4">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{dateLabel}</span>
          <button onClick={fetchData} className="ml-2 text-gray-400 hover:text-primary-600 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Empowered Farmers"
          value="—"
          sub="Groups registered in system"
          icon={Users}
          iconBg="bg-blue-50" iconColor="text-blue-500"
        />
        <StatCard
          label="Active Ocean Cages"
          value={stats.totalDevices ?? 0}
          sub={`${stats.onlineDevices ?? 0} require maintenance checks`}
          subColor={stats.onlineDevices === 0 ? 'text-amber-500' : 'text-green-500'}
          icon={Anchor}
          iconBg="bg-primary-50" iconColor="text-primary-600"
        />
        <StatCard
          label="Expected Harvest"
          value="—"
          sub="+8% compared to last cycle"
          subColor="text-green-500"
          icon={Wheat}
          iconBg="bg-green-50" iconColor="text-green-600"
        />
        <StatCard
          label="Avg Water Temp"
          value={stats.avgTemperature != null ? `${stats.avgTemperature}°C` : '--'}
          sub={stats.avgTemperature >= 20 && stats.avgTemperature <= 28 ? '✓ Optimal for Eucheuma growth' : 'Check conditions'}
          subColor={stats.avgTemperature >= 20 && stats.avgTemperature <= 28 ? 'text-green-500' : 'text-amber-500'}
          icon={Thermometer}
          iconBg="bg-orange-50" iconColor="text-orange-500"
        />
      </div>

      {/* ── Main two-column grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Ocean Cage Live Monitoring (2/3) ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Cage list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-primary-600" />
                  Ocean Cage Live Monitoring
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{devices.length} device{devices.length !== 1 ? 's' : ''} registered · {stats.totalReadings ?? 0} readings</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </div>
            </div>

            {devices.length === 0 ? (
              <div className="py-12 text-center text-gray-300">
                <Anchor className="w-12 h-12 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-400">No cages registered yet</p>
                <p className="text-xs text-gray-300 mt-1">Register a device to start monitoring</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {devices.map(d => <CageRow key={d.device_id} device={d} />)}
              </div>
            )}
          </div>

          {/* Temperature trend chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-600" />
                  Water Temperature Trend
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">By minute · last 24h of recorded data</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {[['#f97316','Max'],['#2563eb','Avg'],['#22c55e','Min']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 rounded inline-block" style={{ background: c }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {chart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chart} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false} tickLine={false} unit="°" width={42}
                    tickFormatter={v => Number(v).toFixed(1)} />
                  <Tooltip content={<ChartTooltip />} />
                  {chartAvg && (
                    <ReferenceLine y={chartAvg} stroke="#2563eb" strokeDasharray="4 3" strokeOpacity={0.5}
                      label={{ value: `avg ${chartAvg}°`, position: 'insideTopRight', fontSize: 10, fill: '#2563eb' }} />
                  )}
                  <ReferenceLine y={32} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.35}
                    label={{ value: 'Max 32°', position: 'insideTopRight', fontSize: 9, fill: '#ef4444' }} />
                  <ReferenceLine y={20} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.35}
                    label={{ value: 'Min 20°', position: 'insideBottomRight', fontSize: 9, fill: '#3b82f6' }} />
                  <Area type="linear" dataKey="max" stroke="#f97316" strokeWidth={1.5}
                    strokeDasharray="5 3" fill="none" dot={{ r: 3, fill: '#f97316' }} name="Max" />
                  <Area type="linear" dataKey="avg" stroke="#2563eb" strokeWidth={2.5}
                    fill="url(#fillBlue)"
                    dot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }} name="Avg" />
                  <Area type="linear" dataKey="min" stroke="#22c55e" strokeWidth={1.5}
                    strokeDasharray="5 3" fill="none" dot={{ r: 3, fill: '#22c55e' }} name="Min" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex flex-col items-center justify-center text-gray-200 gap-2">
                <Activity className="w-10 h-10" />
                <p className="text-sm text-gray-400 font-medium">No chart data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-5">

          {/* Seaweed Readings / yield */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-1">Seaweed Yield (Readings)</h2>
            <p className="text-xs text-gray-400 mb-4">Monthly data volume from devices</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={yieldData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="tons" fill="#bfdbfe" radius={[4, 4, 0, 0]}
                  label={false}
                  // Highlight current month
                  cells={undefined}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-gray-400">Total readings this month</span>
              <span className="font-bold text-primary-600">{stats.totalReadings ?? 0}</span>
            </div>
          </div>

          {/* Device health summary */}
          {devices.map(d => {
            const battColor = d.battery?.current > 60 ? 'bg-green-500' : d.battery?.current > 30 ? 'bg-amber-400' : 'bg-red-500';
            const hasNet = d.network?.operator && d.network.operator !== 'Offline';
            return (
              <div key={d.device_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${d.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="font-bold text-gray-800 text-sm font-mono">{d.device_id}</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${d.isOnline ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {d.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Temp stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { l: 'Min',  v: d.temperature?.min,  c: 'text-blue-600' },
                    { l: 'Avg',  v: d.temperature?.avg,  c: 'text-primary-600' },
                    { l: 'Max',  v: d.temperature?.max,  c: 'text-orange-500' },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="text-center bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                      <p className={`text-sm font-black ${c}`}>{v != null ? `${v}°` : '--'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>

                {/* Battery */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Battery</span>
                    <span className="font-bold">{d.battery?.current ?? '--'}% · {d.battery?.voltage}V</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${battColor}`}
                      style={{ width: `${d.battery?.current ?? 0}%` }} />
                  </div>
                </div>

                {/* Network */}
                <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border ${
                  hasNet ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {hasNet ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  <span>{d.network?.operator ?? 'Offline'}</span>
                  {d.network?.mode && <span className="text-gray-400 font-normal ml-auto">{d.network.mode}</span>}
                </div>

                <p className="text-xs text-gray-400 mt-3 text-center">
                  {d.totalReadings} readings · last {timeAgo(d.lastSeen)}
                </p>
              </div>
            );
          })}

          {devices.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-300">
              <Anchor className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No devices yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent readings table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent Sensor Readings</h2>
          <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg font-medium">
            {stats.totalReadings ?? 0} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['#', 'Device', 'Temperature', 'Battery', 'Network', 'Received'].map(h => (
                  <th key={h} className="text-left py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {readings.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-300">No readings yet</td></tr>
              )}
              {readings.map((r, i) => {
                const st = tempStatus(r.temperature);
                const isOnNet = r.network?.operator && r.network.operator !== 'Offline';
                return (
                  <tr key={r._id ?? i} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3.5 px-5 text-xs font-mono text-gray-300 font-bold">{String(i + 1).padStart(2, '0')}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                          <Anchor className="w-3.5 h-3.5 text-primary-600" />
                        </div>
                        <span className="font-mono text-xs font-bold text-gray-700">{r.device_id}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-gray-800">{r.temperature}°C</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge[st.color]}`}>{st.label}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary-500"
                            style={{ width: `${r.battery?.percentage ?? 0}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{r.battery?.percentage ?? '--'}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                        isOnNet ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {isOnNet ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {r.network?.operator ?? 'Offline'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="text-xs font-semibold text-gray-600">{timeAgo(r.received_at)}</p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {r.received_at ? new Date(r.received_at).toLocaleString() : '--'}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
