// server/app.js

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const auth     = require('./routes/auth');
const progress = require('./routes/progress');

const app = express();

// Разрешаем кросс-доменные запросы и JSON в теле
app.use(cors());
app.use(express.json());

// Монтируем роуты
app.use('/api/auth', auth);
app.use('/api/progress', progress);

// Простой корневой маршрут для проверки
app.get('/', (req, res) => {
  res.send('API is running');
});

// Запускаем сервер
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
