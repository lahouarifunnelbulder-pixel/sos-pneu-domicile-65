(() => {
  const yearNode = document.getElementById('year');
  if (yearNode) yearNode.textContent = new Date().getFullYear();

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
