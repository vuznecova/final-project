// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm    = document.getElementById('loginForm');

  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email    = e.target.email.value;
      const password = e.target.password.value;
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Registration successful! Please log in.');
        window.location.href = 'login.html';
      } else {
        alert(data.error);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email    = e.target.email.value;
      const password = e.target.password.value;
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        // сохраняем токен в localStorage
        localStorage.setItem('token', data.token);
        window.location.href = 'index.html';  // перенаправляем на выбор уровня
      } else {
        alert(data.error);
      }
    });
  }

  // js/auth.js (добавить в конец)
document.addEventListener('DOMContentLoaded', () => {
  const navList = document.querySelector('.nav-list');
  const token = localStorage.getItem('token');

  if (token) {
    // Заменяем Log In → Log Out
    const loginLink = navList.querySelector('a[href="login.html"]');
    if (loginLink) {
      loginLink.textContent = 'Log Out';
      loginLink.setAttribute('href', '#');
      loginLink.addEventListener('click', e => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.reload(); // перезагрузим, чтобы вернуть “Log In”
      });
    }
    // скрываем Sign Up, если хотите
    const signupLink = navList.querySelector('a[href="register.html"]');
    if (signupLink) signupLink.style.display = 'none';
  }
});

});
