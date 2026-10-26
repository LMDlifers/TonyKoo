import sources from '../data/guide-sources.mjs';
import primarySources from '../data/primary-sources.mjs';

const allowedIds = new Set([...sources.filter((source) => !source.searchOnly), ...primarySources].map((source) => source.id));
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SHARE_LIFETIME = 30 * 86400_000;
const RECEIPT_LIFETIME = 7 * 86400_000;
const MAX_COMMUNITY_BODY = 16000;
const UUID = /^[a-f0-9-]{36}$/i;
const SHARE_ID = /^[A-Za-z0-9_-]{22,64}$/;

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function unbase64url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 2000) throw Error('Invalid token');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}
async function digest(value) { return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))); }
async function keyFor(secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw Error('Signing key unavailable');
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function sealAnswer(answer, env, question) {
  if (!env.FEEDBACK_SIGNING_KEY) return answer;
  const sourceIds = answer.citations?.map(({ id }) => id) || [];
  if (sourceIds.some((id) => !allowedIds.has(id))) return answer;
  const answerId = crypto.randomUUID();
  const payload = {
    v: 1, id: answerId, status: answer.status, sourceIds,
    answerHash: await digest(answer.answer), questionHash: await digest(question), exp: Date.now() + RECEIPT_LIFETIME,
  };
  const encoded = base64url(encoder.encode(JSON.stringify(payload)));
  const signature = base64url(new Uint8Array(await crypto.subtle.sign('HMAC', await keyFor(env.FEEDBACK_SIGNING_KEY), encoder.encode(encoded))));
  return { ...answer, answerId, receipt: `${encoded}.${signature}` };
}

async function verifyReceipt(receipt, env) {
  if (typeof receipt !== 'string' || receipt.length > 1800) return null;
  const parts = receipt.split('.');
  if (parts.length !== 2) return null;
  try {
    const valid = await crypto.subtle.verify('HMAC', await keyFor(env.FEEDBACK_SIGNING_KEY),
      unbase64url(parts[1]), encoder.encode(parts[0]));
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(unbase64url(parts[0])));
    if (payload.v !== 1 || !UUID.test(payload.id) || !Number.isFinite(payload.exp)
      || payload.exp < Date.now() || payload.exp > Date.now() + RECEIPT_LIFETIME + 60000
      || !['supported', 'inference', 'unknown'].includes(payload.status)
      || !Array.isArray(payload.sourceIds) || payload.sourceIds.length > 4
      || payload.sourceIds.some((id) => !allowedIds.has(id))
      || typeof payload.answerHash !== 'string' || typeof payload.questionHash !== 'string') return null;
    return payload;
  } catch { return null; }
}

function response(body, status, origin, noindex = false) {
  return new Response(JSON.stringify(body), { status, headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store',
    'x-robots-tag': noindex ? 'noindex, nofollow, noarchive' : 'noindex',
    vary: 'Origin',
  } });
}

async function readBody(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return { error: 415 };
  const reader = request.body?.getReader();
  if (!reader) return { error: 400 };
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_COMMUNITY_BODY) { await reader.cancel(); return { error: 413 }; }
    chunks.push(value);
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const body = JSON.parse(decoder.decode(bytes));
    return body && typeof body === 'object' && !Array.isArray(body) ? { body } : { error: 400 };
  } catch { return { error: 400 }; }
}

async function verifiedTranscript(turns, env) {
  if (!Array.isArray(turns) || turns.length < 2 || turns.length > 16 || turns.length % 2) return null;
  const snapshot = [];
  let chars = 0;
  for (let i = 0; i < turns.length; i += 2) {
    const question = turns[i];
    const answer = turns[i + 1];
    if (question?.role !== 'user' || typeof question.content !== 'string'
      || question.content.trim().length < 3 || question.content.length > 400
      || answer?.role !== 'assistant' || typeof answer.content !== 'string'
      || !answer.content.trim() || answer.content.length > 1200
      || !UUID.test(answer.answerId || '') || !Array.isArray(answer.citations)) return null;
    const proof = await verifyReceipt(answer.receipt, env);
    if (!proof || proof.id !== answer.answerId || proof.status !== answer.status
      || await digest(question.content) !== proof.questionHash
      || await digest(answer.content) !== proof.answerHash
      || JSON.stringify(answer.citations) !== JSON.stringify(proof.sourceIds)) return null;
    chars += question.content.length + answer.content.length;
    snapshot.push({ role: 'user', content: question.content },
      { role: 'assistant', content: answer.content, status: proof.status,
        citations: proof.sourceIds, answerId: proof.id });
  }
  return chars <= 10000 ? snapshot : null;
}

