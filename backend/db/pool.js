// backend/db/pool.js
const { Pool } = require('pg');
const config   = require('../config');

if (!config.db.url) {
  throw new Error('DATABASE_URL is not set. Add it to your .env file.');
}

const pool = new Pool({
  connectionString: config.db.url,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  max: config.db.max,
  idleTimeoutMillis: config.db.idle,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => { console.error('[DB] Pool error:', err.message); });

// Keep the connection warm — ping every 4 minutes so Azure doesn't idle it out
setInterval(async () => {
  try { await pool.query('SELECT 1'); }
  catch (err) { console.warn('[DB] Keep-alive ping failed:', err.message); }
}, 4 * 60 * 1000);

async function query(sql, params = []) {
  const start  = Date.now();
  const result = await pool.query(sql, params);
  const dur    = Date.now() - start;
  if (dur > 2000) console.warn(`[DB] Slow query (${dur}ms): ${sql.slice(0, 80)}`);
  return result;
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function ping() {
  const { rows } = await query('SELECT NOW() AS now');
  return rows[0].now;
}

module.exports = { pool, query, withTransaction, ping };
