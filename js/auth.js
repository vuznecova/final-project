// js/auth.js

(async function() {
  const registerForm = document.getElementById('registerForm');
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

  const loginForm = document.getElementById('loginForm');
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
        localStorage.setItem('token', data.token);
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        localStorage.setItem('userName', payload.name);
        window.location.href = 'index.html';
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const token        = localStorage.getItem('token');
  const userName     = localStorage.getItem('userName');
  const signUpLink   = document.getElementById('signUpLink');
  const loginLink    = document.getElementById('loginLink');
  const logoutLink   = document.getElementById('logoutLink');
  const greetingElem = document.getElementById('greeting');

  if (token && userName) {
    if (signUpLink) signUpLink.style.display = 'none';
    if (loginLink)  loginLink.style.display  = 'none';
    if (logoutLink) {
      logoutLink.style.display = 'inline-block';
    }
    if (greetingElem) {
      greetingElem.style.display = 'inline-block';
      greetingElem.textContent   = `Hi, ${userName}`;
    }
  } else {
    if (signUpLink)   signUpLink.style.display = 'inline-block';
    if (loginLink)    loginLink.style.display  = 'inline-block';
    if (logoutLink)   logoutLink.style.display = 'none';
    if (greetingElem) greetingElem.style.display = 'none';
  }

  if (logoutLink) {
    logoutLink.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      window.location.reload();
    });
  }
})();
