import { searchSources } from './guide-core.mjs';

// shortcut: AI service URL stays blank in the local preview; set it after deploying the Worker.
const endpoint = '';
const avatar = new URL('../images/portfolio/tonykoo.png', import.meta.url).href;
const home = new URL('../index.html', import.meta.url).href;

const widget = document.createElement('div');
widget.className = 'tkGuide';
widget.innerHTML = `
  <button class="tkGuideLaunch" type="button" aria-expanded="false" aria-controls="tkGuidePanel" aria-label="Open guide to Tony's work">
    <span class="tkGuideAvatar"><img src="${avatar}" alt="" width="58" height="58"></span>
    <span>Explore Tony's work</span>
  </button>
  <dialog class="tkGuidePanel" id="tkGuidePanel" aria-labelledby="tkGuideTitle">
    <header class="tkGuideHeader">
      <div class="tkGuideIdentity"><img src="${avatar}" alt="" width="44" height="44"><div><strong id="tkGuideTitle">Tony's work guide</strong><small>Projects · writing · research</small></div></div>
      <button class="tkGuideClose" type="button" aria-label="Close guide">×</button>
    </header>
    <div class="tkGuideIntro"><p>${endpoint ? 'I’m an AI guide to Tony’s published work, not Tony himself. Answers cite sources and label interpretations.' : 'Explore Tony’s published projects, writing, and research. AI answers will appear here when the service is connected.'}</p><small>${endpoint ? 'AI answers are available.' : 'Search preview: AI answers need a connected service.'}</small></div>
    <div class="tkGuidePrompts" aria-label="Example questions">
      <button type="button">Show me agent evaluation work</button>
      <button type="button">How does the FAISS cache work?</button>
      <button type="button">Find writing on cloud design</button>
    </div>
    <div class="tkGuideResults" aria-live="polite"></div>
    <form class="tkGuideForm"><label for="tkGuideQuestion">Ask about the work</label><div><input id="tkGuideQuestion" name="question" maxlength="400" autocomplete="off" placeholder="Try “agent evaluation”" required><button type="submit">Ask <span aria-hidden="true">→</span></button></div></form>
    <p class="tkGuideFoot">Answers can be imperfect. Check cited pages or <a href="${home}#contact">contact Tony</a>.</p>
  </dialog>`;
document.body.append(widget);

const launch = widget.querySelector('.tkGuideLaunch');
const panel = widget.querySelector('.tkGuidePanel');
const input = widget.querySelector('input');
const results = widget.querySelector('.tkGuideResults');
let inFlight = false;
let moodTimer;

function mood(name) {
  widget.classList.remove('is-greeting', 'is-found', 'is-lost');
  clearTimeout(moodTimer);
  if (!name) return;
  widget.classList.add(`is-${name}`);
  moodTimer = setTimeout(() => widget.classList.remove(`is-${name}`), 1100);
}

function openPanel() {
  if (panel.open) return;
  panel.showModal();
  launch.setAttribute('aria-expanded', 'true');
  mood('greeting');
  input.focus();
}

function closePanel() {
  if (panel.open) panel.close();
}

panel.addEventListener('close', () => {
  launch.setAttribute('aria-expanded', 'false');
  launch.focus();
});

function textLine(value, className) {
  const p = document.createElement('p');
  if (className) p.className = className;
  p.textContent = value;
  results.append(p);
}

function linkCard(source) {
  const link = document.createElement('a');
  link.className = 'tkGuideSource';
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

async function ask(question) {
  if (inFlight) return;
  inFlight = true;
  results.replaceChildren();
  mood();
  widget.classList.add('is-thinking');
  textLine(`“${question}”`, 'tkGuideAsked');
  let local;
  try {
    const { default: sources } = await import('../data/guide-sources.mjs');
    local = searchSources(question, sources, 4);
  } catch {
    textLine('Search is unavailable right now. Please use the site navigation or contact Tony.', 'tkGuideAnswer');
    widget.classList.remove('is-thinking');
    inFlight = false;
    return;
  }
  if (!local.length) {
    mood('lost');
    textLine('I could not find that in Tony’s published pages. You can ask Tony directly using the contact link below.', 'tkGuideAnswer');
  } else if (!endpoint) {
    mood('found');
    textLine('These published pages are the closest matches. AI answers will be available when the service is connected.', 'tkGuideAnswer');
    local.forEach(linkCard);
  } else {
    textLine('Checking the published sources…', 'tkGuideLoading');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question }), signal: controller.signal });
      if (!response.ok) throw new Error('service unavailable');
      const answer = await response.json();
      mood(answer.status === 'unknown' ? 'lost' : 'found');
      results.querySelector('.tkGuideLoading')?.remove();
      textLine(answer.status === 'inference' ? 'Inference from Tony’s published work' : answer.status === 'supported' ? 'Source-backed answer' : 'No verified answer', 'tkGuideLabel');
      textLine(answer.answer, 'tkGuideAnswer');
      (answer.citations?.length ? answer.citations : local).forEach(linkCard);
    } catch {
      mood('lost');
      results.querySelector('.tkGuideLoading')?.remove();
      textLine('The AI answer is unavailable. Here are the closest published pages.', 'tkGuideAnswer');
      local.forEach(linkCard);
    } finally {
      clearTimeout(timeout);
    }
  }
  widget.classList.remove('is-thinking');
  inFlight = false;
}

launch.addEventListener('click', () => panel.open ? closePanel() : openPanel());
widget.querySelector('.tkGuideClose').addEventListener('click', closePanel);
widget.querySelector('.tkGuideForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const question = input.value.trim();
  if (question) ask(question);
});
widget.querySelectorAll('.tkGuidePrompts button').forEach((button) => button.addEventListener('click', () => {
  input.value = button.textContent;
  ask(input.value);
}));
