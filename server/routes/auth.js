// server/routes/auth.js

const express   = require('express');
const router    = express.Router();
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcrypt');
const db        = require('../db/knex');
const auth      = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, surname, email, password } = req.body;
  if (!name || !surname || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [userId] = await db('users').insert({ name, surname, email, password: hashed });
    res.json({ success: true, userId });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  try {
    const users = await db('users').where({ email });
    if (!users.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user  = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Подпись токена с полем name
    const token = jwt.sign(
      { id: user.id, name: user.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await db('users')
      .select('id', 'first_name as name')
      .where({ id: req.user.id })
      .first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
