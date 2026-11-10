# Evidence Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portfolio memorable by making it look like the evidence itself. The field returns to the hero and shows dated status from a lab log. Every project gets a fixed evidence label, every report gets receipts, a colophon page explains how the site is checked, and the remaining slop tells go.

**Architecture:** Static GitHub Pages site. One source of dated facts: a static `#log` section in `index.html`, where each entry is an `<li>` carrying `data-date`, `data-kind`, `data-href` and `data-destination`. Everything else reads from those entries:
- The field card reads them at runtime.
- `scripts/check-evidence.mjs` checks every `data-date` against the file's git add date.

No JSON file, no build step and no new dependencies. Everything renders without JS.

**Tech Stack:** HTML, CSS, jQuery and ES modules; Node 22 `node:assert` with `child_process.execFileSync('git', …)`; Playwright through the existing `PLAYWRIGHT_MODULE` path; `python3 -m http.server 8000`; Hallmark `sloplint.mjs`.

**Spec:** `_audit/2026-11-10-design-directions.md` (shortlist items 1–5, plus the "remaining slop tells" list). The user's complaint is that the site looks "massively boring", and every task is judged against that complaint first.

**Order and PRs:**
- **PR 1 is Task 2 alone** (field back in the hero), because it answers the complaint directly. Until Task 1 exists, its status line stays hidden.
- **PR 2 is Tasks 1, 3, 4, 5, 6 and 7.** Task 2's status line turns on once Task 1's log entries exist.
- Run order: 2, 1, 3, 4, 5, 6, 7.

## Global Constraints

- Work on branch `feat/evidence-redesign`, cut from `main` at `b8b6ef4` or later. Never push to `main`; merge by PR.
- **No invented facts.**
  - Every date is the file's git add date (`git log --diff-filter=A --format=%as -1 -- <file>`), or a date the user states.
  - Every status word comes from copy already on the page, or from the user.
  - No metrics, no "Live" pill and no pulsing dot.
- Keep every existing link, id, `data-*` attribute and script or test hook. `check-portfolio-field.mjs` and `check-isometric-field.mjs` must keep passing. Their assertions may only change when a task says so.
- Hallmark Floor still binds (rules 1–16 in the Hallmark skill), plus `scripts/check-polish.mjs`. Expect to update its assertions where the field moves back.
- No palette or typeface change. Lato stays as the body face and Karla as the display face.
- Every animation has a `prefers-reduced-motion: reduce` fallback. Content is visible with JS off.
- Copy is plain and specific: no dashes as separators, no middle dots, no tracked capitals.
- **Word budget:** the homepage's visible word count must not grow. Measure it with `document.body.innerText.split(/\s+/).length` at 1440, before and after. New text replaces old text and is never added on top.
  - The homepage log shows only the 5 newest entries. The full log lives on `log.html`.
  - An evidence label replaces its card's existing spans, and is never added beside them.
- **Date honesty:** a git add date is labelled "Added to site", never "Updated" or "Published", because it is when the file was uploaded, not when the work was done.

## Review Focus

1. **A log date drifts from git:** a renamed or rewritten file gets a different add date. `check-evidence` must fail and name the file (Task 1).
2. **The field card shows a stale or missing status:** a persona whose destination has no log entry must show its description only. It must never show an empty status line or say "undefined" (Task 2).
3. **Hero at 1280×800:** the headline, one sentence and the primary action stay above the fold with the field beside them, and at 390 the field stacks below without covering the launcher (Task 2; `check-portfolio-field` at 390 and 320).
4. **An evidence label with a missing field:** a project without an evaluation line shows a stated "Not evaluated publicly", never a blank row (Task 3).
5. **A shallow clone (CI or Pages):** `check-evidence` run without git history must fail loudly ("needs full git history"), not pass empty (Task 1).

## Baseline facts (main @ b8b6ef4)

- The field scene is in `<section id="field">` (`index.html:704-790`). `#portfolioField` in the header holds only `.fieldIntro`. The hero is one column (`css/portfolio-field.css:3`, `min-height: min(78svh, 680px)`).
- The selection card is filled in `js/portfolio-field.mjs:72-84` from `.personaRole`, `.personaDescription`, `href` and `data-destination-label`.
- Persona destinations:
  - `#portfolio`: ai-engineer and quant (`data-project-filter-target="quant"`)
  - `research/`: researcher
  - `#resume`: student
  - `#writing`: writer
  - `#reading`: reader
  - `research/how-to-choose-a-system-boundary.html`: architect
  - `research/how-to-decide-under-uncertainty.html`: investor
