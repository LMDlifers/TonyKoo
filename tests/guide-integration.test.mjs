import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const pages = ['index.html', ...['research', 'reports'].flatMap((directory) =>
  fs.readdirSync(new URL(`../${directory}/`, import.meta.url))
    .filter((name) => name.endsWith('.html')).map((name) => `${directory}/${name}`))];

test('Find / Ask appears only on the homepage and Research hub', () => {
  for (const page of pages) {
    const html = fs.readFileSync(new URL(page, root), 'utf8');
    const prefix = page === 'index.html' ? '' : '../';
    const expected = page === 'index.html' || page === 'research/index.html';
    assert.equal(html.includes(`${prefix}css/guide-widget.css`), expected, page);
    assert.equal(html.includes(`${prefix}js/guide-widget.mjs`), expected, page);
    assert.equal(html.includes('data-find-ask-trigger'), expected, page);
  }
});

test('all indexed source paths exist locally', async () => {
  const { default: sources } = await import('../data/guide-sources.mjs');
  for (const source of sources.filter((item) => item.path)) assert.ok(fs.existsSync(path.join(fileURLToPath(root), source.path)), source.path);
});
