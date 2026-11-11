# Portfolio Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the generated-looking tells and CSS defects the audit found, keeping the current layout. Give the case studies priority over the field scene and the chat.

**Architecture:** Static GitHub Pages site (`index.html`, `css/*.css`, `js/*.js`). A new static check, `scripts/check-polish.mjs`, encodes the structural decisions as assertions. Hallmark `sloplint` gate counts verify the tell removal. The existing check, smoke and test suites guard against regressions.

**Tech Stack:** HTML, CSS, jQuery and ES modules; Node 22 `node:assert` scripts; Playwright (`PLAYWRIGHT_MODULE`); `python3 -m http.server 8000`; Hallmark `sloplint.mjs`.

**Spec:** `_audit/2026-11-09-strategy-and-ui-research.md` §4 and grill rounds 1–2. Decisions: polish depth; keep the nav Chat link and `.findAskLauncher`; move the field scene below the projects; grid is the default view.

## Global Constraints

- **Work on branch `polish/hallmark-audit`.** Pages deploys from `main`, so never push to `main` from this plan. Merge by PR only after review.
- Polish depth: no section is added, removed or reordered, except that `.fieldScene` moves out of the hero.
- Keep every link, id, `data-*` attribute, script hook and test hook. `scripts/check-portfolio-field.mjs` must pass unchanged.
- Keep the nav `Chat` link (`href="chat/"`) and `.findAskLauncher`. Remove only `.heroGuideLine`.
- No new dependencies. No palette or typeface changes. Lato stays as the body face.
- Every animation keeps a `prefers-reduced-motion: reduce` fallback.

## Review Focus

1. **JS off:** `.resumeSubsection` must be visible. Task 5 pins this.
2. **Mobile 320–390 after the field moves:** the launcher must not cover the field controls. `check-portfolio-field.mjs` pins this.
3. **Field routing after the move:** `check-field-routing.mjs` must pass. `id="field"` is unused on origin/main today (checked).
4. **Grid default with a filter active:** the filter still applies. Task 4 pins this.
5. **Dark mode in the moved section:** the night map must still load. `check-portfolio-field.mjs` runs in dark mode.

## Baseline facts (origin/main @ 2d77078, linted in a detached worktree)

- Local `main` is 48 commits behind `origin/main`. All refs below are from origin/main.
- Hero: `index.html:109-212`. `.fieldIntro` (eyebrow `:112`, `.heroGuideLine` `:128`), then `.fieldScene` from `:130`.
- Gate 54 eyebrows at `index.html` lines 112, 240, 791, 811, 910, 915, 920, 1197, 1359, 1385.
- Gate 38i: italics inside `<h4>` at 1203, 1217, 1231, 1245.
- Gate 63:
  - Decorative dots at 829.
  - "SKEZI - Data Scientist Intern" at 911.
  - Arrow glued to a label at 1551.
  - Middle-dot meta strings at 145, 203, 1564, 1594, 1624, 1654, 1684.
- `setProjectView("deck")` is at `js/script.js:446`. The dark-mode inline `<script>` is at `index.html:65`.
- `css/style.css`:
  - Gate 10a: `transition: all` at 331, 442, 455, 767, 785, 804, 823, 839, 1150, 1241, 1350, 1421, 1485, 3290, 3337, 3778. Width or left animated at 517, 756, 1437, 1593, 4221.
  - Gate 34: `body { overflow-x: hidden }` at 73, and `body.command-open` at 5529. (2250 is `.filterItem`, not body: leave it.)
  - Gate 6a: `100vh` at 4048.
  - Gate 50: bare `1fr` on `.bookStage` at 3093 and `.projectDeckCard` at 3696, plus `.fieldWorld` in `css/portfolio-field.css:80`.
  - Gate 62: `.resumeSubsection` at 1239 is a real defect. `.sidebar-nav` (a collapsed menu), `.motion-reveal` (a class JS adds) and `.loading-fact.fact-changing` are state-driven, so waive them.
- **Waived:** `.findAskDialog` `100vw` (`css/guide-widget.css:40`) is a full-screen modal, not page width.

---

### Task 1: Branch and baseline

