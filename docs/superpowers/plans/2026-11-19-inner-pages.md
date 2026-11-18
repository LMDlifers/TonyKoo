# Inner Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Give the 8 reports, the research hub, its 14 essays, the log and the colophon the homepage's system: one header, one reading column, Lato, one surface.

**Architecture:** Mostly CSS. Shared tokens go in `css/site-theme.css`, which every page already loads. `css/report.css` and `css/research.css` are edited in place and shrink. The only markup change is the report header, applied to all 8 report files by one script run. One new Playwright check, `scripts/check-pages.mjs`, loads every inner page and owns every new assertion.

**Tech Stack:** HTML, CSS, Python 3 stdlib (one-off header rewrite), Node 22 with Playwright.

**Spec:** `docs/superpowers/specs/2026-11-19-inner-pages-design.md`

## Global Constraints

- **Branch:** `feat/inner-pages` from `main`. Merge by PR.
- **Content is unchanged.** `git diff main -- reports research log.html colophon.html`, with tags stripped, shows no changed words outside the report header.
- **Fonts:** Lato and Inconsolata only on inner pages. No Georgia, no Pixelify Sans.
- **Prose measure:** at most 68 characters (`--measure: 68ch`).
- **Surface:** 1px hairline, 16px radius, no shadow.
- **No uppercase, no letter-spacing** on any text.
- **No sideways scroll** at 320, 390, 768, 1024 and 1440.
- Day and night both pass. Every existing suite stays green.

## Review Focus

1. **Wide content in a narrow column.** Tables, code blocks and the demo video must scroll or scale inside the column at 320px, not push the page wide. Task 3 asserts it on every report.
2. **Night contrast of body text and labels** on every page type, at least 4.5:1. Task 1 asserts it.
3. **Report anchors and the contents list.** In-page links (`#demo-video`, `#sources`) must still land below the sticky header. Task 2 asserts it.
4. **Receipts.** `check-evidence` reads the receipts block by regex; the header rewrite must not touch it. Task 2 runs it.
5. **The theme toggle on reports.** Reports use a text "Dark theme" button with its own JS hook. The new header must keep that hook working. Task 2 asserts a toggle click flips `body.dark-mode` and persists across a reload.

---

### Task 1: The page check and shared tokens

**Files:** Create `scripts/check-pages.mjs`. Modify `css/site-theme.css`, `css/home.css` (use the tokens), `README.md` (add the check to the launch-readiness block).

**Interfaces:** Produces `--card-radius`, `--card-border`, `--measure` on `:root`; and in the check, `PAGES` (every tracked `reports/*.html`, `research/*.html`, `log.html`, `colophon.html`, read from `git ls-files`) and `forEachPage(fn, { night })`.

- [ ] **Step 1:** Write `check-pages.mjs` with the bootstrap and helpers from `scripts/check-home.mjs`. For every page, in day and night, assert:
  - Every text-bearing element's computed `font-family` starts with `Lato` or `Inconsolata`.
  - No text-bearing element has `text-transform: uppercase` or a non-zero `letter-spacing`.
  - Body paragraph contrast is at least 4.5.
  - No sideways scroll at the five widths.
- [ ] **Step 2:** Run it. Expected: FAIL (Georgia, uppercase labels).
- [ ] **Step 3:** Add the three tokens to `:root` in `site-theme.css`. Replace the literal `16px` radius and `1px solid var(--lab-line)` border in `home.css`'s card-surface rule with the tokens. Run `check-home`. Expected: PASS.
- [ ] **Step 4:** Commit: `test: inner page checks (failing); shared surface tokens`.

### Task 2: One header on the reports

**Files:** Modify all 8 `reports/*.html` (the `<nav class="reportNav">` block), `css/report.css`, `scripts/check-pages.mjs`, `scripts/smoke-theme.mjs` (its report toggle selector).

**Interfaces:** Consumes the research header markup: copy the `<header>` element from `research/when-agents-need-search.html` as the template. Produces, on every report, the same header with section label `Case study` and links `Projects` (`../index.html#portfolio`), `Writing` (`../index.html#writing`), `Research` (`../research/`).

