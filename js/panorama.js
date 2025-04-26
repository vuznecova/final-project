// js/panorama.js

// ===== 1) Получаем параметр ?level=X из URL
function getParam(name) {
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const res = regex.exec(location.href);
  if (!res) return null;
  if (!res[2]) return '';
  return decodeURIComponent(res[2].replace(/\+/g, ' '));
}
const level = getParam('level') || '1';

// ===== 2) Ставим нужную панораму
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sky')
          .setAttribute('src', `assets/panorama${level}.jpg`);
});

// ===== 3) Таймер
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

// ===== 4) Всплывающая ачивка
function showAchievement(text, iconUrl) {
  const ach = document.createElement('div');
  ach.className = 'achievement';
  ach.innerHTML = `<img src="${iconUrl}" alt=""><span>${text}</span>`;
  // позиционируем над сценой
  ach.style.position = 'fixed';
  ach.style.top = '20px';
  ach.style.right = '20px';
  ach.style.zIndex = '10000';
  document.body.appendChild(ach);
  // анимация
  setTimeout(() => ach.classList.add('show'), 50);
  setTimeout(() => {
    ach.classList.remove('show');
    setTimeout(() => ach.remove(), 500);
  }, 3500);
}

// ===== 5) Модальное окно завершения уровня
function showCompletion(elapsed) {
  clearInterval(timerId);

  // блокируем клики по сцене
  document.getElementById('scene').style.pointerEvents = 'none';

  // создаём обёртку модалки
  const wrap = document.createElement('div');
  wrap.id = 'completionModal';
  Object.assign(wrap.style, {
    position: 'fixed',
    top: 0, left: 0, width: '100%', height: '100%',
    zIndex: 9999,
  });

  wrap.innerHTML = `
    <div class="modal-overlay" style="
      position: absolute;
      top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.5);
    "></div>
    <div class="modal-content" style="
      position: absolute;
      top:50%; left:50%;
      transform: translate(-50%,-50%);
      background:#fff;
      padding:30px;
      border-radius:8px;
      text-align:center;
    ">
      <h2>Level Complete!</h2>
      <p>You finished in ${elapsed} second${elapsed !== 1 ? 's' : ''}.</p>
      <div class="modal-buttons" style="margin-top:20px;">
        <button id="retryBtn" style="margin:0 8px;">Retry</button>
        <button id="nextBtn" style="margin:0 8px;">Next Level</button>
        <button id="backBtn" style="margin:0 8px;">Back to Levels</button>
      </div>
    </div>
  `;

  document.body.appendChild(wrap);

  // делаем кнопки рабочими
  document.getElementById('retryBtn').onclick = () => window.location.reload();
  document.getElementById('nextBtn').onclick = () => {
    const next = parseInt(level, 10) + 1;
    window.location.href = `panorama.html?level=${next}`;
  };
  document.getElementById('backBtn').onclick = () => {
    window.location.href = 'levels.html';
  };

  // и показываем ачивку
  showAchievement(`Level ${level} Complete!`, 'assets/icons/achv1.png');
}

// ===== 6) Старт уровня: таймер + обработчик клика по шарику
function initLevel() {
  startTimer();
  const hot = document.getElementById('hotspot1');
  hot.addEventListener('click', () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    showCompletion(elapsed);
  });
}

// ждём полной загрузки
if (document.readyState === 'complete') {
  initLevel();
} else {
  window.addEventListener('load', initLevel);
}
