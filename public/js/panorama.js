// public/js/panorama.js

// 1) Константа максимального числа уровней
const MAX_LEVEL = 6;

// 2) Получаем параметр ?level=X из URL
function getParam(name) {
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const res = regex.exec(location.href);
  if (!res) return null;
  if (!res[2]) return '';
  return decodeURIComponent(res[2].replace(/\+/g, ' '));
}
const level = getParam('level') || '1';

// 3) Устанавливаем нужную панораму
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sky')
          .setAttribute('src', `assets/panorama${level}.jpg`);
});

// 4) Таймер
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

// 5) Ачивка «pop-up»
function showAchievement(text, iconUrl) {
  const ach = document.createElement('div');
  ach.className = 'achievement';
  ach.innerHTML = `<img src="${iconUrl}" alt=""><span>${text}</span>`;
  document.getElementById('ui-container').appendChild(ach);
  setTimeout(() => ach.classList.add('show'), 50);
  setTimeout(() => {
    ach.classList.remove('show');
    setTimeout(() => ach.remove(), 500);
  }, 3500);
}

// 6) Ачивка «Master of Heights» за полное прохождение
function showFinalAchievement() {
  showAchievement('Master of Heights!', 'assets/icons/achv_master.png');
}

// ————————————————————————————————————————————————————————————————
// Вспомогательная функция: сохраняет прогресс на сервере
async function saveProgress(elapsed) {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        level:      parseInt(level, 10),
        time_taken: elapsed
      })
    });
  } catch (err) {
    console.error('[Panorama] Failed to save progress:', err);
  }
}
// ————————————————————————————————————————————————————————————————

// 7) Модальное окно завершения уровня
function showCompletion(elapsed) {
  clearInterval(timerId);
  document.getElementById('scene').style.pointerEvents = 'none';

  // Сохраняем на сервере (не ждем ответа, просто отправляем)
  saveProgress(elapsed);

  const wrap = document.createElement('div');
  wrap.id = 'completionModal';
  Object.assign(wrap.style, {
    position: 'fixed',
    top: 0, left: 0, width: '100%', height: '100%',
    zIndex: 9999,
  });
  wrap.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <h2>Level Complete!</h2>
      <p>You finished in ${elapsed} second${elapsed !== 1 ? 's' : ''}.</p>
      <div class="modal-buttons">
        <button id="retryBtn">Retry</button>
        <button id="nextBtn">Next Level</button>
        <button id="backBtn">Back to Levels</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  document.getElementById('retryBtn').onclick = () => window.location.reload();

  document.getElementById('nextBtn').onclick = () => {
    const next = parseInt(level, 10) + 1;
    if (next > MAX_LEVEL) {
      showFinalAchievement();
      setTimeout(() => {
        window.location.href = `levels.html?_=${Date.now()}`;
      }, 1500);
    } else {
      window.location.href = `panorama.html?level=${next}`;
    }
  };

  document.getElementById('backBtn').onclick = () => {
    window.location.href = `levels.html?_=${Date.now()}`;
  };

  showAchievement(`Level ${level} Complete!`, 'assets/icons/achv1.png');
}

// 8) Инициализация уровня: старт таймера + обработка клика
function initLevel() {
  startTimer();
  const hot = document.getElementById('hotspot1');
  hot.addEventListener('click', () => {
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