- [ ] **Step 1:** Add failing asserts: on every inner page there is exactly one site header; its first link text is `Tony Koo`; it holds a theme toggle; `.reportNav` does not exist. On one report, clicking the toggle flips `body.dark-mode` and the choice survives a reload. On one report, clicking a link to `#sources` leaves that section's top between 0 and 120px.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Rewrite the header in all 8 reports with one Python run that replaces the `reportNav` block. Keep the report's existing theme-toggle hook (same id or data attribute) on the new button. Move the header rules reports need from `research.css` into `site-theme.css` so both page types share one copy; delete `.reportNav*` and `.reportThemeButton` from `report.css`.
- [ ] **Step 4:** Run `check-pages` (header asserts pass), `check-evidence`, `smoke-theme`, `smoke-guide`. Expected: PASS for those.
- [ ] **Step 5:** Commit: `feat: reports use the site header`.

### Task 3: Reports read as one column

**Files:** Modify `css/report.css`, `scripts/check-pages.mjs`, `scripts/check-polish.mjs` (only if an assert names a removed report rule).

- [ ] **Step 1:** Add failing asserts, on every report:
  - Every `p` and `li` directly inside a `.reportSection` is at most 68ch wide (measure the element's width against `1ch` of its own font, tolerance 1ch).
  - `.reportSection`, `.reportHero` and `.reportTldr` have no border, no background different from the page, and no shadow.
  - Every `figure`, `table`, `pre`, `video`, `.modelCard`, `.reportTldrItem` and callout shares one surface (`1px`, `16px`, no shadow).
  - At 320px, no descendant of `main` is wider than the viewport; tables and `pre` scroll inside their own box.
  - Section headings are Lato 700 at 28px (22px below 700px); the report title is 40px (28px below 700px), matching the homepage scale.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement in `report.css`. Shell max-width 960px; prose capped with `max-width: var(--measure)`; wide blocks keep the full 960px. Delete the box rules rather than overriding them. Metadata chips become plain Inconsolata text.
- [ ] **Step 4:** Run `check-pages`, `check-polish`, `smoke-responsive` temp copy. Expected: PASS except research-only asserts.
- [ ] **Step 5:** Screenshot three reports at 1440 and 390, day and night, into `_audit/inner-pages/`. Read each one and fix what looks wrong.
- [ ] **Step 6:** Commit: `feat: reports read as one column`.

### Task 4: Research, log and colophon join the system

**Files:** Modify `css/research.css`, `css/log.css`, `scripts/check-pages.mjs`, `scripts/check-research-navigation.mjs` (only if a selector it uses changes).

- [ ] **Step 1:** Add failing asserts: on every essay, body paragraphs are Lato 18px with line height between 1.6 and 1.7 and at most 68ch wide; every bordered or filled block on research pages, the log and the colophon uses the one surface or has no radius at all (rules and dividers); the hub's essay cards share one surface.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Replace Georgia with `var(--font-body)`. Remove every `text-transform: uppercase` and its `letter-spacing`. Collapse radii of 8, 10, 12, 14 and 20px to `var(--card-radius)`; leave `50%` avatars and `0`. Remove the three shadows.
- [ ] **Step 4:** Run `check-pages` (all PASS now), `check-research-navigation`, `check-evidence`, `smoke-guide`. Expected: PASS.
- [ ] **Step 5:** Screenshot the hub, two essays, the log and the colophon at 1440 and 390, day and night, into `_audit/inner-pages/`. Read each one and fix what looks wrong.
- [ ] **Step 6:** Commit: `feat: research, log and colophon in the site system`.

### Task 5: Content proof, full suite, review, ship

- [ ] **Step 1:** Prove the content is unchanged. For each inner page, strip tags from the `main` version and the branch version and diff the words. The only differences allowed are the report header words (`Tony Koo`, `Case study`, `Projects`, `Writing`, `Research`, and the old pill labels). Save the command and its output summary in `_audit/inner-pages/content-diff.md`.
- [ ] **Step 2:** Update `colophon.html` only if a sentence in it is now false (it names the typefaces). Rerun Step 1 with that sentence listed.
- [ ] **Step 3:** Run the full suite (`check-*`, `smoke-*`, `node --test`, the `smoke-responsive` temp copy). Check `uptime` first. Expected: all PASS.
- [ ] **Step 4:** Run a fresh-context review on the most capable model, then one TDD fix pass.
- [ ] **Step 5:** Push, open the PR, merge, wait for the Pages build of the merge commit. Confirm the live `reports/faiss-caching-llm-cost-latency.html` has no `reportNav` and the live `css/research.css` has no `Georgia`.
