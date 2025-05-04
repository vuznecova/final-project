document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const noProgressEl        = document.getElementById("no-progress");
  const progressContent     = document.getElementById("progress-content");
  const numEl               = document.querySelector(".overview-card .num");
  const ofEl                = document.querySelector(".overview-card .of");
  const ring                = document.querySelector(".overview-card .ring");
  const attemptsList        = document.querySelector(".attempts-list");
  const achievementsSection = document.getElementById("achievements-section");
  const achievementsGrid    = document.querySelector(".achievements-grid");

  // === 1. Прогресс ===
  try {
    const res = await fetch("/api/progress", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const progress = await res.json();

    const hasProgress = progress && progress.length > 0;

    noProgressEl.hidden        = hasProgress;
    progressContent.hidden     = !hasProgress;
    achievementsSection.hidden = !hasProgress;

    if (hasProgress) {
      const totalLevels = 6;
      const completed   = new Set(progress.map(p => p.level)).size;

      numEl.textContent = completed;
      ofEl.textContent  = `out of ${totalLevels}`;

      const radius        = ring.r.baseVal.value;
      const circumference = 2 * Math.PI * radius;
      ring.style.strokeDasharray  = `${circumference}`;
      ring.style.strokeDashoffset = `${circumference - (completed / totalLevels) * circumference}`;

      attemptsList.innerHTML = "";
      progress
        .filter(p => p.completed_at)
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 5)
        .forEach(p => {
          const li = document.createElement("li");
          li.textContent = `🏆 Level ${p.level} — ${p.time_taken}s`;
          attemptsList.appendChild(li);
        });
    }
  } catch (err) {
    console.error("Failed to load progress:", err);
    noProgressEl.hidden        = false;
    progressContent.hidden     = true;
    achievementsSection.hidden = true;
  }

  // === 2. Ачивки ===
  try {
    const res = await fetch("/api/progress/achievements", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    });

    if (res.status === 304) {
      console.info("Achievements not modified — skipping update.");
      return;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid JSON response");
    }

    const achievements = await res.json();

    achievementsGrid.innerHTML = "";
    achievements.forEach(a => {
      const card = document.createElement("div");
      card.className = "achievement-card";
      card.innerHTML = `
        <img src="${a.icon_path}" alt="${a.name}" />
        <h3>${a.name}</h3>
        <p>${a.description}</p>
        <small>${new Date(a.awarded_at).toLocaleDateString()}</small>
      `;
      achievementsGrid.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load achievements:", err);
  }
});
