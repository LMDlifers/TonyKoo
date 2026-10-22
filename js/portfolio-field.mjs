export function initPortfolioField(root = document) {
  const scene = root.querySelector('.fieldScene');
  if (!scene || scene.dataset.initialized) return;
  scene.dataset.initialized = 'true';
  const motionToggle = scene.querySelector('.fieldMotionToggle');
  const motionAvailable = matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
  if (motionToggle) {
    const updateMotionControl = () => { motionToggle.hidden = !motionAvailable.matches; };
    updateMotionControl();
    motionAvailable.addEventListener('change', updateMotionControl);
    motionToggle.addEventListener('click', () => {
      const paused = scene.dataset.paused !== 'true';
      scene.dataset.paused = String(paused);
      motionToggle.setAttribute('aria-pressed', String(paused));
      motionToggle.textContent = paused ? 'Play motion' : 'Pause motion';
    });
  }
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
