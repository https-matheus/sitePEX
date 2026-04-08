  (function() {
    const toggleBtn = document.getElementById('menuToggle');
    const menuNav = document.getElementById('menuNav');
    if (toggleBtn && menuNav) {
      toggleBtn.addEventListener('click', function() {
        const expanded = menuNav.classList.toggle('active');
        toggleBtn.setAttribute('aria-expanded', expanded);
        toggleBtn.setAttribute('aria-label', expanded ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
      });
      const links = menuNav.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', () => {
          if (menuNav.classList.contains('active')) {
            menuNav.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.setAttribute('aria-label', 'Abrir menu de navegação');
          }
        });
      });
    }
  })();