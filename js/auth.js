// js/auth.js

(async function() {
  // =====================
  // REGISTRATION
  // =====================
  const registerForm = document.getElementById('registerForm');
  const registerError = document.getElementById('registerError');

  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (registerError) {
        registerError.style.display = 'none';
        registerError.textContent = '';
      }

      const name       = e.target.name.value.trim();
      const surname    = e.target.surname.value.trim();
      const emailInput = e.target.email;
      const email      = emailInput.value.trim();
      const password   = e.target.password.value;

      // Manual validation for registration
      if (!name) {
        registerError.textContent   = 'Please enter your name';
        registerError.style.display = 'block';
        return;
      }
      if (!surname) {
        registerError.textContent   = 'Please enter your surname';
        registerError.style.display = 'block';
        return;
      }
      if (!email) {
        registerError.textContent   = 'Please enter your email';
        registerError.style.display = 'block';
        return;
      }
      if (!emailInput.validity.valid) {
        registerError.textContent   = 'Please enter a valid email address';
        registerError.style.display = 'block';
        return;
      }
      if (!password) {
        registerError.textContent   = 'Please enter a password';
        registerError.style.display = 'block';
        return;
      }
      if (password.length < 8) {
        registerError.textContent   = 'Password must be at least 8 characters';
        registerError.style.display = 'block';
        return;
      }
      if (!/\d/.test(password)) {
        registerError.textContent   = 'Password must contain at least one digit';
        registerError.style.display = 'block';
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ name, surname, email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          if (registerError) {
            registerError.textContent = data.error || 'Registration failed';
            registerError.style.display = 'block';
          }
          return;
        }

        window.location.href = 'login.html';
      } catch (err) {
        if (registerError) {
          registerError.textContent = 'Network error, please try again';
          registerError.style.display = 'block';
        }
      }
    });
  }

  // =====================
  // LOGIN
  // =====================
  const loginForm  = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      loginError.style.display = 'none';
      loginError.textContent   = '';

      const emailInput    = e.target.email;
      const passwordInput = e.target.password;
      const email         = emailInput.value.trim();
      const password      = passwordInput.value;

      // Manual validation for login
      if (!email) {
        loginError.textContent   = 'Please enter your email';
        loginError.style.display = 'block';
        return;
      }
      if (!emailInput.validity.valid) {
        loginError.textContent   = 'Please enter a valid email address';
        loginError.style.display = 'block';
        return;
      }
      if (!password) {
        loginError.textContent   = 'Please enter your password';
        loginError.style.display = 'block';
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
          loginError.textContent   = 'Incorrect login or password';
          loginError.style.display = 'block';
          return;
        }

        const { token } = await res.json();
        localStorage.setItem('token', token);
        const payload = JSON.parse(atob(token.split('.')[1]));
        localStorage.setItem('userName', payload.name);
        window.location.href = 'index.html';
      } catch {
        loginError.textContent   = 'Network error, please try again';
        loginError.style.display = 'block';
      }
    });
  }

  // =====================
  // HEADER & AUTH STATE
  // =====================
  const token      = localStorage.getItem('token');
  const userName   = localStorage.getItem('userName');
  const signUpLink = document.getElementById('signUpLink');
  const loginLink  = document.getElementById('loginLink');
  const logoutLink = document.getElementById('logoutLink');
  const greeting   = document.getElementById('greeting');

  if (token && userName) {
    if (signUpLink) signUpLink.remove();
    if (loginLink) loginLink.remove();
    if (logoutLink) logoutLink.style.display = 'inline-block';
    if (greeting) {
      greeting.textContent = `Hi, ${userName}`;
      greeting.style.display = 'inline-block';
    }
  } else {
    if (loginLink) loginLink.style.display = 'inline-block';
    if (signUpLink) signUpLink.style.display = 'inline-block';
    if (logoutLink) logoutLink.style.display = 'none';
    if (greeting) greeting.style.display = 'none';
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