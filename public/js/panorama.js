// public/js/panorama.js

// Максимальный номер уровня
const MAX_LEVEL = 6;
// Флаг, что Eagle Eye уже получена
let eagleUnlocked = false;

// Утилита: градусы → радианы
const deg2rad = d => (d * Math.PI) / 180;

// Извлечь ?level из URL
function getParam(name) {
  const re = new RegExp('[?&]' + name + '=([^&#]*)');
  const m  = re.exec(window.location.search);
  return m ? +m[1] : null;
}
const level = getParam('level') || 1;

// UI-элементы
const backBtn   = document.getElementById('backBtn');
const totalEl   = document.getElementById('totalObjects');
const countEl   = document.getElementById('progressCount');
const fillEl    = document.getElementById('progressFill');
const timerEl   = document.getElementById('levelTimer');

let total, found, startTime, timerId, hintTimeout;
let chosenAnxiety = 0;

// Звуки
const clickSound   = new Audio('assets/click.mp3');
const successSound = new Audio('assets/success.mp3');

// Метаданные ачивок
const LEVEL_ACH = {
  1: { name: 'Rookie Climber',    icon: 'assets/achiv/lvl1.png' },
  2: { name: 'Altitude Adapter',  icon: 'assets/achiv/lvl2.png' },
  3: { name: 'Confident Ascent',  icon: 'assets/achiv/lvl3.png' },
  4: { name: 'Peak Conqueror',    icon: 'assets/achiv/lvl4.png' },
  5: { name: 'Final Push',        icon: 'assets/achiv/lvl5.png' },
  6: { name: 'Master of Heights', icon: 'assets/achiv/lvl6.png' }
};
const SPEED_ACH = { name: 'Lightning Finisher', icon: 'assets/achiv/speed_runner.png' };
const CALM_ACH  = { name: 'Serenity Seeker',    icon: 'assets/achiv/calm_climber.png' };
const EAGLE_ACH = { name: 'Eagle Eye',          icon: 'assets/achiv/eagle_eye.png' };

// При старте проверяем, нет ли уже в профиле ачивки Eagle Eye
async function fetchAchievements() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch('/api/progress/achievements', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      const data = await res.json();
      // если среди юзер-ачивок есть код 'eagle_eye' — больше не показываем popup
      if (data.some(a => a.code === 'eagle_eye')) {
        eagleUnlocked = true;
      }
    }
  } catch (err) {
    console.warn('Не удалось получить уже открытые ачивки', err);
  }
}

// Запускаем всё, когда DOM и A-Frame загрузились
window.addEventListener('load', async () => {
  await fetchAchievements();

  // Устанавливаем 360°-панораму
  document.getElementById('skyEl')
          .setAttribute('src', `assets/lvl${level}.jpg`);

  // Инициализируем прогресс
  total = 2 + level;
  totalEl.textContent = total;
  countEl.textContent = `0 / ${total}`;
  fillEl.style.width = '0%';

  backBtn.onclick = () => location.href = 'levels.html';

  document.querySelector('a-cursor')
          .setAttribute('raycaster', 'objects: .click-target');

  startTimer();
  placeTargets();
});


// ========================
//       ТАЙМЕР
// ========================
function startTimer() {
  startTime = Date.now();
  timerEl.textContent = '00:00';
  timerId = setInterval(() => {
    const s  = Math.floor((Date.now() - startTime) / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2,'0');
    const ss = String(s % 60).padStart(2,'0');
    timerEl.textContent = `${mm}:${ss}`;
  }, 300);
}


// ========================
//   Сохранить прогресс
// ========================
async function saveProgress(timeTaken, anxiety = null) {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({
        level,
        time_taken:     timeTaken,
        anxiety_rating: anxiety
      })
    });
  } catch (err) {
    console.error('Failed to save progress', err);
  }
}


// ========================
//   Открыть ачивку
// ========================
async function unlockAchievement(key, meta) {
  const token = localStorage.getItem('token');
  if (token) {
    await fetch('/api/achievements/unlock', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ key })
    });
  }
  showAchievement(meta.name, meta.icon);
}

