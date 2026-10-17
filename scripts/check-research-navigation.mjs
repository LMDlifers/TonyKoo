import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const hub = fs.readFileSync(path.join(root, 'research/index.html'), 'utf8');
const articles = [
  'how-coding-agents-find-and-change-code.html',
  'from-specification-to-verified-release.html',
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
const topics = ['All', 'AI &amp; agents', 'ML &amp; data', 'Systems &amp; cloud', 'Decisions &amp; money'];

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
assert.deepEqual([...hub.matchAll(/data-topic-filter="([^"]+)"/g)].map((match) => match[1]), ['all', 'ai-agents', 'ml-data', 'systems-cloud', 'decisions-money']);
assert.doesNotMatch(hub, /class="featuredStory"/);
assert.match(hub, /class="storyFeed"/);
assert.equal([...hub.matchAll(/data-topic="[a-z-]+"/g)].length, articles.length);
assert.equal([...hub.matchAll(/class="topicCard topicCard--lead"/g)].length, 1);
assert.equal([...hub.matchAll(/class="topicCard topicCard--secondary"/g)].length, 2);
assert.equal([...hub.matchAll(/class="topicCard topicCard--row"/g)].length, 9);
assert.match(hub, /href="assets\/source-tree-of-thoughts\.png"[^>]*><img[^>]*src="assets\/source-tree-of-thoughts-detail\.png"/);
assert.match(hub, /detail cropped from Figure 1/i);
for (const fragment of ['guides', 'reading-path', 'reads']) assert.ok(hub.includes(`id="${fragment}"`), `Missing section ${fragment}`);
const leadDetail = fs.readFileSync(path.join(root, 'research/assets/source-tree-of-thoughts-detail.png'));
assert.equal(leadDetail.subarray(1, 4).toString('ascii'), 'PNG');
assert.deepEqual([leadDetail.readUInt32BE(16), leadDetail.readUInt32BE(20)], [545, 590]);
assert.ok(fs.existsSync(path.join(root, 'research/feed.xml')));
assert.equal([...fs.readFileSync(path.join(root, 'research/feed.xml'), 'utf8').matchAll(/<item>/g)].length, articles.length);
checkLocalLinks(hub, path.join(root, 'research/index.html'));
for (const file of articles) {
  assert.ok(hub.includes(`href="${file}"`), `Hub does not link ${file}`);
  const filename = path.join(root, 'research', file);
  assert.ok(fs.existsSync(filename), `Missing article: ${file}`);
  const html = fs.readFileSync(filename, 'utf8');
  assert.match(html, /<main\b/);
  assert.match(html, /class="articleByline"/);
  assert.match(html, /<details class="articleToc"/);
  assert.match(html, /rel="alternate" type="application\/rss\+xml"/);
  assert.match(html, /<figcaption\b/);
  assert.ok([...html.matchAll(/<li><a href="https:\/\//g)].length >= 2, `Fewer than two primary-source links in ${file}`);
  for (const [, attrs] of html.matchAll(/<img\b([^>]+)>/g)) {
    assert.match(attrs, /\balt="[^"]+"/, `Missing image description in ${file}`);
  }
  checkLocalLinks(html, filename);
}
console.log(`Research navigation checks passed: ${topics.length} topics, ${articles.length} articles.`);
