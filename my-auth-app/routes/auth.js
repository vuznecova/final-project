// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Читайте секретный ключ из переменной окружения или задайте значение по умолчанию
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Регистрация пользователя
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  // Проверяем, что все поля заполнены
  if (!email || !password) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  
  try {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    // Хешируем пароль с использованием bcrypt (10 раундов соли)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создаем нового пользователя
    const user = new User({ email, password: hashedPassword });
    await user.save();
    
    res.status(201).json({ message: 'Регистрация прошла успешно' });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Логин пользователя
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  
  try {
    // Находим пользователя по email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }
    
    // Сравниваем введённый пароль с сохранённым хешем
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }
    
    // Если пароль совпадает, создаем JWT-токен
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '2h' });
    
    res.status(200).json({ message: 'Вход выполнен успешно', token });
  } catch (error) {
    console.error('Ошибка логина:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
