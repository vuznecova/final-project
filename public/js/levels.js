// public/js/levels.js

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const cards = document.querySelectorAll('.level');

  // Универсальная функция, чтобы «заблокировать» все карточки
  function lockAll(msg) {
    cards.forEach(el => {
      el.classList.add('locked');
      el.style.opacity = '0.5';
      el.style.pointerEvents = 'none';
      // Убираем ссылку
      const link = el.querySelector('a');
      if (link) link.remove();
      // Добавляем декоративный оверлей
      const ov = document.createElement('div');
      ov.className = 'lock-overlay';
      ov.innerHTML = `
        <img src="assets/icons/lock.png" alt="Locked" />
        <span>${msg}</span>
      `;
      el.appendChild(ov);
    });
  }

  // 0) Если нет токена — показываем все заблокированными
  if (!token) {
    lockAll('Login to access');
    return;
  }

  // 1) Собираем set разблокированных уровней (1 всегда доступен)
  const unlocked = new Set([1]);

  // 2) Пытаемся получить прогресс с сервера
  try {
    const res = await fetch('/api/progress', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401) {
      // токен просрочен/неверен — снова блокируем все
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
        // следующий уровень тоже становится доступным
        if (lvl + 1 <= cards.length) unlocked.add(lvl + 1);
      }
    });
  } catch (err) {
    console.warn('[Levels] could not fetch progress, default to level 1 unlocked', err);
    // оставляем unlocked = {1}
  }

  // 3) Вычисляем максимальный доступный уровень
  const maxUnlocked = Math.max(...unlocked);

  // 4) Проходим по всем карточкам и либо блокируем, либо оставляем ссылку
  cards.forEach(el => {
    const lvl = Number(el.dataset.level);
    if (isNaN(lvl)) return;

    const link = el.querySelector('a');
    if (lvl > maxUnlocked) {
      // блокируем
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
      // оставляем рабочую ссылку
      if (link) {
        link.href = `panorama.html?level=${lvl}`;
      }
    }
  });
});