- [ ] **Step 1:** `git pull --ff-only origin main && git switch -c polish/hallmark-audit`. Expected: fast-forward to `2d77078` or later.
- [ ] **Step 2:** `python3 -m http.server 8000` in a second terminal.
- [ ] **Step 3:** Run every suite:
  ```bash
  for f in scripts/check-*.mjs scripts/smoke-*.mjs; do node "$f" || echo "FAIL $f"; done; node --test tests/
  ```
  Write the pre-existing failures into `_audit/polish-baseline.txt`. Those are not this plan's to fix, but no new ones may appear.
- [ ] **Step 4:** Record the gate counts:
  ```bash
  node ~/.claude/plugins/cache/hallmark/hallmark/2.0.0/hallmark/scripts/sloplint.mjs index.html --genre editorial > _audit/polish-before.txt
  ```
- [ ] **Step 5:** Add `.hallmark/` to `.gitignore`. Commit `.gitignore` and `_audit/`: `chore: polish baseline and audit notes`.

### Task 2: Hero, eyebrows and copy tells

**Files:**
- Create: `scripts/check-polish.mjs`
- Modify: `index.html`, `css/style.css`
- Modify: `README.md`, adding `node scripts/check-polish.mjs` to the launch-readiness block

**Interfaces:**
- Produces: `scripts/check-polish.mjs`. It reads `index.html`, `css/*.css` (concatenated as `css`) and `js/script.js` with `fs`, in the same style as `check-launch-readiness.mjs`. It exposes `heroBlock`, the header slice. Later tasks append to it.

- [ ] **Step 1: Write the failing check**
  ```js
  const heroBlock = html.slice(html.indexOf('<header id="heroSection"'), html.indexOf("</header>"));
  assert.doesNotMatch(html, /heroGuideLine/, "hero offers projects or contact, not chat");
  assert.match(html, /<a class="nav-link" href="chat\/"/, "nav Chat link kept");
  assert.equal((heroBlock.match(/heroButtonPrimary/g) || []).length, 1, "one primary hero action");
  assert.doesNotMatch(heroBlock, /heroEyebrow/, "no hero eyebrow");
  ```
- [ ] **Step 2:** Run `node scripts/check-polish.mjs`. Expected: FAIL on the first assertion.
- [ ] **Step 3:** Remove `.heroGuideLine` and the eyebrow at `:112`, along with their CSS. Make `.heroButtonSecondary` outlined: transparent fill, 1px border in the current text token.
- [ ] **Step 4:** Fix the other gate 54 eyebrows:
  - Delete the label where the heading already says the same thing.
  - Where the heading is figurative, make the plain label the heading instead.
  - Where a label is real data, keep it as body text in sentence case (for example "RAG" on a card is a tag).
- [ ] **Step 5:** Fix gate 38i: set the four `<h4>`s in roman, and move any emphasis into weight.
- [ ] **Step 6:** Fix gate 63:
  - Delete the decorative dots at 829.
  - Rewrite 911 as "Data Scientist Intern, SKEZI".
  - Drop the glued arrow at 1551.
  - Split the middle-dot meta strings onto separate spans, separated by spacing instead of `•` or `·`.
- [ ] **Step 7:** Run `check-polish`, the full suites from Task 1, and sloplint. Expected:
  - `check-polish` passes.
  - No new suite failures.
  - `grep -cE "FAIL (54|38i|63) " ` on the sloplint output prints `0`.
- [ ] **Step 8:** Commit: `style: remove eyebrows, hero chat line and copy tells`.

### Task 3: Move the field scene below projects

**Files:**
- Modify: `index.html`. Cut `.fieldScene` (from `:130` to its closing tag) into a new `<section id="field" class="fieldSection section" aria-label="Explore the field">`, placed right after `#portfolio`'s `</section>`. `#portfolioField` and `.fieldIntro` stay in the header.
- Modify: `css/portfolio-field.css` and `css/style.css`, only where selectors assume the scene sits inside `#portfolioField` or `#heroSection`.
- Modify: `js/portfolio-field.mjs` and `js/portfolio-field-routing.mjs`, only if a query depends on that nesting.
- Modify: `scripts/check-polish.mjs`

