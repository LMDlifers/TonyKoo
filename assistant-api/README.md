# Portfolio work guide

The portfolio guide searches the public site even when no AI service is configured. Its optional answer service is a Cloudflare Worker using the Workers AI binding and `@cf/zai-org/glm-4.7-flash`. Visitors never need an API key. The chosen binding does not require a separate model-provider key; deploying it requires access to a Cloudflare account.

## Local preview and checks

From the repository root, run `python3 -m http.server 8000`, then open `http://localhost:8000/`. The guide says “Search preview” while `endpoint` in `js/guide-widget.mjs` is blank.

Run:
- `python3 scripts/build-guide-index.py`
- `node --test tests/guide-*.test.mjs`
- `node scripts/check-launch-readiness.mjs`
- `node scripts/check-research-navigation.mjs`
- `node scripts/smoke-guide.mjs` while the server is running

The browser smoke script accepts `SITE_BASE_URL`, `PLAYWRIGHT_MODULE`, and `PLAYWRIGHT_BROWSER_EXECUTABLE` when the local environment needs overrides.

## Connect AI answers

1. Review `data/guide-sources.mjs` and `docs/guide-evaluation.md`. The index is generated from already-published research and report pages, a curated summary of the public homepage, and two search-only GitHub links. Do not add unpublished documents or unverified contribution claims. Rebuild the index after edits to public pages.
2. Create or sign in to a Cloudflare account. In `assistant-api/wrangler.toml`, set the rate-limiter `namespace_id` to a positive-integer string unique to this account. This is a rate-limit namespace, not an API key.
3. From `assistant-api/`, run `npx wrangler login` and then `npx wrangler deploy`. Confirm the Worker reports an HTTPS URL and accepts `POST /ask` from the published site.
4. Set the `endpoint` constant at the top of `js/guide-widget.mjs` to that URL plus `/ask`. Run the checks again and test from the deployed GitHub Pages origin before publishing the frontend change.
5. Review real answers against the question set and monitor Workers AI usage. The rate limiter is set to 10 requests per minute per IP. Cloudflare usage or a paid plan may incur charges.

The Worker rejects other browser origins, limits question and body size, searches public evidence, and rejects answers with invented citation IDs. Origin checks are not authentication, and a valid citation ID does not prove the cited page supports a sentence. Complete the manual citation review before enabling public AI answers. The app does not intentionally store conversation history or visitor data.
