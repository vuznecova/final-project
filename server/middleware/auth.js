require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '5f8d9a8f7d6a3b2c1e0f';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    req.user  = payload;
    req.userId = payload.id;

    next();
  } catch (err) {
    console.error('[Auth] token error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
