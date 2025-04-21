// server/routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Регистрация
router.post('/register', async (req, res) => {
  const { name, surname, email, password } = req.body;
  try {
    // Проверяем существование
    const [exists] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (exists.length) return res.status(400).json({ error: 'Email already in use' });

    // Хешируем пароль и вставляем
    const hashed = await bcrypt.hash(password, 10);
    await db.execute(
      `INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)`,
    [name, surname, email, hashed]
    );
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Логин
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Ищем пользователя
    const [rows] = await db.execute(
      'SELECT id, first_name, last_name, password FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length) return res.status(400).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    // Отправляем JWT
    const fullName = `${user.first_name} ${user.last_name}`;
    const token = jwt.sign({ userId: user.id, name: fullName },
                           process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
