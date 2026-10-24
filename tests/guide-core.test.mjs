import test from 'node:test';
import assert from 'node:assert/strict';
import { searchSources, excerptForQuery, validateAnswer } from '../js/guide-core.mjs';

const sources = [
  {
    id: 'faiss-cache',
    title: 'FAISS caching for LLM cost and latency',
    url: 'https://lmdlifers.github.io/TonyKoo/reports/faiss-caching-llm-cost-latency.html',
    kind: 'case study',
    summary: 'Semantic cache with freshness and fallback gates.',
    keywords: 'RAG retrieval vector similarity',
    text: 'The FAISS cache checks similarity before reusing a result. A freshness gate rejects stale answers.',
  },
  {
    id: 'agent-evals',
    title: 'How to prove an agent works',
    url: 'https://lmdlifers.github.io/TonyKoo/research/how-to-prove-an-agent-works.html',
    kind: 'article',
    summary: 'Evaluate agent workflows against strong baselines.',
    keywords: 'agent evaluation testing evals',
    text: 'Compare validated success, cost, and human effort.',
  },
];

test('search ranks a specific matching source and accepts punctuation', () => {
  assert.equal(searchSources('FAISS (RAG)?', sources)[0].id, 'faiss-cache');
});

test('search returns no source for an unrelated question', () => {
  assert.deepEqual(searchSources('What is Tony’s favourite food?', sources), []);
});

test('evaluation wording finds the evaluation guide', () => {
  assert.equal(searchSources('How are agents evaluated?', sources)[0]?.id, 'agent-evals');
});

test('excerpt includes the matching passage without exceeding its limit', () => {
  const excerpt = excerptForQuery(sources[0].text, 'freshness', 80);
  assert.match(excerpt, /freshness gate/);
  assert.ok(excerpt.length <= 80);
});

test('excerpt follows the rare detail rather than a common introductory term', () => {
  const body = 'Healthcare agents can help. '.repeat(40) + 'A human reviews the generated query and evidence before release.';
  const excerpt = excerptForQuery(body, 'Healthcare agents: what can a human review?', 180);
  assert.match(excerpt, /human reviews the generated query/);
});

test('answer validation accepts citations from retrieved sources', () => {
  const answer = validateAnswer({
    status: 'inference',
    answer: 'My inference is that freshness matters.',
    citations: ['faiss-cache'],
  }, sources.slice(0, 1));
  assert.equal(answer.status, 'inference');
  assert.deepEqual(answer.citations.map((source) => source.id), ['faiss-cache']);
  assert.equal(answer.citations[0].text, undefined);
});

test('unsupported answers without a source become unknown', () => {
  const answer = validateAnswer({
    status: 'supported',
    answer: 'Tony has deployed this clinically.',
    citations: ['invented-source'],
  }, sources);
  assert.equal(answer.status, 'unknown');
  assert.match(answer.answer, /could not verify/i);
});

test('an answer with any invented citation ID is rejected', () => {
  const answer = validateAnswer({
    status: 'supported',
    answer: 'The cache uses a freshness gate.',
    citations: ['faiss-cache', 'invented-source'],
  }, sources);
  assert.equal(answer.status, 'unknown');
  assert.deepEqual(answer.citations, []);
});

test('an inference must be labeled in the answer itself', () => {
  const answer = validateAnswer({
    status: 'inference',
    answer: 'Tony prefers this architecture.',
    citations: ['faiss-cache'],
  }, sources);
  assert.equal(answer.status, 'unknown');
});
