// backend/routes/matches.js
// POST /api/matches/like/:targetId   — like a user (creates match if mutual)
// GET  /api/matches                   — get all your active matches
// GET  /api/matches/trppl             — get your active trppl
// POST /api/matches/trppl/:trpplId/game-result — submit game result

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const { query, withTransaction } = require('../db/pool');
const store = require('../store');

// ── Helpers ───────────────────────────────────────────────────────────────────
async function createNotification(userId, type, title, body, data = {}) {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, JSON.stringify(data)]
    );
  } catch (err) {
    console.error('[Notifications] Failed to create:', err.message);
  }
}

// ── POST /api/matches/like/:targetId ──────────────────────────────────────────
router.post('/like/:targetId', requireAuth, async (req, res, next) => {
  try {
    const me     = req.user;
    const target = await store.getUserById(req.params.targetId);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.id === me.id) return res.status(400).json({ error: 'You cannot like yourself.' });

    // Ensure opposite sex
    if (me.sex === target.sex) {
      return res.status(400).json({ error: 'Trppl is a heterosexual dating app.' });
    }

    // Check if match already exists
    const existing = await query(
      `SELECT * FROM matches WHERE
        (user1_id=$1 AND user2_id=$2) OR (user1_id=$2 AND user2_id=$1)`,
      [me.id, target.id]
    );
    if (existing.rows.length) {
      return res.json({ message: 'Already matched.', match: existing.rows[0] });
    }

    // Determine shared love language (simplified — use first from profile)
    // In production this would come from quiz answers stored per-user
    const loveLang = 'Quality Time';

    const match = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO matches (user1_id, user2_id, love_lang, status)
         VALUES ($1, $2, $3, 'active') RETURNING *`,
        [me.id, target.id, loveLang]
      );
      return rows[0];
    });

    // Notify target
    await createNotification(
      target.id, 'match', '💜 New Match!',
      `${me.name} matched with you on ${loveLang}!`,
      { matchId: match.id, userId: me.id }
    );

    // Check if this creates a Trppl (two people matched with same third person)
    await checkAndCreateTrppl(me.id, target.id, match.id);

    res.status(201).json({ message: 'Matched!', match });
  } catch (err) {
    next(err);
  }
});

async function checkAndCreateTrppl(userId1, userId2, matchId) {
  // Find if there's a third person both have matched with
  const result = await query(`
    SELECT u.id as common_user_id FROM users u
    WHERE u.id != $1 AND u.id != $2
    AND EXISTS (
      SELECT 1 FROM matches m1 WHERE m1.status='active'
        AND ((m1.user1_id=$1 AND m1.user2_id=u.id) OR (m1.user1_id=u.id AND m1.user2_id=$1))
    )
    AND EXISTS (
      SELECT 1 FROM matches m2 WHERE m2.status='active'
        AND ((m2.user1_id=$2 AND m2.user2_id=u.id) OR (m2.user1_id=u.id AND m2.user2_id=$2))
    )
    LIMIT 1
  `, [userId1, userId2]);

  if (!result.rows.length) return;

  const prizeUserId = result.rows[0].common_user_id;
  const deadline    = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days

  const { rows: trpplRows } = await query(
    `INSERT INTO trppls (match_id, prize_user_id, comp1_user_id, comp2_user_id, booking_deadline, status)
     VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
    [matchId, prizeUserId, userId1, userId2, deadline]
  );

  const trppl = trpplRows[0];

  // Update match status
  await query(`UPDATE matches SET status='trppl' WHERE id=$1`, [matchId]);

  // Notify all three
  const [user1, user2, prize] = await Promise.all([
    store.getUserById(userId1),
    store.getUserById(userId2),
    store.getUserById(prizeUserId),
  ]);

  await createNotification(userId1, 'trppl', '⚔️ Trppl Activated!',
    `You and ${user2.name} both matched with ${prize.name}. Play a game to win the date!`,
    { trpplId: trppl.id });

  await createNotification(userId2, 'trppl', '⚔️ Trppl Activated!',
    `You and ${user1.name} both matched with ${prize.name}. Play a game to win the date!`,
    { trpplId: trppl.id });

  await createNotification(prizeUserId, 'trppl', '💥 Two people want you!',
    `${user1.name} and ${user2.name} are competing for a date with you!`,
    { trpplId: trppl.id });

  console.log(`[Trppl] Created trppl ${trppl.id} — ${user1.name} vs ${user2.name} for ${prize.name}`);
}

