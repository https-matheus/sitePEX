    (function() {
      const toggleBtn = document.getElementById('menuToggle');
      const menuNav = document.getElementById('menuNav');
      if (toggleBtn && menuNav) {
        toggleBtn.addEventListener('click', function() {
          const expanded = menuNav.classList.toggle('active');
          toggleBtn.setAttribute('aria-expanded', expanded);
          if (expanded) {
            toggleBtn.setAttribute('aria-label', 'Fechar menu de navegação');
          } else {
            toggleBtn.setAttribute('aria-label', 'Abrir menu de navegação');
          }
        });
        // Fechar menu ao clicar em link (para melhor usabilidade mobile)
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