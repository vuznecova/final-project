// auth.js

// Адрес вашего сервера
const BASE_URL = 'http://localhost:5000/api/auth';

// Функция регистрации
async function handleRegister() {
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (!email || !password) {
    alert('Заполните все поля!');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Если статус не 2xx, значит ошибка
      throw new Error(data.error || 'Ошибка регистрации');
    }

    alert(data.message || 'Регистрация успешна!');
    // Перенаправляем на страницу логина
    window.location.href = 'login.html';
  } catch (error) {
    alert('Ошибка: ' + error.message);
    console.error('Ошибка регистрации:', error);
  }
}

// Функция логина
async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) {
    alert('Заполните все поля!');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка входа');
    }

    alert(data.message || 'Вход выполнен успешно');

    // Сохраняем токен (если сервер его присылает)
    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    // Перенаправляем на главную страницу (или levels.html)
    window.location.href = 'index.html';
  } catch (error) {
    alert('Ошибка: ' + error.message);
    console.error('Ошибка входа:', error);
  }
}
