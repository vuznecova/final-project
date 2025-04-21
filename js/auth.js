// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm    = document.getElementById('loginForm');
  const navList      = document.querySelector('.nav-list');

  // 1) Регистрация
  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name     = e.target.name.value.trim();
      const surname  = e.target.surname.value.trim();
      const email    = e.target.email.value.trim();
      const password = e.target.password.value;

      try {
        const res = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ name, surname, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        alert('Registration successful! Please log in.');
        window.location.href = 'login.html';
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // 2) Логин
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email    = e.target.email.value.trim();
      const password = e.target.password.value;

      try {
        const res  = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        // Cохраняем токен и имя
        localStorage.setItem('token', data.token);
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        localStorage.setItem('userName', payload.name);

        window.location.href = 'index.html';
      } catch (err) {
        alert(err.message);
      }
    });
  }

// 3) Меняем шапку, если авторизован
const token = localStorage.getItem('token');
const userName = localStorage.getItem('userName');

// Проверка элементов навигации (возможно, у вас другая структура)
const navArea = document.querySelector('header') || document.querySelector('nav') || document;
const signUpButton = document.querySelector('a[href="register.html"]') || document.querySelector('.sign-up') || document.querySelector('a:contains("SIGN UP")');
const loginButton = document.querySelector('a[href="login.html"]') || document.querySelector('.log-in') || document.querySelector('a:contains("LOG IN")');

console.log('Проверка авторизации:', { token, userName });

if (token && userName) {
  console.log('Пользователь авторизован, меняем шапку');
  
  // скрываем Sign up
  if (signUpButton) {
    signUpButton.style.display = 'none';
    console.log('Скрыли Sign up');
  }
}
});
