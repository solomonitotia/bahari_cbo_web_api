import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Radio, MapPin, Thermometer, Bell, Battery, Wifi, WifiOff,
  Clock, TrendingUp, Activity, Signal, Zap, ChevronUp, ChevronDown, Minus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { locationAPI } from '../services/api';
import { connectSocket } from '../services/socket';

const iotAPI = {
  getStats:   ()  => api.get('/iot/stats'),
  getChart:   (p) => api.get('/iot/chart',   { params: p }),
  getReadings:(p) => api.get('/iot/readings',{ params: p }),
};

const fmt = (v, unit = '') => v != null ? `${v}${unit}` : '--';

/* ── Custom tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-600 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }} className="font-medium capitalize">{p.name}</span>
          <span className="font-bold text-gray-700">{p.value}°C</span>
        </div>
      ))}
    </div>
  );
};

/* ── Stat card ── */
const StatCard = ({ label, value, sub, icon: Icon, iconBg, iconColor, trend }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ── Metric row ── */
const Metric = ({ label, value, valueClass = 'text-gray-800' }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-500">{label}</span>
    <span className={`text-xs font-semibold ${valueClass}`}>{value}</span>
  </div>
);

/* ── Battery indicator ── */
const BatteryIndicator = ({ pct, voltage }) => {
  const color = pct > 60 ? '#22c55e' : pct > 30 ? '#f59e0b' : '#ef4444';
  const label = pct > 60 ? 'Good' : pct > 30 ? 'Low' : 'Critical';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Charge</span>
          <span className="text-xs font-bold" style={{ color }}>{pct}% · {label}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold text-gray-700">{voltage}V</p>
        <p className="text-xs text-gray-400">voltage</p>
      </div>
    </div>
  );
};

/* ── Temperature mini chart inside device card ── */
const TempRange = ({ min, max, avg, current }) => {
  const span = max - min || 0.1;
  const avgPos  = ((avg     - min) / span) * 100;
  const currPos = ((current - min) / span) * 100;
  return (
    <div className="mt-2">
      <div className="relative h-2 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-full">
        {/* avg marker */}
        <div className="absolute -top-1 w-1 h-4 bg-ocean-600 rounded-full" style={{ left: `${Math.min(Math.max(avgPos,0),100)}%` }} />
        {/* current marker */}
        <div className="absolute -top-1.5 w-2 h-5 bg-gray-700 rounded-full border-2 border-white shadow" style={{ left: `${Math.min(Math.max(currPos,0),100)}%`, transform:'translateX(-50%)' }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}°</span>
        <span className="text-ocean-600 font-semibold">avg {avg}°</span>
        <span>{max}°</span>
      </div>
    </div>
  );
};

