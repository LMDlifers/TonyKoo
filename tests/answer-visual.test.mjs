import test from 'node:test';
import assert from 'node:assert/strict';

const figures = new Map([['outbox', { id: 'outbox', sourceId: 'system-boundary', path: 'research/assets/source-transactional-outbox.png' }]]);
const charts = new Map([['pilot', { id: 'pilot', sourceId: 'pilot-results', points: [{ label: 'Baseline', value: 3 }, { label: 'Revised', value: 5 }] }]]);

test('a published figure is shown only when its source is cited', async () => {
  const { validateVisual } = await import('../js/answer-visual.mjs');
  assert.deepEqual(validateVisual({ kind: 'figure', id: 'outbox' }, ['system-boundary'], { figures, charts }),
    { kind: 'figure', id: 'outbox' });
  assert.equal(validateVisual({ kind: 'figure', id: 'outbox' }, ['other'], { figures, charts }), null);
  assert.equal(validateVisual({ kind: 'figure', id: 'https://evil.example/image.svg' }, ['system-boundary'], { figures, charts }), null);
});

test('a proposed diagram accepts bounded labels and cited design guidance', async () => {
  const { validateVisual } = await import('../js/answer-visual.mjs');
  const visual = validateVisual({ kind: 'diagram', title: 'Approval flow', sourceIds: ['system-boundary'],
    nodes: [{ id: 'service', type: 'approval' }, { id: 'outbox', type: 'outbox' }],
    edges: [{ from: 'service', to: 'outbox', type: 'write' }] }, ['system-boundary'], { figures, charts });
  assert.equal(visual?.kind, 'diagram');
  assert.equal(visual?.label, 'Illustrative design');
  assert.equal(validateVisual({ kind: 'diagram', title: 'Unsafe', sourceIds: ['system-boundary'],
    nodes: [{ id: 'x', type: 'model', label: '<script>alert(1)</script>' }, { id: 'y', type: 'tool' }], edges: [] }, ['system-boundary'], { figures, charts }), null);
  assert.equal(validateVisual({ kind: 'diagram', title: 'Fake metric', sourceIds: ['system-boundary'],
    nodes: [{ id: 'x', type: 'model', label: '99.9% accurate model' }, { id: 'y', type: 'tool' }], edges: [] }, ['system-boundary']), null);
  assert.equal(validateVisual({ kind: 'diagram', title: 'Wrong context', sourceIds: ['system-boundary'],
    nodes: [{ id: 'x', type: 'model' }, { id: 'y', type: 'tool' }], edges: [] }, ['system-boundary'],
  { allowedDiagramTypes: ['model'] }), null);
});

test('a chart uses only a curated cited dataset', async () => {
  const { validateVisual } = await import('../js/answer-visual.mjs');
  assert.deepEqual(validateVisual({ kind: 'chart', id: 'pilot' }, ['pilot-results'], { figures, charts }), { kind: 'chart', id: 'pilot' });
  assert.equal(validateVisual({ kind: 'chart', id: 'pilot', points: [{ label: 'Made up', value: 999 }] }, ['pilot-results'], { figures, charts }), null);
  assert.equal(validateVisual({ kind: 'chart', id: 'pilot' }, ['system-boundary'], { figures, charts }), null);
});

test('a comparison contains bounded text and cited sources only', async () => {
  const { validateVisual } = await import('../js/answer-visual.mjs');
  const draft = { kind: 'comparison', title: 'Delivery choices', sourceIds: ['system-boundary'], rows: [
    { option: 'Direct call', fit: 'Short synchronous path', tradeoff: 'Commit and send can diverge' },
    { option: 'Outbox', fit: 'Durable event intent', tradeoff: 'Requires a publisher and idempotent consumer' },
  ] };
  assert.deepEqual(validateVisual(draft, ['system-boundary'])?.rows, draft.rows);
  assert.equal(validateVisual(draft, ['other']), null);
  assert.equal(validateVisual({ ...draft, rows: [{ ...draft.rows[0], fit: '<svg onload=alert(1)>' }, draft.rows[1]] }, ['system-boundary']), null);
});
