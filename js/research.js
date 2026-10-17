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

  const input = document.querySelector('[data-research-search]');
  if (!input) return;
  const stories = [...document.querySelectorAll('.storyFeed [data-research-card]')];
  const reads = [...document.querySelectorAll('.readingCard[data-research-card]')];
  const readsSection = document.querySelector('[aria-labelledby="reads"]');
  const buttons = [...document.querySelectorAll('[data-topic-filter]')];
  const count = document.querySelector('[data-result-count]');
  const empty = document.querySelector('[data-research-empty]');
  const topicGroups = {
    'ai-agents': ['ai-agents'],
    'ml-data': ['machine-learning', 'data-retrieval'],
    'systems-cloud': ['system-design', 'cloud-operations'],
    'decisions-money': ['decisions-money'],
  };
  let topic = 'all';

  const filter = () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    for (const card of stories) {
      const copy = card.textContent;
      card.hidden = (topic !== 'all' && !topicGroups[topic]?.includes(card.dataset.topic)) || !copy.toLowerCase().includes(query);
      if (!card.hidden) visible++;
    }
    for (const card of reads) {
      card.hidden = topic !== 'all' || !card.textContent.toLowerCase().includes(query);
      if (!card.hidden) visible++;
    }
    if (readsSection) readsSection.hidden = topic !== 'all' || !reads.some(card => !card.hidden);
    if (count) count.textContent = `${visible} of ${stories.length + reads.length} items shown`;
    if (empty) empty.hidden = visible !== 0;
  };

  for (const button of buttons) button.addEventListener('click', () => {
    topic = button.dataset.topicFilter;
    input.value = '';
    for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
    filter();
  });
  input.addEventListener('input', filter);
  filter();
})();