- [ ] **Step 1: Append the failing assertions**
  ```js
  assert.doesNotMatch(heroBlock, /class="fieldScene"/, "field scene not in hero");
  const iPortfolioEnd = html.indexOf("</section>", html.indexOf('id="portfolio"'));
  const iField = html.indexOf('id="field"');
  assert.ok(iField > iPortfolioEnd && iField < html.indexOf('id="proof"'), "field between projects and proof");
  ```
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Move the markup. Run `grep -n "portfolioField\|heroSection" css/*.css js/*.mjs js/script.js` and fix every selector the move breaks.
- [ ] **Step 4:** Run `check-polish`, `check-portfolio-field`, `check-field-routing`, `check-isometric-field`, `smoke-responsive` and `smoke-guide`. Expected: all pass, with `check-portfolio-field.mjs` unchanged.
- [ ] **Step 5:** Commit: `feat: move field scene below projects`.

### Task 4: Grid view by default

**Files:**
- Modify: `index.html`, the `data-project-view` buttons (swap `active` and `aria-pressed`)
- Modify: `js/script.js:446`
- Modify: `scripts/check-polish.mjs`

- [ ] **Step 1: Append the failing assertions**
  ```js
  assert.match(html, /data-project-view="grid"\s+aria-pressed="true"/, "grid pressed at load");
  assert.match(js, /setProjectView\("grid"\);/, "grid is the initial view");
  ```
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Make the two edits.
- [ ] **Step 4:** Run the suites. Then, at `http://localhost:8000` in the browser pane, click the "Quant" chip. Expected: only quant cards show in grid mode.
- [ ] **Step 5:** Commit: `feat: open project browser in grid view`.

### Task 5: CSS defects

**Files:**
- Modify: `css/style.css`, `css/portfolio-field.css`
- Modify: `index.html:65`, the existing inline `<script>` in `<head>`
- Modify: `scripts/check-polish.mjs`

- [ ] **Step 1: Append the failing assertions**
  ```js
  assert.doesNotMatch(css, /transition:\s*all/, "no transition: all");
  assert.doesNotMatch(css, /(^|\})\s*(html|body)[^{]*\{[^}]*overflow-x:\s*hidden/m, "html/body use overflow-x: clip");
  assert.doesNotMatch(css, /min-height:\s*calc\(100vh/, "hero uses svh");
  for (const sel of ["bookStage", "projectDeckCard", "fieldWorld"]) {
    const rules = [...css.matchAll(new RegExp(`\\.${sel}\\s*\\{[^}]*grid-template-columns:([^;]*);`, "g"))];
    for (const [, cols] of rules) assert.doesNotMatch(cols.replace(/minmax\([^)]*\)/g, ""), /\b1fr/, `${sel} image track uses minmax(0, 1fr)`);
  }
  assert.doesNotMatch(css, /(^|\})\s*\.resumeSubsection\s*\{[^}]*opacity:\s*0/m, "resume visible without JS");
  assert.match(html, /documentElement\.classList\.add\('js'\)/, "js class set in head");
  ```
- [ ] **Step 2:** Run it. Expected: FAIL on the first assertion.
- [ ] **Step 3:** Fix:
  - Replace each `transition: all` with the properties the rule's states actually change.
  - At 517, 756, 1437, 1593 and 4221, move the width or left animation to `transform: scaleX()` or `translateX()`.
  - Set `overflow-x: clip` at 73 and 5529.
  - Change 4048 to `calc(100svh - 70px)`.
  - Wrap the three image tracks in `minmax(0, 1fr)`.
  - Move `.resumeSubsection`'s `opacity: 0; transform` under `.js .resumeSubsection`.
  - Prepend `document.documentElement.classList.add('js');` inside the inline script at `index.html:65`.
- [ ] **Step 4:** Run all suites. Then, with JS disabled in the browser pane, confirm the resume subsections show. Check sloplint: `grep -cE "FAIL (6a|10a|34|50) "` returns 0 (34 has only the waived modal line).
- [ ] **Step 5:** Commit: `fix: css defects from hallmark audit`.

### Task 6: Verify and hand over

- [ ] **Step 1:** Run sloplint again, writing to `_audit/polish-after.txt`, with `--kept`. Expected: no `FAIL kept`. Then diff against `polish-before.txt`.
- [ ] **Step 2:** Screenshot `http://localhost:8000` at 1440 and 375 in the browser pane. Expected: the hero stands alone, and projects (grid) come second.
- [ ] **Step 3:** Add a "Polish result" note to the audit doc. Commit, push the branch, and open a PR against `main`.

**Deferred** (add when there's a reason): one icon library, the 4px spacing scale, dark-mode text-colour rules (gate 41), the type-family count (gate 37), and cutting the page to five sections.
