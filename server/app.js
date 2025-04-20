// server/app.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const auth    = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', auth);

app.get('/', (req, res) => res.send('API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

const authMiddleware = require('./middleware/auth');
app.post('/api/progress', authMiddleware, async (req, res) => {
  // здесь можете сохранять req.userId + уровень
});
