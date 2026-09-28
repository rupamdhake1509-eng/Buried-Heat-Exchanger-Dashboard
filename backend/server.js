const path = require('path');
const express = require('express');

const readingRoutes = require('./routes/readings');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (_req, res) => {
  const n = require('./services/store').load('readings.json', []).length;
  res.json({ status: 'ok', readings: n });
});

app.use('/api', readingRoutes);
app.use('/api', configRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route' }));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.listen(PORT, () => {
  console.log(`Smart Tube Cooling running -> http://localhost:${PORT}`);
});
