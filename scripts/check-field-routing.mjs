import assert from 'node:assert/strict';
import { walkable, findWalkablePath } from '../js/portfolio-field-routing.mjs';

const start = [.86, .535];
const finish = [.57, .54];
assert.ok(walkable(...start) && walkable(...finish));
const path = findWalkablePath(start, finish);
assert.ok(path.length > 2, 'A drop across scenery needs a detour');
let previous = start;
for (const point of path) {
  for (let step = 0; step <= 20; step++) {
    const x = previous[0] + (point[0] - previous[0]) * step / 20;
    const y = previous[1] + (point[1] - previous[1]) * step / 20;
    assert.ok(walkable(x, y), `Route crossed scenery at ${x.toFixed(3)}, ${y.toFixed(3)}`);
  }
  previous = point;
}
assert.ok(Math.hypot(previous[0] - finish[0], previous[1] - finish[1]) < .011, 'Route reaches its destination');
console.log('Field routing stays on walkable scenery.');
