import test from 'node:test';
import assert from 'node:assert/strict';
import sources from '../data/guide-sources.mjs';
import primary from '../data/primary-sources.mjs';
import { searchPassages } from '../js/guide-core.mjs';
import { scenarios } from './engineering-scenarios.mjs';

const index = [...sources.filter((source) => !source.searchOnly), ...primary];

test('the study contains ten distinct tasks per engineer perspective', () => {
  assert.equal(scenarios.length, 30);
  for (const role of ['AI engineer', 'Senior software engineer', 'Cloud architect']) {
    assert.equal(scenarios.filter((scenario) => scenario.role === role).length, 10);
  }
  assert.equal(new Set(scenarios.map(({ prompt }) => prompt)).size, 30);
});

test('supported pilot tasks retrieve their expected primary or published source', () => {
  for (const scenario of scenarios.filter(({ expected }) => expected)) {
    const ids = searchPassages(scenario.prompt, index, 3).map(({ source }) => source.id);
    assert.ok(ids.includes(scenario.expected), `${scenario.role}: ${scenario.prompt}\nRetrieved ${ids.join(', ')}`);
  }
});
