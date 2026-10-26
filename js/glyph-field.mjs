const glyphs = ['∑', 'λ', '∂', '∞', 'π', 'μ', '∫', '0', '1', '+', '×', '=', '{', '}'];
const maxWake = 48;
const frameInterval = 1000 / 30;

export function startGlyphField(canvas, host, activeRegion = host, options = {}) {
  const context = canvas?.getContext('2d', { alpha: true });
  if (!context || !host) return null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const count = options.ambientCount ?? 24;
  const quiet = options.quiet ?? false;
  const ambient = Array.from({ length: count }, (_, index) => ({
    x: (index * 0.61803398875 + 0.13) % 1,
    y: (index * 0.41421356237 + 0.17) % 1,
    glyph: glyphs[index % glyphs.length],
  }));
  const wake = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastDraw = 0;
  let lastPoint = null;
  let visible = true;

  function draw(now = performance.now()) {
    context.clearRect(0, 0, width, height);
    const dark = document.body.classList.contains('dark-mode');
    const color = dark ? '176, 195, 210' : '86, 107, 122';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '13px ui-monospace, SFMono-Regular, Menlo, monospace';
    for (const item of ambient) {
      context.fillStyle = `rgba(${color}, ${quiet ? (dark ? 0.085 : 0.07) : (dark ? 0.13 : 0.10)})`;
      context.fillText(item.glyph, item.x * width, item.y * height);
    }
    for (let index = wake.length - 1; index >= 0; index--) {
      const item = wake[index];
      const age = (now - item.born) / item.life;
      if (age >= 1) { wake.splice(index, 1); continue; }
      const fade = (1 - age) ** 2;
      context.fillStyle = `rgba(${color}, ${fade * item.strength * (quiet ? 0.62 : 1)})`;
      context.fillText(item.glyph, item.x + item.vx * age, item.y + item.vy * age);
    }
  }

  function canAnimate() {
    return visible && !document.hidden && !reduced.matches && finePointer.matches;
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    wake.length = 0;
    lastPoint = null;
    draw();
  }

  function tick(now) {
    frame = 0;
    if (!canAnimate()) { stop(); return; }
    if (now - lastDraw >= frameInterval) {
      lastDraw = now;
      draw(now);
    }
    if (wake.length) frame = requestAnimationFrame(tick);
  }

  function start() {
    if (!frame && wake.length && canAnimate()) frame = requestAnimationFrame(tick);
  }

  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function onMove(event) {
    if (event.pointerType !== 'mouse' || !canAnimate()) return;
    const region = activeRegion.getBoundingClientRect();
    if (event.clientX < region.left || event.clientX > region.right || event.clientY < region.top || event.clientY > region.bottom) {
      lastPoint = null;
      return;
    }
    const now = performance.now();
    const rect = host.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top, time: now };
    const distance = lastPoint ? Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) : 0;
    const speed = lastPoint ? distance / Math.max(1, now - lastPoint.time) : 0;
    const steps = Math.min(maxWake, Math.max(1, Math.ceil(distance / 15)));
    for (let step = 1; step <= steps; step++) {
      const fraction = step / steps;
      const x = lastPoint ? lastPoint.x + (point.x - lastPoint.x) * fraction : point.x;
      const y = lastPoint ? lastPoint.y + (point.y - lastPoint.y) * fraction : point.y;
      wake.push({
        x: x + (Math.random() - 0.5) * 9,
        y: y + (Math.random() - 0.5) * 9,
        vx: (Math.random() - 0.5) * 11,
        vy: -7 - Math.random() * 12,
        born: now,
        life: Math.max(650, 1080 - speed * 80),
        strength: Math.min(0.62, (document.body.classList.contains('dark-mode') ? 0.42 : 0.32) + speed * 0.035),
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
      });
    }
    if (wake.length > maxWake) wake.splice(0, wake.length - maxWake);
    lastPoint = point;
    start();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) stop();
  });
  intersection.observe(host);
  host.addEventListener('pointermove', onMove, { passive: true });
  host.addEventListener('pointerleave', () => { lastPoint = null; }, { passive: true });
  document.addEventListener('visibilitychange', stop);
  reduced.addEventListener('change', stop);
  finePointer.addEventListener('change', stop);
  resize();
  return { redraw: () => draw() };
}
