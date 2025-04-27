// js/auth.js

document.addEventListener('DOMContentLoaded', () => {

  const loginForm  = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  if (!loginForm) {
    return;
  }

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginError.style.display = 'none';
    loginError.textContent   = '';

    const email    = loginForm.email.value.trim();
    const password = loginForm.password.value;

    if (!email || !password) {
      loginError.textContent   = 'Please enter both email and password';
      loginError.style.display = 'block';
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        loginError.textContent   = data.error || 'Login failed';
        loginError.style.display = 'block';
        return;
      }

      // Сохраняем токен
      localStorage.setItem('token', data.token);

      // Извлекаем имя из payload
      try {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        if (payload.name) {
          localStorage.setItem('userName', payload.name);
        }
      } catch (_) {}

      // Редирект
      window.location.href = 'index.html';
    } catch (err) {
      console.error('❌ Login network error:', err);
      loginError.textContent   = 'Network error, please try again';
      loginError.style.display = 'block';
    }
  });
});