async function limitCommunity(request, env) {
  if (!env.COMMUNITY_RATE_LIMITER) return false;
  try {
    const key = `${request.method}:${new URL(request.url).pathname.startsWith('/feedback') ? 'feedback' : 'shares'}:${request.headers.get('cf-connecting-ip') || 'local'}`;
    return (await env.COMMUNITY_RATE_LIMITER.limit({ key })).success;
  } catch { return false; }
}

export async function handleCommunity(request, env, origin, pathname) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
    'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type', vary: 'Origin',
  } });
  if (!env.COMMUNITY_DB || !env.FEEDBACK_SIGNING_KEY || !env.COMMUNITY_RATE_LIMITER) {
    return response({ error: 'Community features unavailable' }, 503, origin);
  }
  if (!await limitCommunity(request, env)) return response({ error: 'Please wait before trying again' }, 429, origin);
  const match = pathname.match(/^\/shares\/([A-Za-z0-9_-]{22,64})$/);
  if (pathname === '/shares' && request.method === 'POST') {
    const input = await readBody(request);
    if (input.error) return response({ error: 'Invalid request' }, input.error, origin);
    const snapshot = await verifiedTranscript(input.body.turns, env);
    if (!snapshot) return response({ error: 'Share only unchanged, recent answers' }, 400, origin);
    const fingerprint = await digest(JSON.stringify(snapshot));
    try {
      const duplicate = await env.COMMUNITY_DB.prepare('SELECT id FROM shares WHERE fingerprint = ? AND expires_at > ?')
        .bind(fingerprint, Date.now()).first();
      if (duplicate) return response({ error: 'These exchanges already have a share link in this browser.' }, 409, origin);
    } catch { return response({ error: 'Sharing is unavailable right now.' }, 503, origin); }
    const budget = await reserveDailyShare(env);
    if (budget === 'exhausted') return response({ error: 'Today’s share limit is reached. Try again tomorrow.' }, 429, origin);
    if (budget === 'unavailable') return response({ error: 'Sharing is unavailable right now.' }, 503, origin);
    const id = base64url(crypto.getRandomValues(new Uint8Array(18)));
    const revokeToken = base64url(crypto.getRandomValues(new Uint8Array(32)));
    const createdAt = Date.now();
    const expiresAt = createdAt + SHARE_LIFETIME;
    try {
      await env.COMMUNITY_DB.prepare('INSERT INTO shares(id, transcript, created_at, expires_at, revoke_hash, fingerprint) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, JSON.stringify(snapshot), createdAt, expiresAt, await digest(revokeToken), fingerprint).run();
      return response({ id, revokeToken, expiresAt }, 201, origin, true);
    } catch (error) {
      return response({ error: String(error).includes('UNIQUE') ? 'These exchanges already have a share link.' : 'Could not create share' },
        String(error).includes('UNIQUE') ? 409 : 503, origin);
    }
  }
  if (match && request.method === 'GET') {
    try {
      const row = await env.COMMUNITY_DB.prepare('SELECT transcript, expires_at FROM shares WHERE id = ? AND expires_at > ?')
        .bind(match[1], Date.now()).first();
      return row ? response({ turns: JSON.parse(row.transcript), expiresAt: row.expires_at }, 200, origin, true)
        : response({ error: 'Share unavailable or expired' }, 404, origin, true);
    } catch { return response({ error: 'Share unavailable' }, 503, origin, true); }
  }
  if (match && request.method === 'DELETE') {
    const input = await readBody(request);
    if (input.error) return response({ error: 'Invalid request' }, input.error, origin);
    const token = input.body.revokeToken;
    if (typeof token !== 'string' || token.length !== 43) return response({ error: 'Invalid revoke token' }, 403, origin);
    try {
      const result = await env.COMMUNITY_DB.prepare('DELETE FROM shares WHERE id = ? AND revoke_hash = ?')
        .bind(match[1], await digest(token)).run();
      return result.meta?.changes || result.changes ? response({ revoked: true }, 200, origin, true)
        : response({ error: 'Share unavailable' }, 403, origin, true);
    } catch { return response({ error: 'Could not revoke share' }, 503, origin, true); }
  }
  if (pathname === '/feedback' && request.method === 'POST') {
    const input = await readBody(request);
    if (input.error) return response({ error: 'Invalid request' }, input.error, origin);
    const { answerId, receipt, rating } = input.body;
    const comment = input.body.comment ?? '';
    if (!UUID.test(answerId || '') || !['helpful', 'not_helpful'].includes(rating)
      || typeof comment !== 'string' || comment.length > 280) return response({ error: 'Invalid feedback' }, 400, origin);
    const proof = await verifyReceipt(receipt, env);
    if (!proof || proof.id !== answerId) return response({ error: 'Invalid answer receipt' }, 400, origin);
    try {
      const previous = await env.COMMUNITY_DB.prepare('SELECT answer_id FROM feedback WHERE answer_id = ?').bind(answerId).first();
      if (previous) return response({ error: 'Feedback already recorded' }, 409, origin);
    } catch { return response({ error: 'Feedback is unavailable right now.' }, 503, origin); }
    const budget = await reserveDailyFeedback(env);
    if (budget === 'exhausted') return response({ error: 'Today’s feedback limit is reached. Try again tomorrow.' }, 429, origin);
    if (budget === 'unavailable') return response({ error: 'Feedback is unavailable right now.' }, 503, origin);
    try {
      await env.COMMUNITY_DB.prepare('INSERT INTO feedback(answer_id, rating, comment, source_ids, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(answerId, rating, comment.trim(), JSON.stringify(proof.sourceIds), Date.now()).run();
      return response({ saved: true }, 201, origin);
    } catch (error) {
      return response({ error: String(error).includes('UNIQUE') ? 'Feedback already recorded' : 'Could not save feedback' },
        String(error).includes('UNIQUE') ? 409 : 503, origin);
    }
  }
  return response({ error: 'Not found' }, 404, origin);
}

export async function reserveDailyCall(env) {
  if (!env.MAX_DAILY_AI_CALLS) return 'allowed';
  const max = Number(env.MAX_DAILY_AI_CALLS);
  if (!env.COMMUNITY_DB || !Number.isSafeInteger(max) || max < 1) return 'unavailable';
  const day = new Date().toISOString().slice(0, 10);
  try {
    const row = await env.COMMUNITY_DB.prepare(`INSERT INTO daily_ai_usage(day, calls) VALUES (?, 1)
      ON CONFLICT(day) DO UPDATE SET calls = calls + 1 WHERE calls < ? RETURNING calls`)
      .bind(day, max).first();
    return row ? 'allowed' : 'exhausted';
  } catch { return 'unavailable'; }
}

async function reserveDailyShare(env) {
  const max = Number(env.MAX_DAILY_SHARES);
  if (!env.COMMUNITY_DB || !Number.isSafeInteger(max) || max < 1) return 'unavailable';
  const day = new Date().toISOString().slice(0, 10);
  try {
    const row = await env.COMMUNITY_DB.prepare(`INSERT INTO daily_share_usage(day, shares) VALUES (?, 1)
      ON CONFLICT(day) DO UPDATE SET shares = shares + 1 WHERE shares < ? RETURNING shares`)
      .bind(day, max).first();
    return row ? 'allowed' : 'exhausted';
  } catch { return 'unavailable'; }
}

async function reserveDailyFeedback(env) {
  const max = Number(env.MAX_DAILY_FEEDBACK);
  if (!env.COMMUNITY_DB || !Number.isSafeInteger(max) || max < 1) return 'unavailable';
  const day = new Date().toISOString().slice(0, 10);
  try {
    const row = await env.COMMUNITY_DB.prepare(`INSERT INTO daily_feedback_usage(day, submissions) VALUES (?, 1)
      ON CONFLICT(day) DO UPDATE SET submissions = submissions + 1 WHERE submissions < ? RETURNING submissions`)
      .bind(day, max).first();
    return row ? 'allowed' : 'exhausted';
  } catch { return 'unavailable'; }
}

export async function cleanupCommunity(env) {
  if (!env.COMMUNITY_DB) return;
  const now = Date.now();
  await env.COMMUNITY_DB.prepare('DELETE FROM shares WHERE expires_at <= ?').bind(now).run();
  await env.COMMUNITY_DB.prepare('DELETE FROM feedback WHERE created_at < ?').bind(now - 90 * 86400_000).run();
  await env.COMMUNITY_DB.prepare('DELETE FROM daily_ai_usage WHERE day < ?')
    .bind(new Date(now - 3 * 86400_000).toISOString().slice(0, 10)).run();
  await env.COMMUNITY_DB.prepare('DELETE FROM daily_share_usage WHERE day < ?')
    .bind(new Date(now - 3 * 86400_000).toISOString().slice(0, 10)).run();
  await env.COMMUNITY_DB.prepare('DELETE FROM daily_feedback_usage WHERE day < ?')
    .bind(new Date(now - 3 * 86400_000).toISOString().slice(0, 10)).run();
}
