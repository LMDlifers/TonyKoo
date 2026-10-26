# Portfolio work guide

The site guide searches approved public pages in the browser. It also calls a Cloudflare Worker for optional source-backed AI answers. The frontend uses `https://tony-portfolio-guide.assistant-api.workers.dev/ask`; visitors do not need an API key. If the answer service fails or times out, the guide still links to matching public pages.

The Worker uses the Workers AI binding with `@cf/zai-org/glm-4.7-flash`. Its prompt asks for concise JSON answers, keeps recommendations distinct from completed work, and rejects unverifiable citation IDs. It checks the GitHub Pages origin and limits request size. The source set combines published site pages with four reviewed primary-source summaries in `data/primary-sources.mjs`. Model answers can still be wrong, so periodically review real answers against the cited pages.

The `/chat/` page keeps the current tab's chat in `sessionStorage`. Only an explicitly reviewed share is stored in D1. A share has a random unlisted ID, expires after 30 days, and can be revoked with a key kept in the creator's browser. The full chat page lists links created in that browser; clearing local storage loses early-revocation ability. Feedback stores answer ID, rating, source IDs and optional comment, not the conversation. Feedback is deleted after 90 days by the daily cleanup trigger. The Worker signs answer receipts so a shared question, answer and source IDs cannot be substituted. Atomic D1 counters cap model invocations at 250, new shares at 100, and feedback submissions at 500 per UTC day. This bounds usage alongside the request-size and completion-token limits; it is a call ceiling, not a dollar billing alarm. Per-IP rate limits remain soft and location-scoped. The origin check is not authentication.

## Local checks

From the repository root, run `python3 -m http.server 8000` and open `http://localhost:8000/`. Local preview can search pages, but the production Worker rejects the localhost browser origin by design.

Run `python3 scripts/build-guide-index.py` after editing a public research or report page. Then run:

- `node --test tests/guide-*.test.mjs`
- `node --test tests/community-worker.test.mjs tests/primary-sources.test.mjs`
- `node scripts/check-launch-readiness.mjs`
- `node scripts/check-research-navigation.mjs`
- `node scripts/smoke-guide.mjs` while the local server is running
- `node scripts/smoke-chat.mjs` while the local server is running
- `node scripts/smoke-shared.mjs` while the local server is running

The browser smoke script accepts `SITE_BASE_URL`, `PLAYWRIGHT_MODULE`, and `PLAYWRIGHT_BROWSER_EXECUTABLE` when the local environment needs overrides.

## Worker maintenance

From `assistant-api/`, run `npx wrangler d1 migrations apply tony-community-chat --remote` before deploying a schema change. Set `FEEDBACK_SIGNING_KEY` as a Wrangler secret (at least 32 random characters); never commit it. Then run `npx wrangler deploy` while authenticated to the portfolio's Cloudflare account. The `RATE_LIMITER` binding limits questions and `COMMUNITY_RATE_LIMITER` limits shares and feedback; both use per-location counters. Do not commit Cloudflare credentials or add unpublished documents to the source index. After deployment, test `POST /ask`, one share create/read/revoke flow, duplicate feedback rejection, unsupported personal claims and the browser fallback. See `docs/guide-evaluation.md` for the question set.

Cloudflare Workers AI usage may incur charges. The model setting disables extended reasoning for short guide answers; check Cloudflare usage and latency after changes to the model or evidence index.
