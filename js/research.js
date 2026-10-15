(() => {
  const toggle = document.querySelector('[data-theme-toggle]');
  try { if (localStorage.getItem('darkMode') === 'enabled') document.body.classList.add('dark-mode'); } catch (_) {}
  const update = () => { if (toggle) toggle.setAttribute('aria-label', document.body.classList.contains('dark-mode') ? 'Switch to light mode' : 'Switch to dark mode'); };
  update();
  if (toggle) toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    try { localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled'); } catch (_) {}
    update();
  });
  const input = document.querySelector('[data-research-search]');
  if (!input) return;
  const cards = [...document.querySelectorAll('[data-research-card]')];
  const groups = [...document.querySelectorAll('[data-research-group]')];
  const count = document.querySelector('[data-result-count]');
  const empty = document.querySelector('[data-research-empty]');
  const filter = () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const topic = card.closest('[data-research-group]')?.querySelector('.topicGroupIntro h3')?.textContent || '';
      card.hidden = !(card.textContent + ' ' + topic).toLowerCase().includes(query);
      if (!card.hidden) visible++;
    });
    groups.forEach(group => { group.hidden = !group.querySelector('[data-research-card]:not([hidden])'); });
    if (count) count.textContent = `${visible} of ${cards.length} items shown`;
    if (empty) empty.hidden = visible !== 0;
  };
  input.addEventListener('input', filter);
  filter();
})();
