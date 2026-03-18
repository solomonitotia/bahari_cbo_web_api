import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LineChart, Line,
} from 'recharts';
import {
  Radio, MapPin, Thermometer, Bell, Battery, Wifi, WifiOff,
  Clock, TrendingUp, TrendingDown, Minus, Activity, Signal,
  Zap, ChevronUp, ChevronDown, RefreshCw, AlertTriangle,
  Droplets, BarChart2, Shield, CheckCircle2,
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
const fmt = (v, unit = '') => v != null ? `${v}${unit}` : '--';

const timeAgo = (iso) => {
  if (!iso) return '--';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(iso).toLocaleDateString();
};

const tempColor = (t) => {
  if (t == null) return 'text-gray-400';
  if (t < 20) return 'text-blue-600';
  if (t <= 28) return 'text-ocean-600';
  if (t <= 32) return 'text-amber-500';
  return 'text-red-600';
};

const battColor = (p) => p > 60 ? '#22c55e' : p > 30 ? '#f59e0b' : '#ef4444';

/* ── Custom tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 text-xs">
      <p className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
        <Clock className="w-3 h-3" /> {label}
      </p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-5 py-0.5">
          <span style={{ color: p.color }} className="font-medium capitalize flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-white">{p.value}°C</span>
        </div>
      ))}
    </div>
  );
};

/* ── Stat card with left accent ── */
const StatCard = ({ label, value, sub, icon: Icon, accent, trend, trendLabel }) => (
  <div className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex gap-4 items-start border-l-4 ${accent}`}>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
    <div className="flex flex-col items-end gap-1">
      <Icon className="w-6 h-6 text-gray-300" />
      {trend != null && (
        <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-400'}`}>
          {trend > 0 ? <ChevronUp className="w-3 h-3" /> : trend < 0 ? <ChevronDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {trendLabel}
        </div>
      )}
    </div>
  </div>
);

