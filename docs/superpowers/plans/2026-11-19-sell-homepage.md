# Sell Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rebuild the homepage so the first screen sells Tony to AI and quant hiring managers: results first, four featured projects, one visual system.

**Architecture:** Static HTML and CSS. Markup changes are in `index.html`. New rules go in a new `css/home.css`, loaded last; dead rules are deleted from `css/craft.css` and `css/style.css` as their markup goes. One new Playwright check, `scripts/check-home.mjs`, owns every new assertion. Old checks are trimmed where the feature they guard is removed.

**Tech Stack:** HTML, CSS, Python 3 stdlib (art), Node 22 with Playwright (checks).

**Spec:** `docs/superpowers/specs/2026-11-19-sell-homepage-design.md`

## Global Constraints

- **Branch:** `feat/sell-homepage` from `main`. Merge by PR.
- **No new claims.** Every outcome line reuses text already published on the homepage or in that project's report.
- **Pixelify Sans** only on `.title-word` and `.fieldToolbarTitle`.
- **Budgets:** height ≤ 9,000px at 1440×900 and ≤ 13,000px at 390×844; visible words ≤ 1,200.
- **Themes:** every change works in day and night.
- **No sideways scroll** at 320, 390, 768, 899, 900, 1024 and 1440.
- **No JS added.** Deleting JS is expected.
- The field, the Ask launcher, the log page and all report pages keep working.

## Review Focus

1. **Night theme on the new cards and proof strip.** Text contrast must be at least 4.5:1. Task 2 and Task 3 assert it.
2. **JS off.** With the filter and deck gone, all four cards and the seven list rows show with no script. Task 3 asserts it.
3. **Old anchors.** `#proof`, `#reading`, `#certifications` may be linked from reports, the log or the chat. Task 5 keeps the ids on the new elements and asserts no homepage link in the repo points at a missing id.
4. **Long titles at 320px.** "Fixed Income Analytics: Yield Curve Modeling" must wrap without overflow. Task 3 asserts it.
5. **`check-evidence` card dates.** That check expects 11 "Report added" dates on cards. Task 3 removes that block and keeps the log and receipt checks.

---

### Task 1: New check file and the page budgets

**Files:** Create `scripts/check-home.mjs`. Modify `README.md` (add it to the launch-readiness block), `scripts/check-portfolio-field.mjs:36` (budget 1744 → 1200).

- [ ] **Step 1:** Write `check-home.mjs` with the same Playwright bootstrap as `scripts/check-chapters.mjs`. Assert:
  - `scrollHeight ≤ 9000` at 1440×900 and `≤ 13000` at 390×844.
  - No sideways scroll at the seven widths.
  - Every element whose computed `font-family` starts with `Pixelify Sans` matches `.title-word` or `.fieldToolbarTitle`.
- [ ] **Step 2:** Run it. Expected: FAIL on height.
- [ ] **Step 3:** Commit: `test: homepage budgets (failing)`. Later tasks make it pass; it must be green by Task 5.

### Task 2: Hero sells in one screen

**Files:** Modify `index.html` (hero block near 110–130, `#proof` near 675–703). Create `css/home.css` and link it after `craft.css`. Modify `scripts/check-home.mjs`, `scripts/check-polish.mjs` (drop asserts on removed hero elements), `scripts/check-craft.mjs` (the launcher check keeps using `.heroButtonPrimary` and `.heroTextLink`).

**Interfaces:** Produces `.proofStrip` (a `<ul id="proof">` of three `<li class="proofItem">`, each with `.proofValue` and `.proofLabel`).

