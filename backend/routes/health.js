// backend/routes/health.js
const express  = require('express');
const config   = require('../config');
const { ping } = require('../db/pool');
const router   = express.Router();

router.get('/', async (req, res) => {
  let dbStatus = 'unconfigured', dbTime = null;
  if (config.db.url) {
    try { dbTime = await ping(); dbStatus = 'connected'; }
    catch (err) { dbStatus = 'error: ' + err.message; }
  }
  const healthy = dbStatus === 'connected';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    app: 'Trppl', version: '1.0.0', env: config.nodeEnv,
    timestamp: new Date().toISOString(),
    services: { database: dbStatus, dbTime, anthropic: config.anthropic.apiKey ? 'configured' : 'missing_key' },
  });
});

module.exports = router;