- Project cards (`.filterItem`) hold `.filterItemProblem`, `.filterItemArchitecture` and `.filterItemResults` spans with `<strong>` lead-ins ("Problem:", "Tony's contribution:", "Evidence boundary:"), plus `.filterItemTech` badges and a links paragraph. There are 11 projects.
- Git add dates (real):
  - **Reports.** The healthcare, judicial, loan-default, rentlock and telepresence reports were added on 2026-05-15. The faiss, human-in-the-loop and yield-curve reports were added on 2026-08-03.
  - **Research articles, 2026-10-13:** how-to-prove-an-agent-works, what-language-models-learn, when-agents-need-search, where-autonomy-stops.
  - **Research articles, 2026-10-15:** how-data-becomes-reliable-evidence, how-money-compounds-and-risk-interrupts-it, how-to-choose-a-system-boundary, how-to-decide-under-uncertainty, what-the-cloud-should-own, when-an-ml-model-is-ready.
  - **Research articles, 2026-10-17:** from-specification-to-verified-release, how-coding-agents-find-and-change-code.
  - **Research articles, 2026-10-22:** how-agent-loops-work, when-a-website-needs-a-digital-twin.
- Reports carry a `.reportMeta` block (`reports/agentic-healthcare-analytics.html:34`).
- Slop tells left on main:
  - tracked capitals in `#navigation`, `.sectionTitle` and the filter chips
  - a centred `.sectionTitle` with a `::after` bar
  - the empty `.projectDeckHeader` box ("My Projects")
  - the pill radius on chips and the deck switch

---

### Task 1: Lab log section + evidence check

**Files:**
- Create: `scripts/check-evidence.mjs`
- Modify: `index.html` (new `<section id="log" class="logSection section" aria-labelledby="logHeading">` directly after `#portfolio`; it holds the 5 newest entries and a link, "Full lab log", to `log.html`)
- Create: `log.html` (every entry; head, nav and theme copied from `research/index.html`, with paths adjusted for the root level)
- Modify: `css/style.css` (append the `.logSection` rules)
- Modify: `README.md` (add the command to the launch-readiness block)
- Commit: `_audit/2026-11-10-design-directions.md` and this plan file, so the PR carries its own spec

`check-evidence` reads `.logEntry` items from both `index.html` and `log.html`. It also asserts that the homepage's 5 entries are the first 5 entries of `log.html`.

**Interfaces:**
- Produces a log entry with this exact markup. Tasks 2 and 4 read it.
  ```html
  <li class="logEntry" data-date="YYYY-MM-DD" data-kind="report|article|audit|release" data-href="<relative path or #id>" data-destination="<persona destination href>">
    <time datetime="YYYY-MM-DD">10 Nov 2026</time> <a href="…">Title</a> <span class="logKind">Report</span>
  </li>
  ```
  The `<time>` text is the date in `D Mon YYYY` format. `data-destination` matches a persona `href` from the baseline facts: reports use `#portfolio`, research articles use `research/` (or their own path when a persona points straight at it).
- Produces `scripts/check-evidence.mjs`. It exits non-zero on failure and prints one line per bad entry.

- [ ] **Step 1: Write the failing check.** It covers these rules:
  - Read `index.html`. Collect every `.logEntry` with a regex over the `li` attributes.
  - Assert at least 1 entry: `assert.ok(entries.length > 0, "log has entries")`.
  - For each entry where `data-href` is a file path:
    - Assert the path exists.
    - Assert `data-date` equals `git log --diff-filter=A --format=%as -1 -- <path>`. Failure message: `` `${href}: log says ${date}, git says ${gitDate}` ``.
    - Assert the `<time datetime>` equals `data-date`.
  - Assert the entries are sorted newest first.
  - If `git rev-parse --is-shallow-repository` prints `true`, or a git date comes back empty for an existing tracked file, throw `"check-evidence needs full git history"`.
- [ ] **Step 2:** `node scripts/check-evidence.mjs`. Expected: FAIL with "log has entries".
- [ ] **Step 3: Add the section.**
  - Heading: `<h2 id="logHeading">Lab log</h2>`. One sentence under it: "Dated entries for every report, article and audit on this site."
  - One `<li>` per report and per research article from the baseline facts, newest first. Use each page's own `<title>` or `<h1>` as the link text.
  - The sentence under the heading reads "Date each page was added to this site." Each `<time>` carries `title="Added to site"`.
  - Note for the PR: six articles share 2026-10-15 and five reports share 2026-05-15. Flag this to the user, because it can read as a content dump.
  - Style: a plain list in one column on the container grid. The date sits in a fixed-width column in Inconsolata, the existing mono face. Use hairline separators. No cards, no pills, no capitals.
