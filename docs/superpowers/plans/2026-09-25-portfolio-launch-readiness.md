# Portfolio Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Tony Koo's portfolio ready for LinkedIn sharing with a valid social card, current and defensible copy, clear team-project ownership, focused hero actions, and mobile regression coverage.

**Architecture:** Preserve the dependency-free static GitHub Pages site. Add a deterministic SVG-to-PNG social card, a Node launch-readiness contract, and bounding-box assertions to the existing Playwright smoke test.

**Tech Stack:** HTML5, CSS3, Node.js built-ins, Playwright, SVG, `rsvg-convert`, GitHub Pages.

**Spec:** `/Users/kootony/.codex/attachments/26876b40-2372-4159-8a13-f817907fcd29/pasted-text.txt`

## Global Constraints

- Work in `/Users/kootony/Documents/Github/TonyKoo` on `main`, as explicitly authorized by the user.
- Add no package manager, runtime dependency, analytics, or framework.
- The LinkedIn PNG is exactly 1200 x 627, PNG, and at most 5 MB.
- Use `Graduated Jun 2026` and never invent an extraction sample size.
- Present IBKR as a two-contributor research prototype with evidence-bounded claims.
- Keep exactly two hero actions: `View Projects` and `Download Résumé`.
- Do not restructure the homepage, edit the GitHub profile, or change responsive CSS unless the bounding-box test fails.

## Review Focus

- Social images with missing metadata, wrong dimensions, relative URLs, or excessive size must fail verification.
- Stale student/graduation language, ambiguous CV language, and overstated trading claims must fail verification.
- Visible hero blocks must stay within the viewport at all supported widths.
- Team repository links must be canonical, safely opened, and clearly collaborative.
- The deployed HTML and image must be publicly fetchable before refreshing LinkedIn's cache.

---

### Task 1: Social Preview Asset and Metadata

**Files:**
- Create: `images/portfolio/linkedin-preview.svg`
- Create: `images/portfolio/linkedin-preview.png`
- Create: `scripts/check-launch-readiness.mjs`
- Modify: `index.html`

**Interfaces:**
- Produces the public social-card asset and Open Graph/Twitter metadata contract consumed by LinkedIn and Task 2's expanded checks.

- [ ] Write and run the failing metadata/image contract.
- [ ] Create the hero-based SVG and render it to an exact 1200 x 627 PNG.
- [ ] Replace title, description, Open Graph, and Twitter metadata.
- [ ] Run the contract, inspect the card, and commit `feat: add LinkedIn social preview card`.

### Task 2: Correct Status, Claims, Ownership, and Hero Actions

**Files:**
- Modify: `index.html`
- Modify: `scripts/check-launch-readiness.mjs`

**Interfaces:**
- Consumes Task 1's launch-readiness contract and expands it to cover user-visible copy and links.
- Produces current graduation status, defensible extraction and IBKR wording, and two focused hero actions.

- [ ] Add and run failing content-contract assertions.
- [ ] Replace hero actions with `View Projects` and `Download Résumé`.
- [ ] Replace expected-graduation copy with `Graduated Jun 2026`.
- [ ] Clarify the approximate field-level questionnaire extraction result and evidence boundary.
- [ ] Rewrite the IBKR entries as a two-contributor research prototype and use the canonical repository URL.
- [ ] Run the contract and commit `content: clarify portfolio claims and status`.

### Task 3: Mobile Regression Coverage and Maintenance Documentation

**Files:**
- Modify: `scripts/smoke-responsive.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes the final Task 2 hero markup.
- Produces browser-level clipping checks and documented social-card/test workflows.

- [ ] Add hero bounding-box measurements to the existing browser evaluation.
- [ ] Make clipped visible hero blocks fail the smoke test.
- [ ] Document local checks and social-card regeneration.
- [ ] Run metadata, content, responsive, and diff verification.
- [ ] Commit `test: add portfolio launch readiness checks`.

## Deployment and Acceptance

- Push the reviewed commits to `origin/main`.
- Verify the deployed HTML exposes the new metadata and `Graduated Jun 2026`.
- Fetch the deployed PNG and confirm it remains 1200 x 627.
- Refresh `https://lmdlifers.github.io/TonyKoo/` with LinkedIn Post Inspector.
- Accept only when the card is legible, all contracts pass, team ownership is explicit, and no tested viewport clips or overflows.
