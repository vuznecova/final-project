// js/carousel.js

document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.levels-track');
  const levels = Array.from(document.querySelectorAll('.level'));
  const arrowLeft = document.querySelector('.arrow.left');
  const arrowRight = document.querySelector('.arrow.right');

  // Индекс активной карточки
  let currentIndex = 0;

  // Ширина одной карточки и gap (заполним позже)
  let cardWidth = 0;
  let gap = 20; // Учтите, что в CSS у .levels-track будет gap: 20px

  function initCarousel() {
    if (levels.length === 0) return;

    // Предположим, что все карточки имеют одинаковую ширину
    cardWidth = levels[0].offsetWidth;
    updateCarousel();
  }

  function updateCarousel() {
    const total = levels.length;

    // Ограничиваем currentIndex
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex > total - 1) currentIndex = total - 1;

    // Рассчитываем, на сколько сместить "трек"
    // Простейший вариант: сдвигаем так, чтобы карточка currentIndex была в центре
    // offset = (cardWidth + gap) * currentIndex - (половина ширины контейнера)
    // Но для упрощения возьмём формулу (cardWidth+gap)*currentIndex - некий offset
    // Можно улучшать под нужный дизайн

    const offset = (cardWidth + gap) * currentIndex;
    track.style.transform = `translateX(-${offset}px)`;

    // Снимаем классы со всех
    levels.forEach(level => {
      level.classList.remove('active', 'side-left', 'side-right');
    });

    // Назначаем .active текущей карточке
    levels[currentIndex].classList.add('active');

    // Левую и правую приглушаем меньше
    if (levels[currentIndex - 1]) {
      levels[currentIndex - 1].classList.add('side-left');
    }
    if (levels[currentIndex + 1]) {
      levels[currentIndex + 1].classList.add('side-right');
    }
  }

  // Обработчики стрелок
  arrowLeft.addEventListener('click', () => {
    currentIndex--;
    updateCarousel();
  });

  arrowRight.addEventListener('click', () => {
    currentIndex++;
    updateCarousel();
  });

  // Инициализируем после загрузки
  initCarousel();

  // Пересчитываем при ресайзе
  window.addEventListener('resize', initCarousel);

  console.log("JS файл загрузился!");
arrowLeft.addEventListener('click', () => {
  console.log("Нажата стрелка влево");
});
});
