// js/panorama.js

// 1) Константа уровней
const MAX_LEVEL = 6;

// 2) Утилита для чтения ?level=… из URL
function getParam(name) {
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const res = regex.exec(location.href);
  if (!res) return null;
  if (!res[2]) return '';
  return decodeURIComponent(res[2].replace(/\+/g, ' '));
}
const level = getParam('level') || '1';

// 3) Показ «тоста»
function showAchievement(text) {
  const ach = document.createElement('div');
  ach.className = 'achievement';
  ach.innerHTML = `<span>${text}</span>`;
  document.getElementById('ui-container').appendChild(ach);
  setTimeout(() => ach.classList.add('show'), 50);
  setTimeout(() => {
    ach.classList.remove('show');
    setTimeout(() => ach.remove(), 500);
  }, 3000);
}

// 4) Отправка прогресса
async function recordProgress(level, seconds) {
  const token = localStorage.getItem('token');
  console.log('recordProgress – token:', token);
  if (!token) {
    showAchievement('Not logged in — progress not saved');
    return;
  }
  const payload = { level: parseInt(level, 10), duration: seconds };
  console.log('Saving progress:', payload);

  try {
    const res = await fetch('http://localhost:5000/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    console.log(`API ответ ${res.status}:`, data);

    if (res.ok)           showAchievement('Progress saved!');
    else if (res.status===401) showAchievement('Session expired — log in again');
    else                  showAchievement('Error saving progress');
  } catch (err) {
    console.error('recordProgress error:', err);
    showAchievement('Error saving progress');
  }
}

// 5) Ачивка за все уровни
function showFinalAchievement() {
  showAchievement('Master of Heights!');
}

// 6) Показ модалки окончания уровня
async function showCompletion(elapsed) {
  clearInterval(timerId);

  // 6.1 сохраняем прогресс, но не редиректим
  await recordProgress(level, elapsed);

  // 6.2 блокируем саму сцену
  document.getElementById('scene').style.pointerEvents = 'none';

  // 6.3 Удаляем старую модалку (если была)
  const old = document.getElementById('completionModal');
  if (old) old.remove();

  // 6.4 Создаём новый контейнер
  const wrap = document.createElement('div');
  wrap.id = 'completionModal';

  // 6.5 Добавляем overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  wrap.appendChild(overlay);

  // 6.6 Создаём контент
  const modal = document.createElement('div');
  modal.className = 'modal-content';

  const title = document.createElement('h2');
  title.textContent = 'Level Complete!';
  modal.appendChild(title);

  const msg = document.createElement('p');
  msg.textContent = `You finished in ${elapsed} second${elapsed !== 1 ? 's' : ''}.`;
  modal.appendChild(msg);

  const buttons = document.createElement('div');
  buttons.className = 'modal-buttons';

  const retryBtn = document.createElement('button');
  retryBtn.textContent = 'Retry';
  buttons.appendChild(retryBtn);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next Level';
  buttons.appendChild(nextBtn);

  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back to Levels';
  buttons.appendChild(backBtn);

  modal.appendChild(buttons);
  wrap.appendChild(modal);

  // 6.7 Вешаем слушатели **до** добавления в DOM
  retryBtn.addEventListener('click', () => window.location.reload());
  backBtn.addEventListener('click', () => window.location.href = 'levels.html');
  nextBtn.addEventListener('click', () => {
    const next = parseInt(level, 10) + 1;
    if (next > MAX_LEVEL) {
      showFinalAchievement();
      setTimeout(() => window.location.href = 'levels.html', 1500);
    } else {
      window.location.href = `panorama.html?level=${next}`;
    }
  });

  // 6.8 Вставляем в документ
  document.body.appendChild(wrap);

  // 6.9 Показ ачивки уровня
  showAchievement(`Level ${level} Complete!`);
}

// 7) Таймер
let startTime, timerId;
function startTimer() {
  startTime = Date.now();
  const el = document.getElementById('levelTimer');
  timerId = setInterval(() => {
    const secs = Math.floor((Date.now() - startTime) / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    el.textContent = `${mm}:${ss}`;
  }, 200);
}

// 8) Инициализация уровня
function initLevel() {
  document.getElementById('sky')
          .setAttribute('src', `assets/panorama${level}.jpg`);
  startTimer();
  document.getElementById('hotspot1')
    .addEventListener('click', () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      showCompletion(elapsed);
    });
}

// 9) Старт
if (document.readyState === 'complete') {
  initLevel();
} else {
  window.addEventListener('load', initLevel);
}
