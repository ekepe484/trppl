// backend/middleware/index.js — production-grade middleware
const rateLimit = require('express-rate-limit');
const helmet    = require('helmet');
const cors      = require('cors');
const config    = require('../config');

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.isDev && /^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    if (config.cors.allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods:        ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    true,
};

// ── IP extraction (Azure load balancer appends port) ──────────────────────────
function getClientIp(req) {
  const raw = req.ip || req.socket.remoteAddress || '';
  return raw.replace(/:\d+$/, '').replace(/^::ffff:/, '');
}

// ── Rate limiters ─────────────────────────────────────────────────────────────
const triviaLimiter = rateLimit({
  windowMs: config.rateLimit.trivia.windowMs, max: config.rateLimit.trivia.max,
  standardHeaders: true, legacyHeaders: false, keyGenerator: getClientIp,
  message: { error: 'Too many trivia requests. Please wait.' },
});

const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs, max: config.rateLimit.auth.max,
  standardHeaders: true, legacyHeaders: false, keyGenerator: getClientIp,
  message: { error: 'Too many auth attempts. Please try again later.' },
  skipSuccessfulRequests: true,
});

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs, max: config.rateLimit.api.max,
  standardHeaders: true, legacyHeaders: false, keyGenerator: getClientIp,
  message: { error: 'Too many requests. Please slow down.' },
});

// ── Request logger ────────────────────────────────────────────────────────────
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    if (level !== 'INFO' || ms > 1000) {
      console.log(`[${new Date().toISOString()}] ${level} ${res.statusCode} ${req.method} ${req.path} ${ms}ms ip=${getClientIp(req)}`);
    }
  });
  next();
}

// ── Error handler ─────────────────────────────────────────────────────────────
function errorHandler(err, req, res, next) {
  const status  = err.status || err.statusCode || 500;
  const isDev   = config.isDev;

  // Log all errors
  console.error(`[${new Date().toISOString()}] ${status} ${req.method} ${req.path} — ${err.message}`);
  if (status >= 500) console.error(err.stack);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE')  return res.status(413).json({ error: 'File too large. Maximum size is 20MB.' });
  if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files. Maximum is 6.' });

  // CORS errors
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: 'Request blocked by CORS policy.' });
  }

  const message = status < 500
    ? (err.message || 'Bad request')
    : isDev ? err.message : 'An internal error occurred. Please try again.';

  res.status(status).json({ error: message });
}

// ── Helmet (security headers, CSP disabled for now) ──────────────────────────
const helmetOptions = {
  contentSecurityPolicy:    false,
  crossOriginEmbedderPolicy: false,
};

module.exports = {
  corsOptions,
  triviaLimiter, apiLimiter, authLimiter,
  requestLogger, errorHandler, helmetOptions,
  getClientIp,
};
