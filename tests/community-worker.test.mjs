import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../assistant-api/worker.mjs';

const origin = 'https://lmdlifers.github.io';
const answerText = 'Start with “How to prove an agent works”. Compare a simple baseline.';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  for (const migration of ['0001_community.sql', '0002_share_budget.sql', '0003_feedback_budget.sql', '0004_share_dedup.sql', '0005_client_ai_budget.sql']) {
    sqlite.exec(fs.readFileSync(new URL(`../assistant-api/migrations/${migration}`, import.meta.url), 'utf8'));
  }
  return {
    sqlite,
    prepare(sql) {
      return { bind(...values) {
        const statement = sqlite.prepare(sql);
        return {
          first: async () => statement.get(...values) ?? null,
          all: async () => ({ results: statement.all(...values) }),
          run: async () => statement.run(...values),
        };
      } };
    },
  };
}

function env() {
  return {
    COMMUNITY_DB: database(), FEEDBACK_SIGNING_KEY: 'test-key-that-is-long-enough-for-hmac',
    RATE_LIMITER: { limit: async () => ({ success: true }) },
    COMMUNITY_RATE_LIMITER: { limit: async () => ({ success: true }) },
    AI: { run: async () => ({ response: JSON.stringify({ status: 'supported', answer: answerText,
      citations: ['research-how-to-prove-an-agent-works'] }) }) },
    MAX_DAILY_AI_CALLS: '250', MAX_DAILY_AI_CALLS_PER_CLIENT: '20',
    MAX_DAILY_SHARES: '100', MAX_DAILY_FEEDBACK: '500',
  };
}

