// server/routes/progress.js

const express = require('express');
const router  = express.Router();
const db      = require('../db/knex');
const auth    = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const userId   = req.user.id;           // теперь определён
    const { level, duration } = req.body;

    if (level == null || duration == null) {
      return res.status(400).json({ error: 'Level and duration required' });
    }

    await db('progress').insert({
      user_id:     userId,
      level:       parseInt(level,    10),
      time_taken:  parseInt(duration, 10),
      anxiety_rating: 0
      // completed_at заполняется автоматически в БД
    });

    res.json({ success: true });
  } catch (err) {
    console.error('DB insert error:', err);
    // во время разработки шлём полное сообщение
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

module.exports = router;
