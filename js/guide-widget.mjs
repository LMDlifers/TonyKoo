import { searchSources } from './guide-core.mjs';

const triggers = [...document.querySelectorAll('[data-find-ask-trigger]')];
const endpoint = 'https://tony-portfolio-guide.assistant-api.workers.dev/ask';

if (triggers.length) {
  const dialog = document.createElement('dialog');
  dialog.className = 'findAskDialog';
  dialog.setAttribute('aria-labelledby', 'findAskTitle');
  dialog.innerHTML = `
    <div class="findAskHeader">
      <div><p class="findAskEyebrow">Tony Koo / published work</p><h2 id="findAskTitle">Find your way in.</h2></div>
      <button class="findAskClose" type="button" aria-label="Close Find / Ask">×</button>
    </div>
    <p class="findAskIntro">Find a project or article, or ask a question about the published work.</p>
    <div class="findAskModes" role="group" aria-label="Find or Ask">
      <button type="button" data-mode="find" aria-pressed="true">Find</button>
      <button type="button" data-mode="ask" aria-pressed="false">Ask</button>
    </div>
    <form class="findAskForm">
      <label for="findAskQuery">Search published work</label>
      <div><input id="findAskQuery" type="search" maxlength="400" autocomplete="off" placeholder="Try HNSW, agent evaluation, cloud…" required><button type="submit">Find →</button></div>
    </form>
    <div class="findAskSuggestions" aria-label="Try a search">
      <button type="button" data-example="FAISS cache" data-example-mode="find">FAISS cache</button>
      <button type="button" data-example="How are agents evaluated?" data-example-mode="ask">How are agents evaluated?</button>
    </div>
    <div class="findAskResults" aria-live="polite" hidden></div>
    <p class="findAskFoot">The AI guide uses Tony’s public pages and cites them. It is not Tony; check the linked work for details.</p>`;
  document.body.append(dialog);

  const form = dialog.querySelector('form');
  const input = dialog.querySelector('input');
  const submit = form.querySelector('button');
  const results = dialog.querySelector('.findAskResults');
  const modeButtons = [...dialog.querySelectorAll('[data-mode]')];
  let mode = 'find';
  let sourcesPromise;
  let controller;
  let requestId = 0;
  let previousFocus;

  const sources = () => sourcesPromise ??= import('../data/guide-sources.mjs').then(({ default: items }) => items);

  function showMessage(message, className = 'findAskMessage') {
    const p = document.createElement('p');
    p.className = className;
    p.textContent = message;
    results.append(p);
  }

  function showSource(source) {
    const link = document.createElement('a');
    link.className = 'findAskSource';
    link.href = source.path ? new URL('../' + source.path, import.meta.url).href : source.url;
    if (!source.path) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    const kind = document.createElement('small');
    kind.textContent = source.kind;
    const title = document.createElement('strong');
    title.textContent = source.title;
    const summary = document.createElement('span');
    summary.textContent = source.summary;
    link.append(kind, title, summary);
    results.append(link);
  }

  function setMode(next) {
    requestId++;
    controller?.abort();
    controller = null;
    submit.disabled = false;
    mode = next;
    for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    form.querySelector('label').textContent = mode === 'find' ? 'Search published work' : 'Ask about published work';
    submit.textContent = mode === 'find' ? 'Find →' : 'Ask →';
    input.placeholder = mode === 'find' ? 'Try HNSW, agent evaluation, cloud…' : 'What would you like to know?';
    results.replaceChildren();
    results.hidden = true;
    if (mode === 'find' && input.value.trim().length >= 2) find(input.value.trim());
    input.focus();
  }

  async function find(query) {
    results.replaceChildren();
    results.hidden = query.length < 2;
    if (query.length < 2) return;
    try {
      const matches = searchSources(query, await sources(), 7);
      if (mode !== 'find' || input.value.trim() !== query) return;
      if (!matches.length) showMessage('No published pages match yet. Try a shorter term.');
      else matches.forEach(showSource);
    } catch {
      showMessage('Search is unavailable right now. Use the site navigation to browse the work.');
    }
  }

  async function ask(question) {
    if (controller) return;
    const activeId = ++requestId;
    const activeController = new AbortController();
    controller = activeController;
    submit.disabled = true;
    results.hidden = false;
    results.replaceChildren();
    showMessage('Checking the published sources…');
    const timeout = setTimeout(() => activeController.abort(), 12000);
    try {
      const matches = searchSources(question, await sources(), 4);
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }), signal: activeController.signal,
      });
      if (!response.ok) throw new Error('service unavailable');
      const answer = await response.json();
      if (activeId !== requestId) return;
      results.replaceChildren();
      showMessage(answer.status === 'supported' ? 'Source-backed answer' : answer.status === 'inference' ? 'Inference from published work' : 'No verified answer', 'findAskLabel');
      showMessage(answer.answer);
      (answer.citations?.length ? answer.citations : matches).forEach(showSource);
    } catch {
      if (activeId !== requestId) return;
      results.replaceChildren();
      showMessage('The AI answer is unavailable. You can still search the published pages.');
      searchSources(question, await sources().catch(() => []), 4).forEach(showSource);
    } finally {
      clearTimeout(timeout);
      if (activeId === requestId) { controller = null; submit.disabled = false; }
    }
  }

  function open() {
    if (dialog.open || document.querySelector('dialog[open]')) return;
    previousFocus = document.activeElement;
    dialog.showModal();
    triggers.forEach((button) => button.setAttribute('aria-expanded', 'true'));
    input.focus({ preventScroll: true });
    dialog.scrollTop = 0;
  }

  triggers.forEach((button) => button.addEventListener('click', open));
  dialog.querySelector('.findAskClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    requestId++;
    controller?.abort();
    controller = null;
    submit.disabled = false;
    triggers.forEach((button) => button.setAttribute('aria-expanded', 'false'));
    (previousFocus?.isConnected ? previousFocus : triggers[0]).focus();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
  });
  modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  dialog.querySelectorAll('[data-example]').forEach((button) => button.addEventListener('click', () => {
    input.value = button.dataset.example;
    setMode(button.dataset.exampleMode);
    if (mode === 'ask') ask(input.value.trim());
  }));
  input.addEventListener('input', () => { if (mode === 'find') find(input.value.trim()); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (query.length < 2) return;
    if (mode === 'ask') ask(query);
    else find(query);
  });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) dialog.close();
      else open();
    }
  });
}
