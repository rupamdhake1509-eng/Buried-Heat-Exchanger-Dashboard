const express = require('express');
const store = require('../services/store');

const router = express.Router();
const FILE = 'config.json';

const DEFAULTS = { deviceName: '', location: '', power: false, targetTemp: 24, fanSpeed: 'medium' };
const FAN_SPEEDS = ['low', 'medium', 'high'];

router.get('/config', (_req, res) => res.json({ ...DEFAULTS, ...store.load(FILE, {}) }));

router.put('/config', (req, res) => {
  const body = req.body || {};
  const cfg = { ...DEFAULTS, ...store.load(FILE, {}) };

  if (body.deviceName !== undefined) cfg.deviceName = String(body.deviceName).slice(0, 60);
  if (body.location !== undefined) cfg.location = String(body.location).slice(0, 60);
  if (body.power !== undefined) cfg.power = Boolean(body.power);

  if (body.targetTemp !== undefined) {
    const n = Number(body.targetTemp);
    if (Number.isNaN(n) || n < 15 || n > 32) return res.status(400).json({ error: 'targetTemp must be between 15 and 32' });
    cfg.targetTemp = n;
  }

  if (body.fanSpeed !== undefined) {
    if (!FAN_SPEEDS.includes(body.fanSpeed)) return res.status(400).json({ error: 'fanSpeed must be low, medium, or high' });
    cfg.fanSpeed = body.fanSpeed;
  }

  store.save(FILE, cfg);
  res.json(cfg);
});

module.exports = router;