- [ ] **Step 1:** Add failing asserts:
  - `.title-line` text is exactly `I build AI and quant systems whose results you can check.`
  - `.heroSubtitle` and `.heroPositioning` do not exist.
  - `#proof` is inside `#heroSection` and has three `.proofItem`.
  - The first `.proofValue` bottom is ≤ 900 at 1440×900 and ≤ 1700 at 390×844.
  - The text `0.86s`, `6.09`, `~90%` and the `~90%` qualifier sentence each appear once on the page.
  - `.proofValue` has `font-variant-numeric` containing `tabular-nums`.
  - Proof text contrast ≥ 4.5 in day and night (use the `__rgb` helper from `check-craft.mjs`).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Move the three proof items into the hero under `.heroProofLine`; delete the `#proof` section and its CSS. Value in Lato 700 32px, label in Lato 16px, items in a three-column grid that stacks below 700px.
- [ ] **Step 4:** Run `check-home`, `check-polish`, `check-craft`, `check-portfolio-field`. Expected: PASS except the Task 1 height assert.
- [ ] **Step 5:** Commit: `feat: hero leads with one claim and the proof numbers`.

### Task 3: Four featured cards and a list of seven

**Files:**
- Create: `scripts/build-card-art.py`, `images/cards/{healthcare,extraction,yield-curve,judicial}.svg`.
- Modify: `index.html` (`#portfolio`, near 225–657), `css/home.css`, `js/script.js` (delete `filterSelection`, the deck code and the view switch), `css/style.css` and `css/craft.css` (delete `.filterItem*`, `.projectDeck*`, `.projectViewSwitch`, `#filter`, card `.pixelFrame` rules).
- Modify checks: `check-home.mjs`; `check-evidence.mjs` (delete the "Project cards: Report added" block, lines 65–72); `check-craft.mjs` (delete deck, filter, card-frame and no-JS-card asserts); `check-polish.mjs` (drop `.btn` filter and `.projectViewButton` from the hover scan list and lower its minimum count to match).

**Interfaces:** Produces `.workCard` (four, inside `.workGrid`) and `.workList` (seven `<li>`).

- [ ] **Step 1:** Write `build-card-art.py`. It writes four 800×500 SVGs, each made of rects, circles and polygons only, using two theme colours plus `#f6f4ee`. No `<text>`. It ends with a self-check that asserts each file parses as XML, has `viewBox="0 0 800 500"`, and contains no `<text` or `<image`.
- [ ] **Step 2:** Add failing asserts to `check-home.mjs`:
  - Exactly four `.workCard`, titles in the spec's order.
  - Each has one `img` (`alt=""`, natural size 800×500), one `.workOutcome`, one `.workContext`, one `.workStack`, and exactly one link.
  - `.workList li` count is 7, each with one link; the seven titles are the remaining projects.
  - No element on the page contains `Does not claim`, `Full label` or `Report added`.
  - `.projectDeck`, `#filter`, `.filterItem` and `.pixelFrame` inside `#portfolio` do not exist.
  - JS off: all four cards and seven rows have nonzero height.
  - At 320px no `.workCard` child is wider than its card.
  - All `.workCard` share one computed `border-radius`, `border-color` and `box-shadow`.
  - Card text contrast ≥ 4.5 in day and night.
- [ ] **Step 3:** Run. Expected: FAIL.
- [ ] **Step 4:** Implement the markup and CSS. Two-column grid at ≥ 900px, one column below. Card: 1px border, 16px radius, 16px padding, art radius 0 with the card clipping it. For each `.workOutcome`, copy a sentence or number from that project's current card or report and note the source in an HTML comment beside it.
- [ ] **Step 5:** Delete the dead JS and CSS. Run `node --test tests/*.test.mjs`; delete tests that cover only removed functions.
- [ ] **Step 6:** Run `check-home`, `check-evidence`, `check-craft`, `check-polish`, `check-portfolio-field`, `check-field-routing`. Expected: PASS except the Task 1 height assert. `check-field-routing` matters: field characters link to `#portfolio`.
- [ ] **Step 7:** Commit: `feat: four featured projects with outcomes; the rest as a list`.

### Task 4: One heading system, no chapters

