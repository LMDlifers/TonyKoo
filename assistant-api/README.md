# Portfolio work guide

The site guide searches approved public pages in the browser. It also calls a Cloudflare Worker for optional source-backed AI answers. The frontend uses `https://tony-portfolio-guide.assistant-api.workers.dev/ask`; visitors do not need an API key. If the answer service fails or times out, the guide still links to matching public pages.

The Worker uses the Workers AI binding with `@cf/zai-org/glm-4.7-flash`. Its prompt asks for concise JSON answers, keeps recommendations distinct from completed work, and rejects unverifiable citation IDs. It configures a 10-request-per-minute per-IP rate limit, checks the GitHub Pages origin, and limits request size. Cloudflare rate-limit counters are per location and eventually consistent; this is a soft safeguard, not a hard spending cap. The origin check is not authentication. Model answers can still be wrong, so periodically review real answers against the cited pages. The Worker does not store conversations. The `/chat/` page keeps the current tab's chat in `sessionStorage` so visitors can reload it; closing the tab ends that local session.

## Local checks

From the repository root, run `python3 -m http.server 8000` and open `http://localhost:8000/`. Local preview can search pages, but the production Worker rejects the localhost browser origin by design.

Run `python3 scripts/build-guide-index.py` after editing a public research or report page. Then run:

- `node --test tests/guide-*.test.mjs`
- `node scripts/check-launch-readiness.mjs`
- `node scripts/check-research-navigation.mjs`
- `node scripts/smoke-guide.mjs` while the local server is running
- `node scripts/smoke-chat.mjs` while the local server is running

The browser smoke script accepts `SITE_BASE_URL`, `PLAYWRIGHT_MODULE`, and `PLAYWRIGHT_BROWSER_EXECUTABLE` when the local environment needs overrides.

## Worker maintenance

From `assistant-api/`, run `npx wrangler deploy` while authenticated to the portfolio's Cloudflare account. The `RATE_LIMITER` namespace in `wrangler.toml` is dedicated to this guide. Do not commit Cloudflare credentials or add unpublished documents to the source index. After deployment, test `POST /ask` from `https://lmdlifers.github.io`, check a factual answer and its linked page, then test unsupported personal claims and the browser fallback. See `docs/guide-evaluation.md` for the question set.

Cloudflare Workers AI usage may incur charges. The model setting disables extended reasoning for short guide answers; check Cloudflare usage and latency after changes to the model or evidence index.
