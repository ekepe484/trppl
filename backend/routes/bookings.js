// backend/routes/bookings.js
// POST /api/bookings              — winner books a date
// GET  /api/bookings              — get all bookings (sent and received)
// PUT  /api/bookings/:id/respond  — accept or decline a booking
// PUT  /api/bookings/:id/complete — mark a date as completed
// DELETE /api/bookings/:id        — cancel a booking

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const { query, withTransaction } = require('../db/pool');
const store = require('../store');

async function createNotification(userId, type, title, body, data = {}) {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, JSON.stringify(data)]
    );
  } catch (err) {
    console.error('[Notifications] Failed:', err.message);
  }
}

// ── POST /api/bookings ────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { trpplId, dateType, proposedDate, proposedTime, location, message } = req.body;

    // Validate
    const DATE_TYPES = ['coffee', 'dinner', 'drinks', 'activity', 'virtual'];
    if (!trpplId)                              return res.status(400).json({ error: 'trpplId is required.' });
    if (!DATE_TYPES.includes(dateType))        return res.status(400).json({ error: 'Invalid date type.' });
    if (!proposedDate || !proposedTime)        return res.status(400).json({ error: 'Date and time are required.' });

    // Verify date is in the future
    const dateObj = new Date(proposedDate + 'T' + proposedTime);
    if (dateObj < new Date()) return res.status(400).json({ error: 'Proposed date must be in the future.' });

    // Look up trppl and verify user is the winner
    const { rows: trpplRows } = await query(`SELECT * FROM trppls WHERE id=$1`, [trpplId]);
    if (!trpplRows.length) return res.status(404).json({ error: 'Trppl not found.' });
    const t = trpplRows[0];

    if (t.winner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the Trppl winner can book a date.' });
    }
    if (t.status !== 'completed') {
      return res.status(400).json({ error: 'The game must be completed before booking.' });
    }
    if (t.booking_deadline && new Date(t.booking_deadline) < new Date()) {
      return res.status(400).json({ error: 'Booking deadline has passed.' });
    }

    // Check for existing pending booking for this trppl
    const existing = await query(
      `SELECT id FROM date_bookings WHERE trppl_id=$1 AND status IN ('proposed','accepted')`,
      [trpplId]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'A booking already exists for this Trppl.' });
    }

    const { rows } = await query(`
      INSERT INTO date_bookings
        (trppl_id, booker_id, recipient_id, date_type, proposed_date, proposed_time, location, message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [trpplId, req.user.id, t.prize_user_id, dateType, proposedDate, proposedTime, location || null, message || null]);

    const booking  = rows[0];
    const prize    = await store.getUserById(t.prize_user_id);
    const booker   = req.user;

    const dateLabels = { coffee:'☕ Coffee', dinner:'🍽️ Dinner', drinks:'🍹 Drinks', activity:'🎯 Activity', virtual:'💻 Virtual date' };

    await createNotification(
      t.prize_user_id, 'date_request', '💌 Date request!',
      `${booker.name} wants to take you on a ${dateLabels[dateType]} on ${proposedDate} at ${proposedTime}!`,
      { bookingId: booking.id, bookerId: booker.id }
    );

    res.status(201).json({ message: 'Date booking sent!', booking });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/bookings ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT b.*,
        ub.name as booker_name, ub.username as booker_username,
        ur.name as recipient_name, ur.username as recipient_username,
        t.game_type, t.comp1_user_id, t.comp2_user_id
      FROM date_bookings b
      JOIN users ub ON ub.id = b.booker_id
      JOIN users ur ON ur.id = b.recipient_id
      JOIN trppls t  ON t.id  = b.trppl_id
      WHERE b.booker_id=$1 OR b.recipient_id=$1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json({ bookings: rows });
  } catch (err) { next(err); }
});

// ── PUT /api/bookings/:id/respond ─────────────────────────────────────────────
router.put('/:id/respond', requireAuth, async (req, res, next) => {
  try {
    const { accept, message } = req.body;
    const { rows } = await query(`SELECT * FROM date_bookings WHERE id=$1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found.' });

    const booking = rows[0];
    if (booking.recipient_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the recipient can respond to this booking.' });
    }
    if (booking.status !== 'proposed') {
      return res.status(400).json({ error: 'This booking has already been responded to.' });
    }

    const newStatus = accept ? 'accepted' : 'declined';
    const { rows: updated } = await query(`
      UPDATE date_bookings
      SET status=$1, response_msg=$2, responded_at=NOW()
      WHERE id=$3 RETURNING *
    `, [newStatus, message || null, booking.id]);

    const booker = await store.getUserById(booking.booker_id);
    const recipient = req.user;

    if (accept) {
      await createNotification(
        booking.booker_id, 'date_accepted', '🎉 Date accepted!',
        `${recipient.name} accepted your date request for ${booking.proposed_date}! 
        ${message ? '"' + message + '"' : ''}`,
        { bookingId: booking.id }
      );
    } else {
      await createNotification(
        booking.booker_id, 'date_declined', '😔 Date declined',
        `${recipient.name} declined your date request.
        ${message ? 'They said: "' + message + '"' : ''}`,
        { bookingId: booking.id }
      );
    }

    res.json({ message: accept ? 'Date accepted! 🎉' : 'Date declined.', booking: updated[0] });
  } catch (err) { next(err); }
});

// ── PUT /api/bookings/:id/complete ────────────────────────────────────────────
router.put('/:id/complete', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM date_bookings WHERE id=$1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found.' });

    const booking = rows[0];
    const isParty = booking.booker_id === req.user.id || booking.recipient_id === req.user.id;
    if (!isParty) return res.status(403).json({ error: 'Not your booking.' });
    if (booking.status !== 'accepted') return res.status(400).json({ error: 'Date must be accepted before marking complete.' });

    const { rows: updated } = await query(`
      UPDATE date_bookings SET status='completed', completed_at=NOW() WHERE id=$1 RETURNING *
    `, [booking.id]);

    const other = req.user.id === booking.booker_id ? booking.recipient_id : booking.booker_id;
    await createNotification(other, 'date_completed', '✅ Date completed!',
      'Your date has been marked as completed. We hope it went well! 💜', { bookingId: booking.id });

    res.json({ message: 'Date marked as completed!', booking: updated[0] });
  } catch (err) { next(err); }
});

// ── DELETE /api/bookings/:id ──────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM date_bookings WHERE id=$1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Booking not found.' });

    const booking = rows[0];
    if (booking.booker_id !== req.user.id) return res.status(403).json({ error: 'Only the booker can cancel.' });
    if (!['proposed','accepted'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cannot cancel a booking with status: ' + booking.status });
    }

    await query(`UPDATE date_bookings SET status='cancelled' WHERE id=$1`, [booking.id]);

    await createNotification(booking.recipient_id, 'date_cancelled', '❌ Date cancelled',
      `${req.user.name} cancelled the date booking.`, { bookingId: booking.id });

    res.json({ message: 'Booking cancelled.' });
  } catch (err) { next(err); }
});

module.exports = router;
