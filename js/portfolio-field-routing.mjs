// One shared ground mask for all four seasonal illustrations.
export function walkable(x, y) {
  if (y < .38 || y > .78) return false;
  const reach = y < .535 ? (y - .198) / .337 : (.887 - y) / .352;
  if (Math.abs(x - .5) > .44 * reach - .025) return false;
  return !(
    (x > .20 && x < .38 && y < .48) ||
    (x > .48 && x < .57 && y < .48) ||
    (x > .70 && x < .84 && y < .46) ||
    (x > .68 && x < .80 && y > .50 && y < .59)
  );
}

export function segmentWalkable(start, finish) {
  const steps = Math.max(1, Math.ceil(Math.hypot(finish[0] - start[0], finish[1] - start[1]) / .003));
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    if (!walkable(start[0] + (finish[0] - start[0]) * fraction, start[1] + (finish[1] - start[1]) * fraction)) return false;
  }
  return true;
}

// Search the small, fixed island grid only when a dragged person needs a detour.
export function findWalkablePath(start, finish) {
  if (segmentWalkable(start, finish)) return [finish];
  const cells = [];
  for (let row = 38; row <= 78; row++) {
    for (let col = 6; col <= 94; col++) {
      const point = [col / 100, row / 100];
      if (walkable(...point)) cells.push({ col, row, point });
    }
  }
  const nearest = point => cells
    .filter(cell => segmentWalkable(point, cell.point))
    .reduce((best, cell) => !best || Math.hypot(cell.point[0] - point[0], cell.point[1] - point[1]) < Math.hypot(best.point[0] - point[0], best.point[1] - point[1]) ? cell : best, null);
  const first = nearest(start), last = nearest(finish);
  if (!first || !last) return [];
  const key = (col, row) => row * 101 + col;
  const byKey = new Map(cells.map(cell => [key(cell.col, cell.row), cell]));
  const queue = [first];
  const previous = new Map([[key(first.col, first.row), null]]);
  const goal = key(last.col, last.row);
  for (let i = 0; i < queue.length && !previous.has(goal); i++) {
    const current = queue[i];
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nextKey = key(current.col + dx, current.row + dy);
      const next = byKey.get(nextKey);
      if (!next || previous.has(nextKey) || !segmentWalkable(current.point, next.point)) continue;
      previous.set(nextKey, key(current.col, current.row));
      queue.push(next);
    }
  }
  if (!previous.has(goal)) return [];
  const raw = [];
  for (let cursor = goal; cursor !== null; cursor = previous.get(cursor)) raw.push(byKey.get(cursor).point);
  raw.reverse();
  raw.push(finish);
  const smooth = [];
  let current = start;
  for (let index = 0; index < raw.length;) {
    let farthest = index;
    for (let candidate = raw.length - 1; candidate > index; candidate--) {
      if (segmentWalkable(current, raw[candidate])) { farthest = candidate; break; }
    }
    current = raw[farthest];
    smooth.push(current);
    index = farthest + 1;
  }
  return smooth;
}
