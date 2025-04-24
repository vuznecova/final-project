// js/progress.js

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html?error=auth';
      return;
    }
  
    // 1. Запрос прогресса
    const res = await fetch('http://localhost:5000/api/progress', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      document.getElementById('progress-overview')
              .textContent = 'Could not load progress.';
      return;
    }
    const data = await res.json();
  
    // 2. Обзор: сколько уровней пройдено
    const levelsDone = new Set(data.map(d => d.level)).size;
    document.getElementById('progress-overview').textContent =
      `You have completed ${levelsDone} of 6 levels.`;
  
    // 3. Подготовка данных для графика
    const labels = data.map(d =>
      new Date(d.completed_at).toLocaleDateString()
    );
    const times  = data.map(d => d.time_taken);
  
    // 4. Рисуем линейный график
    const ctx = document.getElementById('progress-chart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Time Taken (seconds)',
          data: times,
          fill: false,
          tension: 0.3,
          borderWidth: 2,
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  });
  