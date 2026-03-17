const mongoose = require('mongoose');

// Helper to get the raw collection
const col = () => mongoose.connection.db.collection('bahari_cbo');

// @desc  Get latest reading per device (raw IoT data)
// @route GET /api/iot/latest
const getLatestIoT = async (req, res) => {
  try {
    const docs = await col().aggregate([
      { $match: { 'payload.device_id': { $exists: true } } },
      { $sort:  { 'payload.received_at': -1 } },
      {
        $group: {
          _id:  '$payload.device_id',
          doc:  { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { 'payload.received_at': -1 } },
    ]).toArray();

    const data = docs.map(d => ({
      _id:          d._id,
      device_id:    d.payload.device_id,
      topic:        d.topic,
      temperature:  d.payload.temperature,
      battery:      d.payload.battery,
      network:      d.payload.network,
      transmitted_at: d.payload.transmitted_at,
      received_at:  d.payload.received_at,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all readings (paginated) for a device
// @route GET /api/iot/readings
const getIoTReadings = async (req, res) => {
  try {
    const { device_id, limit = 50, page = 1 } = req.query;
    const filter = { 'payload.device_id': { $exists: true } };
    if (device_id) filter['payload.device_id'] = device_id;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await col().countDocuments(filter);
    const docs  = await col()
      .find(filter)
      .sort({ 'payload.received_at': -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const data = docs.map(d => ({
      _id:          d._id,
      device_id:    d.payload.device_id,
      topic:        d.topic,
      temperature:  d.payload.temperature,
      battery:      d.payload.battery,
      network:      d.payload.network,
      transmitted_at: d.payload.transmitted_at,
      received_at:  d.payload.received_at,
    }));

    res.json({ success: true, total, page: parseInt(page), data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get rich summary stats per device for dashboard
// @route GET /api/iot/stats
const getIoTStats = async (req, res) => {
  try {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const oneDayAgo  = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const docs = await col().find({ 'payload.device_id': { $exists: true } })
      .sort({ 'payload.received_at': 1 }).toArray();

    // Group per device
    const deviceMap = {};
    docs.forEach(d => {
      const id = d.payload.device_id;
      if (!deviceMap[id]) deviceMap[id] = [];
      deviceMap[id].push(d.payload);
    });

    const devices = Object.entries(deviceMap).map(([device_id, readings]) => {
      const temps    = readings.map(r => r.temperature).filter(t => t != null);
      const batts    = readings.map(r => r.battery?.percentage).filter(b => b != null);
      const voltages = readings.map(r => r.battery?.voltage).filter(v => v != null);
      const times    = readings.map(r => new Date(r.received_at)).filter(Boolean).sort((a,b)=>a-b);

      const avg  = temps.length ? +(temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(2) : null;
      const min  = temps.length ? +Math.min(...temps).toFixed(2) : null;
      const max  = temps.length ? +Math.max(...temps).toFixed(2) : null;
      const range = (max != null && min != null) ? +(max - min).toFixed(2) : null;

      // Std deviation
      const stdDev = temps.length > 1
        ? +(Math.sqrt(temps.reduce((s,t)=>s+Math.pow(t-avg,2),0)/temps.length)).toFixed(3)
        : 0;

      const lastReading  = readings[readings.length - 1];
      const firstReading = readings[0];
      const lastSeen     = times[times.length - 1];
      const firstSeen    = times[0];
      const isOnline     = lastSeen && lastSeen >= tenMinsAgo;

      // Avg interval between readings (seconds)
      let avgInterval = null;
      if (times.length > 1) {
        const totalMs = times[times.length-1] - times[0];
        avgInterval = Math.round(totalMs / (times.length - 1) / 1000);
      }

      return {
        device_id,
        isOnline,
        totalReadings: readings.length,
        readingsLast24h: readings.filter(r => new Date(r.received_at) >= oneDayAgo).length,
        temperature: { avg, min, max, range, stdDev, current: lastReading?.temperature },
        battery: {
          current:    lastReading?.battery?.percentage,
          voltage:    lastReading?.battery?.voltage,
          avgVoltage: voltages.length ? +(voltages.reduce((a,b)=>a+b,0)/voltages.length).toFixed(2) : null,
          min:        batts.length ? Math.min(...batts) : null,
        },
        network: {
          operator: lastReading?.network?.operator,
          rssi:     lastReading?.network?.rssi,
          mode:     lastReading?.network?.mode,
          csq:      lastReading?.network?.csq_rssi,
        },
        firstSeen:   firstSeen?.toISOString(),
        lastSeen:    lastSeen?.toISOString(),
        avgInterval,
      };
    });

    const allTemps = docs.map(d => d.payload?.temperature).filter(t => t != null);
    const globalAvg = allTemps.length ? +(allTemps.reduce((a,b)=>a+b,0)/allTemps.length).toFixed(2) : null;

    res.json({
      success: true,
      data: {
        totalDevices:  devices.length,
        onlineDevices: devices.filter(d => d.isOnline).length,
        totalReadings: docs.length,
        avgTemperature: globalAvg,
        devices,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get chart data (grouped by minute)
// @route GET /api/iot/chart
const getIoTChart = async (req, res) => {
  try {
    const { device_id, hours = 24 } = req.query;
    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000); // Date object

    const filter = {
      'payload.device_id': { $exists: true },
      'payload.received_at': { $gte: since },
    };
    if (device_id) filter['payload.device_id'] = device_id;

    const docs = await col().find(filter).sort({ 'payload.received_at': 1 }).toArray();

    // Group by minute
    const byMinute = {};
    docs.forEach(d => {
      const t  = d.payload?.temperature;
      const ra = d.payload?.received_at;
      if (t == null || !ra) return;
      const dt  = new Date(ra);
      const key = `${dt.getUTCHours().toString().padStart(2,'0')}:${dt.getUTCMinutes().toString().padStart(2,'0')}`;
      if (!byMinute[key]) byMinute[key] = [];
      byMinute[key].push(t);
    });

    const data = Object.entries(byMinute).map(([time, temps]) => ({
      time,
      avg: +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2),
      min: +Math.min(...temps).toFixed(2),
      max: +Math.max(...temps).toFixed(2),
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLatestIoT, getIoTReadings, getIoTStats, getIoTChart };
