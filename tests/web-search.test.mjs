import test from 'node:test';
import assert from 'node:assert/strict';

test('web results retain official excerpts but discard image metadata and unsafe domains', async () => {
  const { normaliseExaResults } = await import('../assistant-api/web-search.mjs');
  const sources = normaliseExaResults({ results: [
    { title: 'AWS Recovery', url: 'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/plan-for-disaster-recovery-dr.html',
      highlights: ['Set RTO and RPO from business needs.'], image: 'https://unknown.example/picture.png' },
    { title: 'Fake', url: 'https://docs.aws.amazon.com.evil.example/guide', highlights: ['Bad'] },
  ] });
  assert.equal(sources.length, 1);
  assert.equal(sources[0].id, 'web-1');
  assert.match(sources[0].text, /RTO and RPO/);
  assert.equal(sources[0].image, undefined);
});

test('web search requests four moderated results from approved publishers only', async () => {
  const { searchWebEvidence } = await import('../assistant-api/web-search.mjs');
  let body;
  let key;
  const fetcher = async (_url, options) => {
    body = JSON.parse(options.body); key = options.headers['x-api-key'];
    return { ok: true, json: async () => ({ results: [] }) };
  };
  await searchWebEvidence('multi region recovery', 'test-key', fetcher);
  assert.equal(key, 'test-key');
  assert.equal(body.numResults, 4);
  assert.equal(body.moderation, true);
  assert.ok(body.includeDomains.includes('docs.aws.amazon.com'));
  assert.equal(body.contents.highlights, true);
});

test('web quota stops a client after three daily searches', async () => {
  const { reserveWebSearch } = await import('../assistant-api/web-search.mjs');
  const rows = new Map();
  const db = { prepare: () => ({ bind(period, scope, max) { return {
    first: async () => {
      const key = `${period}:${scope}`;
      const calls = rows.get(key) || 0;
      if (calls >= max) return null;
      rows.set(key, calls + 1);
      return { calls: calls + 1 };
    },
    run: async () => { rows.set(`${period}:${scope}`, Math.max(0, (rows.get(`${period}:${scope}`) || 0) - 1)); },
  }; } }) };
  const env = { COMMUNITY_DB: db, FEEDBACK_SIGNING_KEY: 'x'.repeat(40),
    MAX_MONTHLY_WEB_SEARCHES: '100', MAX_DAILY_WEB_SEARCHES_PER_CLIENT: '3' };
  for (let i = 0; i < 3; i++) assert.equal(await reserveWebSearch(env, '192.0.2.1'), 'allowed');
  assert.equal(await reserveWebSearch(env, '192.0.2.1'), 'client_exhausted');
});