**Files:** Modify `index.html` (delete both `.chapter` blocks, near 220 and 1653; restore each moved sentence only if Step 1 says so), `css/craft.css` (delete chapter rules and pixel heading rules), `css/home.css`. Delete `scripts/check-chapters.mjs` and its README line.

- [ ] **Step 1:** The two chapter sentences are site copy, not a pitch. Delete the first. Put the second ("Open to AI engineering, data science, and quant tooling conversations…") back as the first paragraph of `#contact .contactCopy`.
- [ ] **Step 2:** Add failing asserts to `check-home.mjs`:
  - No `.chapter` exists.
  - Every `h2` on the page has the same computed `font-family` (Lato), `font-weight` 700 and `font-size` (40px at ≥ 900, 28px below), except `.fieldToolbarTitle`.
  - Every `h2` has `text-wrap: balance`; every `p` inside `main` sections has `text-wrap: pretty`.
- [ ] **Step 3:** Run. Expected: FAIL.
- [ ] **Step 4:** Implement in `home.css`; delete the superseded rules.
- [ ] **Step 5:** Run `check-home`, `check-craft` (delete its section-title pixel-size asserts), `smoke-theme`. Expected: PASS except height.
- [ ] **Step 6:** Commit: `feat: one heading system; chapters removed`.

### Task 5: Collapse the long tail, trim the nav, hit the budgets

**Files:** Modify `index.html` (`#reading` near 1220, `#certifications` near 1588, nav near 67–108), `css/home.css`, `scripts/check-home.mjs`, `scripts/check-polish.mjs` (the `nav Chat link kept` assert flips to "no Chat link in nav").

- [ ] **Step 1:** Add failing asserts:
  - Nav link texts are exactly `Projects, Writing, Research, Find, Resume, Contact`.
  - `#reading` and `#certifications` are `<details>` elements, closed by default, placed inside `#resume`.
  - For every `href="…index.html#x"` or `href="#x"` pointing at the homepage in any tracked HTML or JS file, `#x` exists on the homepage. Opening a link to `#reading` or `#certifications` opens that `<details>` (native behaviour in Chrome; assert `open` after navigating to the hash).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Keep each section's content unchanged inside its `<details>`; the `<summary>` is the old heading text.
- [ ] **Step 4:** Run `check-home`. If a height budget still fails, cut in this order until it passes: testimonials to one row of three; the homepage log to three entries (then update `check-evidence.mjs:48–49` from 5 to 3); writing to the three newest. Do not raise the budget.
- [ ] **Step 5:** Run `check-home`, `check-evidence`, `check-research-navigation`, `smoke-guide`. Expected: all PASS, including the Task 1 asserts.
- [ ] **Step 6:** Commit: `feat: short homepage — long tail collapsed, six nav links`.

### Task 6: Details pass, full suite, review, ship

**Files:** Modify `css/home.css`, `scripts/check-home.mjs`.

- [ ] **Step 1:** Add failing asserts: for every card that contains a rounded child (`.workCard`, resume cards, testimonial cards, `.proofStrip` if boxed), child radius equals card radius minus card padding, floor 0. All card-like elements on the page use one of at most two border colours per theme.
- [ ] **Step 2:** Run, implement, run. Expected: PASS.
- [ ] **Step 3:** Screenshot the full page at 1440 and 390, day and night, into `_audit/sell-homepage/`. Read every screenshot. Fix anything that looks wrong, with a check where one is cheap.
- [ ] **Step 4:** Run the full suite (`check-*`, `smoke-*`, `node --test`, the `smoke-responsive` temp copy). Check `uptime` first. Expected: all PASS.
- [ ] **Step 5:** Commit. Run a fresh-context review on the most capable model, then one TDD fix pass.
- [ ] **Step 6:** Push, open the PR, merge, wait for the Pages build of the merge commit, and confirm the live HTML contains `class="workCard"` four times and no `class="chapter"`.
