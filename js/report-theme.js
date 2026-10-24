(() => {
  const nav = document.querySelector('.reportNav');
  if (!nav) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'reportThemeButton';
  function sync() {
    const dark = document.body.classList.contains('dark-mode');
    button.textContent = dark ? 'Light theme' : 'Dark theme';
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  button.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    try { localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled'); } catch (_) {}
    sync();
  });
  nav.insertBefore(button, nav.lastElementChild);
  sync();
})();
