import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const hub = fs.readFileSync(path.join(root, 'research/index.html'), 'utf8');
const articles = [
  'what-language-models-learn.html',
  'when-agents-need-search.html',
  'where-autonomy-stops.html',
  'how-to-prove-an-agent-works.html',
  'when-an-ml-model-is-ready.html',
  'how-data-becomes-reliable-evidence.html',
  'how-to-choose-a-system-boundary.html',
  'what-the-cloud-should-own.html',
  'how-to-decide-under-uncertainty.html',
  'how-money-compounds-and-risk-interrupts-it.html',
];
const topics = ['Machine learning', 'AI and agents', 'Data and retrieval', 'System design', 'Cloud and operations', 'Decisions and money'];

function checkLocalLinks(html, filename) {
  for (const [, target] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:)/.test(target)) continue;
    const [file, fragment] = target.split('#');
    const destination = file ? path.resolve(path.dirname(filename), file) : filename;
    assert.ok(fs.existsSync(destination), `Broken local path ${target} in ${filename}`);
    if (fragment && destination.endsWith('.html')) {
      assert.ok(fs.readFileSync(destination, 'utf8').includes(`id="${fragment}"`), `Broken section ${target} in ${filename}`);
    }
  }
}

for (const topic of topics) assert.ok(hub.includes(topic), `Missing topic: ${topic}`);
checkLocalLinks(hub, path.join(root, 'research/index.html'));
for (const file of articles) {
  assert.ok(hub.includes(`href="${file}"`), `Hub does not link ${file}`);
  const filename = path.join(root, 'research', file);
  assert.ok(fs.existsSync(filename), `Missing article: ${file}`);
  const html = fs.readFileSync(filename, 'utf8');
  assert.match(html, /<main\b/);
  assert.match(html, /<figcaption\b/);
  assert.ok([...html.matchAll(/<li><a href="https:\/\//g)].length >= 2, `Fewer than two primary-source links in ${file}`);
  for (const [, attrs] of html.matchAll(/<img\b([^>]+)>/g)) {
    assert.match(attrs, /\balt="[^"]+"/, `Missing image description in ${file}`);
  }
  checkLocalLinks(html, filename);
}
console.log(`Research navigation checks passed: ${topics.length} topics, ${articles.length} articles.`);