- [ ] **Step 3b: Turn on the field status (Task 2 already shipped).** Add this desktop assertion to `check-portfolio-field.mjs`:
  - Switch the cast to `ideas` and click `[data-persona="researcher"]`.
  - Assert the `.fieldSelectionStatus` text matches `/^Latest: .+, \d{1,2} [A-Z][a-z]{2} \d{4}$/`.
- [ ] **Step 4:** Run `check-evidence`, `check-polish`, `check-portfolio-field`, `check-launch-readiness` and the `smoke-responsive` temp copy (the known 'system boundary' line removed). Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat: dated lab log with git-verified dates`.

### Task 2: Field back in the hero, showing dated status

**Files:**
- Modify: `index.html`. Move `.fieldScene` (with its toolbar, which keeps `<h2 id="fieldHeading">`) back into `#portfolioField` after `.fieldIntro`. Delete the now-empty `<section id="field">`. Move `aria-labelledby="fieldHeading"` onto `.fieldScene` with `role="region"`.
- Modify: `css/portfolio-field.css`. Restore the two-column hero grid at ≥900px: intro on the left, scene on the right, scene max 720px wide. Keep `min-height` in `svh`.
- Modify: `js/portfolio-field.mjs`. In `select()`, add a status line.
- Modify: `index.html`, the selection card. Add `<p class="fieldSelectionStatus" hidden></p>` after `.fieldSelectionDescription`.
- Modify: `scripts/check-polish.mjs`. Replace the "field scene not in hero" and "field between projects and proof" assertions with "field scene in hero" and "no `id="field"` section".
- Modify: `scripts/smoke-responsive.mjs`. Add `.fieldScene` back to its hero selector list.

**Interfaces:**
- Consumes: the `.logEntry` markup from Task 1.
- Produces: `latestEntryFor(destination: string): {date: string, title: string, kind: string} | null`, exported from `js/portfolio-field.mjs`. It returns the newest `.logEntry` whose `data-destination` equals `destination`.

- [ ] **Step 1: Update `check-polish` (it fails first).**
  ```js
  assert.match(heroBlock, /class="fieldScene"/, "field scene in hero");
  assert.doesNotMatch(html, /<section id="field"/, "no separate field section");
  ```
- [ ] **Step 2: Add a Playwright assertion in `check-portfolio-field.mjs`, inside the existing width loop at ≤390.** After the existing `[data-persona="student"]` click, assert that `.fieldSelectionStatus` is hidden or non-empty. It must never be visible and empty.

  The "Latest:" text assertion belongs to Task 1, which creates the entries it reads. Don't add it here, because PR 1 has no log yet.
- [ ] **Step 3:** Run both checks. Expected: FAIL.
- [ ] **Step 4: Implement.** In `select()`, call `latestEntryFor(person.element.getAttribute('href'))`.
  - Known limitation: ai-engineer and quant both point to `#portfolio`, so both show the newest report. Accept this and list it in the PR. Scope by project tag only if the user asks.
  - Shipped first (PR 1), there are no `.logEntry`s yet. `latestEntryFor` then returns null and the status stays hidden. That is correct.
  - If it returns an entry: set `status.textContent = \`Latest: ${title}, ${formatted date}\`` and `status.hidden = false`.
  - If it returns null: `status.hidden = true`.

  Reuse the `<time>` text for the formatted date, so the date is never formatted in JS.
- [ ] **Step 5:** Run `check-polish`, `check-portfolio-field`, `check-isometric-field`, `check-field-routing`, `smoke-guide` and the `smoke-responsive` temp copy. Expected: PASS. Then take screenshots at 1440 and 390: the intro and scene sit side by side at 1440, and at 390 the scene stacks below the intro.
- [ ] **Step 6: Commit.** Message: `feat: field returns to hero with dated status`.
- [ ] **Step 7: PR 1.** Run the boredom gate from Task 7 Step 2 on the hero only. Push the branch and open a PR against `main` titled "Field back in the hero". Later tasks continue on the same branch, or on `feat/evidence-trust` cut after PR 1 merges.

