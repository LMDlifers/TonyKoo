import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sources from '../data/guide-sources.mjs';

test('every suggested figure has a local asset, cited publisher and matching source page', async () => {
  const { figures } = await import('../data/figure-registry.mjs');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const ids = new Set(sources.map(({ id }) => id));
  assert.ok(figures.length >= 10);
  for (const figure of figures) {
    assert.ok(ids.has(figure.sourceId), figure.id);
    assert.ok(fs.existsSync(path.join(root, figure.path)), figure.path);
    assert.match(figure.sourceUrl, /^https:\/\//);
    assert.match(figure.licenseUrl, /^https:\/\//);
    assert.ok(figure.alt.length > 35 && figure.caption.length > 20, figure.id);
  }
});
