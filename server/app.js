require('dotenv').config();
const express        = require('express');
const path           = require('path');
const authRouter     = require('./routes/auth');
const progressRouter = require('./routes/progress');
const authMiddleware = require('./middleware/auth');

const app = express();

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/progress', progressRouter);

app.use(
  express.static(
    path.join(__dirname, '..', 'public')
  )
);

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
