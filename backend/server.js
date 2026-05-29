// backend/server.js
const express = require('express');
const path    = require('path');
const helmet  = require('helmet');
const cors    = require('cors');

const config   = require('./config');
const { corsOptions, apiLimiter, errorHandler, helmetOptions, requestLogger } = require('./middleware');
const { migrate } = require('./db/migrate');

const triviaRouter        = require('./routes/trivia');
const healthRouter        = require('./routes/health');
const authRouter          = require('./routes/auth');
const verificationRouter  = require('./routes/verification');
const profileRouter       = require('./routes/profile');
const matchesRouter       = require('./routes/matches');
const bookingsRouter      = require('./routes/bookings');
const notificationsRouter = require('./routes/notifications');

const app = express();

app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));
app.use(requestLogger);

app.use('/api', apiLimiter);
app.use('/api/health',         healthRouter);
app.use('/api/trivia',         triviaRouter);
app.use('/api/auth',           authRouter);
app.use('/api/verification',   verificationRouter);
app.use('/api/profile',        profileRouter);
app.use('/api/matches',        matchesRouter);
app.use('/api/bookings',       bookingsRouter);
app.use('/api/notifications',  notificationsRouter);

const FRONTEND = path.join(__dirname, '../frontend');
app.use(express.static(FRONTEND));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

app.use(errorHandler);

async function start() {
  // Start listening first so Azure health checks pass and we get real logs
  const port = config.port;
  app.listen(port, () => {
    console.log('');
    console.log('  TRPPL server started on port ' + port);
    console.log('  NODE_ENV:       ' + config.nodeEnv);
    console.log('  DATABASE_URL:   ' + (config.db.url ? 'set (' + config.db.url.replace(/:([^:@]{1,40})@/, ':****@') + ')' : 'NOT SET'));
    console.log('  ANTHROPIC_KEY:  ' + (config.anthropic.apiKey ? 'set' : 'NOT SET'));
    console.log('');
  });

  // Run migrations after server is up — log errors but don't crash
  try {
    await migrate();
    console.log('[DB] Migrations complete.');
  } catch (err) {
    console.error('[DB] Migration error: ' + err.message);
    console.error('[DB] Full error: ' + err.stack);
    console.error('[DB] Check DATABASE_URL is correct and the PostgreSQL server allows connections from Azure.');
    // Don't exit — keep server running so /api/health returns useful info
  }
}

start();
module.exports = app;
