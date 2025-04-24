// server/routes/progress.js

const express    = require('express');
const db         = require('../db');
const authMw     = require('../middleware/auth');
const router     = express.Router();

// Запись прогресса пользователя
// POST /api/progress
router.post('/', authMw, async (req, res) => {
  const userId        = req.userId;
  const { level, time_taken, anxiety_rating } = req.body;

  console.log('POST /api/progress payload:', { userId, level, time_taken, anxiety_rating });

  try {
    await db.execute(
      `INSERT INTO progress
         (user_id, level, time_taken, anxiety_rating, completed_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, level, time_taken, anxiety_rating || null]
    );
    res.status(201).json({ message: 'Progress saved' });
  } catch (err) {
    console.error('Error saving progress:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получение истории прогресса пользователя
// GET /api/progress
router.get('/', authMw, async (req, res) => {
  const userId = req.userId;

  try {
    const [rows] = await db.execute(
      `SELECT level, time_taken, anxiety_rating, completed_at
         FROM progress
        WHERE user_id = ?
        ORDER BY completed_at ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