### Task 3: Evidence label per project

**Files:**
- Modify: `index.html`. In each of the 11 `.filterItemDesc` blocks, wrap the existing spans in a `<dl class="evidenceLabel">`. Keep the `.filterItemProblem`, `.filterItemArchitecture`, `.filterItemResults` and `.filterItemTech` classes on the `<dd>`s, so existing CSS and JS hooks survive.
- Modify: `css/style.css`. Append the `.evidenceLabel` rules.
- Modify: `scripts/check-polish.mjs`

**The fixed label rows, in this order, with exact `<dt>` text:**
1. Problem
2. Built
3. Evidence
4. Does not claim
5. Stack
6. Added to site

**Where each row comes from:**
- **Problem:** the text after "Problem:".
- **Built:** the text after "Tony's contribution:" or the existing architecture lead-in.
- **Evidence:** what the evidence-boundary sentence says is shown.
- **Does not claim:** what that sentence says it "does not substantiate". If a card has no such clause, the row reads "Not stated publicly".
- **Stack:** the tech badges.
- **Added to site:** the linked report's git add date when the card links a `reports/` file. Otherwise "Not dated".
- The label replaces the card's existing spans in place. The card's word count must not grow.

Split sentences only where the existing copy already marks a boundary ("does not", "it does not substantiate"). Never write new claims.

- [ ] **Step 1: Write the failing assertion.**
  ```js
  const labels = [...html.matchAll(/<dl class="evidenceLabel">([\s\S]*?)<\/dl>/g)].map(m => m[1]);
  assert.equal(labels.length, 11, "every project has an evidence label");
  for (const l of labels) assert.deepEqual([...l.matchAll(/<dt>([^<]+)<\/dt>/g)].map(m => m[1]), ["Problem","Built","Evidence","Does not claim","Stack","Added to site"], "fixed label rows");
  for (const l of labels) assert.doesNotMatch(l, /<dd>\s*<\/dd>/, "no blank label rows");
  ```
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Restructure the 11 cards.**
  - Style: a two-column `dl` (`grid-template-columns: 8.5rem minmax(0,1fr)`). `<dt>` is in the body face, a step smaller, sentence case, in the muted token. Hairline rules sit between rows. It collapses to one column below 480px.
  - "Does not claim" uses the same ink as every other row. It must not be styled as an error or warning.
- [ ] **Step 4:** Run `check-polish`, `check-launch-readiness`, the `smoke-responsive` temp copy and the grid-mode filter check from the polish plan (a one-off Playwright run: click the Quant chip and only quant cards are visible). Expected: PASS.
- [ ] **Step 5:** Write every split sentence (before and after) into `_audit/evidence-label-copy.md` for the user to approve.
- [ ] **Step 6: Commit.** Message: `feat: fixed evidence label on every project`.

### Task 4: Receipts on report pages

**Files:**
- Modify: the 8 files in `reports/*.html`. Add a `<section class="reportReceipts" aria-labelledby="receiptsHeading">` at the end of the article.
- Modify: `css/report-theme.css` if it exists. Otherwise use the reports' existing stylesheet (find it with `grep -l reportMeta css/*.css`).
- Modify: `scripts/check-evidence.mjs`

**Receipt rows (a `<dl>`):**
- **Added to site:** the git add date.
- **Source:** a link to `https://github.com/LMDlifers/TonyKoo/blob/<add-commit-sha>/reports/<file>`, with the link text being the first 7 characters of the SHA.
- **History:** a link to `https://github.com/LMDlifers/TonyKoo/commits/main/reports/<file>`.
- **Build fingerprint:** "Not compiled with Research Compiler", until a report is.

The heading is `<h2 id="receiptsHeading">Receipts</h2>`.

- [ ] **Step 0: Privacy gate. This step blocks the rest of the task.**
  - Run `git log -p --follow -- reports/` and read each report's earliest content.
  - The Source and History links expose every past version, so confirm that no commit contains text from before sanitisation: names, identifiers, partner data or raw clinical or legal records.
  - Record the result in `_audit/receipts-privacy-check.md`.
  - If any commit fails, or you can't confirm it, drop the Source and History rows from every receipt and keep only "Added to site" and "Build fingerprint". Then tell the user which commits are a problem.
