const domains = [
  'docs.aws.amazon.com', 'aws.amazon.com', 'developers.cloudflare.com',
  'docs.cloud.google.com', 'developers.google.com', 'learn.microsoft.com',
  'www.anthropic.com', 'platform.openai.com', 'cheatsheetseries.owasp.org',
  'kubernetes.io', 'www.postgresql.org', 'developer.mozilla.org', 'arxiv.org',
];

export function approvedPublisherUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && domains.includes(url.hostname) ? url.href : null;
  } catch { return null; }
}

export function normaliseExaResults(data) {
  if (!Array.isArray(data?.results)) return [];
  const accepted = [];
  const seen = new Set();
  for (const result of data.results) {
    const url = approvedPublisherUrl(result.url);
    if (!url || seen.has(url)) continue;
    const highlights = Array.isArray(result.highlights) ? result.highlights.filter((value) => typeof value === 'string') : [];
    const text = highlights.join(' ').replace(/\s+/g, ' ').trim().slice(0, 1500);
    if (text.length < 35 || typeof result.title !== 'string' || !result.title.trim()) continue;
    seen.add(url);
    accepted.push({ id: `web-${accepted.length + 1}`, title: result.title.trim().slice(0, 150),
      url, kind: 'current publisher documentation', summary: text.slice(0, 180), text });
    if (accepted.length >= 4) break;
  }
  return accepted;
}

export async function searchWebEvidence(query, apiKey, fetcher = fetch) {
  if (!apiKey) throw Error('Web search is unavailable');
  const response = await fetcher('https://api.exa.ai/search', {
    method: 'POST', headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ query: query.slice(0, 500), type: 'auto', numResults: 4,
      moderation: true, includeDomains: domains, contents: { highlights: true } }),
  });
  if (!response.ok) throw Error('Web search failed');
  return normaliseExaResults(await response.json());
}

export async function reserveWebSearch(env, clientIp) {
  const globalMax = Number(env.MAX_MONTHLY_WEB_SEARCHES);
  const clientMax = Number(env.MAX_DAILY_WEB_SEARCHES_PER_CLIENT);
  if (!env.COMMUNITY_DB || typeof env.FEEDBACK_SIGNING_KEY !== 'string' || env.FEEDBACK_SIGNING_KEY.length < 32
    || !Number.isSafeInteger(globalMax) || globalMax < 1 || globalMax > 100
    || !Number.isSafeInteger(clientMax) || clientMax < 1 || clientMax > 3) return 'unavailable';
  const day = new Date().toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  const bytes = new TextEncoder().encode(`${env.FEEDBACK_SIGNING_KEY}:${day}:${clientIp || 'local'}`);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
    (byte) => byte.toString(16).padStart(2, '0')).join('');
  const scope = `client:${hash}`;
  const reserve = (period, name, max) => env.COMMUNITY_DB.prepare(`INSERT INTO web_search_usage(period, scope, calls) VALUES (?, ?, 1)
    ON CONFLICT(period, scope) DO UPDATE SET calls = calls + 1 WHERE calls < ? RETURNING calls`)
    .bind(period, name, max).first();
  try {
    if (!await reserve(day, scope, clientMax)) return 'client_exhausted';
    if (!await reserve(month, 'global', globalMax)) {
      await env.COMMUNITY_DB.prepare('UPDATE web_search_usage SET calls = calls - 1 WHERE period = ? AND scope = ? AND calls > 0')
        .bind(day, scope).run();
      return 'exhausted';
    }
    return 'allowed';
  } catch { return 'unavailable'; }
}
