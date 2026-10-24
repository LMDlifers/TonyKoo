import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const pages = ['index.html', 'chat/index.html', ...['research', 'reports'].flatMap((directory) =>
  fs.readdirSync(new URL(`../${directory}/`, import.meta.url))
    .filter((name) => name.endsWith('.html')).map((name) => `${directory}/${name}`))];

test('chat overlay loads across the site while quick Find stays on the homepage and Research hub', () => {
  for (const page of pages) {
    const html = fs.readFileSync(new URL(page, root), 'utf8');
    const prefix = page === 'index.html' ? '' : '../';
    const expected = page === 'index.html' || page === 'research/index.html';
    assert.equal(html.includes(`${prefix}css/guide-widget.css`), expected, page);
    assert.equal(html.includes(`${prefix}js/guide-widget.mjs`), expected, page);
    assert.equal(html.includes('data-find-ask-trigger'), expected, page);
  }
  const widget = fs.readFileSync(new URL('../js/guide-widget.mjs', import.meta.url), 'utf8');
  assert.match(widget, /chat-overlay\.mjs/);
  const overlay = fs.readFileSync(new URL('../js/chat-overlay.mjs', import.meta.url), 'utf8');
  assert.match(overlay, /images\/portfolio\/tonykoo\.png/);
  assert.match(overlay, /Open AI Engineering Lab chat/);
  assert.match(fs.readFileSync(new URL('../js/research.js', import.meta.url), 'utf8'), /chat-overlay\.mjs/);
  assert.match(fs.readFileSync(new URL('../js/report-theme.js', import.meta.url), 'utf8'), /chat-overlay\.mjs/);
  assert.ok(fs.existsSync(new URL('../chat/index.html', import.meta.url)));
});

test('all indexed source paths exist locally', async () => {
  const { default: sources } = await import('../data/guide-sources.mjs');
  for (const source of sources.filter((item) => item.path)) assert.ok(fs.existsSync(path.join(fileURLToPath(root), source.path)), source.path);
});

test('common engineering questions lead to the decision guide that answers them', async () => {
  const [{ default: sources }, { searchSources }] = await Promise.all([
    import('../data/guide-sources.mjs'), import('../js/guide-core.mjs'),
  ]);
  const publicSources = sources.filter((source) => !source.searchOnly);
  assert.equal(searchSources('How should I evaluate an agent workflow?', publicSources, 1)[0]?.id, 'research-how-to-prove-an-agent-works');
  assert.equal(searchSources('When should I use a multi-agent system?', publicSources, 1)[0]?.id, 'research-how-agent-loops-work');
});
