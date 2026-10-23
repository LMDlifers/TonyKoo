(() => {
  const toggle = document.querySelector('[data-theme-toggle]');
  try { if (localStorage.getItem('darkMode') === 'enabled') document.body.classList.add('dark-mode'); } catch (_) {}
  const updateTheme = () => toggle?.setAttribute('aria-label', document.body.classList.contains('dark-mode') ? 'Switch to light mode' : 'Switch to dark mode');
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
