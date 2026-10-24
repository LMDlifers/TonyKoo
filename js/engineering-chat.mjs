import sources from '../data/guide-sources.mjs';
import { searchSources } from './guide-core.mjs';
import { startGlyphField } from './glyph-field.mjs';

const endpoint = 'https://tony-portfolio-guide.assistant-api.workers.dev/ask';
const storageKey = 'tonyEngineeringChatV1';
const sourceById = new Map(sources.map((source) => [source.id, source]));
const turnsEl = document.querySelector('#chatTurns');
const scrollEl = document.querySelector('#chatScroll');
const emptyEl = document.querySelector('#chatEmpty');
const form = document.querySelector('#chatComposer');
const input = document.querySelector('#chatInput');
const sendButton = document.querySelector('#sendButton');
const stopButton = document.querySelector('#stopButton');
const rail = document.querySelector('#chatRail');
const shade = document.querySelector('#railShade');
const menuButton = document.querySelector('#menuButton');
const themeButton = document.querySelector('#themeToggle');
let running = null;
let generation = 0;

function readSaved() {
  try {
    const data = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(data)) return [];
    const clean = [];
    for (const turn of data.slice(-24)) {
      const role = clean.length % 2 === 0 ? 'user' : 'assistant';
      if (turn?.role !== role || typeof turn.content !== 'string' || turn.content.length > 1200) break;
      if (role === 'assistant' && !['supported', 'inference', 'unknown', 'error'].includes(turn.status)) break;
      clean.push({ role, content: turn.content, status: role === 'assistant' ? turn.status : undefined,
        citations: role === 'assistant' && Array.isArray(turn.citations)
          ? turn.citations.filter((id) => typeof id === 'string' && sourceById.has(id)).slice(0, 4) : [] });
    }
    return clean.length % 2 === 0 ? clean : clean.slice(0, -1);
  } catch { return []; }
}
let turns = readSaved();
function save() { try { sessionStorage.setItem(storageKey, JSON.stringify(turns.slice(-24))); } catch {} }
function scrollToLatest() { requestAnimationFrame(() => { scrollEl.scrollTop = scrollEl.scrollHeight; }); }
function textNode(tag, className, value) { const node = document.createElement(tag); node.className = className; node.textContent = value; return node; }

function addTurn(turn) {
  const article = document.createElement('article');
  article.className = `chatTurn chatTurn--${turn.role}`;
  const body = document.createElement('div');
  body.className = 'turnBody';
  if (turn.role === 'assistant') {
    const avatar = document.createElement('img');
    avatar.className = 'turnAvatar';
    avatar.src = new URL('../images/portfolio/tonykoo.png', import.meta.url).href;
    avatar.alt = '';
    avatar.width = 34;
    avatar.height = 34;
    article.append(avatar);
    const labels = { supported: 'From published sources', inference: 'Inference from published sources', unknown: 'Not verified', error: 'Could not answer' };
    body.append(textNode('span', `turnStatus turnStatus--${turn.status || 'supported'}`, labels[turn.status] || 'Checking sources…'));
  }
  body.append(textNode('p', 'turnText', turn.content));
  if (turn.role === 'assistant' && turn.citations?.length) {
    const list = document.createElement('ul');
    list.className = 'turnSources';
    for (const id of turn.citations) {
      const source = sourceById.get(id);
      if (!source) continue;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.path ? new URL('../' + source.path, import.meta.url).href : source.url;
      if (!source.path) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      link.textContent = source.title;
      item.append(link);
      list.append(item);
    }
    body.append(list);
  }
  if (turn.role === 'assistant' && turn.status !== 'error' && turn.status !== 'pending') {
    const actions = document.createElement('div');
    actions.className = 'turnActions';
    const copy = textNode('button', '', 'Copy answer');
    copy.type = 'button';
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(turn.content); copy.textContent = 'Copied'; }
      catch { copy.textContent = 'Copy unavailable'; }
    });
    actions.append(copy);
    body.append(actions);
  }
  article.append(body);
  turnsEl.append(article);
  emptyEl.hidden = true;
  scrollToLatest();
  return article;
}

