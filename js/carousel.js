/**
 * Простой скрипт для карусели.
 * При каждом клике на стрелку сдвигаем "ленту" на одну карточку вправо или влево.
 * Нет пустого места в конце, если видимых карточек меньше, чем общее количество.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Находим ключевые элементы
  const track = document.querySelector('.carousel-track');
  if (!track) return;  // Если на этой странице нет карусели, выходим

  const items = Array.from(track.querySelectorAll('.carousel-item'));
  const arrowLeft = document.querySelector('.arrow-left');
  const arrowRight = document.querySelector('.arrow-right');

  // Сколько карточек показывать одновременно (например, 3)
  // Если хотите показывать 1 карточку за раз, поставьте visibleCount = 1
  let visibleCount = 3;

  // Текущий «сдвиг» (в терминах индекса)
  let currentIndex = 0;

  // Ширина одной карточки + отступ (после инициализации)
  let itemWidth = 0;

  /**
   * Инициализация карусели: определяем реальную ширину одной карточки
   * (учитываем margin-right) и делаем начальный update.
   */
  function initCarousel() {
    if (items.length === 0) return;

    // Получаем стили первой карточки
    const itemStyle = window.getComputedStyle(items[0]);
    const marginRight = parseFloat(itemStyle.marginRight);

    // offsetWidth включает ширину + padding + border
    itemWidth = items[0].offsetWidth + marginRight;

    // Обновляем карусель (позицию трека, стрелки)
    updateCarousel();
  }

  /**
   * Обновляем сдвиг ленты (track) на основе currentIndex.
   * Не даём currentIndex выйти за границы, чтобы не было «пустого места» в конце.
   */
  function updateCarousel() {
    // Максимальный индекс = (кол-во карточек - видимых) (минимум 0)
    const maxIndex = Math.max(0, items.length - visibleCount);

    // Ограничиваем currentIndex
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex > maxIndex) currentIndex = maxIndex;

    // Считаем сдвиг в пикселях
    const offset = itemWidth * currentIndex;
    track.style.transform = `translateX(-${offset}px)`;

    // Визуально блокируем стрелки, если достигли начала/конца
    if (arrowLeft) {
      arrowLeft.style.opacity = currentIndex === 0 ? '0.5' : '1';
      arrowLeft.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
    }
    if (arrowRight) {
      arrowRight.style.opacity = currentIndex === maxIndex ? '0.5' : '1';
      arrowRight.style.pointerEvents = currentIndex === maxIndex ? 'none' : 'auto';
    }
  }

  // Обработчики кликов по стрелкам
  if (arrowLeft) {
    arrowLeft.addEventListener('click', () => {
      currentIndex--;
      updateCarousel();
    });
  }
  if (arrowRight) {
    arrowRight.addEventListener('click', () => {
      currentIndex++;
      updateCarousel();
    });
  }

  // При ресайзе пересчитываем ширину карточки
  window.addEventListener('resize', initCarousel);

  // Запускаем инициализацию при загрузке
  initCarousel();
});
