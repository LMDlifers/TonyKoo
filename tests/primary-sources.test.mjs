import test from 'node:test';
import assert from 'node:assert/strict';
import primarySources from '../data/primary-sources.mjs';
import { searchSources } from '../js/guide-core.mjs';

test('approved primary sources are bounded, reviewable and searchable', () => {
  assert.equal(primarySources.length, 4);
  assert.equal(new Set(primarySources.map(({ id }) => id)).size, 4);
  for (const source of primarySources) {
    assert.match(source.url, /^https:\/\/(www\.anthropic\.com|cheatsheetseries\.owasp\.org|developers\.cloudflare\.com)\//);
    assert.ok(source.publisher && source.accessDate && source.reviewedSummary && source.reuseTerms);
    assert.ok(source.text.length <= 850);
  }
  assert.ok(searchSources('prompt injection untrusted instructions', primarySources, 4)
    .some(({ id }) => id === 'primary-owasp-prompt-injection'));
  assert.ok(searchSources('agent evaluation grader outcome', primarySources, 4)
    .some(({ id }) => id === 'primary-anthropic-agent-evals'));
});