for (const turn of turns) addTurn(turn);
function priorHistory() {
  const pairs = [];
  for (let i = 0; i + 1 < turns.length - 1; i += 2) {
    if (turns[i].role === 'user' && turns[i + 1].role === 'assistant'
      && ['supported', 'inference'].includes(turns[i + 1].status)) {
      pairs.push({ user: turns[i].content, assistant: turns[i + 1].content });
    }
  }
  return pairs.slice(-2).flatMap(({ user, assistant }) => [
    { role: 'user', content: user.slice(0, 400) },
    { role: 'assistant', content: assistant.slice(0, 400) },
  ]);
}
function setBusy(busy) {
  input.disabled = busy;
  sendButton.hidden = busy;
  stopButton.hidden = !busy;
  sendButton.disabled = busy || input.value.trim().length < 3;
}
function errorText(status, stopped) {
  if (stopped) return 'Stopped. Edit your question and try again.';
  if (status === 429) return 'The public guide is receiving too many requests. Try again in a minute.';
  if (status === 413) return 'That message is too long. Shorten it and try again.';
  return 'The AI answer is unavailable right now. You can still open the matching published pages below.';
}
async function ask(question) {
  const history = priorHistory();
  const controller = new AbortController();
  const currentGeneration = generation;
  running = controller;
  setBusy(true);
  const pending = addTurn({ role: 'assistant', content: 'Checking the published sources…', status: 'pending' });
  let timeout;
  try {
    timeout = setTimeout(() => controller.abort(), 18000);
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, history }), signal: controller.signal,
    });
    if (!response.ok) { const error = new Error('service error'); error.status = response.status; throw error; }
    const answer = await response.json();
    if (currentGeneration !== generation) return;
    const status = ['supported', 'inference', 'unknown'].includes(answer.status) ? answer.status : 'unknown';
    const content = typeof answer.answer === 'string' && answer.answer.trim() ? answer.answer.trim() : 'I could not verify an answer from the published sources.';
    const citations = Array.isArray(answer.citations) ? answer.citations.map((item) => item?.id).filter((id) => sourceById.has(id)).slice(0, 4) : [];
    pending.remove();
    const turn = { role: 'assistant', content, status, citations };
    turns.push(turn); addTurn(turn); save();
  } catch (error) {
    if (currentGeneration !== generation) return;
    pending.remove();
    const citations = controller.signal.aborted ? [] : searchSources(question, sources.filter((source) => !source.searchOnly), 3).map((source) => source.id);
    const turn = { role: 'assistant', content: errorText(error.status, controller.signal.aborted), status: 'error', citations };
    turns.push(turn); addTurn(turn); save();
  } finally {
    clearTimeout(timeout);
    if (currentGeneration !== generation) return;
    running = null;
    setBusy(false);
    input.focus();
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (running) return;
  const question = input.value.trim();
  if (question.length < 3 || question.length > 400) return;
  const turn = { role: 'user', content: question };
  turns.push(turn); addTurn(turn); save();
  input.value = '';
  input.style.height = '';
  ask(question);
});
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  sendButton.disabled = input.value.trim().length < 3;
});
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
});
stopButton.addEventListener('click', () => running?.abort());
document.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => {
  input.value = button.dataset.prompt;
  input.dispatchEvent(new Event('input'));
  input.focus();
}));
document.querySelector('#newChat').addEventListener('click', () => {
  if (turns.length && !window.confirm('Start a new chat? This will clear the conversation from this tab.')) return;
  generation++;
  running?.abort();
  running = null;
  turns = [];
  turnsEl.replaceChildren();
  emptyEl.hidden = false;
  save();
  closeRail();
  input.value = '';
  input.style.height = '';
  setBusy(false);
  input.focus();
});
function openRail() { rail.classList.add('isOpen'); shade.hidden = false; menuButton.setAttribute('aria-expanded', 'true'); document.querySelector('#newChat').focus(); }
function closeRail() { rail.classList.remove('isOpen'); shade.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.focus(); }
menuButton.addEventListener('click', openRail);
document.querySelector('#railClose').addEventListener('click', closeRail);
shade.addEventListener('click', closeRail);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && rail.classList.contains('isOpen')) closeRail(); });
try { if (localStorage.getItem('darkMode') === 'disabled') document.body.classList.remove('dark-mode'); } catch {}
const glyphField = startGlyphField(document.querySelector('#glyphField'), document.querySelector('#main'), scrollEl);
function updateTheme() {
  const dark = document.body.classList.contains('dark-mode');
  themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  themeButton.querySelector('path').setAttribute('d', dark
    ? 'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'
    : 'M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z');
}
updateTheme();
themeButton.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  try { localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled'); } catch {}
  updateTheme();
  glyphField?.redraw();
});
