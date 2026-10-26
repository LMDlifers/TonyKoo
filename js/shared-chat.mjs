import sources from '../data/guide-sources.mjs';
import primarySources from '../data/primary-sources.mjs';

const endpoint = 'https://tony-portfolio-guide.assistant-api.workers.dev';
const sourceById = new Map([...sources, ...primarySources].map((source) => [source.id, source]));
const status = document.querySelector('#sharedStatus');
const container = document.querySelector('#sharedTurns');
const revokeButton = document.querySelector('#sharedRevoke');
const id = location.hash.slice(1);
const validId = /^[A-Za-z0-9_-]{22,64}$/.test(id);

function renderTurn(turn) {
  const article = document.createElement('article');
  article.className = `sharedTurn sharedTurn--${turn.role === 'assistant' ? 'assistant' : 'user'}`;
  const label = document.createElement('h2');
  label.textContent = turn.role === 'assistant' ? 'AI Engineering Lab' : 'Question';
  const body = document.createElement('p');
  body.textContent = typeof turn.content === 'string' ? turn.content : '';
  article.append(label, body);
  if (turn.role === 'assistant' && Array.isArray(turn.citations)) {
    const list = document.createElement('ul');
    for (const id of turn.citations) {
      const source = sourceById.get(id);
      if (!source) continue;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.path ? new URL('../' + source.path, import.meta.url).href : source.url;
      link.textContent = source.title;
      if (!source.path) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      item.append(link);
      list.append(item);
    }
    if (list.childElementCount) article.append(list);
  }
  container.append(article);
}

if (!validId) {
  status.textContent = 'This share link is invalid.';
} else {
  try {
    const response = await fetch(`${endpoint}/shares/${id}`);
    if (!response.ok) throw Error(response.status === 404 ? 'This share has expired or was revoked.' : 'This share is unavailable right now.');
    const snapshot = await response.json();
    if (!Array.isArray(snapshot.turns) || snapshot.turns.length > 16) throw Error('This share could not be displayed.');
    snapshot.turns.forEach(renderTurn);
    status.textContent = '';
    document.querySelector('#sharedExpiry').textContent = `This link expires ${new Date(snapshot.expiresAt).toLocaleDateString()}.`;
    let token;
    try { token = JSON.parse(localStorage.getItem(`tonyShareRevoke:${id}`) || 'null')?.token; } catch {}
    if (token) {
      revokeButton.hidden = false;
      revokeButton.addEventListener('click', async () => {
        if (!window.confirm('Revoke this link? People with it will no longer see the shared chat.')) return;
        revokeButton.disabled = true;
        try {
          const deleted = await fetch(`${endpoint}/shares/${id}`, { method: 'DELETE',
            headers: { 'content-type': 'application/json' }, body: JSON.stringify({ revokeToken: token }),
          });
          if (!deleted.ok) throw Error('Could not revoke this link.');
          localStorage.removeItem(`tonyShareRevoke:${id}`);
          container.replaceChildren();
          status.textContent = 'Link revoked.';
          revokeButton.hidden = true;
        } catch { status.textContent = 'Could not revoke this link. Try again.'; revokeButton.disabled = false; }
      });
    }
  } catch (error) { status.textContent = error.message; }
}
