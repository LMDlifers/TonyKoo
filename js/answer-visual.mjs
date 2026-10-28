function cleanLabel(value, limit) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= limit && !/[<>\u0000-\u001f]/.test(value)
    ? value.trim() : null;
}

export const diagramComponents = Object.freeze({
  request: 'Request', api: 'API service', agent: 'Agent', model: 'Model', retriever: 'Retriever',
  cache: 'Cache', database: 'Database', outbox: 'Outbox', publisher: 'Publisher', broker: 'Event broker',
  queue: 'Queue', worker: 'Worker', consumer: 'Consumer', tool: 'Tool', approval: 'Human approval',
  logs: 'Logs', region: 'Cloud region', backup: 'Backup', user: 'User', verifier: 'Verifier',
});
const diagramEdges = Object.freeze({ request: 'Request', write: 'Write', publish: 'Publish',
  deliver: 'Deliver', retry: 'Retry', review: 'Review', retrieve: 'Retrieve', respond: 'Respond',
  observe: 'Observe', failover: 'Failover', replicate: 'Replicate', handoff: 'Handoff' });
export function allowedDiagramTypes(text) {
  const lower = String(text).toLowerCase();
  return Object.keys(diagramComponents).filter((type) => lower.includes(type));
}

export function validateVisual(candidate, citationIds, { figures = new Map(), charts = new Map(), allowedDiagramTypes: allowedTypes } = {}) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  const cited = new Set(citationIds);
  if (candidate.kind === 'figure' || candidate.kind === 'chart') {
    if (Object.keys(candidate).some((key) => !['kind', 'id'].includes(key))) return null;
    const item = (candidate.kind === 'figure' ? figures : charts).get(candidate.id);
    return item && cited.has(item.sourceId) ? { kind: candidate.kind, id: candidate.id } : null;
  }
  if (candidate.kind === 'comparison') {
    const title = cleanLabel(candidate.title, 80);
    if (!title || !Array.isArray(candidate.sourceIds) || !candidate.sourceIds.length || candidate.sourceIds.length > 3
      || candidate.sourceIds.some((id) => !cited.has(id))
      || !Array.isArray(candidate.rows) || candidate.rows.length < 2 || candidate.rows.length > 4) return null;
    const rows = candidate.rows.map((row) => {
      if (!row || typeof row !== 'object' || Object.keys(row).some((key) => !['option', 'fit', 'tradeoff'].includes(key))) return null;
      const option = cleanLabel(row.option, 40);
      const fit = cleanLabel(row.fit, 100);
      const tradeoff = cleanLabel(row.tradeoff, 100);
      return option && fit && tradeoff && !/\d/.test(`${option} ${fit} ${tradeoff}`) ? { option, fit, tradeoff } : null;
    });
    return rows.some((row) => !row) ? null
      : { kind: 'comparison', title, sourceIds: [...new Set(candidate.sourceIds)], rows };
  }
  if (candidate.kind !== 'diagram' || !Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)
    || candidate.nodes.length < 2 || candidate.nodes.length > 8 || candidate.edges.length > 12
    || !Array.isArray(candidate.sourceIds) || !candidate.sourceIds.length || candidate.sourceIds.length > 3
    || candidate.sourceIds.some((id) => !cited.has(id))) return null;
  const title = cleanLabel(candidate.title, 80);
  if (!title) return null;
  const nodes = candidate.nodes.map((node) => {
    if (!node || !/^[a-z][a-z0-9-]{0,31}$/.test(node.id || '')) return null;
    const label = diagramComponents[node.type];
    if (!label || (node.label !== undefined && node.label !== label)) return null;
    return { id: node.id, type: node.type, label };
  });
  if (nodes.some((node) => !node) || new Set(nodes.map(({ id }) => id)).size !== nodes.length) return null;
  if (Array.isArray(allowedTypes) && nodes.some((node) => !allowedTypes.includes(node.type))) return null;
  const ids = new Set(nodes.map(({ id }) => id));
  const edges = candidate.edges.map((edge) => {
    const label = edge?.type == null ? '' : diagramEdges[edge.type];
    return ids.has(edge?.from) && ids.has(edge?.to) && edge.from !== edge.to && label !== undefined
      && (edge.label === undefined || edge.label === label)
      ? { from: edge.from, to: edge.to, type: edge.type || null, label } : null;
  });
  if (edges.some((edge) => !edge)) return null;
  return { kind: 'diagram', label: 'Illustrative design', title, sourceIds: [...new Set(candidate.sourceIds)], nodes, edges };
}
