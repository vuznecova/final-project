// js/panorama.js

// Функция для получения параметров из URL
function getParameterByName(name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var url = window.location.href;
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
  
  // Получаем уровень из URL, если его нет — по умолчанию 1
  const level = getParameterByName('level') || '1';
  
  // Определяем, какое изображение загружать для каждого уровня
  let panoramaSrc;
  switch (level) {
    case '1':
      panoramaSrc = 'assets/panorama1.jpg';
      break;
    case '2':
      panoramaSrc = 'assets/panorama2.jpg';
      break;
    case '3':
      panoramaSrc = 'assets/panorama3.jpg';
      break;
    default:
      panoramaSrc = 'assets/panorama1.jpg';
  }
  
  const skyEl = document.getElementById('sky');
  skyEl.setAttribute('src', panoramaSrc);
  