function request(path, method = 'GET', body, from = origin, ip) {
  return new Request(`https://assistant.example${path}`, {
    method, headers: { origin: from, ...(ip ? { 'cf-connecting-ip': ip } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function signedAnswer(bindings) {
  const response = await worker.fetch(request('/ask', 'POST', { question: 'Which pages explain agent evaluation?' }), bindings);
  assert.equal(response.status, 200);
  const answer = await response.json();
  assert.match(answer.answerId, /^[a-f0-9-]{36}$/);
  assert.equal(typeof answer.receipt, 'string');
  return answer;
}

function transcript(answer) {
  return [{ role: 'user', content: 'Which pages explain agent evaluation?' },
    { role: 'assistant', content: answer.answer, status: answer.status,
      citations: answer.citations.map(({ id }) => id), answerId: answer.answerId, receipt: answer.receipt }];
}

test('explicit share creates a 30-day unlisted snapshot and creator can revoke it', async () => {
  const bindings = env();
  const answer = await signedAnswer(bindings);
  const created = await worker.fetch(request('/shares', 'POST', { turns: transcript(answer) }), bindings);
  assert.equal(created.status, 201);
  const share = await created.json();
  assert.equal((await worker.fetch(request('/shares', 'POST', { turns: transcript(answer) }), bindings)).status, 409);
  assert.equal(bindings.COMMUNITY_DB.sqlite.prepare('SELECT shares FROM daily_share_usage').get().shares, 1);
  assert.match(share.id, /^[A-Za-z0-9_-]{22,}$/);
  assert.match(share.revokeToken, /^[A-Za-z0-9_-]{40,}$/);
  assert.ok(share.expiresAt > Date.now() + 29 * 86400_000);
  const opened = await worker.fetch(request(`/shares/${share.id}`), bindings);
  assert.equal(opened.status, 200);
  assert.equal(opened.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
  const shared = await opened.json();
  assert.deepEqual(shared.turns[0], transcript(answer)[0]);
  assert.equal(shared.turns[1].content, answer.answer);
  assert.equal(shared.turns[1].receipt, undefined);
  assert.equal((await worker.fetch(request(`/shares/${share.id}`, 'DELETE', { revokeToken: 'wrong' }), bindings)).status, 403);
  assert.equal((await worker.fetch(request(`/shares/${share.id}`, 'DELETE', { revokeToken: share.revokeToken }), bindings)).status, 200);
  assert.equal((await worker.fetch(request(`/shares/${share.id}`), bindings)).status, 404);
});

test('sharing rejects edited answers, fabricated citations, invalid origin and stale receipt', async () => {
  const bindings = env();
  const answer = await signedAnswer(bindings);
  const edited = transcript(answer);
  edited[1].content += ' Tony guarantees it.';
  assert.equal((await worker.fetch(request('/shares', 'POST', { turns: edited }), bindings)).status, 400);
  const switchedQuestion = transcript(answer);
  switchedQuestion[0].content = 'Did Tony guarantee this result?';
  assert.equal((await worker.fetch(request('/shares', 'POST', { turns: switchedQuestion }), bindings)).status, 400);
  const forged = transcript(answer);
  forged[1].citations = ['https://evil.example'];
  assert.equal((await worker.fetch(request('/shares', 'POST', { turns: forged }), bindings)).status, 400);
  assert.equal((await worker.fetch(request('/shares', 'POST', { turns: transcript(answer) }, 'https://evil.example'), bindings)).status, 403);
  const stale = answer.receipt.split('.');
  stale[1] = (stale[1].startsWith('A') ? 'B' : 'A') + stale[1].slice(1);
  assert.equal((await worker.fetch(request('/feedback', 'POST', { answerId: answer.answerId,
    receipt: stale.join('.'), rating: 'helpful' }), bindings)).status, 400);
});

test('feedback is one rating per signed answer with a bounded optional comment', async () => {
  const bindings = env();
  const answer = await signedAnswer(bindings);
  const payload = { answerId: answer.answerId, receipt: answer.receipt, rating: 'helpful', comment: 'Useful citation.' };
  assert.equal((await worker.fetch(request('/feedback', 'POST', { ...payload, comment: 'x'.repeat(281) }), bindings)).status, 400);
  assert.equal((await worker.fetch(request('/feedback', 'POST', payload), bindings)).status, 201);
  assert.equal((await worker.fetch(request('/feedback', 'POST', payload), bindings)).status, 409);
  assert.equal(bindings.COMMUNITY_DB.sqlite.prepare('SELECT submissions FROM daily_feedback_usage').get().submissions, 1);
  const stored = bindings.COMMUNITY_DB.sqlite.prepare('SELECT rating, comment, source_ids FROM feedback').get();
  assert.equal(stored.rating, 'helpful');
  assert.equal(stored.comment, 'Useful citation.');
  assert.equal(JSON.parse(stored.source_ids)[0], 'research-how-to-prove-an-agent-works');
});

test('expired shares disappear and scheduled cleanup removes them', async () => {
  const bindings = env();
  const answer = await signedAnswer(bindings);
  const share = await (await worker.fetch(request('/shares', 'POST', { turns: transcript(answer) }), bindings)).json();
  bindings.COMMUNITY_DB.sqlite.prepare('UPDATE shares SET expires_at = 1 WHERE id = ?').run(share.id);
  assert.equal((await worker.fetch(request(`/shares/${share.id}`), bindings)).status, 404);
  await worker.scheduled({}, bindings);
  assert.equal(bindings.COMMUNITY_DB.sqlite.prepare('SELECT COUNT(*) AS count FROM shares').get().count, 0);
});

test('daily model budget blocks a model call after the hard cap', async () => {
  const bindings = env();
  let calls = 0;
  bindings.AI.run = async () => { calls++; return { response: JSON.stringify({ status: 'unknown', answer: '', citations: [] }) }; };
  const day = new Date().toISOString().slice(0, 10);
  bindings.COMMUNITY_DB.sqlite.prepare('INSERT INTO daily_ai_usage(day, calls) VALUES (?, ?)').run(day, 250);
  const response = await worker.fetch(request('/ask', 'POST', { question: 'How are agents evaluated?' }), bindings);
  assert.equal(response.status, 429);
  assert.equal(calls, 0);
  assert.equal(bindings.COMMUNITY_DB.sqlite.prepare('SELECT SUM(calls) AS calls FROM daily_ai_usage_by_client').get().calls, 0);
});

test('missing daily quota configuration fails closed before a model call', async () => {
  const bindings = env();
  let calls = 0;
  bindings.AI.run = async () => { calls++; return {}; };
  for (const key of ['MAX_DAILY_AI_CALLS', 'MAX_DAILY_AI_CALLS_PER_CLIENT']) {
    const original = bindings[key];
    for (const invalid of [undefined, '']) {
      bindings[key] = invalid;
      const response = await worker.fetch(request('/ask', 'POST', { question: 'How are agents evaluated?' }), bindings);
      assert.equal(response.status, 503);
    }
    bindings[key] = original;
  }
  assert.equal(calls, 0);
});

test('one IP cannot use the shared daily AI allowance, while another can still ask', async () => {
  const bindings = env();
  bindings.MAX_DAILY_AI_CALLS_PER_CLIENT = '2';
  let calls = 0;
  bindings.AI.run = async () => { calls++; return { response: JSON.stringify({
    status: 'supported', answer: answerText, citations: ['research-how-to-prove-an-agent-works'],
  }) }; };
  const ask = (ip) => worker.fetch(request('/ask', 'POST',
    { question: 'How are agents evaluated?' }, origin, ip), bindings);
  assert.equal((await ask('203.0.113.7')).status, 200);
  assert.equal((await ask('203.0.113.7')).status, 200);
  assert.equal((await ask('203.0.113.7')).status, 429);
  assert.equal((await ask('198.51.100.9')).status, 200);
  assert.equal(calls, 3);
  assert.equal(bindings.COMMUNITY_DB.sqlite.prepare('SELECT calls FROM daily_ai_usage').get().calls, 3);
  const rows = bindings.COMMUNITY_DB.sqlite.prepare('SELECT client_hash, calls FROM daily_ai_usage_by_client').all();
  assert.deepEqual(rows.map(({ calls: count }) => count).sort(), [1, 2]);
  assert.ok(rows.every(({ client_hash: hash }) => hash !== '203.0.113.7' && hash !== '198.51.100.9'));
});

test('requests without a connecting IP share one bounded fallback allowance', async () => {
  const bindings = env();
  bindings.MAX_DAILY_AI_CALLS_PER_CLIENT = '1';
  let calls = 0;
  bindings.AI.run = async () => { calls++; return { response: JSON.stringify({
    status: 'supported', answer: answerText, citations: ['research-how-to-prove-an-agent-works'],
  }) }; };
  const ask = () => worker.fetch(request('/ask', 'POST', { question: 'How are agents evaluated?' }), bindings);
  assert.equal((await ask()).status, 200);
  assert.equal((await ask()).status, 429);
  assert.equal(calls, 1);
});

test('daily share budget prevents repeated valid receipts from filling storage', async () => {
  const bindings = env();
  const answer = await signedAnswer(bindings);
  const day = new Date().toISOString().slice(0, 10);
  bindings.COMMUNITY_DB.sqlite.prepare('INSERT INTO daily_share_usage(day, shares) VALUES (?, ?)').run(day, 100);
  const response = await worker.fetch(request('/shares', 'POST', { turns: transcript(answer) }), bindings);
  assert.equal(response.status, 429);
  assert.equal(bindings.COMMUNITY_DB.sqlite.prepare('SELECT COUNT(*) AS count FROM shares').get().count, 0);
});

test('daily feedback budget bounds anonymous submissions', async () => {
  const bindings = env();
  const answer = await signedAnswer(bindings);
  const day = new Date().toISOString().slice(0, 10);
  bindings.COMMUNITY_DB.sqlite.prepare('INSERT INTO daily_feedback_usage(day, submissions) VALUES (?, ?)').run(day, 500);
  const response = await worker.fetch(request('/feedback', 'POST', {
    answerId: answer.answerId, receipt: answer.receipt, rating: 'helpful',
  }), bindings);
  assert.equal(response.status, 429);
  assert.equal(bindings.COMMUNITY_DB.sqlite.prepare('SELECT COUNT(*) AS count FROM feedback').get().count, 0);
});
