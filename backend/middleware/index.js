// backend/middleware/index.js
const rateLimit = require('express-rate-limit');
const helmet    = require('helmet');
const cors      = require('cors');
const config    = require('../config');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.isDev && /^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    if (config.cors.allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const triviaLimiter = rateLimit({
  windowMs: config.rateLimit.trivia.windowMs,
  max: config.rateLimit.trivia.max,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many trivia requests. Please wait.' },
});

const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please wait 15 minutes.' },
});

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

function errorHandler(err, req, res, next) {
  const status  = err.status || 500;
  const message = config.isDev ? err.message : 'Something went wrong';
  console.error(`[${new Date().toISOString()}] ${status} ${req.method} ${req.path} — ${err.message}`);
  res.status(status).json({ error: message });
}

// CSP disabled for testing — re-enable with proper nonces before going to production
const helmetOptions = {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
};

module.exports = { corsOptions, triviaLimiter, apiLimiter, authLimiter, errorHandler, helmetOptions };
