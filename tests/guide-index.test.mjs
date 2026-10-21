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

test('specific details outrank filler words and unsupported private facts do not match', async () => {
  const { searchSources } = await import('../js/guide-core.mjs');
  assert.equal(searchSources('What are its freshness and fallback gates?', sources, 1)[0]?.id, 'reports-faiss-caching-llm-cost-latency');
  assert.deepEqual(searchSources('What is Tony’s private salary?', sources, 1), []);
});

test('curated public facts and guide fallback are available to the answer service', () => {
  assert.match(sources.find(({ id }) => id === 'reports-faiss-caching-llm-cost-latency').facts, /acceptable age/);
  assert.match(sources.find(({ id }) => id === 'reports-agentic-healthcare-analytics').facts, /generated SQL and statistical steps/);
  assert.match(sources.find(({ id }) => id === 'site-guide').text, /AI service fails or times out/);
});

test('research questions rank the relevant essay ahead of broad project mentions', async () => {
  const { searchSources } = await import('../js/guide-core.mjs');
  assert.equal(searchSources('When should an agent search instead of producing one answer?', sources, 1)[0]?.id, 'research-when-agents-need-search');
  assert.equal(searchSources('What does the research say about model evaluation?', sources, 1)[0]?.id, 'research-when-an-ml-model-is-ready');
});
