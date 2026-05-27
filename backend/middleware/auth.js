// backend/middleware/auth.js
const jwt    = require('jsonwebtoken');
const config = require('../config');
const store  = require('../store');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authentication required.' });
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    const user    = await store.getUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found.' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

module.exports = { requireAuth };
