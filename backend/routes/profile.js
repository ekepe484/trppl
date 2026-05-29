// backend/routes/profile.js
// GET  /api/profile/me          — return full profile
// PUT  /api/profile/update      — update text fields
// POST /api/profile/photos      — upload additional photos
// DELETE /api/profile/photos/:index — remove a photo by index

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');

const config  = require('../config');
const store   = require('../store');
const { requireAuth } = require('../middleware/auth');

const router  = express.Router();

// ── Photo upload ──────────────────────────────────────────────────────────────
const photoDir = path.resolve(config.uploads.dir, 'photos');
if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, photoDir),
  filename:    (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: config.uploads.maxSize, files: 6 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','image/heic'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPEG/PNG/WEBP/HEIC images allowed.'), ok);
  },
});

// ── GET /api/profile/me ───────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: store.publicUser(req.user) });
});

// ── PUT /api/profile/update ───────────────────────────────────────────────────
router.put('/update', requireAuth, async (req, res, next) => {
  try {
    const {
      name, city, country, height,
      education, drinking, smoking,
      haveKids, wantKids, zodiac, religion,
    } = req.body;

    const EDUCATION_VALS = ['high-school','some-college','bachelors','masters','phd','trade-school','prefer-not-to-say'];
    const DRINKING_VALS  = ['yes','socially','no'];
    const SMOKING_VALS   = ['yes','no'];
    const HAVEKIDS_VALS  = ['yes','no'];
    const WANTKIDS_VALS  = ['yes','no','open','not-sure'];
    const ZODIAC_VALS    = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
    const RELIGION_VALS  = ['christianity','islam','hinduism','judaism','buddhism','sikhism','spiritual','agnostic','atheist','other','prefer-not-to-say'];

    const fields = {};
    if (name      && name.trim().length >= 2)               fields.name      = name.trim();
    if (city      && city.trim().length >= 2)               fields.city      = city.trim();
    if (country)                                             fields.country   = country;
    if (height)                                              fields.height    = height;
    if (education && EDUCATION_VALS.includes(education))     fields.education = education;
    if (drinking  && DRINKING_VALS.includes(drinking))       fields.drinking  = drinking;
    if (smoking   && SMOKING_VALS.includes(smoking))         fields.smoking   = smoking;
    if (haveKids  && HAVEKIDS_VALS.includes(haveKids))       fields.haveKids  = haveKids;
    if (wantKids  && WANTKIDS_VALS.includes(wantKids))       fields.wantKids  = wantKids;
    if (zodiac    && ZODIAC_VALS.includes(zodiac))           fields.zodiac    = zodiac;
    if (religion  && RELIGION_VALS.includes(religion))       fields.religion  = religion;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const user = await store.updateUser(req.user.id, fields);
    res.json({ message: 'Profile updated.', user: store.publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/profile/photos ──────────────────────────────────────────────────
router.post('/photos', requireAuth, upload.array('photos', 6), async (req, res, next) => {
  try {
    const newFiles = (req.files || []).map(f => f.path);
    if (!newFiles.length) return res.status(400).json({ error: 'No photos uploaded.' });

    const existing  = req.user.photoPaths || [];
    const combined  = [...existing, ...newFiles].slice(0, 6); // max 6 total
    const user      = await store.updateUser(req.user.id, { photoPaths: combined });
    res.json({ message: `${newFiles.length} photo(s) added.`, user: store.publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/profile/photos/:index ─────────────────────────────────────────
router.delete('/photos/:index', requireAuth, async (req, res, next) => {
  try {
    const idx   = parseInt(req.params.index);
    const paths = [...(req.user.photoPaths || [])];
    if (isNaN(idx) || idx < 0 || idx >= paths.length) {
      return res.status(400).json({ error: 'Invalid photo index.' });
    }
    if (paths.length <= 1) {
      return res.status(400).json({ error: 'You must keep at least one photo.' });
    }

    const removed = paths.splice(idx, 1)[0];
    // Delete file from disk
    if (removed && fs.existsSync(removed)) {
      fs.unlink(removed, err => { if (err) console.warn('[Profile] Could not delete photo file:', err.message); });
    }

    const user = await store.updateUser(req.user.id, { photoPaths: paths });
    res.json({ message: 'Photo removed.', user: store.publicUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
