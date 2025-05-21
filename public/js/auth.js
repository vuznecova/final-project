// public/js/auth.js

(async function() {
  // =====================
  // SHOW AUTHENTICATION WARNING BASED ON URL PARAMS
  // =====================
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'auth') {
    const loginError = document.getElementById('loginError');
    if (loginError) {
      loginError.textContent   = 'Please log in to access levels';
      loginError.style.display = 'block';
    }
  }

  // =====================
  // REGISTRATION
  // =====================
  const registerForm  = document.getElementById('registerForm');
  const registerError = document.getElementById('registerError');

  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      registerError.style.display = 'none';
      registerError.textContent   = '';

      const name     = e.target.name.value.trim();
      const surname  = e.target.surname.value.trim();
      const email    = e.target.email.value.trim();
      const password = e.target.password.value;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ name, surname, email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          registerError.textContent   = data.error || 'Registration failed';
          registerError.style.display = 'block';
          return;
        }

        window.location.href = 'login.html';
      } catch (err) {
        registerError.textContent   = 'Network error, please try again';
        registerError.style.display = 'block';
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

      const email    = e.target.email.value.trim();
      const password = e.target.password.value;

      if (!email || !password) {
        loginError.textContent   = 'Please fill in both fields';
        loginError.style.display = 'block';
        return;
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
          loginError.textContent   = res.status === 401
            ? 'Incorrect login or password'
            : 'Server error, please try later';
          loginError.style.display = 'block';
          return;
        }

        const { token } = await res.json();
        localStorage.setItem('token', token);
        const payload = JSON.parse(atob(token.split('.')[1]));
        localStorage.setItem('userName', payload.name);

        window.location.href = 'levels.html';
      } catch (err) {
        console.error(err);
        loginError.textContent   = 'Network error, please try again';
        loginError.style.display = 'block';
      }
    });
  }

  // =====================
  // HEADER & AUTH STATE
  // =====================
  const loginLink  = document.getElementById('loginLink');
  const signUpLink = document.getElementById('signUpLink');
  const logoutLink = document.getElementById('logoutLink');
  const greeting   = document.getElementById('greeting');

  const token = localStorage.getItem('token');
  if (token) {
    if (loginLink)  loginLink.style.display  = 'none';
    if (signUpLink) signUpLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'inline-block';
    if (greeting) {
      greeting.style.display = 'inline-block';
      greeting.textContent   = 'Hello, ' + localStorage.getItem('userName');
    }
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
