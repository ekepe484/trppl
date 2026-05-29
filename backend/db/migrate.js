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

  // ── 005 — matches, trppls, date bookings, notifications
  {
    id: '005_matches_and_bookings',
    sql: `
      -- Matches: two users who share a primary love language
      CREATE TABLE IF NOT EXISTS matches (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user1_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user2_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        love_lang   TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','active','trppl','completed','expired')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user1_id, user2_id)
      );
      CREATE INDEX IF NOT EXISTS matches_u1_idx ON matches(user1_id);
      CREATE INDEX IF NOT EXISTS matches_u2_idx ON matches(user2_id);

      -- Trppls: three-way competition between two competitors for one person
      CREATE TABLE IF NOT EXISTS trppls (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        prize_user_id   UUID NOT NULL REFERENCES users(id),
        comp1_user_id   UUID NOT NULL REFERENCES users(id),
        comp2_user_id   UUID NOT NULL REFERENCES users(id),
        game_type       TEXT CHECK (game_type IN ('chess','checkers','scrabble','trivia')),
        winner_id       UUID REFERENCES users(id),
        loser_id        UUID REFERENCES users(id),
        status          TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','active','completed')),
        game_started_at TIMESTAMPTZ,
        game_ended_at   TIMESTAMPTZ,
        booking_deadline TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Date bookings: winner books a date with the prize user
      CREATE TABLE IF NOT EXISTS date_bookings (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trppl_id      UUID NOT NULL REFERENCES trppls(id) ON DELETE CASCADE,
        booker_id     UUID NOT NULL REFERENCES users(id),
        recipient_id  UUID NOT NULL REFERENCES users(id),
        date_type     TEXT NOT NULL CHECK (date_type IN ('coffee','dinner','drinks','activity','virtual')),
        proposed_date DATE NOT NULL,
        proposed_time TEXT NOT NULL,
        location      TEXT,
        message       TEXT,
        status        TEXT NOT NULL DEFAULT 'proposed'
                        CHECK (status IN ('proposed','accepted','declined','completed','cancelled')),
        response_msg  TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        responded_at  TIMESTAMPTZ,
        completed_at  TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS bookings_booker_idx    ON date_bookings(booker_id);
      CREATE INDEX IF NOT EXISTS bookings_recipient_idx ON date_bookings(recipient_id);

      -- Notifications
      CREATE TABLE IF NOT EXISTS notifications (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type       TEXT NOT NULL,
        title      TEXT NOT NULL,
        body       TEXT NOT NULL,
        data       JSONB,
        read       BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS notifs_user_idx ON notifications(user_id, read, created_at DESC);

      -- Waiting room entries
      CREATE TABLE IF NOT EXISTS waiting_room (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        trppl_id    UUID REFERENCES trppls(id),
        release_at  TIMESTAMPTZ NOT NULL,
        is_premium  BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
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

// ── Export is already at bottom — this file is complete ──────────────────────
