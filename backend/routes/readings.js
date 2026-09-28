const express = require('express');
const store = require('../services/store');

const router = express.Router();
const FILE = 'readings.json';
const MAX_KEPT = 5000;

// The six things a household sensor kit can actually measure.
const SENSORS = [
  { field: 'ambientTemp', label: 'Outdoor temperature', unit: '°C', range: [-20, 60] },
  { field: 'soilTemp',    label: 'Ground temperature',  unit: '°C', range: [-10, 50] },
  { field: 'roomTemp',    label: 'Indoor temperature',  unit: '°C', range: [-10, 50] },
  { field: 'humidity',    label: 'Humidity',            unit: '%',  range: [0, 100] },
  { field: 'velocity',    label: 'Airflow speed',       unit: 'm/s', range: [0, 20] },
  { field: 'fanWatts',    label: 'Power draw',          unit: 'W',  range: [0, 500] }
];
const FIELD_MAP = Object.fromEntries(SENSORS.map(s => [s.field, s.range]));

function clean(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Reading must be an object');
  const ts = raw.timestamp ? new Date(raw.timestamp) : new Date();
  if (isNaN(ts)) throw new Error('Invalid timestamp');

  const out = { timestamp: ts.toISOString() };
  let count = 0;
  for (const [key, [min, max]] of Object.entries(FIELD_MAP)) {
    const v = raw[key];
    if (v === undefined || v === null || v === '') continue;
    const n = Number(v);
    if (Number.isNaN(n) || n < min || n > max) throw new Error(`${key} must be a number between ${min} and ${max}`);
    out[key] = n;
    count++;
  }
  if (!count) throw new Error('Reading has no measurement values');
  out.source = String(raw.source || 'manual').slice(0, 40);
  return out;
}

function all() { return store.load(FILE, []); }
function append(items) {
  const merged = all().concat(items)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-MAX_KEPT);
  store.save(FILE, merged);
}

router.post('/readings', (req, res) => {
  try {
    const list = Array.isArray(req.body) ? req.body : [req.body];
    const cleaned = list.map((r, i) => {
      try { return clean(r); } catch (e) { throw new Error(list.length > 1 ? `Item ${i + 1}: ${e.message}` : e.message); }
    });
    append(cleaned);
    res.status(201).json({ saved: cleaned.length });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/readings/import', (req, res) => {
  const text = String((req.body && req.body.csv) || '').trim();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return res.status(400).json({ error: 'CSV needs a header row and at least one data row' });

  const header = lines[0].split(',').map(h => h.trim());
  const known = ['timestamp', 'source', ...Object.keys(FIELD_MAP)];
  if (!header.some(h => known.includes(h))) {
    return res.status(400).json({ error: 'No known column names in header. Expected: ' + known.join(', ') });
  }

  const good = [];
  const errors = [];
  lines.slice(1).forEach((line, i) => {
    const cells = line.split(',');
    const row = {};
    header.forEach((h, c) => { if (known.includes(h)) row[h] = (cells[c] || '').trim(); });
    if (!row.source) row.source = 'csv';
    try { good.push(clean(row)); } catch (e) { errors.push(`Line ${i + 2}: ${e.message}`); }
  });

  if (errors.length) return res.status(400).json({ error: 'Nothing imported. ' + errors.slice(0, 5).join(' | ') });
  append(good);
  res.status(201).json({ saved: good.length });
});

router.get('/readings', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, MAX_KEPT);
  const list = all();
  res.json({ total: list.length, readings: list.slice(-limit) });
});

router.get('/readings/latest', (_req, res) => {
  const list = all();
  res.json({ reading: list[list.length - 1] || null });
});

router.get('/readings/export.csv', (_req, res) => {
  const cols = ['timestamp', ...Object.keys(FIELD_MAP), 'source'];
  const rows = all().map(r => cols.map(c => (r[c] ?? '')).join(','));
  res.type('text/csv').set('Content-Disposition', 'attachment; filename="readings.csv"')
    .send([cols.join(','), ...rows].join('\n'));
});

router.delete('/readings', (_req, res) => {
  store.save(FILE, []);
  res.json({ cleared: true });
});

// Which sensors have actually reported in, and their last value. No placeholders.
router.get('/sensors/status', (_req, res) => {
  const list = all();
  const status = SENSORS.map(sensor => {
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i];
      if (r[sensor.field] !== undefined && r[sensor.field] !== null) {
        return { ...sensor, connected: true, value: r[sensor.field], timestamp: r.timestamp, source: r.source };
      }
    }
    return { ...sensor, connected: false, value: null, timestamp: null, source: null };
  });
  res.json({ sensors: status, connectedCount: status.filter(s => s.connected).length, total: status.length });
});

module.exports = router;
