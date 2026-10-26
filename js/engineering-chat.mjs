import sources from '../data/guide-sources.mjs';
import primarySources from '../data/primary-sources.mjs';
import { searchSources } from './guide-core.mjs';
import { startGlyphField } from './glyph-field.mjs';
import { receiptIsCurrent } from './chat-receipts.mjs';

const endpoint = 'https://tony-portfolio-guide.assistant-api.workers.dev/ask';
const communityEndpoint = endpoint.replace(/\/ask$/, '');
const storageKey = 'tonyEngineeringChatV1';
const sourceById = new Map([...sources, ...primarySources].map((source) => [source.id, source]));
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
const shareButton = document.querySelector('#shareChat');
const shareDialog = document.querySelector('#shareDialog');
const sharePairs = document.querySelector('#sharePairs');
const shareReviewed = document.querySelector('#shareReviewed');
const shareSubmit = document.querySelector('#shareSubmit');
const shareStatus = document.querySelector('#shareStatus');
const shareResult = document.querySelector('#shareResult');
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
          ? turn.citations.filter((id) => typeof id === 'string' && sourceById.has(id)).slice(0, 4) : [],
        answerId: role === 'assistant' && typeof turn.answerId === 'string' ? turn.answerId : undefined,
        receipt: role === 'assistant' && typeof turn.receipt === 'string' ? turn.receipt : undefined,
        feedbackGiven: role === 'assistant' && turn.feedbackGiven === true });
    }
    return clean.length % 2 === 0 ? clean : clean.slice(0, -1);
  } catch { return []; }
}
let turns = readSaved();
function save() { try { sessionStorage.setItem(storageKey, JSON.stringify(turns.slice(-24))); } catch {} }
function scrollToLatest() { requestAnimationFrame(() => { scrollEl.scrollTop = scrollEl.scrollHeight; }); }
function textNode(tag, className, value) { const node = document.createElement(tag); node.className = className; node.textContent = value; return node; }

function feedbackControls(turn, body, actions) {
  if (!turn.answerId || !turn.receipt) return;
  if (turn.feedbackGiven) { body.append(textNode('p', 'feedbackThanks', 'Thanks for the feedback.')); return; }
  if (!receiptIsCurrent(turn.receipt)) return;
  for (const [rating, label, className] of [
    ['helpful', 'Helpful', 'feedbackHelpful'], ['not_helpful', 'Not helpful', 'feedbackUnhelpful'],
  ]) {
    const button = textNode('button', className, label);
    button.type = 'button';
    button.setAttribute('aria-label', `${label} answer`);
    button.addEventListener('click', () => {
      body.querySelector('.feedbackForm')?.remove();
      const formEl = document.createElement('form');
      formEl.className = 'feedbackForm';
      const commentLabel = textNode('label', '', `${label}. Add a comment (optional, 280 characters).`);
      const comment = document.createElement('textarea');
      comment.className = 'feedbackComment';
      comment.maxLength = 280;
      comment.rows = 2;
      commentLabel.append(comment);
      const submit = textNode('button', 'feedbackSubmit', 'Send feedback');
      submit.type = 'submit';
      const status = textNode('span', 'feedbackStatus', '');
      status.setAttribute('role', 'status');
      formEl.append(commentLabel, submit, status);
      formEl.addEventListener('submit', async (event) => {
        event.preventDefault();
        submit.disabled = true;
        status.textContent = 'Sending…';
        try {
          const response = await fetch(`${communityEndpoint}/feedback`, { method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ answerId: turn.answerId, receipt: turn.receipt, rating, comment: comment.value.trim() }),
          });
          if (!response.ok && response.status !== 409) {
            if (response.status === 429) throw Error('Today’s feedback limit is reached. Try again tomorrow.');
            throw Error('Could not send feedback. Try again.');
          }
          turn.feedbackGiven = true;
          save();
          formEl.remove();
          actions.querySelectorAll('.feedbackHelpful,.feedbackUnhelpful').forEach((control) => control.remove());
          body.append(textNode('p', 'feedbackThanks', 'Thanks for the feedback.'));
        } catch (error) {
          status.textContent = error.message;
          submit.disabled = false;
        }
      });
      body.append(formEl);
      comment.focus();
    });
    actions.append(button);
  }
}

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
    feedbackControls(turn, body, actions);
    body.append(actions);
  }
  article.append(body);
  turnsEl.append(article);
  emptyEl.hidden = true;
  scrollToLatest();
  return article;
}

