import { startGlyphField } from './glyph-field.mjs';
import { walkable, segmentWalkable, findWalkablePath } from './portfolio-field-routing.mjs';

const ROUTES = {
  'ai-engineer': [[.28, .62], [.31, .64], [.30, .59], [.25, .63]],
  researcher: [[.50, .49], [.55, .54], [.51, .56], [.49, .51]],
  student: [[.72, .62], [.75, .63], [.73, .69], [.72, .64]],
};

function nearestWalkable(x, y, occupied = [], width = 960, height = 520) {
  x = Math.max(.06, Math.min(.94, x));
  y = Math.max(.38, Math.min(.78, y));
  const clear = (px, py) => occupied.every(([ox, oy]) => Math.abs(px - ox) * width >= 124 || Math.abs(py - oy) * height >= 142);
  if (walkable(x, y) && clear(x, y)) return [x, y];
  let best = [x, y];
  let distance = Infinity;
  for (let row = 38; row <= 78; row++) {
    for (let column = 7; column <= 93; column++) {
      const px = column / 100, py = row / 100;
      if (!walkable(px, py) || !clear(px, py)) continue;
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d < distance) { best = [px, py]; distance = d; }
    }
  }
  return best;
}

export function initPortfolioField(root = document) {
  const scene = root.querySelector('.fieldScene');
  if (!scene || scene.dataset.initialized) return;
  scene.dataset.initialized = 'true';
  scene.dataset.active = 'false';
  const world = scene.querySelector('.fieldWorld');
  const card = scene.querySelector('.fieldSelectionCard');
  const cardTitle = card.querySelector('.fieldSelectionTitle');
  const cardDescription = card.querySelector('.fieldSelectionDescription');
  const cardLink = card.querySelector('.fieldSelectionLink');
  const people = [...scene.querySelectorAll('.personaStation')].map((element) => ({
    element,
    x: Number(element.dataset.x),
    y: Number(element.dataset.y),
    route: ROUTES[element.dataset.persona],
    waypoint: 1,
    detour: null,
    restUntil: 0,
  }));
  let selected = null;
  let inViewport = false;
  let frame = 0;
  let lastFrame = 0;
  let pointer = null;
  let ignoreNextClick = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = window.matchMedia('(max-width: 899px)');

  function position(person, x, y) {
    person.x = x; person.y = y;
    person.element.dataset.x = x.toFixed(3);
    person.element.dataset.y = y.toFixed(3);
    person.element.style.setProperty('--x', x.toFixed(4));
    person.element.style.setProperty('--y', y.toFixed(4));
    person.element.style.setProperty('--depth', String(2 + Math.round(y * 10)));
  }

  function select(person) {
    selected = person;
    document.body.classList.add('fieldSelectionOpen');
    for (const candidate of people) {
      candidate.element.setAttribute('aria-expanded', String(candidate === person));
      if (candidate === person) candidate.element.classList.remove('is-walking');
    }
    cardTitle.textContent = person.element.querySelector('.personaLabel').textContent;
    cardDescription.textContent = person.element.querySelector('.personaDescription').textContent;
    cardLink.href = person.element.getAttribute('href');
    cardLink.firstChild.textContent = 'Open ' + (person.element.dataset.persona === 'ai-engineer' ? 'Projects' : person.element.dataset.persona === 'researcher' ? 'Research' : 'Background') + ' ';
    card.hidden = false;
  }

  function deselect() {
    selected = null;
    document.body.classList.remove('fieldSelectionOpen');
    card.hidden = true;
    for (const person of people) person.element.setAttribute('aria-expanded', 'false');
  }

  function animate(now) {
    frame = 0;
    if (scene.dataset.active !== 'true') return;
    const seconds = Math.min((now - (lastFrame || now)) / 1000, .05);
    lastFrame = now;
    for (const person of people) {
      if (person === selected || pointer?.person === person) continue;
      const goal = person.route[person.waypoint];
      if (!person.detour && !segmentWalkable([person.x, person.y], goal)) {
        person.detour = findWalkablePath([person.x, person.y], goal);
        if (!person.detour.length) { person.waypoint = (person.waypoint + 1) % person.route.length; person.detour = null; continue; }
      }
      const [tx, ty] = person.detour?.[0] || goal;
      const distance = Math.hypot(tx - person.x, ty - person.y);
      if (distance < .004) {
        if (person.detour?.length) {
          person.detour.shift();
          if (!person.detour.length) person.detour = null;
          continue;
        }
        person.element.classList.remove('is-walking');
        if (!person.restUntil) person.restUntil = now + 700;
        if (now >= person.restUntil) {
          person.waypoint = (person.waypoint + 1) % person.route.length;
          person.restUntil = 0;
        }
      } else {
        const step = Math.min(distance, .030 * seconds);
        const nx = person.x + (tx - person.x) / distance * step;
        const ny = person.y + (ty - person.y) / distance * step;
        const bounds = world.getBoundingClientRect();
        const tooClose = people.some(other => other !== person && Math.abs(nx - other.x) * bounds.width < 124 && Math.abs(ny - other.y) * bounds.height < 142);
        if (!walkable(nx, ny) || tooClose) {
          person.element.classList.remove('is-walking');
          if (!person.restUntil) person.restUntil = now + 700;
          if (now >= person.restUntil) { person.waypoint = (person.waypoint + 1) % person.route.length; person.detour = null; person.restUntil = 0; }
        } else {
          position(person, nx, ny);
          person.element.classList.add('is-walking');
        }
      }
    }
    frame = requestAnimationFrame(animate);
  }

  function updateActivity() {
    const active = inViewport && !document.hidden && !reduced.matches && !narrow.matches;
    scene.dataset.active = String(active);
    if (!active) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
      people.forEach(person => person.element.classList.remove('is-walking'));
    } else if (!frame) frame = requestAnimationFrame(animate);
  }

  for (const button of scene.querySelectorAll('[data-season-choice]')) {
    button.addEventListener('click', () => {
      scene.dataset.season = button.dataset.seasonChoice;
      for (const choice of scene.querySelectorAll('[data-season-choice]')) {
        choice.setAttribute('aria-pressed', String(choice === button));
      }
    });
  }

  for (const person of people) {
    const link = person.element;
    link.querySelector('.personaAnimated').hidden = false;
    link.draggable = false;
    link.querySelector('.personaStill').draggable = false;
    link.addEventListener('dragstart', event => event.preventDefault());
    link.addEventListener('pointerdown', event => {
      if (narrow.matches || event.button !== 0) return;
      pointer = { person, x: event.clientX, y: event.clientY, dragging: false };
      link.setPointerCapture(event.pointerId);
      select(person);
    });
    link.addEventListener('pointermove', event => {
      if (!pointer || pointer.person !== person) return;
      if (!pointer.dragging && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 6) return;
      pointer.dragging = true;
      link.classList.add('is-dragging');
      const bounds = world.getBoundingClientRect();
      const [x, y] = nearestWalkable((event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height, people.filter(other => other !== person).map(other => [other.x, other.y]), bounds.width, bounds.height);
      person.detour = null;
      position(person, x, y);
    });
    link.addEventListener('pointerup', event => {
      if (!pointer || pointer.person !== person) return;
      ignoreNextClick = pointer.dragging;
      link.classList.remove('is-dragging');
      if (link.hasPointerCapture(event.pointerId)) link.releasePointerCapture(event.pointerId);
      pointer = null;
    });
    link.addEventListener('pointercancel', () => { link.classList.remove('is-dragging'); pointer = null; });
    link.addEventListener('click', event => {
      event.preventDefault();
      if (ignoreNextClick) { ignoreNextClick = false; return; }
      select(person);
    });
  }

  world.addEventListener('click', event => {
    if (!event.target.closest('.personaStation')) deselect();
  });
  card.querySelector('.fieldSelectionClose').addEventListener('click', () => {
    const previous = selected;
    deselect();
    previous?.element.focus();
  });
  cardLink.addEventListener('click', () => {
    if (selected?.element.dataset.persona === 'ai-engineer') {
      document.querySelector('[data-project-filter="ai"]')?.click();
    }
    deselect();
  });
  scene.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selected) {
      const previous = selected;
      deselect();
      previous.element.focus();
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      updateActivity();
    }, { threshold: 0 });
    observer.observe(scene);
  } else inViewport = true;
  document.addEventListener('visibilitychange', updateActivity);
  reduced.addEventListener('change', updateActivity);
  narrow.addEventListener('change', updateActivity);
  updateActivity();
}

initPortfolioField();
const intro = document.querySelector('.fieldIntro');
if (intro) {
  const canvas = document.createElement('canvas');
  canvas.className = 'glyphField glyphField--hero';
  canvas.setAttribute('aria-hidden', 'true');
  intro.prepend(canvas);
  const field = startGlyphField(canvas, intro, intro, { ambientCount: 19, quiet: true });
  document.querySelector('#darkModeToggle')?.addEventListener('click', () => requestAnimationFrame(() => field?.redraw()));
}