function showAchievement(text, iconUrl) {
  const el = document.createElement('div');
  el.className = 'achievement';
  el.innerHTML = `
    <img src="${iconUrl}" alt="">
    <div class="achievement-text">
      <span class="achievement-prefix">Achievement Get!</span>
      <span class="achievement-title">${text}</span>
    </div>
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}


// ========================
//   Модалка завершения
// ========================
function showCompletion(elapsed) {
  clearInterval(timerId);
  clearTimeout(hintTimeout);
  document.getElementById('scene').style.pointerEvents = 'none';

  const wrap = document.createElement('div');
  wrap.id = 'completionModal';
  wrap.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <h2>Level Complete!</h2>
      <p>You finished in ${elapsed} second${elapsed!==1?'s':''}.</p>
      <p>Rate your anxiety:</p>
      <div id="anxietyRating" class="anxiety-rating"></div>
      <div class="modal-buttons">
        <button id="retryBtn">Retry</button>
        ${ level < MAX_LEVEL ? '<button id="nextBtn">Next Level</button>' : '' }
        <button id="backBtnModal">Back to Levels</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  document.getElementById('retryBtn').onclick = () => location.reload();

  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    nextBtn.onclick = async () => {
      await saveProgress(elapsed, chosenAnxiety);
      if (chosenAnxiety <= 3) unlockAchievement('calm_climber', CALM_ACH);
      location.href = `panorama.html?level=${level+1}`;
    };
  }

  document.getElementById('backBtnModal').onclick = async () => {
    await saveProgress(elapsed, chosenAnxiety);
    if (chosenAnxiety <= 3) unlockAchievement('calm_climber', CALM_ACH);
    location.href = 'levels.html';
  };

  initAnxietyRating();
}


// ========================
//   Рейтинг тревожности
// ========================
function initAnxietyRating() {
  const container = document.getElementById('anxietyRating');
  container.innerHTML = '';
  chosenAnxiety = 0;

  for (let i = 1; i <= 10; i++) {
    const c = document.createElement('div');
    c.className = 'circle';
    c.dataset.value = i;
    container.appendChild(c);
  }
  const circles = Array.from(container.children);

  function refresh(n) {
    circles.forEach((c, idx) => {
      c.classList.toggle('hover', idx < n);
      c.classList.toggle('sel',   idx < chosenAnxiety);
    });
  }

  circles.forEach((c, idx) => {
    c.addEventListener('mouseover', () => refresh(idx+1));
    c.addEventListener('mouseout',  () => refresh(0));
    c.addEventListener('click',     () => {
      chosenAnxiety = idx+1;
      refresh(chosenAnxiety);
      if (chosenAnxiety <= 3) unlockAchievement('calm_climber', CALM_ACH);
    });
  });
}


// ========================
//   Расставляем цели
// ========================
function placeTargets() {
  const scene = document.querySelector('a-scene');
  found = 0;
  countEl.textContent = `0 / ${total}`;
  fillEl.style.width  = '0%';
  clearTimeout(hintTimeout);

  const colors = ['#e78ba8','#a8d0e6','#f7a072','#c3e47d','#e6c3d8'];
  const shapes = ['circle','square','triangle'];
  const baseSize = Math.max(1.5 - level*0.2, 0.6);

  for (let i = 0; i < total; i++) {
    const color = colors[Math.floor(Math.random()*colors.length)];
    const shape = shapes[Math.floor(Math.random()*shapes.length)];
    let geo = '';

    if (shape === 'circle') {
      geo = `primitive: circle; radius: ${baseSize}`;
    } else if (shape === 'square') {
      geo = `primitive: plane; width: ${baseSize*2}; height: ${baseSize*2}`;
    } else {
      const h = baseSize*Math.sqrt(3);
      geo = `
        primitive: triangle;
        vertexA: 0 ${h/2} 0;
        vertexB: -${baseSize} -${h/2} 0;
        vertexC: ${baseSize} -${h/2} 0
      `;
    }

    const ent = document.createElement('a-entity');
    ent.setAttribute('geometry', geo.trim());
    ent.setAttribute('material',
      `shader:flat; side:double; color:${color}; opacity:0.85`
    );

    // Распределение по сфере
    const θ = deg2rad(Math.random()*360);
    const φ = deg2rad(Math.random()*160 - 80);
    const d = 30 + (Math.random()*10 - 5);
    const x = d * Math.cos(φ)*Math.sin(θ);
    const y = d * Math.sin(φ);
    const z = -d * Math.cos(φ)*Math.cos(θ);
    ent.setAttribute('position', `${x} ${y} ${z}`);

    ent.setAttribute('look-at', '[camera]');
    ent.classList.add('click-target');

    ent.addEventListener('click', () => {
      clickSound.play();
      ent.remove();
      found++;
      countEl.textContent = `${found} / ${total}`;
      fillEl.style.width = `${Math.round(found/total*100)}%`;
      resetHint();

      // Eagle Eye: первые 3 цели за ≤15 секунд (только один раз)
      const elapsedSec = (Date.now() - startTime) / 1000;
      if (found === 3 && elapsedSec <= 15 && !eagleUnlocked) {
        eagleUnlocked = true;
        unlockAchievement('eagle_eye', EAGLE_ACH);
      }

      if (found === total) {
        successSound.play();
        const elapsed = Math.floor((Date.now() - startTime)/1000);
        showCompletion(elapsed);
      }
    });

    scene.appendChild(ent);
  }

  resetHint();
}

// Подсказка: подсветить одну случайную цель
function resetHint() {
  clearTimeout(hintTimeout);
  hintTimeout = setTimeout(() => {
    const rem = document.querySelectorAll('.click-target');
    if (!rem.length) return;
    const pick = rem[Math.floor(Math.random()*rem.length)];
    const orig = pick.getAttribute('material').match(/color:\s*([^;]+)/)[1];
    pick.setAttribute('material', `shader:flat; side:double; color:#ff0; opacity:0.85`);
    setTimeout(()=> pick.setAttribute('material', `shader:flat; side:double; color:${orig}; opacity:0.85`), 2000);
  }, 10000);
}