for (const turn of turns) addTurn(turn);
function shareablePairs() {
  const pairs = [];
  for (let i = 0; i + 1 < turns.length; i += 2) {
    const user = turns[i];
    const assistant = turns[i + 1];
    if (user.role === 'user' && assistant.role === 'assistant' && assistant.answerId && receiptIsCurrent(assistant.receipt)
      && ['supported', 'inference', 'unknown'].includes(assistant.status)) {
      pairs.push([user, assistant]);
    }
  }
  return pairs.slice(-8);
}
function updateShareButton() {
  shareButton.disabled = shareablePairs().length === 0;
  shareButton.title = shareButton.disabled ? 'Ask a new question to create a shareable answer (available for seven days).' : 'Review and share selected exchanges';
}
updateShareButton();
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
    const turn = { role: 'assistant', content, status, citations,
      answerId: typeof answer.answerId === 'string' ? answer.answerId : undefined,
      receipt: typeof answer.receipt === 'string' ? answer.receipt : undefined };
    turns.push(turn); addTurn(turn); save(); updateShareButton();
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
  updateShareButton();
  closeRail();
  input.value = '';
  input.style.height = '';
  setBusy(false);
  input.focus();
});

let selectedPairs = [];
function updateShareSubmit() {
  shareSubmit.disabled = !shareReviewed.checked || !sharePairs.querySelector('input[type=checkbox]:checked') || shareResult.hidden === false;
}
shareButton.addEventListener('click', () => {
  updateShareButton();
  if (shareButton.disabled) return;
  selectedPairs = shareablePairs();
  sharePairs.querySelectorAll('label').forEach((node) => node.remove());
  selectedPairs.forEach(([user, assistant], index) => {
    const label = document.createElement('label');
    label.className = 'sharePair';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = false;
    checkbox.dataset.index = String(index);
    const description = document.createElement('span');
    description.append(textNode('strong', '', `Exchange ${index + 1}`),
      textNode('span', 'sharePreviewQuestion', `Question: ${user.content}`),
      textNode('span', 'sharePreviewAnswer', `Answer: ${assistant.content}`));
    label.append(checkbox, description);
    sharePairs.append(label);
  });
  shareReviewed.checked = false;
  shareStatus.textContent = '';
  shareResult.hidden = true;
  shareSubmit.disabled = true;
  shareDialog.showModal();
});
sharePairs.addEventListener('change', updateShareSubmit);
shareReviewed.addEventListener('change', updateShareSubmit);
document.querySelector('#shareCancel').addEventListener('click', () => shareDialog.close());
document.querySelector('#shareClose').addEventListener('click', () => shareDialog.close());
document.querySelector('#shareForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (shareSubmit.disabled) return;
  const chosen = Array.from(sharePairs.querySelectorAll('input[type=checkbox]:checked'))
    .map((inputEl) => selectedPairs[Number(inputEl.dataset.index)]).filter(Boolean);
  if (!chosen.length) return;
  const snapshot = chosen.flatMap(([user, assistant]) => [
    { role: 'user', content: user.content },
    { role: 'assistant', content: assistant.content, status: assistant.status, citations: assistant.citations,
      answerId: assistant.answerId, receipt: assistant.receipt },
  ]);
  shareSubmit.disabled = true;
  shareStatus.textContent = 'Creating the link…';
  try {
    const response = await fetch(`${communityEndpoint}/shares`, { method: 'POST',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ turns: snapshot }),
    });
    if (!response.ok) throw Error(response.status === 400 ? 'One answer is too old or has changed. Ask again and retry.'
      : response.status === 409 ? 'These exchanges are already shared. Open My shared links to copy or revoke the link.'
        : response.status === 429 ? 'Today’s share limit is reached. Try again tomorrow.' : 'Sharing is unavailable right now.');
    const result = await response.json();
    const link = new URL(`shared.html#${result.id}`, location.href).href;
    document.querySelector('#shareLink').value = link;
    document.querySelector('#shareExpiry').textContent = `Expires ${new Date(result.expiresAt).toLocaleDateString()}. Anyone with this link can read it.`;
    shareResult.dataset.id = result.id;
    shareResult.dataset.revokeToken = result.revokeToken;
    try { localStorage.setItem(`tonyShareRevoke:${result.id}`, JSON.stringify({ token: result.revokeToken, expiresAt: result.expiresAt })); } catch {}
    shareResult.hidden = false;
    shareStatus.textContent = 'Link created. Copy it to share.';
  } catch (error) {
    shareStatus.textContent = error.message;
    updateShareSubmit();
  }
});
document.querySelector('#shareCopy').addEventListener('click', async () => {
  const button = document.querySelector('#shareCopy');
  try { await navigator.clipboard.writeText(document.querySelector('#shareLink').value); button.textContent = 'Copied'; }
  catch { document.querySelector('#shareLink').select(); button.textContent = 'Select and copy'; }
});
async function revokeShare(id, revokeToken) {
  const response = await fetch(`${communityEndpoint}/shares/${id}`, { method: 'DELETE',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ revokeToken }),
  });
  if (!response.ok) throw Error('Could not revoke this link.');
  try { localStorage.removeItem(`tonyShareRevoke:${id}`); } catch {}
}
document.querySelector('#shareRevoke').addEventListener('click', async () => {
  if (!window.confirm('Revoke this link? People with it will no longer see the shared chat.')) return;
  const { id, revokeToken } = shareResult.dataset;
  try {
    await revokeShare(id, revokeToken);
    shareResult.hidden = true;
    shareStatus.textContent = 'Link revoked.';
  } catch { shareStatus.textContent = 'Could not revoke this link. Try again.'; }
});
function savedShares() {
  const entries = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('tonyShareRevoke:')) continue;
      const id = key.slice('tonyShareRevoke:'.length);
      if (!/^[A-Za-z0-9_-]{22,64}$/.test(id)) continue;
      let value;
      try { value = JSON.parse(localStorage.getItem(key)); } catch { continue; }
      if (typeof value?.token === 'string' && value.token.length === 43 && value.expiresAt > Date.now()) {
        entries.push({ id, ...value });
      }
    }
  } catch {}
  return entries.sort((a, b) => b.expiresAt - a.expiresAt);
}
const manageDialog = document.querySelector('#manageDialog');
const manageList = document.querySelector('#manageList');
function renderSavedShares() {
  manageList.replaceChildren();
  const entries = savedShares();
  if (!entries.length) { manageList.append(textNode('p', '', 'No active links were created in this browser.')); return; }
  for (const entry of entries) {
    const item = document.createElement('div');
    item.className = 'manageItem';
    const link = document.createElement('a');
    link.href = new URL(`shared.html#${entry.id}`, location.href).href;
    link.textContent = link.href;
    const expiry = textNode('p', '', `Expires ${new Date(entry.expiresAt).toLocaleDateString()}`);
    const revoke = textNode('button', '', 'Revoke link');
    revoke.type = 'button';
    revoke.addEventListener('click', async () => {
      if (!window.confirm('Revoke this link? People with it will no longer see the shared chat.')) return;
      revoke.disabled = true;
      try { await revokeShare(entry.id, entry.token); renderSavedShares(); }
      catch { revoke.textContent = 'Could not revoke. Try again.'; revoke.disabled = false; }
    });
    item.append(link, expiry, revoke);
    manageList.append(item);
  }
}
document.querySelector('#myShares').addEventListener('click', () => {
  if (rail.classList.contains('isOpen')) closeRail();
  renderSavedShares();
  manageDialog.showModal();
});
document.querySelector('#manageClose').addEventListener('click', () => manageDialog.close());
function openRail() { rail.classList.add('isOpen'); shade.hidden = false; menuButton.setAttribute('aria-expanded', 'true'); document.querySelector('#newChat').focus(); }
function closeRail() { rail.classList.remove('isOpen'); shade.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.focus(); }
menuButton.addEventListener('click', openRail);
document.querySelector('#railClose').addEventListener('click', closeRail);
shade.addEventListener('click', closeRail);
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (rail.classList.contains('isOpen')) closeRail();
  else if (window.parent !== window) window.parent.postMessage({ type: 'tony-chat-close' }, location.origin);
});
document.addEventListener('click', (event) => {
  if (!document.body.classList.contains('embedded')) return;
  const link = event.target.closest?.('a[href]');
  if (!link || link.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  window.top.location.assign(link.href);
});
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
