(() => {
  const yearNode = document.getElementById('year');
  if (yearNode) yearNode.textContent = new Date().getFullYear();

  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const siteHeader = document.querySelector('.site-header');
  const mobileNavLinks = document.querySelectorAll('.main-nav a');

  if (mobileMenuBtn && siteHeader) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = siteHeader.classList.toggle('menu-open');
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    mobileNavLinks.forEach((link) => {
      link.addEventListener('click', () => {
        siteHeader.classList.remove('menu-open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const detailsList = document.querySelectorAll('.faq-grid details');
  detailsList.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      detailsList.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
})();
