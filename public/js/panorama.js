// panorama.js — полный файл с актуальной логикой

const MAX_LEVEL = 6;
let achievementsMap = {};

const deg2rad = d => (d * Math.PI) / 180;

function getParam(name) {
  const re = new RegExp('[?&]' + name + '=([^&#]*)');
  const m  = re.exec(window.location.search);
  return m ? +m[1] : null;
}
const level = getParam('level') || 1;

const backBtn   = document.getElementById('backBtn');
const totalEl   = document.getElementById('totalObjects');
const countEl   = document.getElementById('progressCount');
const fillEl    = document.getElementById('progressFill');
const timerEl   = document.getElementById('levelTimer');

let total, found, startTime, timerId, hintTimeout;
let chosenAnxiety = 0;
let firstObjectTime = null;

const clickSound   = new Audio('assets/click.mp3');
const successSound = new Audio('assets/success.mp3');

async function fetchAchievements() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch('/api/progress/achievements', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      const data = await res.json();
      data.forEach(a => {
        achievementsMap[a.code] = {
          name: a.name,
          icon: a.icon_path,
          awarded: true
        };
      });
    }
  } catch (err) {
    console.warn('Не удалось загрузить достижения', err);
  }
}

async function unlockAchievement(key) {
  const token = localStorage.getItem('token');

  if (!achievementsMap[key]) {
    achievementsMap[key] = { awarded: false };
  }
  if (achievementsMap[key].awarded) return;

  if (token) {
    await fetch('/api/achievements/unlock', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key })
    });
  }

  const meta = achievementsMap[key];
  meta.awarded = true;
  showAchievement(meta.name || key, meta.icon || '');
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

function checkAchievementsOnFinish(elapsed) {
  unlockAchievement(`lvl${level}_complete`);
  if (firstObjectTime && firstObjectTime <= 5) unlockAchievement('eagle_eye');
  if (elapsed <= 20) unlockAchievement('speed_runner');
  if (chosenAnxiety <= 3 && chosenAnxiety > 0) unlockAchievement('calm_climber');
}

async function saveProgress(elapsed, anxiety) {
  const token = localStorage.getItem('token');
  if (!token) return;
  await fetch('/api/progress', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      level,
      time_taken: elapsed,
      anxiety_rating: anxiety
    })
  });
}

function showCompletion(elapsed) {
  clearInterval(timerId);
  clearTimeout(hintTimeout);
  document.getElementById('scene').style.pointerEvents = 'none';

  checkAchievementsOnFinish(elapsed);

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
      <p id="anxietyWarning" style="color:red; font-size:0.9em; display:none;">Please rate your anxiety before continuing.</p>
    </div>`;
  document.body.appendChild(wrap);

  document.getElementById('retryBtn').onclick = () => location.reload();

  const requireAnxiety = async (cb) => {
    const warning = document.getElementById('anxietyWarning');
    if (chosenAnxiety === 0) {
      warning.style.display = 'block';
      return;
    }
    warning.style.display = 'none';
    await saveProgress(elapsed, chosenAnxiety);
    cb();
  };

  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    nextBtn.onclick = () => requireAnxiety(() => {
      location.href = `panorama.html?level=${level+1}`;
    });
  }

  document.getElementById('backBtnModal').onclick = () => requireAnxiety(() => {
    location.href = 'levels.html';
  });

  initAnxietyRating();
}

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
    });
  });
}

function placeTargets() {
  const scene = document.querySelector('a-scene');
  found = 0;
  firstObjectTime = null;
  total = 2 + level;
  countEl.textContent = `0 / ${total}`;
  fillEl.style.width = '0%';
  clearTimeout(hintTimeout);

  const colors = ['#e78ba8','#a8d0e6','#f7a072','#c3e47d','#e6c3d8'];
  const shapes = ['circle','square','triangle'];
  const baseSize = Math.max(1.5 - level * 0.2, 0.6);

  for (let i = 0; i < total; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    let geo = '';
    if (shape === 'circle') {
      geo = `primitive: circle; radius: ${baseSize}`;
    } else if (shape === 'square') {
      geo = `primitive: plane; width: ${baseSize*2}; height: ${baseSize*2}`;
    } else {
      const h = baseSize * Math.sqrt(3);
      geo = `primitive: triangle; vertexA: 0 ${h/2} 0; vertexB: -${baseSize} -${h/2} 0; vertexC: ${baseSize} -${h/2} 0`;
    }
    const ent = document.createElement('a-entity');
    ent.setAttribute('geometry', geo);
    ent.setAttribute('material', `shader: flat; side: double; color: ${color}; opacity: 0.85`);

    const θ = deg2rad(Math.random() * 360);
    const φ = deg2rad(Math.random() * 160 - 80);
    const d = 30 + (Math.random() * 10 - 5);
    const x = d * Math.cos(φ) * Math.sin(θ);
    const y = d * Math.sin(φ);
    const z = -d * Math.cos(φ) * Math.cos(θ);
    ent.setAttribute('position', `${x} ${y} ${z}`);
    ent.setAttribute('look-at', '[camera]');
    ent.classList.add('click-target');

    ent.addEventListener('click', () => {
      clickSound.play();
      ent.remove();
      found++;
      countEl.textContent = `${found} / ${total}`;
      fillEl.style.width = `${Math.round((found / total) * 100)}%`;
      if (found === 1) {
        firstObjectTime = (Date.now() - startTime) / 1000;
      }
      if (found === total) {
        successSound.play();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        showCompletion(elapsed);
      }
    });

    scene.appendChild(ent);
  }
}

window.addEventListener('load', async () => {
  await fetchAchievements();
  document.getElementById('skyEl')?.setAttribute('src', `assets/lvl${level}.jpg`);
  backBtn && (backBtn.onclick = () => location.href = 'levels.html');
  document.querySelector('a-cursor')?.setAttribute('raycaster', 'objects: .click-target');
  startTimer();
  placeTargets();
});
