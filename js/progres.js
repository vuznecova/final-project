// js/progress.js

// Максимальное число уровней
const MAX_LEVEL = 6;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Проверяем авторизацию
  const token = localStorage.getItem('token');
  if (!token) {
    // если нет токена — перенаправляем на логин
    window.location.href = 'login.html?error=auth';
    return;
  }

  let data;
  // 2. Запрашиваем прогресс с сервера
  try {
    const res = await fetch('http://localhost:5000/api/progress', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
  } catch (err) {
    console.error('Could not load progress:', err);
    document.getElementById('progress-overview')
            .textContent = 'Could not load progress.';
    return;
  }

  // 3. Если записей нет — показываем empty-state и выходим
  if (!data || data.length === 0) {
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('progress-content').classList.add('hidden');
    return;
  }

  // 4. Иначе рендерим обзор: сколько уровней пройдено
  const levelsDone = new Set(data.map(d => d.level)).size;
  document.getElementById('progress-overview').textContent =
    `You have completed ${levelsDone} of ${MAX_LEVEL} levels.`;

  // 5. Список последних 3 попыток
  const recent = data
    .slice()
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 3);

  const ul = document.getElementById('attempts-list');
  recent.forEach(item => {
    const date = new Date(item.completed_at)
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    const li = document.createElement('li');
    li.textContent = `Level ${item.level}: ${item.time_taken}s on ${date}`;
    ul.appendChild(li);
  });

  // 6. Линейный график динамики времени
  // Сортируем записи от oldest → newest
  const sorted = data
    .slice()
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

  const labels = sorted.map(d =>
    new Date(d.completed_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  );
  const times = sorted.map(d => d.time_taken);

  const ctx = document.getElementById('progress-chart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Time Taken (s)',
        data: times,
        fill: false,
        tension: 0.3,
        borderWidth: 2
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
});
