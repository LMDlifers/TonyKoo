import { validateVisual } from './answer-visual.mjs';

const STOP_WORDS = new Set([
  'about', 'and', 'are', 'can', 'did', 'does', 'for', 'from', 'has', 'have',
  'how', 'instead', 'into', 'its', 'one', 'producing', 'say', 'that', 'the', 'their', 'this', 'tony', 'was', 'what',
  'when', 'where', 'which', 'who', 'why', 'with', 'would', 'your',
]);
const SOURCE_ALIASES = {
  'research-how-to-choose-a-system-boundary': 'service boundaries data ownership system design coupling architecture',
  'research-where-autonomy-stops': 'agent tool authorization cloud security approval control boundary',
  'research-what-the-cloud-should-own': 'cloud deployment shared responsibility options cost architecture',
  'primary-aws-idempotent-apis': 'uncertain write outcome retry idempotency cloud architecture',
  'primary-owasp-prompt-injection': 'retrieved page system prompt reveal agent boundary instruction prompt injection',
  'primary-aws-outbox': 'delivery exactly once guarantee duplicate idempotent consumer',
};

function words(value) {
  return (String(value).toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .map((word) => {
      if (/^evaluat/.test(word) || /^evals?$/.test(word)) return 'evaluat';
      if (/^validat/.test(word)) return 'validat';
      if (/^test(?:s|ed|ing)?$/.test(word)) return 'test';
      return word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word;
    });
}

export function searchSources(query, sources, limit = 6) {
  const terms = [...new Set(words(query))];
  if (!terms.length) return [];
  const fieldsBySource = sources.map((source) => [source.title, `${source.keywords || ''} ${SOURCE_ALIASES[source.id] || ''}`, source.summary, source.text]
    .map((field) => String(field || '').toLowerCase()));
  const documentFrequency = new Map(terms.map((term) => [term,
    fieldsBySource.filter((fields) => fields.some((field) => field.includes(term))).length]));
  const phrases = terms.slice(0, -1).map((term, index) => `${term} ${terms[index + 1]}`);
  return sources.map((source, sourceIndex) => {
    const fields = fieldsBySource[sourceIndex];
    const matchedTerms = terms.filter((term) => fields.some((field) => field.includes(term)));
    const score = matchedTerms.reduce((total, term) =>
      total + fields.reduce((sum, field, index) =>
        sum + (field.includes(term) ? [8, 16, 5, 1][index] *
          Math.log(1 + (sources.length + 1) / (documentFrequency.get(term) + 1)) : 0), 0), 0)
      + phrases.reduce((total, phrase) => total + (fields.some((field) => field.includes(phrase)) ? 3 : 0), 0);
    return { source, score, matchedTerms: matchedTerms.length };
  }).filter(({ score, matchedTerms }) => score > 0
    && matchedTerms >= Math.min(terms.length, Math.max(2, Math.min(4, Math.ceil(terms.length * .3)))))
    .sort((a, b) => b.score - a.score || a.source.title.localeCompare(b.source.title))
    .slice(0, limit)
    .map(({ source }) => source);
}

export function excerptForQuery(text, query, limit = 1100) {
  const body = String(text || '').replace(/\s+/g, ' ').trim();
  if (body.length <= limit) return body;
  const lower = body.toLowerCase();
  const position = [...new Set(words(query))].map((word) => {
    const first = lower.indexOf(word);
    if (first < 0) return null;
    return { first, count: lower.split(word).length - 1 };
  }).filter(Boolean).sort((a, b) => a.count - b.count || a.first - b.first)[0]?.first ?? 0;
  const start = Math.max(0, Math.min(position - Math.floor(limit / 4), body.length - limit));
  return body.slice(start, start + limit).trim();
}

export function searchPassages(query, sources, limit = 3) {
  const terms = [...new Set(words(query))];
  return searchSources(query, sources, Math.max(limit * 3, 6)).map((source) => {
    const sentences = String(source.text || source.summary || '').match(/[^.!?]+[.!?]*/g) || [];
    const windows = [];
    for (let index = 0; index < sentences.length; index += 2) {
      const text = sentences.slice(index, index + 4).join(' ').replace(/\s+/g, ' ').trim().slice(0, 1100);
      if (text) windows.push({ id: `${source.id}:p${Math.floor(index / 2)}`, source, text });
    }
    if (!windows.length) windows.push({ id: `${source.id}:p0`, source, text: String(source.summary || '') });
    return windows.map((passage) => {
      const lower = passage.text.toLowerCase();
      const hits = terms.filter((term) => lower.includes(term)).length;
      const pairs = terms.slice(0, -1).filter((term, index) => lower.includes(`${term} ${terms[index + 1]}`)).length;
      return { ...passage, score: hits * 3 + pairs * 5 };
    }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))[0];
  }).slice(0, limit);
}

export function validateAnswer(draft, retrieved, visualRegistry = {}) {
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
  const claimNumbers = answer.match(/\b\d+(?:\.\d+)?%?/g) || [];
  const evidenceNumbers = new Set(ids.flatMap((id) => {
    const source = known.get(id);
    return `${source.text || ''} ${source.facts || ''} ${source.summary || ''}`.match(/\b\d+(?:\.\d+)?%?/g) || [];
  }));
  if (claimNumbers.some((number) => !evidenceNumbers.has(number))) return unknown;

  const citations = [...new Set(ids)].map((id) => {
    const { title, url, path, kind, summary } = known.get(id);
    return { id, title, url, path, kind, summary };
  });
  const result = { status, answer, citations };
  if (typeof draft.nextStep === 'string' && draft.nextStep.trim() && draft.nextStep.length <= 240) {
    result.nextStep = draft.nextStep.trim();
  }
  if (typeof draft.limits === 'string' && draft.limits.trim() && draft.limits.length <= 240) {
    result.limits = draft.limits.trim();
  }
  const visual = validateVisual(draft.visual, ids, visualRegistry);
  if (visual) result.visual = visual;
  return result;
}
