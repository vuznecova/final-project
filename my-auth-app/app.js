// app.js
require('dotenv').config();  // Подключение переменных окружения из .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');

const app = express();

// Middleware для обработки JSON и CORS
app.use(express.json());  // встроенный в Express
app.use(cors());

// Подключаем маршруты
app.use('/api/auth', authRoutes);

// Подключение к базе данных MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/my-auth-app';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useCreateIndex: true (если используете старую версию mongoose)
})
  .then(() => console.log('MongoDB успешно подключена'))
  .catch((err) => console.error('Ошибка подключения к MongoDB:', err));

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
