// public/js/progress.js

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    // вместо login — на главную
    window.location.href = "index.html";
    return;
  }

  // === Найдём все нужные элементы ===
  const numEl      = document.querySelector(".overview-card .num");
  const ofEl       = document.querySelector(".overview-card .of");
  const ring       = document.querySelector(".overview-card .ring");
  const attemptsList   = document.querySelector(".attempts-list");
  const achievementsGrid = document.querySelector(".achievements-grid");

  const TOTAL_LEVELS = 6;
  let progressData = [];

  // === 1) Запрос прогресса ===
  try {
    const res = await fetch("/api/progress", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.status === 401) {
      window.location.href = "index.html";
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    progressData = await res.json();
  } catch (err) {
    console.error("Progress fetch error:", err);
  }

  // === 2) Overview: сколько уровней пройдено ===
  const levelsDone = new Set(progressData.map(d => d.level)).size;
  numEl.textContent = levelsDone;
  ofEl.textContent  = `out of ${TOTAL_LEVELS}`;

  // === 3) Анимация кольца ===
  if (ring) {
    const r = ring.r.baseVal.value;
    const c = 2 * Math.PI * r;
    ring.style.strokeDasharray  = c;
    ring.style.strokeDashoffset = c * (1 - levelsDone / TOTAL_LEVELS);
  }

  // === 4) Recent Attempts ===
  attemptsList.innerHTML = "";
  progressData.slice(-5).reverse().forEach(({ level, time_taken, completed_at }) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="icon">🏆</span>
      <span>Level ${level} — ${time_taken}s</span>
      <small>${new Date(completed_at).toLocaleDateString()}</small>
    `;
    attemptsList.append(li);
  });

  // === 5) Achievements ===
  let achData = [];
  try {
    const r2 = await fetch("/api/achievements", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (r2.ok) achData = await r2.json();
  } catch (err) {
    console.error("Achievements fetch error:", err);
  }
  achievementsGrid.innerHTML = "";
  achData.forEach(a => {
    const card = document.createElement("div");
    card.className = "achievement-card";
    card.innerHTML = `
      <img src="${a.icon_path}" alt="${a.name}">
      <h3>${a.name}</h3>
      <p>${a.description}</p>
      <small>${new Date(a.awarded_at).toLocaleDateString()}</small>
    `;
    achievementsGrid.append(card);
  });
});
