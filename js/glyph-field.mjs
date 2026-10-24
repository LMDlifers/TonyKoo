const glyphs = ['∑', 'λ', '∂', '∞', 'π', 'μ', '∫', '0', '1', '+', '×', '=', '{', '}'];

export function startGlyphField(canvas, main, scroll) {
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const ambient = Array.from({ length: 24 }, (_, index) => ({
    x: ((index * 0.61803398875) % 1),
    y: ((index * 0.41421356237 + 0.15) % 1),
    glyph: glyphs[index % glyphs.length],
    phase: index * 1.7,
  }));
  const wake = [];
  let width = 0;
  let height = 0;
  let previous = 0;
  let lastSpawn = 0;
  let frame = 0;

  function resize() {
    width = main.clientWidth;
    height = main.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(performance.now());
  }

  function draw(now) {
    context.clearRect(0, 0, width, height);
    const dark = document.body.classList.contains('dark-mode');
    const color = dark ? '176, 195, 210' : '86, 107, 122';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '13px ui-monospace, SFMono-Regular, Menlo, monospace';
    const motion = reduced.matches || !finePointer.matches ? 0 : now / 2300;
    for (const item of ambient) {
      const x = item.x * width + Math.sin(motion + item.phase) * 7;
      const y = item.y * height + Math.cos(motion * 0.8 + item.phase) * 6;
      context.fillStyle = `rgba(${color}, ${dark ? 0.13 : 0.10})`;
      context.fillText(item.glyph, x, y);
    }
    for (let index = wake.length - 1; index >= 0; index--) {
      const item = wake[index];
      const age = (now - item.born) / 1050;
      if (age >= 1) { wake.splice(index, 1); continue; }
      const ease = 1 - age;
      context.fillStyle = `rgba(${color}, ${ease * ease * (dark ? 0.58 : 0.43)})`;
      context.fillText(item.glyph, item.x + item.vx * age, item.y + item.vy * age);
    }
  }

  function tick(now) {
    if (document.hidden || reduced.matches || !finePointer.matches) { frame = 0; return; }
    if (now - previous >= 33) { previous = now; draw(now); }
    frame = requestAnimationFrame(tick);
  }

  function syncMotion() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    draw(performance.now());
    if (!document.hidden && !reduced.matches && finePointer.matches) frame = requestAnimationFrame(tick);
  }

  main.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || reduced.matches || !finePointer.matches) return;
    const scrollRect = scroll.getBoundingClientRect();
    if (event.clientY < scrollRect.top || event.clientY > scrollRect.bottom) return;
    const now = performance.now();
    if (now - lastSpawn < 35) return;
    lastSpawn = now;
    const rect = main.getBoundingClientRect();
    wake.push({
      x: event.clientX - rect.left + (Math.random() - 0.5) * 26,
      y: event.clientY - rect.top + (Math.random() - 0.5) * 26,
      vx: (Math.random() - 0.5) * 24,
      vy: -14 - Math.random() * 25,
      born: now,
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
    });
    if (wake.length > 48) wake.shift();
  }, { passive: true });
  document.addEventListener('visibilitychange', syncMotion);
  reduced.addEventListener('change', syncMotion);
  finePointer.addEventListener('change', syncMotion);
  new ResizeObserver(resize).observe(main);
  resize();
  syncMotion();
  return { redraw: () => draw(performance.now()) };
}
