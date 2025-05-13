document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html?error=auth";
    return;
  }

  // Elements
  const noProgressEl = document.getElementById("no-progress");
  const progressEl   = document.getElementById("progress-content");
  const numEl        = document.querySelector(".overview-card .num");
  const ofEl         = document.querySelector(".overview-card .of");
  const ring         = document.querySelector(".overview-card .ring");
  const attemptsList = document.querySelector(".attempts-list");
  const achSection   = document.getElementById("achievements-section");
  const achGrid      = document.querySelector(".achievements-grid");

  try {
    // 1. Fetch progress
    const res = await fetch("/api/progress", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const progress = await res.json();

    const hasProgress = progress.length > 0;
    noProgressEl.hidden        = hasProgress;
    progressEl.hidden          = !hasProgress;
    achSection.hidden          = !hasProgress;

    if (hasProgress) {
      // 2. Overview
      const totalLevels = 6;
      const completed   = new Set(progress.map(p => p.level)).size;
      numEl.textContent = completed;
      ofEl.textContent  = `out of ${totalLevels}`;

      // Draw circle
      const radius        = ring.r.baseVal.value;
      const circumference = 2 * Math.PI * radius;
      ring.style.strokeDasharray  = `${circumference}`;
      ring.style.strokeDashoffset = 
        `${circumference - (completed / totalLevels) * circumference}`;

      // 3. Recent attempts (up to 5), include anxiety rating
      attemptsList.innerHTML = "";
      progress
        .filter(p => p.completed_at)
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 5)
        .forEach(p => {
          const li = document.createElement("li");
          li.textContent = 
            `🏆 Level ${p.level} — ${p.time_taken}s — 😰 ${p.anxiety_rating}/10`;
          attemptsList.appendChild(li);
        });
    }
  } catch (err) {
    console.error("Failed to load progress:", err);
    noProgressEl.hidden        = false;
    progressEl.hidden          = true;
    achSection.hidden          = true;
  }

  // ===== Achievements (unchanged) =====
  try {
    const res = await fetch("/api/progress/achievements", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    });
    if (res.status === 304) return;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const achievements = await res.json();

    achGrid.innerHTML = "";
    achievements.forEach(a => {
      const card = document.createElement("div");
      card.className = "achievement-card";
      card.innerHTML = `
        <img src="${a.icon_path}" alt="${a.name}" />
        <h3>${a.name}</h3>
        <p>${a.description}</p>
        <small>${new Date(a.awarded_at).toLocaleDateString()}</small>
      `;
      achGrid.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load achievements:", err);
  }
});
