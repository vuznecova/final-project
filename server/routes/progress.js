// server/routes/progress.js

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  const userId   = req.userId;
  const { level, duration } = req.body;
  if (!level || duration == null) {
    return res.status(400).json({ error: 'Level and duration required' });
  }

  try {
    // 1) Сохраняем прогресс
    await db.execute(
      'INSERT INTO progress (user_id, level, duration) VALUES (?, ?, ?)',
      [userId, level, duration]
    );

    // 2) Собираем список новых ачивок, которые надо выдать
    const awarded = []; // тут будут коды новых ачивок

    // Helper: проверяет, есть ли уже у пользователя эта ачивка
    async function hasAch(code) {
      const [[{ cnt }]] = await db.execute(
        `SELECT COUNT(*) AS cnt
           FROM user_achievements ua
           JOIN achievement_types at ON ua.type_id = at.id
          WHERE ua.user_id = ? AND at.code = ?`,
        [userId, code]
      );
      return cnt > 0;
    }

    // Helper: выдаёт ачивку по коду
    async function award(code) {
      const [[atype]] = await db.execute(
        'SELECT id FROM achievement_types WHERE code = ?', [code]
      );
      if (atype) {
        await db.execute(
          'INSERT INTO user_achievements (user_id, type_id) VALUES (?, ?)',
          [userId, atype.id]
        );
        awarded.push(code);
      }
    }

    // Правило 1: первая пройдена
    if (level === 1 && !await hasAch('FIRST_LEVEL')) {
      await award('FIRST_LEVEL');
    }

    // Правило 2: быстрый финиш
    if (duration < 30 && !await hasAch('FAST_FINISH_30')) {
      await award('FAST_FINISH_30');
    }

    // Правило 3: все уровни пройдены (проверяем, есть ли в progress 6 записей)
    const [[{ cnt }]] = await db.execute(
      'SELECT COUNT(DISTINCT level) AS cnt FROM progress WHERE user_id = ?',
      [userId]
    );
    if (cnt >= 6 && !await hasAch('ALL_LEVELS')) {
      await award('ALL_LEVELS');
    }

    // 3) Отдаем клиенту, что всё ок и какие новые ачивки выданы
    res.status(201).json({
      message: 'Progress saved',
      newAchievements: awarded    // например ['FIRST_LEVEL','FAST_FINISH_30']
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server/database error' });
  }
});

module.exports = router;