- [ ] **Step 1: Extend `check-evidence`.** For each `reports/*.html`, assert that a receipts block exists, that its "Added to site" date equals the git add date, and that its source SHA equals `git log --diff-filter=A --format=%h -1 -- <file>`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Add the 8 blocks with the values from git.
- [ ] **Step 4:** Run `check-evidence` and the `smoke-responsive` temp copy, which covers the report pages. Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat: git-verified receipts on reports`.

### Task 5: Colophon page

**Files:**
- Create: `colophon.html`. Copy the head, nav and theme wiring from `research/index.html`, with paths adjusted for the root level.
- Modify: `index.html`. Add one link, "Colophon", to the contact section's link list (find it with `grep -n 'id="contact"' index.html`).
- Modify: `scripts/smoke-responsive.mjs`. Add `"/colophon.html"` to `pages`.

**Content: four short sections, under 300 words in all, plain prose.**
1. **How it's built:** static HTML, CSS and JS on GitHub Pages; Karla, Lato and Inconsolata; the isometric field art pipeline (`scripts/build-portfolio-field-art.py`).
2. **How it's checked:** name each script in `scripts/` and what it asserts (check-polish, check-evidence, check-portfolio-field, smoke-responsive), plus the Hallmark sloplint gates.
3. **How dates work:** every log date and report date is the file's git add date, checked by `check-evidence`. Link to the repo.
4. **What's private:** the sanitisation rule already stated on the case studies, quoted verbatim from the site.

- [ ] **Step 1:** Add the page to `smoke-responsive`. Run the temp copy. Expected: FAIL (404).
- [ ] **Step 2:** Write the page.
- [ ] **Step 3:** Run the `smoke-responsive` temp copy and `check-launch-readiness`. Expected: PASS.
- [ ] **Step 4: Commit.** Message: `content: add colophon`.

### Task 6: Remaining slop tells

**Files:**
- Modify: `css/style.css` and `css/site-theme.css`, wherever these rules live (find them with `grep -n "text-transform: uppercase" css/style.css css/site-theme.css`).
- Modify: `index.html`. Remove the empty `.projectDeckHeader` box. Keep its Deck and Grid switch: move it next to the filter chips.
- Modify: `scripts/check-polish.mjs`

- [ ] **Step 1: Write the failing assertions.**
  ```js
  for (const sel of ["#navigation", ".sectionTitle", ".projectFilterButton", ".projectViewButton"]) {
    const re = new RegExp(`${sel.replace(/[.#]/g, m => "\\" + m)}[^{]*\\{[^}]*text-transform:\\s*uppercase`);
    assert.doesNotMatch(css, re, `${sel} sentence case`);
  }
  assert.doesNotMatch(html, /class="projectDeckHeader"/, "no empty projects header box");
  assert.doesNotMatch(css, /\.sectionTitle::after/, "no bar under section titles");
  ```
  If the filter-chip class has a different name, find it with `grep -n "data-filter=" index.html` and use that selector.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Sentence case, no tracking, body face, one step smaller.
  - Section titles align left on the container's left edge.
  - Chips and the view switch use the small radius token, not a pill.
  - Delete the `::after` bar.
- [ ] **Step 4:** Run every suite from the polish plan's Task 1 list, plus `check-evidence`. Then run `sloplint`: gates 54, 63 and 67 must report 0 for `index.html` and our own CSS.
- [ ] **Step 5: Commit.** Message: `style: remove remaining slop tells`.

### Task 7: Verify and PR

- [ ] **Step 1:** Run every suite and `sloplint`. Write the before and after gate counts to `_audit/evidence-redesign-result.md`.
- [ ] **Step 2: Boredom gate.** Take screenshots at 1440 and 390 of the hero, `#log`, one evidence label and one report's receipts. Then judge them:
  - Compare the hero against the pre-polish screenshot (`git show 2d77078`, the old `before-1440.png` state). The new first screen must be at least as visually rich: the field is visible beside the intro, and nothing important falls below the fold.
  - Compare the homepage's visible word count with the count measured at the start of the branch. It must not have grown.
  - Check each screenshot against the spec's meta-pattern: trust should be cheap to check.
  - Record each verdict. If the boredom gate fails, the PR does not open.
- [ ] **Step 3:** Commit `_audit/`. Push the branch. Open a PR against `main` with `gh pr create`. The body lists the label copy file and every status line for the user to approve.

**Deferred** (add when its material exists):
- The Research Compiler build fingerprint, once Leakage Audit #001 ships through `rc compile`.
- `data-kind="audit"` log entries, starting with LA-001.
- A versioned site archive in the Lynn Fisher style.
