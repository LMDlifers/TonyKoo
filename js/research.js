(() => {
  const toggle = document.querySelector('[data-theme-toggle]');
  try { if (localStorage.getItem('darkMode') !== 'disabled') document.body.classList.add('dark-mode'); } catch (_) { document.body.classList.add('dark-mode'); }
  const updateTheme = () => {
    if (!toggle) return;
    const dark = document.body.classList.contains('dark-mode');
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', dark ? 'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z' : 'M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z');
    svg.append(path);
    toggle.replaceChildren(svg);
  };
  updateTheme();
  toggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    try { localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled'); } catch (_) {}
    updateTheme();
  });

  const toc = document.querySelector('details.articleToc');
  if (toc) {
    const desktop = matchMedia('(min-width: 851px)');
    const syncToc = () => { toc.open = desktop.matches; };
    desktop.addEventListener('change', syncToc);
    syncToc();
  }

  if (!document.querySelector('[data-topic-filter]')) return;
  const stories = [...document.querySelectorAll('.storyFeed [data-research-card]')];
  const buttons = [...document.querySelectorAll('[data-topic-filter]')];
  const topicGroups = {
    'ai-agents': ['ai-agents'],
    'ml-data': ['machine-learning', 'data-retrieval'],
    'systems-cloud': ['system-design', 'cloud-operations'],
    'decisions-money': ['decisions-money'],
  };
  for (const button of buttons) button.addEventListener('click', () => {
    const topic = button.dataset.topicFilter;
    for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
    for (const card of stories) card.hidden = topic !== 'all' && !topicGroups[topic]?.includes(card.dataset.topic);
  });
})();
