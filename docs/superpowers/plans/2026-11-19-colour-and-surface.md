# Colour and Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Move the site to warm neutral tones with tonal surfaces and pill controls, as in the approved colour spec.

**Architecture:** Colour lives in tokens in `css/site-theme.css`, which every page loads. The palette changes there. Hard-coded night colours elsewhere are mapped to the new values in one scripted pass. Surface rules already sit in three places (`css/home.css`, `css/report.css`, `css/research.css`) and each changes in place. The surface assertions in `scripts/check-home.mjs` and `scripts/check-pages.mjs` change with them.

**Tech Stack:** CSS, Python 3 stdlib (one mapping pass), Node 22 with Playwright.

**Spec:** `docs/superpowers/specs/2026-11-19-colour-and-surface-design.md`

## Global Constraints

- **Branch:** `feat/colour-surface` from `main`. Merge by PR.
- **Night palette:** page `#161514`, panel `#201f1d`, control `#2b2927`, line `#3a3733`, text `#ece9e4`, body `#d6d2cb`, muted `#a8a29a`, accent `#cf9265`, text on accent `#161514`.
- **Day palette:** page `#f6f4ee`, panel `#efece4`, control `#e6e2d8`, accent `#2f5d50` (unchanged), text unchanged.
- **Surface:** no border, 20px radius, no shadow, fill one tonal step from the page.
- **Controls:** pill radius on buttons, the theme toggles, the Ask launcher, the Find field and filter tabs.
- Text contrast at least 4.5:1, and focus rings at least 3:1, in both themes.
- No content, layout or motion change.

## Review Focus

1. **Text on the new panels.** Muted text was tuned for white panels by day and blue-grey by night. Task 1 asserts 4.5:1 for body, muted and link text on both the page and a panel.
2. **Accent used as a fill.** The primary button, active filter and progress bars use the accent as background. Task 1 asserts the text on them reaches 4.5:1 at night.
3. **Hard-coded night colours left behind.** A cool blue-grey box on a warm page is the likely miss. Task 1 asserts that at night no visible element's background is within the old graphite-blue family.
4. **Diagrams and screenshots with white backgrounds.** On tonal panels they must still read as intentional. Task 2 gives images inside surfaces a faint outline and checks it.
5. **The field art.** Its night SVG has its own palette and stays as it is; Task 3 looks at it against the new page colour.

---

### Task 1: The palette

**Files:** Modify `css/site-theme.css` (tokens), every non-vendor file in `css/` (mapped night hex values), `scripts/check-pages.mjs`, `scripts/check-home.mjs`.

- [ ] **Step 1:** Add failing asserts. On the homepage, one report, the research hub and one essay, at night: `body` background is `rgb(22, 21, 20)`; link colour is `rgb(207, 146, 101)`; no visible element has a background whose blue channel exceeds its red channel by more than 6 (the old graphite-blue family), excluding images, the field and embedded diagrams. By day: card backgrounds are `rgb(239, 236, 228)`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Change the tokens. Map the old night values (`#121519`, `#191e23`, `#1f242a`, `#20252a`, `#242b32`, `#28323a`, `#2b333a`, `#303840`, `#3c454e`, `#14191d`, `#f3f5f6`, `#d2d9df`, `#b7c2cb`, `#bbc5cd`, `#aab5be`, `#dce5eb`, `#a5c0d2`, and their `rgba()` forms) to the new palette across `css/`.
- [ ] **Step 4:** Run `check-pages`, `check-home`, `check-craft`, `smoke-theme`. Fix each contrast failure by adjusting the token, not the check. Expected: PASS except the surface asserts changed in Task 2.
- [ ] **Step 5:** Commit: `feat: warm neutral palette with a clay night accent`.

### Task 2: Tonal surfaces and pill controls

**Files:** Modify `css/site-theme.css` (`--card-radius: 20px`), `css/home.css`, `css/report.css`, `css/research.css`, `css/craft.css` (button radii), `css/chat-overlay.css` and `css/guide-widget.css` (launcher and Find field), `scripts/check-home.mjs`, `scripts/check-pages.mjs`.

- [ ] **Step 1:** Change the surface asserts in both checks from `1px|16px|none` to: border width 0 (one accent edge still allowed), radius 20px, no shadow, and a background that differs from the page background. Add: the hero primary button, both theme toggles, the Ask launcher and the research filter tabs have a radius of at least half their height; every `img` inside a surface has a 1px outline.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `check-pages`, `check-home`, `check-craft` (its press-state asserts must still pass on pill buttons), `check-motion`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: tonal surfaces and pill controls`.

### Task 3: Look, suite, review, ship

- [ ] **Step 1:** Screenshot the homepage (top, work, resume, contact), one report, the hub and one essay at 1440 and 390 in both themes into `_audit/colour/`. Read every one. Fix what looks wrong.
- [ ] **Step 2:** Run the full suite. Expected: all PASS.
- [ ] **Step 3:** Update `colophon.html` if it names colours. Commit.
- [ ] **Step 4:** Fresh-context review on the most capable model; one fix pass.
- [ ] **Step 5:** Push, open the PR, merge, wait for the Pages build, and confirm the live `css/site-theme.css` contains `#161514`.
