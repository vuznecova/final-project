// js/levels.js

function initLevelSelection() {
    const links = document.querySelectorAll('.levels-gallery .btn');
    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (token) {
          window.location.href = link.href;
        } else {
          alert('Please login to start.');
          window.location.href = 'login.html';
        }
      });
    });
  }
  
  document.addEventListener('DOMContentLoaded', initLevelSelection);
  