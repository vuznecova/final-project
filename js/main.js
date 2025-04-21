// js/main.js

function loadHeader() {
  return fetch('partials/header.html')
    .then(res => {
      if (!res.ok) throw new Error('Header not found');
      return res.text();
    })
    .then(html => {
      document.getElementById('header-placeholder').innerHTML = html;
    });
}

function initAuth() {
  const token        = localStorage.getItem('token');
  const userName     = localStorage.getItem('userName');
  const signUpLink   = document.getElementById('signUpLink');
  const loginLink    = document.getElementById('loginLink');
  const logoutLink   = document.getElementById('logoutLink');
  const greetingElem = document.getElementById('greeting');

  if (token && userName) {
    signUpLink?.remove();
    loginLink?.remove();
    logoutLink   && (logoutLink.style.display = 'inline-block');
    greetingElem && ((greetingElem.textContent = `Hi, ${userName}`), greetingElem.style.display = 'inline-block');
  } else {
    loginLink  && (loginLink.style.display = 'inline-block');
    signUpLink && (signUpLink.style.display = 'inline-block');
    logoutLink && (logoutLink.style.display = 'none');
    greetingElem && (greetingElem.style.display = 'none');
  }

  logoutLink?.addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.reload();
  });
}

function initStartTherapy() {
  const startBtn = document.getElementById('startTherapyBtn');
  startBtn?.addEventListener('click', () => {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = 'levels.html';
    } else {
      alert('Please log in to begin therapy');
      window.location.href = 'login.html';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadHeader()
    .then(initAuth)
    .then(initStartTherapy)
    .catch(err => console.error('Ошибка инициализации:', err));
});
