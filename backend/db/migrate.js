// backend/db/migrate.js
const { query, withTransaction } = require('./pool');

const MIGRATIONS = [
  {
    id: '001_initial_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE, password_hash TEXT NOT NULL, name TEXT NOT NULL, dob DATE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        profile_verified BOOLEAN NOT NULL DEFAULT FALSE,
        verification_status TEXT NOT NULL DEFAULT 'none' CHECK (verification_status IN ('none','pending','processing','approved','rejected')),
        selfie_path TEXT, video_path TEXT, reject_reason TEXT, verified_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
      CREATE TABLE IF NOT EXISTS email_tokens (
        token TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS email_tokens_user_idx ON email_tokens (user_id);
    `,
  },
  {
    id: '002_extended_profile_and_otp',
    sql: `
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
        ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('male','female')),
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS city TEXT, ADD COLUMN IF NOT EXISTS country TEXT,
        ADD COLUMN IF NOT EXISTS photo_paths TEXT[],
        ADD COLUMN IF NOT EXISTS contact_method TEXT NOT NULL DEFAULT 'email' CHECK (contact_method IN ('email','phone')),
        ADD COLUMN IF NOT EXISTS face_match_score NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS face_match_detail TEXT;
      CREATE INDEX IF NOT EXISTS users_username_idx ON users (username);
      CREATE INDEX IF NOT EXISTS users_phone_idx ON users (phone);
      CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code TEXT NOT NULL, contact TEXT NOT NULL,
        method TEXT NOT NULL CHECK (method IN ('email','phone')),
        purpose TEXT NOT NULL CHECK (purpose IN ('register','login','phone')),
        attempts INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ NOT NULL, used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS otp_user_idx ON otp_codes (user_id);
      CREATE INDEX IF NOT EXISTS otp_contact_idx ON otp_codes (contact);
    `,
  },
  // ── 003 — restrict sex to male/female only (heterosexual app)
  {
    id: '003_sex_constraint_heterosexual',
    sql: `
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_sex_check;
      ALTER TABLE users ADD CONSTRAINT users_sex_check CHECK (sex IN ('male','female'));
    `,
  },
  // ── 004 — lifestyle profile fields
  {
    id: '004_lifestyle_fields',
    sql: `
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS height      TEXT,
        ADD COLUMN IF NOT EXISTS education   TEXT CHECK (education IN (
          'high-school','some-college','bachelors','masters',
          'phd','trade-school','prefer-not-to-say'
        )),
        ADD COLUMN IF NOT EXISTS drinking    TEXT CHECK (drinking IN ('yes','socially','no')),
        ADD COLUMN IF NOT EXISTS smoking     TEXT CHECK (smoking  IN ('yes','no')),
        ADD COLUMN IF NOT EXISTS have_kids   TEXT CHECK (have_kids  IN ('yes','no')),
        ADD COLUMN IF NOT EXISTS want_kids   TEXT CHECK (want_kids  IN ('yes','no','open','not-sure')),
        ADD COLUMN IF NOT EXISTS zodiac      TEXT CHECK (zodiac IN (
          'aries','taurus','gemini','cancer','leo','virgo',
          'libra','scorpio','sagittarius','capricorn','aquarius','pisces'
        )),
        ADD COLUMN IF NOT EXISTS religion    TEXT CHECK (religion IN (
          'christianity','islam','hinduism','judaism','buddhism',
          'sikhism','spiritual','agnostic','atheist','other','prefer-not-to-say'
        ));
    `,
  },
];

async function migrate() {
  console.log('[DB] Running migrations…');
  await query(`CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const { rows } = await query('SELECT id FROM schema_migrations');
  const applied  = new Set(rows.map(r => r.id));
  let ran = 0;
  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) continue;
    console.log(`[DB]   Applying: ${m.id}`);
    await withTransaction(async (client) => {
      await client.query(m.sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [m.id]);
    });
    ran++;
  }
  console.log(ran === 0 ? '[DB] Nothing to migrate.' : `[DB] ${ran} migration(s) applied.`);
}

module.exports = { migrate };