/* ── Device panel ── */
const DevicePanel = ({ device }) => {
  const { temperature: t, battery, network, isOnline, totalReadings, avgInterval, lastSeen, firstSeen, device_id } = device;
  const signalOk = network?.operator && network.operator !== 'Offline';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header stripe */}
      <div className={`px-5 py-3 flex items-center justify-between ${isOnline ? 'bg-ocean-600' : 'bg-gray-700'}`}>
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4 text-white/80" />
          <span className="font-mono text-sm font-bold text-white tracking-wider">{device_id}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full">
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-300 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs text-white font-medium">{isOnline ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* Temperature block */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Water Temperature</span>
            <span className={`text-xs font-semibold flex items-center gap-1 ${
              t?.stdDev === 0 ? 'text-blue-500' : t?.stdDev < 0.05 ? 'text-green-500' : 'text-amber-500'
            }`}>
              {t?.stdDev === 0 ? <><Minus className="w-3 h-3" /> Stable</> : t?.stdDev < 0.05 ? <><TrendingUp className="w-3 h-3" /> Very stable</> : <><Activity className="w-3 h-3" /> Varying</>}
            </span>
          </div>

          <div className="flex items-end gap-3 mt-2">
            <div>
              <span className="text-5xl font-black text-gray-900">{t?.current ?? '--'}</span>
              <span className="text-2xl font-bold text-gray-500">°C</span>
            </div>
            <div className="mb-1.5 space-y-0.5">
              <div className="flex items-center gap-1 text-xs text-red-500">
                <ChevronUp className="w-3 h-3" /> Max {fmt(t?.max, '°C')}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-500">
                <ChevronDown className="w-3 h-3" /> Min {fmt(t?.min, '°C')}
              </div>
            </div>
          </div>

          <TempRange min={t?.min} max={t?.max} avg={t?.avg} current={t?.current} />

          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Average',   value: fmt(t?.avg, '°C'),   color: 'text-ocean-600' },
              { label: 'Std Dev',   value: fmt(t?.stdDev, '°C'), color: 'text-purple-600' },
              { label: 'Range',     value: fmt(t?.range, '°C'),  color: 'text-amber-600'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-2.5 text-center border border-gray-100">
                <p className={`text-sm font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Battery */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5" /> Battery Status
          </p>
          <BatteryIndicator pct={battery?.current ?? 0} voltage={battery?.voltage ?? '--'} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
              <p className="text-xs font-bold text-gray-700">{fmt(battery?.avgVoltage, 'V')}</p>
              <p className="text-xs text-gray-400">Avg voltage</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
              <p className="text-xs font-bold text-gray-700">{fmt(battery?.min, '%')}</p>
              <p className="text-xs text-gray-400">Min recorded</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Network */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" /> Network
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              signalOk ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {signalOk ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {network?.operator || 'Unknown'}
            </span>
            {network?.mode && (
              <span className="inline-flex items-center px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium">
                {network.mode}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Activity metadata */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Activity
          </p>
          <Metric label="Total readings"       value={totalReadings} />
          <Metric label="Avg reading interval" value={avgInterval != null ? `~${avgInterval}s` : '--'} />
          <Metric label="First seen"           value={firstSeen ? new Date(firstSeen).toLocaleString() : '--'} />
          <Metric label="Last seen"            value={lastSeen  ? new Date(lastSeen).toLocaleString()  : '--'} valueClass={isOnline ? 'text-green-600' : 'text-gray-400'} />
        </div>

      </div>
    </div>
  );
};

/* ══════════════════════════════════════════ */
export default function Dashboard() {
  const [stats,    setStats]    = useState({ devices: [], totalDevices: 0, onlineDevices: 0, avgTemperature: null, totalReadings: 0 });
  const [chart,    setChart]    = useState([]);
  const [rows,     setRows]     = useState([]);
  const [locations,setLocations]= useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selDevice,setSelDevice]= useState('');

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, chartRes, rowsRes, locRes] = await Promise.all([
        iotAPI.getStats(),
        iotAPI.getChart({ device_id: selDevice || undefined }),
        iotAPI.getReadings({ limit: 10 }),
        locationAPI.getAll(),
      ]);
      setStats(statsRes.data.data    || {});
      setChart(chartRes.data.data    || []);
      setRows(rowsRes.data.data      || []);
      setLocations(locRes.data.data  || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [selDevice]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const socket = connectSocket();
    socket.on('reading_update', r => {
      if (r.alert) toast.error(`⚠️ ${r.device?.name} — ${r.temperature}°${r.unit} (${r.alertType})`, { duration: 6000 });
      fetchData();
    });
    return () => socket.off('reading_update');
  }, [fetchData]);

  const devices = stats.devices || [];

  // Y-axis domain — tight around actual data
  const allTemps = chart.flatMap(d => [d.min, d.avg, d.max]).filter(Boolean);
  const yMin = allTemps.length ? +(Math.min(...allTemps) - 0.3).toFixed(1) : 'auto';
  const yMax = allTemps.length ? +(Math.max(...allTemps) + 0.3).toFixed(1) : 'auto';
  const chartAvg = chart.length ? +(chart.reduce((s,r) => s + r.avg, 0) / chart.length).toFixed(2) : null;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean-600" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Devices"   value={stats.totalDevices}   sub={`${stats.onlineDevices} currently online`}   icon={Radio}       iconBg="bg-ocean-50"  iconColor="text-ocean-600" />
        <StatCard label="Locations"       value={locations.length}     sub="monitored sites"                              icon={MapPin}      iconBg="bg-green-50"  iconColor="text-green-600" />
        <StatCard label="Avg Temperature" value={fmt(stats.avgTemperature,'°C')} sub={`from ${stats.totalReadings} readings`} icon={Thermometer} iconBg="bg-amber-50"  iconColor="text-amber-500" />
        <StatCard label="Active Alerts"   value={0}                    sub="all temperatures normal"                      icon={Bell}        iconBg="bg-gray-50"   iconColor="text-gray-400"  />
      </div>

      {/* ── Main content: Chart + Device panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Chart — takes 2/3 */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-800 text-base">Temperature Trend</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 24h · readings grouped by minute</p>
            </div>
            <select className="input w-auto text-xs py-1.5" value={selDevice} onChange={e => setSelDevice(e.target.value)}>
              <option value="">All Devices</option>
              {devices.map(d => <option key={d.device_id} value={d.device_id}>{d.device_id}</option>)}
            </select>
          </div>

          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0284c7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="°" width={40} tickFormatter={v => v.toFixed(1)} />
                <Tooltip content={<ChartTooltip />} />
                {chartAvg && (
                  <ReferenceLine y={chartAvg} stroke="#0284c7" strokeDasharray="5 4" strokeOpacity={0.5}
                    label={{ value: `avg ${chartAvg}°`, position: 'insideTopRight', fontSize: 10, fill: '#0284c7' }} />
                )}
                <Area type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} name="max" />
                <Area type="monotone" dataKey="avg" stroke="#0284c7" strokeWidth={2.5} fill="url(#avgGrad)"
                  dot={{ r: 4, fill: '#0284c7', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} name="avg" />
                <Area type="monotone" dataKey="min" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} name="min" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Activity className="w-8 h-8 text-gray-200" />
              <p className="text-sm">No data for selected period</p>
            </div>
          )}

          {/* Legend */}
          {chart.length > 0 && (
            <div className="flex items-center justify-center gap-6 mt-2">
              {[['#ef4444','Max'],['#0284c7','Average'],['#22c55e','Min']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: c }} />
                  {l}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Device panels — 1/3 */}
        <div className="space-y-4">
          {devices.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <Radio className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No devices registered</p>
            </div>
          ) : (
            devices.map(d => <DevicePanel key={d.device_id} device={d} />)
          )}
        </div>
      </div>

      {/* ── Readings log ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-800 text-base">Readings Log</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest {rows.length} entries from the sensor network</p>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
            {stats.totalReadings} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Device</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Temp</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Battery</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Network</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r, i) => (
                <tr key={r._id ?? i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-ocean-50 flex items-center justify-center flex-shrink-0">
                        <Radio className="w-3.5 h-3.5 text-ocean-600" />
                      </div>
                      <span className="font-mono text-xs text-gray-600 font-semibold">{r.device_id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-ocean-700 text-sm">{r.temperature}°C</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${r.battery?.percentage ?? 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{r.battery?.percentage ?? '--'}%</span>
                      <span className="text-xs text-gray-400">{r.battery?.voltage}V</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      r.network?.operator === 'Offline' || !r.network?.operator
                        ? 'bg-red-50 text-red-600'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {r.network?.operator === 'Offline' || !r.network?.operator
                        ? <WifiOff className="w-3 h-3" />
                        : <Wifi className="w-3 h-3" />}
                      {r.network?.operator ?? 'Offline'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400">
                    {r.received_at ? new Date(r.received_at).toLocaleString() : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
