// js/main.js

// Функция для переключения источника панорамы
function changePanorama(src) {
    const skyEl = document.querySelector('#sky');
    skyEl.setAttribute('src', src);
    console.log('Панорама изменена на: ' + src);
  }
  
  // Обработка нажатий на кнопки меню для смены панорамы
  document.querySelectorAll('.panorama-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const newSrc = e.target.getAttribute('data-src');
      changePanorama(newSrc);
    });
  });
  
  // Обработка изменения значения слайдера тревоги
  const anxietyRange = document.getElementById('anxietyRange');
  const anxietyValue = document.getElementById('anxietyValue');
  
  anxietyRange.addEventListener('input', (e) => {
    anxietyValue.textContent = e.target.value;
    // Здесь можно сохранить значение в LocalStorage или отправить на сервер
    console.log('Уровень тревоги: ' + e.target.value);
  });
  
  // Пример обработки клика по горячей точке
  const hotspot = document.getElementById('hotspot1');
  hotspot.addEventListener('click', () => {
    // Например, переключим панораму на другую при клике по горячей точке
    changePanorama('assets/panorama2.jpg');
  });
  
  // Сохранение уровня тревоги в LocalStorage
function saveAnxietyLevel(level) {
    // Получаем текущую дату и время
    const timestamp = new Date().toISOString();
    // Сохраняем данные в формате JSON
    let anxietyData = JSON.parse(localStorage.getItem('anxietyData')) || [];
    anxietyData.push({ level, timestamp });
    localStorage.setItem('anxietyData', JSON.stringify(anxietyData));
    console.log('Данные сохранены:', anxietyData);
  }
  
  anxietyRange.addEventListener('change', (e) => {
    saveAnxietyLevel(e.target.value);
  });
  