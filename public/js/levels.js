document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const cards = document.querySelectorAll('.level');

  function lockAll(msg) {
    cards.forEach(el => {
      el.classList.add('locked');
      el.style.opacity = '0.5';
      el.style.pointerEvents = 'none';
      const link = el.querySelector('a');
      if (link) link.remove();
      const ov = document.createElement('div');
      ov.className = 'lock-overlay';
      ov.innerHTML = `
        <img src="assets/icons/lock.png" alt="Locked" />
        <span>${msg}</span>
      `;
      el.appendChild(ov);
    });
  }

  if (!token) {
    lockAll('Login to access');
    return;
  }

  const unlocked = new Set([1]);

  try {
    const res = await fetch('/api/progress', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401) {
      lockAll('Login to access');
      return;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    data.forEach(({ level }) => {
      const lvl = Number(level);
      if (!isNaN(lvl)) {
        unlocked.add(lvl);
        if (lvl + 1 <= cards.length) unlocked.add(lvl + 1);
      }
    });
  } catch (err) {
    console.warn('[Levels] could not fetch progress, default to level 1 unlocked', err);
  }

  const maxUnlocked = Math.max(...unlocked);

  cards.forEach(el => {
    const lvl = Number(el.dataset.level);
    if (isNaN(lvl)) return;

    const link = el.querySelector('a');
    if (lvl > maxUnlocked) {
      el.classList.add('locked');
      el.style.opacity = '0.5';
      el.style.pointerEvents = 'none';
      if (link) link.remove();

      const ov = document.createElement('div');
      ov.className = 'lock-overlay';
      ov.innerHTML = `
        <img src="assets/icons/lock.png" alt="Locked" />
        <span>Complete Level ${lvl - 1} to unlock</span>
      `;
      el.appendChild(ov);
    } else {
      if (link) {
        link.href = `panorama.html?level=${lvl}`;
      }
    }
  });
});
