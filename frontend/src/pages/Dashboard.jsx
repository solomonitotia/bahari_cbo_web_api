import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  Users, Anchor, Leaf, Thermometer, Droplets,
  CheckCircle2, AlertTriangle, TrendingUp, Calendar,
  Wifi, WifiOff, Battery, MoreHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { locationAPI } from '../services/api';
import { connectSocket } from '../services/socket';

const iotAPI = {
  getStats:    () => api.get('/iot/stats'),
  getReadings: (p) => api.get('/iot/readings', { params: p }),
};

/* ── helpers ── */
const tempStatus = (t) => {
  if (t == null) return { label: 'No Data',      cls: 'bg-gray-100 text-gray-500' };
  if (t < 20)   return { label: 'Too Cold',      cls: 'bg-blue-100 text-blue-700' };
  if (t <= 28)  return { label: 'Optimal',       cls: 'bg-green-100 text-green-700' };
  if (t <= 32)  return { label: 'Inspect Nets',  cls: 'bg-amber-100 text-amber-700' };
  return               { label: 'Critical',      cls: 'bg-red-100 text-red-600' };
};

const timeAgo = (iso) => {
  if (!iso) return '--';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

/* ── Stat card — icon on the RIGHT, trend below ── */
const StatCard = ({ label, value, trend, trendColor, trendIcon: TIcon, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
      </div>
    </div>
    <p className="text-3xl font-black text-gray-900 mb-3 leading-none">{value}</p>
    {trend && (
      <p className={`text-xs font-medium flex items-center gap-1.5 ${trendColor}`}>
        {TIcon && <TIcon className="w-3.5 h-3.5" />}
        {trend}
      </p>
    )}
  </div>
);

/* ── Cage row — matches reference exactly ── */
const CageCard = ({ device, index }) => {
  const { device_id, temperature: t, battery, network, isOnline, lastSeen } = device;
  const temp    = t?.current;
  const status  = tempStatus(temp);
  const hasNet  = network?.operator && network.operator !== 'Offline';
  const cageNum = String(index + 1).padStart(3, '0');

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all">

      {/* Cage icon */}
      <div className="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
        <Anchor className="w-5 h-5 text-primary-600" strokeWidth={1.5} />
      </div>

      {/* Name + coords */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm">
          Cage #{cageNum} · <span className="font-mono">{device_id}</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
          <span>{isOnline ? '🟢' : '⚫'} {isOnline ? 'Online' : 'Offline'}</span>
          <span>· {timeAgo(lastSeen)}</span>
          {hasNet && <span>· {network.operator}</span>}
        </p>
      </div>

      {/* Temp */}
      <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 flex-shrink-0">
        <Thermometer className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
        {temp != null ? `${temp}°C` : '--'}
      </div>

      {/* Salinity (ppt) — not in current device data */}
      <div className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-gray-700 flex-shrink-0">
        <Droplets className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
        <span className="text-gray-400">-- ppt</span>
      </div>

      {/* Status badge */}
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${status.cls}`}>
        {status.label === 'Optimal'
          ? <CheckCircle2 className="w-3 h-3" />
          : <AlertTriangle className="w-3 h-3" />}
        {status.label}
      </span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [stats,    setStats]    = useState({ devices: [], totalDevices: 0, onlineDevices: 0, avgTemperature: null, totalReadings: 0 });
  const [locations,setLocations]= useState([]);
  const [loading,  setLoading]  = useState(true);

  const today = new Date();
  const monthLabel = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, locRes] = await Promise.all([
        iotAPI.getStats(),
        locationAPI.getAll(),
      ]);
      setStats(statsRes.data.data   || {});
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

  /* bar chart — last 6 months reading counts (mock breakdown, real total) */
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const curMonth = today.getMonth(); // 0-based
  const yieldData = Array.from({ length: 6 }, (_, i) => {
    const mi = (curMonth - 5 + i + 12) % 12;
    const isCurrent = i === 5;
    return {
      month: months[mi],
      tons: isCurrent ? (stats.totalReadings || 0) : 0,
      current: isCurrent,
    };
  });

  /* temp is optimal for eucheuma? */
  const avg = stats.avgTemperature;
  const tempOk = avg != null && avg >= 20 && avg <= 28;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Kwale Ocean &amp; Farmers Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Empowering communities through sustainable seaweed farming and ocean monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm flex-shrink-0">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="font-medium whitespace-nowrap">{monthLabel}</span>
        </div>
      </div>

      {/* ── 4 Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Empowered Farmers"
          value="—"
          trend="+12% new trainees this month"
          trendColor="text-green-600"
          trendIcon={TrendingUp}
          icon={Users}
        />
        <StatCard
          label="Active Ocean Cages"
          value={stats.totalDevices ?? 0}
          trend={`${stats.onlineDevices ?? 0} require maintenance checks`}
          trendColor="text-amber-500"
          trendIcon={AlertTriangle}
          icon={Anchor}
        />
        <StatCard
          label="Expected Harvest"
          value="315 Tons"
          trend="+8% compared to last cycle"
          trendColor="text-green-600"
          trendIcon={TrendingUp}
          icon={Leaf}
        />
        <StatCard
          label="Avg Water Temp"
          value={avg != null ? `${avg}°C` : '--'}
          trend={tempOk ? 'Optimal for Eucheuma growth' : avg != null ? 'Check conditions' : 'No data yet'}
          trendColor={tempOk ? 'text-green-600' : 'text-amber-500'}
          trendIcon={tempOk ? CheckCircle2 : AlertTriangle}
          icon={Thermometer}
        />
      </div>

      {/* ── Two column: cage list + yield chart ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Ocean Cage Live Monitoring — 2/3 */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-base">Ocean Cage Live Monitoring</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {devices.length === 0 ? (
              <div className="py-12 text-center">
                <Anchor className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-semibold text-gray-400">No devices registered yet</p>
                <p className="text-xs text-gray-300 mt-1">Register a device to see live monitoring</p>
              </div>
            ) : (
              devices.map((d, i) => <CageCard key={d.device_id} device={d} index={i} />)
            )}
          </div>

          {/* Bottom summary row */}
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between text-xs text-gray-400">
            <span>{stats.totalReadings ?? 0} total readings recorded</span>
            <span>{stats.onlineDevices ?? 0} / {stats.totalDevices ?? 0} devices online</span>
          </div>
        </div>

        {/* Seaweed Yield — 1/3 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 text-base mb-1">Seaweed Yield (Tons)</h2>
          <p className="text-xs text-gray-400 mb-5">Monthly readings volume</p>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yieldData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="tons" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {yieldData.map((entry, i) => (
                  <Cell key={i} fill={entry.current ? '#2563eb' : '#bfdbfe'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Ocean image strip */}
          <div className="mt-4 rounded-xl overflow-hidden h-28 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-end relative">
            <div className="absolute inset-0 opacity-30"
              style={{ background: 'radial-gradient(ellipse at 50% 120%, #38bdf8 0%, transparent 70%)' }} />
            <div className="relative w-full p-3">
              <p className="text-white text-xs font-bold">🌊 Indian Ocean</p>
              <p className="text-primary-200 text-xs">Kwale County coastal waters</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-primary-50 rounded-xl p-3 border border-primary-100">
              <p className="text-xl font-black text-primary-700">{stats.totalReadings ?? 0}</p>
              <p className="text-xs text-primary-500 mt-0.5">Readings total</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-xl font-black text-green-700">{devices.length}</p>
              <p className="text-xs text-green-500 mt-0.5">Active devices</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Device health detail ── */}
      {devices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((d, i) => {
            const battPct  = d.battery?.current ?? 0;
            const battColor = battPct > 60 ? '#22c55e' : battPct > 30 ? '#f59e0b' : '#ef4444';
            const hasNet   = d.network?.operator && d.network.operator !== 'Offline';
            const status   = tempStatus(d.temperature?.current);
            return (
              <div key={d.device_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                      <Anchor className="w-4 h-4 text-primary-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Cage #{String(i+1).padStart(3,'0')}</p>
                      <p className="font-mono text-xs font-bold text-gray-700">{d.device_id}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${d.isOnline ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {d.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Temp stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { l: 'Min', v: d.temperature?.min, c: 'text-blue-600' },
                    { l: 'Avg', v: d.temperature?.avg, c: 'text-primary-700' },
                    { l: 'Max', v: d.temperature?.max, c: 'text-orange-500' },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="text-center bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                      <p className={`text-sm font-black leading-none ${c}`}>{v != null ? `${v}°` : '--'}</p>
                      <p className="text-xs text-gray-400 mt-1">{l}</p>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div className={`text-center text-xs font-bold py-2 rounded-xl mb-3 ${status.cls}`}>
                  {status.label}
                </div>

                {/* Battery */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1"><Battery className="w-3 h-3" /> Battery</span>
                    <span className="font-bold">{battPct}% · {d.battery?.voltage}V</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${battPct}%`, backgroundColor: battColor }} />
                  </div>
                </div>

                {/* Network */}
                <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border ${
                  hasNet ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {hasNet ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  {d.network?.operator ?? 'Offline'}
                  <span className="ml-auto text-gray-400 font-normal">{timeAgo(d.lastSeen)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
