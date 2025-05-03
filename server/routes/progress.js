// server/routes/progress.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const db      = require('../db/knex');

// GET  /api/progress — получить весь прогресс текущего юзера
router.get('/', auth, async (req, res) => {
  try {
    const rows = await db('progress')
      .where({ user_id: req.userId })
      .orderBy('completed_at', 'asc');
    const data = rows.map(r => ({
      level:        r.level,
      time_taken:   r.time_taken,
      completed_at: r.completed_at
    }));
    res.json(data);
  } catch (err) {
    console.error('GET /api/progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/progress — записать новый результат
router.post('/', auth, async (req, res) => {
  const { level, time_taken } = req.body;
  if (level == null || time_taken == null) {
    return res.status(400).json({ error: 'Level and time_taken required' });
  }
  try {
    await db('progress').insert({
      user_id:      req.userId,
      level,
      time_taken,
      completed_at: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
