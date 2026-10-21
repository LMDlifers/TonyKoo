import test from 'node:test';
import assert from 'node:assert/strict';
import sources from '../data/guide-sources.mjs';

test('assistant index contains public site pages with verifiable links', () => {
  assert.ok(sources.length >= 22);
  assert.ok(sources.some(({ path }) => path === 'reports/faiss-caching-llm-cost-latency.html'));
  assert.ok(sources.some(({ path }) => path === 'research/how-to-prove-an-agent-works.html'));
  for (const source of sources) {
    assert.ok(source.url.startsWith('https://lmdlifers.github.io/TonyKoo/research/')
      || source.url.startsWith('https://lmdlifers.github.io/TonyKoo/reports/')
      || ['https://lmdlifers.github.io/TonyKoo/', 'https://github.com/LMDlifers', 'https://github.com/df-Nic/Trading-Algo'].includes(source.url));
    assert.ok(source.title && source.text.length > (source.path ? 200 : 20));
    assert.doesNotMatch(source.text, /<\/?(?:script|style)\b/i);
  }
});

test('external navigation links are search-only, not model evidence', () => {
  const external = sources.filter(({ url }) => url.startsWith('https://github.com/'));
  assert.ok(external.length > 0);
  assert.ok(external.every(({ searchOnly }) => searchOnly === true));
});

test('portfolio and agent-evaluation questions lead to the relevant published page', async () => {
  const { searchSources } = await import('../js/guide-core.mjs');
  assert.equal(searchSources('What has Tony built?', sources, 1)[0]?.id, 'portfolio-overview');
  assert.equal(searchSources('How can I contact Tony?', sources, 1)[0]?.id, 'portfolio-overview');
  assert.equal(searchSources('Tradition Energy role', sources, 1)[0]?.id, 'portfolio-overview');
  assert.equal(searchSources('agent evaluation', sources, 1)[0]?.id, 'research-how-to-prove-an-agent-works');
});
