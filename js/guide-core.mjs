const STOP_WORDS = new Set([
  'about', 'and', 'are', 'can', 'did', 'does', 'for', 'from', 'has', 'have',
  'how', 'into', 'its', 'that', 'the', 'their', 'this', 'tony', 'was', 'what',
  'when', 'where', 'which', 'who', 'why', 'with', 'would', 'your',
]);

function words(value) {
  return (String(value).toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .map((word) => word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word);
}

export function searchSources(query, sources, limit = 6) {
  const terms = [...new Set(words(query))];
  if (!terms.length) return [];

  return sources.map((source) => {
    const fields = [source.title, source.keywords, source.summary, source.text]
      .map((field) => String(field || '').toLowerCase());
    const matchedTerms = terms.filter((term) => fields.some((field) => field.includes(term)));
    const score = matchedTerms.reduce((total, term) =>
      total + fields.reduce((sum, field, index) =>
        sum + (field.includes(term) ? [5, 4, 3, 1][index] : 0), 0), 0);
    return { source, score, matchedTerms: matchedTerms.length };
  }).filter(({ score, matchedTerms }) => score > 0 && matchedTerms >= Math.min(2, terms.length))
    .sort((a, b) => b.score - a.score || a.source.title.localeCompare(b.source.title))
    .slice(0, limit)
    .map(({ source }) => source);
}

export function excerptForQuery(text, query, limit = 1100) {
  const body = String(text || '').replace(/\s+/g, ' ').trim();
  if (body.length <= limit) return body;
  const lower = body.toLowerCase();
  const position = words(query).map((word) => lower.indexOf(word)).find((index) => index >= 0) ?? 0;
  const start = Math.max(0, Math.min(position - Math.floor(limit / 4), body.length - limit));
  return body.slice(start, start + limit).trim();
}

export function validateAnswer(draft, retrieved) {
  const unknown = {
    status: 'unknown',
    answer: 'I could not verify an answer from Tony’s approved public sources. Please explore the linked work or contact Tony directly.',
    citations: [],
  };
  const known = new Map(retrieved.map((source) => [source.id, source]));
  const ids = draft?.citations;
  const status = draft?.status;
  const answer = typeof draft?.answer === 'string' ? draft.answer.trim() : '';

  if (!['supported', 'inference'].includes(status) || !answer || answer.length > 1200
    || !Array.isArray(ids) || !ids.length
    || ids.some((id) => typeof id !== 'string' || !known.has(id))
    || (status === 'inference' && !/^my inference\b/i.test(answer))) {
    return unknown;
  }

  const citations = [...new Set(ids)].map((id) => {
    const { title, url, path, kind, summary } = known.get(id);
    return { id, title, url, path, kind, summary };
  });
  return { status, answer, citations };
}
