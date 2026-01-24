(function () {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggle');
  const logo = document.getElementById('mainLogo');

  // Ajustar logo al cargar
  updateLogo();

  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);

    btn.querySelector('span').textContent =
      next === 'dark' ? 'light_mode' : 'dark_mode';

    updateLogo();
  });

  function updateLogo() {
    if (!logo) return;

    const theme = document.documentElement.getAttribute('data-theme');
    const lightSrc = logo.getAttribute('data-logo-light');
    const darkSrc = logo.getAttribute('data-logo-dark');

    logo.style.opacity = '0';

    setTimeout(() => {
      logo.src = theme === 'dark' ? darkSrc : lightSrc;
      logo.style.opacity = '1';
    }, 120);
  }
});
