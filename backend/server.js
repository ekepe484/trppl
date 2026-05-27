// backend/server.js
const express = require('express');
const path    = require('path');
const helmet  = require('helmet');
const cors    = require('cors');

const config   = require('./config');
const { corsOptions, apiLimiter, errorHandler, helmetOptions } = require('./middleware');
const { migrate } = require('./db/migrate');

const triviaRouter       = require('./routes/trivia');
const healthRouter       = require('./routes/health');
const authRouter         = require('./routes/auth');
const verificationRouter = require('./routes/verification');

const app = express();

app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

if (config.isDev) {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

app.use('/api', apiLimiter);
app.use('/api/health',       healthRouter);
app.use('/api/trivia',       triviaRouter);
app.use('/api/auth',         authRouter);
app.use('/api/verification', verificationRouter);

const FRONTEND = path.join(__dirname, '../frontend');
app.use(express.static(FRONTEND));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

app.use(errorHandler);

async function start() {
  try { await migrate(); } catch (err) {
    console.error('[DB] Migration failed:', err.message); process.exit(1);
  }
  app.listen(config.port, () => {
    console.log(`
  ┌──────────────────────────────────────────┐
  │  🔺 TRPPL server running                 │
  │  http://localhost:${config.port}                 │
  │  Env:       ${config.nodeEnv.padEnd(30)}│
  │  DB:        ${config.db.url ? '✅ configured' : '❌ MISSING      '}           │
  │  Anthropic: ${config.anthropic.apiKey ? '✅ configured' : '❌ MISSING      '}           │
  │  Twilio:    ${config.twilio.devMode ? '⚠️  dev mode (SMS not sent)  ' : config.twilio.accountSid ? '✅ configured' : '❌ MISSING      '}│
  └──────────────────────────────────────────┘
    `);
  });
}

start();
module.exports = app;
