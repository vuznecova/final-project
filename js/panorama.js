// js/panorama.js

// -----------------------------
// 1. Получение параметра level из URL
// -----------------------------
function getParameterByName(name) {
  name = name.replace(/[\[\]]/g, '\\$&');
  const url = window.location.href;
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const level = getParameterByName('level') || '1';

// -----------------------------
// 2. Выбор изображения панорамы
// -----------------------------
let panoramaSrc;
switch (level) {
  case '1':
    panoramaSrc = 'assets/panorama1.jpg';
    break;
  case '2':
    panoramaSrc = 'assets/panorama2.jpg';
    break;
  case '3':
    panoramaSrc = 'assets/panorama3.jpg';
    break;
  default:
    panoramaSrc = 'assets/panorama1.jpg';
}

// -----------------------------
// 3. Основная инициализация после загрузки страницы
// -----------------------------
window.addEventListener('load', () => {
  console.log('[panorama.js] window.onload fired');

  // 3.1 Устанавливаем фон
  const skyEl = document.getElementById('sky');
  skyEl.setAttribute('src', panoramaSrc);

  // 3.2 Запускаем таймер
  const timerElem = document.getElementById('levelTimer');
  const startTime = Date.now();
  const timerInterval = setInterval(() => {
    const diff = Date.now() - startTime;
    const secs = Math.floor(diff / 1000) % 60;
    const mins = Math.floor(diff / 60000);
    timerElem.textContent =
      String(mins).padStart(2, '0') + ':' +
      String(secs).padStart(2, '0');
  }, 500);

  // 3.3 Ждём, когда сцена будет готова
  const sceneEl = document.querySelector('a-scene');
  if (sceneEl.hasLoaded) {
    initHotspot();
  } else {
    sceneEl.addEventListener('loaded', initHotspot);
  }

  // 3.4 Функция инициализации клика по hotspot
  function initHotspot() {
    console.log('[panorama.js] a-scene loaded');
    const hotspot1 = document.getElementById('hotspot1');
    console.log('[panorama.js] hotspot1 =', hotspot1);
    hotspot1.addEventListener('click', () => {
      console.log('[panorama.js] hotspot clicked hotspot1');
      clearInterval(timerInterval);
      const totalSec = Math.floor((Date.now() - startTime) / 1000);
      console.log(`[panorama.js] Level done in ${totalSec} seconds`);
      showLevelCompleteModal(totalSec);
    });
  }
});

// -----------------------------
// 4. Показываем модалку завершения уровня
// -----------------------------
function showLevelCompleteModal(totalSec) {
  // Создаём оверлей
  const overlay = document.createElement('div');
  overlay.className = 'level-overlay';
  overlay.innerHTML = `
    <div class="level-modal">
      <h2>Level Complete!</h2>
      <p>You finished in ${totalSec} second${totalSec !== 1 ? 's' : ''}.</p>
      <button id="retryBtn">Retry</button>
      <button id="nextBtn">Next Level</button>
      <button id="backBtn">Back to Levels</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Привязываем кнопки
  overlay.querySelector('#retryBtn').addEventListener('click', () => {
    window.location.reload();
  });
  overlay.querySelector('#nextBtn').addEventListener('click', () => {
    const url = new URL(window.location.href);
    const lvl = parseInt(url.searchParams.get('level') || '1', 10);
    url.searchParams.set('level', lvl + 1);
    window.location.href = url.toString();
  });
  overlay.querySelector('#backBtn').addEventListener('click', () => {
    window.location.href = 'levels.html';
  });
}
