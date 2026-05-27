// backend/config/index.js
require('dotenv').config();

module.exports = {
  port:    parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev:   (process.env.NODE_ENV || 'development') === 'development',

  db: {
    url:   process.env.DATABASE_URL,
    ssl:   process.env.NODE_ENV === 'production',
    max:   parseInt(process.env.DB_POOL_MAX)  || 10,
    idle:  parseInt(process.env.DB_POOL_IDLE) || 30000,
  },

  anthropic: {
    apiKey:    process.env.ANTHROPIC_API_KEY,
    model:     'claude-sonnet-4-20250514',
    maxTokens: 1024,
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [],
  },

  auth: {
    jwtSecret:    process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    otpTtl:       10 * 60 * 1000,
    otpLength:    6,
  },

  email: {
    host:   process.env.EMAIL_HOST   || 'smtp.ethereal.email',
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user:   process.env.EMAIL_USER,
    pass:   process.env.EMAIL_PASS,
    from:   process.env.EMAIL_FROM   || 'Trppl <no-reply@trppl.app>',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken:  process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_PHONE_NUMBER,
    devMode:    process.env.TWILIO_DEV_MODE === 'true' || process.env.NODE_ENV === 'development',
  },

  uploads: {
    dir:     process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_UPLOAD_SIZE) || 20 * 1024 * 1024,
  },

  rateLimit: {
    trivia: { windowMs: 10 * 60 * 1000, max: 30 },
    auth:   { windowMs: 15 * 60 * 1000, max: 20 },
    otp:    { windowMs: 60 * 1000,       max: 5  },
    api:    { windowMs: 60 * 1000,       max: 100 },
  },
};