/* ── Battery bar ── */
const BatteryBar = ({ pct, voltage }) => {
  const color = battColor(pct);
  const label = pct > 60 ? 'Good' : pct > 30 ? 'Low' : 'Critical';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400">Charge level</span>
        <span className="text-xs font-bold" style={{ color }}>{pct}% · {label} · {voltage}V</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

/* ── Temperature range bar ── */
const TempRangeBar = ({ min, max, avg, current }) => {
  const span = max - min || 0.1;
  const pos  = v => `${Math.min(Math.max(((v - min) / span) * 100, 0), 100)}%`;
  return (
    <div className="mt-3">
      <div className="relative h-3 bg-gradient-to-r from-blue-200 via-ocean-200 to-red-200 rounded-full">
        <div title={`avg ${avg}°C`}
          className="absolute -top-0.5 w-1.5 h-4 bg-ocean-600 rounded-full shadow"
          style={{ left: pos(avg), transform: 'translateX(-50%)' }} />
        <div title={`current ${current}°C`}
          className="absolute -top-1 w-3 h-5 bg-slate-800 rounded-full border-2 border-white shadow-md"
          style={{ left: pos(current), transform: 'translateX(-50%)' }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1.5">
        <span className="text-blue-500 font-semibold">{min}° min</span>
        <span className="text-ocean-600 font-semibold">avg {avg}°C</span>
        <span className="text-red-400 font-semibold">{max}° max</span>
      </div>
    </div>
  );
};

/* ── Health badge ── */
const HealthBadge = ({ stdDev }) => {
  const stable = stdDev === 0 || stdDev < 0.05;
  const varying = stdDev >= 0.05;
  if (stable) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Stable
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <Activity className="w-3 h-3" /> Varying
    </span>
  );
};

/* ── Device Intelligence Card ── */
const DeviceCard = ({ device }) => {
  const { temperature: t, battery, network, isOnline, totalReadings, avgInterval, lastSeen, firstSeen, device_id } = device;
  const hasSignal = network?.operator && network.operator !== 'Offline';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className={`px-5 py-4 ${isOnline ? 'bg-gradient-to-r from-ocean-700 to-ocean-600' : 'bg-gradient-to-r from-slate-700 to-slate-600'}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Radio className="w-3.5 h-3.5 text-white/70" />
              <span className="font-mono text-xs text-white/70 tracking-widest uppercase">Device ID</span>
            </div>
            <p className="font-mono text-lg font-black text-white tracking-wide">{device_id}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            isOnline ? 'bg-green-400/20 text-green-300 border border-green-400/30' : 'bg-white/10 text-white/60 border border-white/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-white/40'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <p className="text-xs text-white/50 mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Last seen {timeAgo(lastSeen)}
        </p>
      </div>

      {/* ── Body ── */}
      <div className="p-5 space-y-5">

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5" /> Water Temperature
            </span>
            <HealthBadge stdDev={t?.stdDev} />
          </div>

          <div className="flex items-end gap-4">
            <div className="flex items-end leading-none">
              <span className={`text-6xl font-black ${tempColor(t?.current)}`}>{t?.current ?? '--'}</span>
              <span className="text-2xl font-bold text-gray-400 mb-1">°C</span>
            </div>
            <div className="mb-1 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">
                <ChevronUp className="w-3 h-3" /> {fmt(t?.max, '°C')}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg">
                <ChevronDown className="w-3 h-3" /> {fmt(t?.min, '°C')}
              </div>
            </div>
          </div>

          <TempRangeBar min={t?.min} max={t?.max} avg={t?.avg} current={t?.current} />

          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Avg',    value: fmt(t?.avg, '°C'),   c: 'text-ocean-700 bg-ocean-50 border-ocean-100' },
              { label: 'Range',  value: fmt(t?.range, '°C'),  c: 'text-amber-700 bg-amber-50 border-amber-100' },
              { label: 'Std σ',  value: fmt(t?.stdDev, '°C'), c: 'text-purple-700 bg-purple-50 border-purple-100' },
            ].map(({ label, value, c }) => (
              <div key={label} className={`rounded-xl p-3 text-center border ${c}`}>
                <p className="text-sm font-bold leading-none">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Battery */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5" /> Battery
          </p>
          <BatteryBar pct={battery?.current ?? 0} voltage={battery?.voltage ?? '--'} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-sm font-bold text-gray-800">{fmt(battery?.avgVoltage, 'V')}</p>
              <p className="text-xs text-gray-400 mt-0.5">Avg voltage</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-sm font-bold text-gray-800">{fmt(battery?.min, '%')}</p>
              <p className="text-xs text-gray-400 mt-0.5">Min recorded</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Network */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" /> Network
          </p>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              hasSignal ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {hasSignal ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {network?.operator ?? 'Unknown'}
            </span>
            {network?.mode && (
              <span className="inline-flex items-center px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium">
                {network.mode}
              </span>
            )}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Activity */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> Activity
          </p>
          <div className="space-y-2">
            {[
              { label: 'Total readings',    value: totalReadings,                               vc: '' },
              { label: 'Avg interval',      value: avgInterval != null ? `~${avgInterval}s` : '--', vc: '' },
              { label: 'First data',        value: firstSeen ? new Date(firstSeen).toLocaleString() : '--', vc: 'text-gray-500' },
              { label: 'Last data',         value: lastSeen  ? new Date(lastSeen).toLocaleString()  : '--', vc: isOnline ? 'text-green-600 font-bold' : 'text-gray-400' },
            ].map(({ label, value, vc }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400">{label}</span>
                <span className={`text-xs font-semibold text-gray-700 ${vc}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [stats,     setStats]     = useState({ devices: [], totalDevices: 0, onlineDevices: 0, avgTemperature: null, totalReadings: 0 });
  const [chart,     setChart]     = useState([]);
  const [rows,      setRows]      = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selDevice, setSelDevice] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, chartRes, rowsRes, locRes] = await Promise.all([
        iotAPI.getStats(),
        iotAPI.getChart({ device_id: selDevice || undefined }),
        iotAPI.getReadings({ limit: 15 }),
        locationAPI.getAll(),
      ]);
      setStats(statsRes.data.data   || {});
      setChart(chartRes.data.data   || []);
      setRows(rowsRes.data.data     || []);
      setLocations(locRes.data.data || []);
      setLastRefresh(new Date());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [selDevice]);

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

  /* chart domain — ±1°C around data for readable Y-axis */
  const allTemps = chart.flatMap(d => [d.min, d.avg, d.max]).filter(v => v != null);
  const pad = 0.5;
  const yMin  = allTemps.length ? Math.floor((Math.min(...allTemps) - pad) * 10) / 10 : 20;
  const yMax  = allTemps.length ? Math.ceil((Math.max(...allTemps)  + pad) * 10) / 10 : 35;
  const chartAvg = chart.length ? +(chart.reduce((s, r) => s + r.avg, 0) / chart.length).toFixed(2) : null;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean-600" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Overview</h1>
          <p className="text-xs text-gray-400 mt-0.5">Bahari CBO · Real-time ocean monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">
            Updated {timeAgo(lastRefresh.toISOString())}
          </span>
          <button onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Devices" icon={Radio}
          value={stats.totalDevices ?? 0}
          sub={`${stats.onlineDevices ?? 0} currently online`}
          accent="border-ocean-500"
        />
        <StatCard
          label="Monitoring Sites" icon={MapPin}
          value={locations.length}
          sub="registered locations"
          accent="border-green-500"
        />
        <StatCard
          label="Avg Temperature" icon={Thermometer}
          value={stats.avgTemperature != null ? `${stats.avgTemperature}°C` : '--'}
          sub={`from ${stats.totalReadings ?? 0} readings`}
          accent="border-amber-500"
        />
        <StatCard
          label="Active Alerts" icon={Bell}
          value={0}
          sub="all temperatures normal"
          accent="border-gray-200"
        />
      </div>

      {/* ── Chart + Device panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Chart (2/3) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-ocean-600" /> Temperature Trend
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Grouped by minute · last 24h of data</p>
            </div>
            <select className="input w-auto text-xs py-1.5 pr-8" value={selDevice} onChange={e => setSelDevice(e.target.value)}>
              <option value="">All Devices</option>
              {devices.map(d => <option key={d.device_id} value={d.device_id}>{d.device_id}</option>)}
            </select>
          </div>

          {chart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#0284c7" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[yMin, yMax]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false} tickLine={false}
                    unit="°" width={45}
                    tickFormatter={v => Number(v).toFixed(1)}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  {chartAvg && (
                    <ReferenceLine y={chartAvg} stroke="#0284c7" strokeDasharray="4 3" strokeOpacity={0.6}
                      label={{ value: `avg ${chartAvg}°`, position: 'insideTopRight', fontSize: 10, fill: '#0284c7' }} />
                  )}
                  {/* Safe alert zone reference */}
                  <ReferenceLine y={32} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4}
                    label={{ value: 'Max safe', position: 'insideTopRight', fontSize: 9, fill: '#ef4444' }} />
                  <ReferenceLine y={20} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.4}
                    label={{ value: 'Min safe', position: 'insideBottomRight', fontSize: 9, fill: '#3b82f6' }} />

                  <Area type="linear" dataKey="max" stroke="#f97316" strokeWidth={1.5}
                    strokeDasharray="5 3" fill="none" dot={{ r: 3, fill: '#f97316' }} name="Max" />
                  <Area type="linear" dataKey="avg" stroke="#0284c7" strokeWidth={2.5}
                    fill="url(#fillAvg)"
                    dot={{ r: 5, fill: '#0284c7', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }} name="Avg" />
                  <Area type="linear" dataKey="min" stroke="#22c55e" strokeWidth={1.5}
                    strokeDasharray="5 3" fill="none" dot={{ r: 3, fill: '#22c55e' }} name="Min" />
                </AreaChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-gray-50">
                {[['#f97316','Max temp'],['#0284c7','Average'],['#22c55e','Min temp']].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-3 h-1.5 rounded inline-block" style={{ background: c }} />
                    {l}
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-3 h-0.5 rounded inline-block bg-red-300" style={{ borderTop: '1px dashed #ef4444' }} />
                  Safe zone (20–32°C)
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-300 gap-3">
              <Activity className="w-12 h-12" />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-400">No chart data yet</p>
                <p className="text-xs text-gray-300 mt-1">Data will appear once your device sends readings</p>
              </div>
            </div>
          )}
        </div>

        {/* Device Intelligence Panel (1/3) */}
        <div className="space-y-4">
          {devices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-300 shadow-sm">
              <Radio className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">No devices registered</p>
              <p className="text-xs text-gray-300 mt-1">Add a device to start monitoring</p>
            </div>
          ) : (
            devices.map(d => <DeviceCard key={d.device_id} device={d} />)
          )}
        </div>
      </div>

      {/* ── Readings log ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-ocean-700 to-ocean-600">
          <div>
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Droplets className="w-4 h-4" /> Sensor Readings Log
            </h2>
            <p className="text-xs text-ocean-200 mt-0.5">Latest entries from field devices</p>
          </div>
          <span className="text-xs font-bold text-ocean-200 bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg">
            {stats.totalReadings ?? 0} total readings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-widest">#</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Device</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Temperature</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Battery</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Network</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-300 text-sm">
                    No readings yet — waiting for device data.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => {
                const t = r.temperature;
                const isAlertTemp = t < 20 || t > 32;
                const isOnNet = r.network?.operator && r.network.operator !== 'Offline';
                return (
                  <tr key={r._id ?? i}
                    className={`hover:bg-ocean-50/30 transition-colors ${isAlertTemp ? 'bg-red-50/40' : ''}`}>
                    <td className="py-3.5 px-5">
                      <span className="text-xs font-mono text-gray-300 font-bold">{(i + 1).toString().padStart(2, '0')}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-ocean-50 border border-ocean-100 flex items-center justify-center flex-shrink-0">
                          <Radio className="w-3.5 h-3.5 text-ocean-600" />
                        </div>
                        <div>
                          <p className="font-mono text-xs font-bold text-gray-700">{r.device_id}</p>
                          <p className="text-xs text-gray-400">{r.topic?.split('/').slice(-1)[0] || 'IoT'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-black ${tempColor(t)}`}>{t}°C</span>
                        {isAlertTemp && (
                          <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-lg">
                            <AlertTriangle className="w-3 h-3" /> Alert
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${r.battery?.percentage ?? 0}%`, backgroundColor: battColor(r.battery?.percentage) }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">{r.battery?.percentage ?? '--'}%</span>
                        <span className="text-xs text-gray-400">{r.battery?.voltage}V</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                        isOnNet
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {isOnNet ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {r.network?.operator ?? 'Offline'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600">{timeAgo(r.received_at)}</p>
                        <p className="text-xs text-gray-300 mt-0.5">
                          {r.received_at ? new Date(r.received_at).toLocaleString() : '--'}
                        </p>
                      </div>
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
