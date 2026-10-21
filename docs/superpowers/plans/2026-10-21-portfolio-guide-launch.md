# Portfolio Guide Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the existing portfolio guide prototype reviewable, accessible, and safe to connect to a live AI service.

**Architecture:** Keep GitHub Pages as the static site and client-side search. Use a separate Cloudflare Worker for retrieval and model inference from approved public excerpts. Keep the two deployment steps independent.

**Tech Stack:** HTML, CSS, ES modules, Python index builder, Node test runner, Cloudflare Workers AI.

**Spec:** `docs/superpowers/specs/2026-10-21-portfolio-guide-launch-design.md`

## Global Constraints

- Preserve the existing portfolio and research pages.
- Do not index private or unpublished documents.
- Keep search functional without the Worker.
- Respect reduced-motion preferences and keyboard navigation.
- Do not expose secrets in browser JavaScript.

## Review Focus

- Unknown citation IDs must invalidate an answer rather than silently disappear.
- Search-only external links must not enter model evidence.
- Invalid, oversized, or non-JSON requests must not call the model.
- The dialog must close with Escape and restore focus to the launcher.
- A failed Worker call must show local search results.

---

### Task 1: Grounding and request boundaries

**Files:**
- Modify: `js/guide-core.mjs`
- Modify: `assistant-api/worker.mjs`
- Modify: `scripts/build-guide-index.py`
- Modify: `tests/guide-core.test.mjs`, `tests/guide-worker.test.mjs`, `tests/guide-index.test.mjs`
- Regenerate: `data/guide-sources.mjs`

**Interfaces:**
- Consumes: `searchSources(query, sources, limit)`, `validateAnswer(draft, retrieved)`
- Produces: response with `status`, `answer`, and verified `citations`

- [x] Write tests for invented IDs, search-only source filtering, malformed body, and body limit.
- [x] Run focused tests and observe the expected failures.
- [x] Implement the minimal validation, filtering, and request limits.
- [x] Regenerate the index; run focused tests and the existing launch checks.
- [x] Commit the grounded Worker and index.

### Task 2: Accessible optional guide

**Files:**
- Modify: `js/guide-widget.mjs`
- Modify: `css/guide-widget.css`
- Modify: `tests/guide-integration.test.mjs`

**Interfaces:**
- Consumes: source index and optional Worker endpoint.
- Produces: keyboard-usable guide dialog and local-search fallback.

- [x] Add a test for the public-page assets and the dialog contract.
- [x] Run it and observe the expected failure.
- [x] Replace the panel's ad hoc visibility handling with native dialog open and close behavior; preserve focus and reduced motion.
- [x] Run tests and inspect desktop and mobile previews.
- [x] Commit the UI change.

### Task 3: Launch evidence and integration

**Files:**
- Modify: `assistant-api/README.md`
- Create: `docs/guide-evaluation.md`

**Interfaces:**
- Consumes: site preview, Worker endpoint, and approved source index.
- Produces: reproducible setup and a question-based launch review.

- [x] Document exact Cloudflare setup and endpoint configuration.
- [x] Record representative questions and checks for unsupported claims, citation support, failure fallback, keyboard use, and mobile layout.
- [x] Run local tests, launch checks, and guide browser smoke test; record the full responsive-suite limitation.
- [x] Commit the reviewable local release.
