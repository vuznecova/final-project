async function loadHeader() {
  const res  = await fetch('partials/header.html');
  if (!res.ok) throw new Error('Header not found');
  const html = await res.text();
  document.getElementById('header-placeholder').innerHTML = html;
}

async function initAuthHeader() {
  const token        = localStorage.getItem('token');
  const signUpLink   = document.getElementById('signUpLink');
  const loginLink    = document.getElementById('loginLink');
  const logoutLink   = document.getElementById('logoutLink');
  const greetingElem = document.getElementById('greeting');
  const progressLink = document.getElementById('progressLink');

  if (!token) {
    signUpLink?.style.setProperty('display','inline-block');
    loginLink?.style.setProperty('display','inline-block');
    logoutLink?.style.setProperty('display','none');
    greetingElem?.style.setProperty('display','none');
    progressLink?.style.setProperty('display','none');
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Unauthorized');
    const { name } = await res.json();

    signUpLink?.remove();
    loginLink?.remove();
    progressLink.style.setProperty('display','inline-block');
    greetingElem.textContent     = `Hi, ${name}`;
    greetingElem.style.display   = 'inline-block';
    logoutLink.style.display     = 'inline-block';
  } catch (err) {
    localStorage.removeItem('token');
    window.location.href = 'login.html?error=auth';
  }

  logoutLink?.addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.reload();
  });
}

function initStartTherapy() {
  const startBtn = document.getElementById('startTherapyBtn');
  startBtn?.addEventListener('click', () => {
    if (localStorage.getItem('token')) {
      window.location.href = 'levels.html';
    } else {
      window.location.href = 'login.html?error=auth';
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadHeader();
    await initAuthHeader();
    initStartTherapy();
  } catch (err) {
    console.error('Header init error:', err);
  }
});
