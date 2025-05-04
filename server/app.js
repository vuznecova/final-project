// server/app.js
require('dotenv').config();
const express        = require('express');
const path           = require('path');
const authRouter     = require('./routes/auth');
const progressRouter = require('./routes/progress');
const authMiddleware = require('./middleware/auth');

const app = express();

// 1) Парсим JSON в теле запроса
app.use(express.json());

// 2) Маршруты API — только относительные пути!
app.use('/api/auth', authRouter);
app.use('/api/progress', progressRouter);


// 3) Раздаём фронтенд из папки public (один и тот же источник)
app.use(
  express.static(
    path.join(__dirname, '..', 'public')
  )
);

// 4) Для всех неприсмотренных маршрутов (SPA) — отдаём index.html
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 5) Запускаем
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
