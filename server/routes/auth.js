// server/routes/auth.js

require('dotenv').config();
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const db      = require('../db/knex');
const authMiddleware = require('../middleware/auth');

// Секрет для подписи и проверки JWT
const JWT_SECRET = process.env.JWT_SECRET || '5f8d9a8f7d6a3b2c1e0f';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  console.log('[Register] body:', req.body);
  const { name, surname, email, password } = req.body;

  if (!name || !surname || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 8 || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Password must be ≥8 chars & contain a digit' });
  }

  try {
    const existing = await db('users').where({ email }).first();
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [insertedId] = await db('users').insert({
      first_name: name,
      last_name:  surname,
      email,
      password:   hash
    });

    return res.json({ success: true, userId: insertedId });
  } catch (err) {
    console.error('[Register] ERROR', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  console.log('[Login] body:', req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    const user = await db('users')
      .select('id',
              'first_name as name',
              'last_name  as surname',
              'password')
      .where({ email })
      .first();

    console.log('[Login] fetched user:', user);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, surname: user.surname },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('[Login] ERROR', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me — возвращает данные текущего пользователя по JWT
router.get(
  '/me',
  authMiddleware,
  (req, res) => {
    const { id, name, surname } = req.user;
    res.json({ id, name, surname });
  }
);

module.exports = router;