// ── GET /api/matches ──────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT m.*,
        u1.name as user1_name, u1.username as user1_username,
        u2.name as user2_name, u2.username as user2_username
      FROM matches m
      JOIN users u1 ON u1.id = m.user1_id
      JOIN users u2 ON u2.id = m.user2_id
      WHERE m.user1_id=$1 OR m.user2_id=$1
      ORDER BY m.created_at DESC
    `, [req.user.id]);
    res.json({ matches: rows });
  } catch (err) { next(err); }
});

// ── GET /api/matches/trppl ────────────────────────────────────────────────────
router.get('/trppl', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT t.*,
        up.name as prize_name,   up.username as prize_username,
        u1.name as comp1_name,   u1.username as comp1_username,
        u2.name as comp2_name,   u2.username as comp2_username,
        uw.name as winner_name
      FROM trppls t
      JOIN users up ON up.id = t.prize_user_id
      JOIN users u1 ON u1.id = t.comp1_user_id
      JOIN users u2 ON u2.id = t.comp2_user_id
      LEFT JOIN users uw ON uw.id = t.winner_id
      WHERE t.prize_user_id=$1 OR t.comp1_user_id=$1 OR t.comp2_user_id=$1
      ORDER BY t.created_at DESC LIMIT 10
    `, [req.user.id]);
    res.json({ trppls: rows });
  } catch (err) { next(err); }
});

// ── POST /api/matches/trppl/:trpplId/game-result ──────────────────────────────
router.post('/trppl/:trpplId/game-result', requireAuth, async (req, res, next) => {
  try {
    const { gameType, won } = req.body;
    const trppl = await query(`SELECT * FROM trppls WHERE id=$1`, [req.params.trpplId]);
    if (!trppl.rows.length) return res.status(404).json({ error: 'Trppl not found.' });

    const t = trppl.rows[0];
    const isComp = t.comp1_user_id === req.user.id || t.comp2_user_id === req.user.id;
    if (!isComp) return res.status(403).json({ error: 'You are not a competitor in this Trppl.' });
    if (t.status === 'completed') return res.status(400).json({ error: 'This Trppl is already completed.' });

    const winnerId = won ? req.user.id : (t.comp1_user_id === req.user.id ? t.comp2_user_id : t.comp1_user_id);
    const loserId  = won ? (t.comp1_user_id === req.user.id ? t.comp2_user_id : t.comp1_user_id) : req.user.id;

    await withTransaction(async (client) => {
      // Complete the trppl
      await client.query(`
        UPDATE trppls SET status='completed', winner_id=$1, loser_id=$2,
          game_type=$3, game_ended_at=NOW(),
          booking_deadline=NOW() + INTERVAL '5 days'
        WHERE id=$4
      `, [winnerId, loserId, gameType || 'chess', t.id]);

      // Put loser in waiting room for 7 days
      await client.query(`
        INSERT INTO waiting_room (user_id, trppl_id, release_at)
        VALUES ($1, $2, NOW() + INTERVAL '7 days')
        ON CONFLICT (user_id) DO UPDATE SET
          release_at=NOW() + INTERVAL '7 days', trppl_id=$2, created_at=NOW()
      `, [loserId, t.id]);
    });

    // Notify all three
    const [winner, loser, prize] = await Promise.all([
      store.getUserById(winnerId),
      store.getUserById(loserId),
      store.getUserById(t.prize_user_id),
    ]);

    await createNotification(winnerId, 'win', '🎉 You won the Trppl!',
      `You beat ${loser.name}! You have 5 days to book a date with ${prize.name}.`,
      { trpplId: t.id, prizeUserId: t.prize_user_id });

    await createNotification(loserId, 'loss', '😞 You lost the Trppl',
      `${winner.name} won this round. You're in the waiting room for 7 days.`,
      { trpplId: t.id });

    await createNotification(t.prize_user_id, 'date_incoming', '💌 Get ready for a date!',
      `${winner.name} won the competition! They have 5 days to book a date with you.`,
      { trpplId: t.id, winnerId });

    res.json({ message: 'Result recorded.', winnerId, loserId, trpplId: t.id });
  } catch (err) { next(err); }
});

module.exports = router;
