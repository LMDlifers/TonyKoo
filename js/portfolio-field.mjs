export function initPortfolioField(root = document) {
  const scene = root.querySelector('.fieldScene');
  if (!scene || scene.dataset.initialized) return;
  scene.dataset.initialized = 'true';
  scene.querySelectorAll('.personaAnimated').forEach(sprite => { sprite.hidden = false; });
  let inViewport = false;
  const update = () => { scene.dataset.active = String(inViewport && !document.hidden); };
  update();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      update();
    });
    observer.observe(scene);
    document.addEventListener('visibilitychange', update);
  }
  scene.querySelector('[data-persona="ai-engineer"]')?.addEventListener('click', () => {
    document.querySelector('[data-project-filter="ai"]')?.click();
  });
}

initPortfolioField();
