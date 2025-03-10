// js/progress.js

// Функция для загрузки истории уровня тревоги из LocalStorage
function loadProgress() {
    let anxietyData = JSON.parse(localStorage.getItem('anxietyData')) || [];
    const progressDiv = document.getElementById('progress-data');
    
    if (anxietyData.length === 0) {
      progressDiv.innerHTML = "<p>Нет данных. Начните терапию, чтобы отслеживать прогресс.</p>";
      return;
    }
    
    let html = '<ul>';
    anxietyData.forEach(item => {
      html += `<li>${new Date(item.timestamp).toLocaleString()}: Уровень тревоги - ${item.level}</li>`;
    });
    html += '</ul>';
    
    progressDiv.innerHTML = html;
  }
  
  document.addEventListener('DOMContentLoaded', loadProgress);
  