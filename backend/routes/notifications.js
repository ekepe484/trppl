// backend/routes/notifications.js
// GET  /api/notifications         — get unread + recent
// PUT  /api/notifications/read    — mark all as read
// PUT  /api/notifications/:id/read — mark one as read

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const { query } = require('../db/pool');

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT * FROM notifications
      WHERE user_id=$1
      ORDER BY created_at DESC LIMIT 50
    `, [req.user.id]);
    const unreadCount = rows.filter(n => !n.read).length;
    res.json({ notifications: rows, unreadCount });
  } catch (err) { next(err); }
});

router.put('/read', requireAuth, async (req, res, next) => {
  try {
    await query(`UPDATE notifications SET read=true WHERE user_id=$1 AND read=false`, [req.user.id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
});

router.put('/:id/read', requireAuth, async (req, res, next) => {
  try {
    await query(`UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ message: 'Notification marked as read.' });
  } catch (err) { next(err); }
});

module.exports = router;
