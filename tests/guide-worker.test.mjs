import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../assistant-api/worker.mjs';

const origin = 'https://lmdlifers.github.io';
const allowingLimiter = { limit: async () => ({ success: true }) };
const request = (question, from = origin) => new Request('https://assistant.example/ask', {
  method: 'POST',
  headers: { origin: from, 'content-type': 'application/json' },
  body: JSON.stringify({ question }),
});

test('worker grounds answers in public sources and checks citations', async () => {
  let prompt = '';
  const env = {
    RATE_LIMITER: allowingLimiter,
    AI: { run: async (_model, input) => {
      prompt = input.messages.at(-1).content;
      return { response: JSON.stringify({
        status: 'supported',
        answer: 'A FAISS cache needs freshness and fallback gates.',
        citations: ['reports-faiss-caching-llm-cost-latency'],
      }) };
    } },
  };
  const response = await worker.fetch(request('How does the FAISS cache work?'), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.match(prompt, /FAISS/i);
  assert.deepEqual(body.citations.map(({ id }) => id), ['reports-faiss-caching-llm-cost-latency']);
  assert.equal(body.citations[0].text, undefined);
  assert.equal(body.status, 'supported');
});

test('worker rejects unapproved origins and missing model binding', async () => {
  const blocked = await worker.fetch(request('FAISS?', 'https://other.example'), {});
  assert.equal(blocked.status, 403);
  const unavailable = await worker.fetch(request('FAISS?'), { RATE_LIMITER: allowingLimiter });
  assert.equal(unavailable.status, 503);
});

test('worker does not call model without a matching source', async () => {
  const response = await worker.fetch(request('What is Tony’s favourite food?'), {
    RATE_LIMITER: allowingLimiter,
    AI: { run: () => { throw Error('should not run'); } },
  });
  assert.equal((await response.json()).status, 'unknown');
});

test('worker answers browser preflight and enforces the rate limiter', async () => {
  const preflight = await worker.fetch(new Request('https://assistant.example/ask', {
    method: 'OPTIONS', headers: { origin, 'access-control-request-method': 'POST' },
  }), {});
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
  const limited = await worker.fetch(request('Tell me about FAISS'), {
    AI: { run: () => { throw Error('should not run'); } },
    RATE_LIMITER: { limit: async () => ({ success: false }) },
  });
  assert.equal(limited.status, 429);
});

test('worker rejects oversized request bodies before inference', async () => {
  let called = false;
  const response = await worker.fetch(new Request('https://assistant.example/ask', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ question: 'FAISS?', padding: 'x'.repeat(3000) }),
  }), {
    RATE_LIMITER: allowingLimiter,
    AI: { run: () => { called = true; return {}; } },
  });
  assert.equal(response.status, 413);
  assert.equal(called, false);
});

test('worker rejects a non-JSON content type', async () => {
  let called = false;
  const response = await worker.fetch(new Request('https://assistant.example/ask', {
    method: 'POST',
    headers: { origin, 'content-type': 'text/plain' },
    body: JSON.stringify({ question: 'FAISS?' }),
  }), {
    RATE_LIMITER: allowingLimiter,
    AI: { run: () => { called = true; return {}; } },
  });
  assert.equal(response.status, 415);
  assert.equal(called, false);
});

test('worker fails closed when the rate limiter binding is missing', async () => {
  let called = false;
  const response = await worker.fetch(request('How does the FAISS cache work?'), {
    AI: { run: () => { called = true; return {}; } },
  });
  assert.equal(response.status, 503);
  assert.equal(called, false);
});
