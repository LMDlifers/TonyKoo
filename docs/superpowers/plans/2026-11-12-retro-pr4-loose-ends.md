# Retro PR 4: Loose Ends Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Close the remaining loose ends from the retro redesign:
- Retire Karla on every page.
- Stop the Ask launcher from covering the hero actions on small phones.
- Show project cards with JS off.
- Stop hover colours sticking after a tap.
- Move the sprite sizing into `css/portfolio-field.css`, where it belongs.

**Architecture:** Each fix sits where its behaviour is defined:
- **Karla:** font links and CSS family values.
- **Ask launcher:** one media query in `css/chat-overlay.css`.
- **No-JS cards:** the `.js` class that the inline head script already adds (from the craft layer).
- **Hover:** `@media (hover: hover)` guards.
- **Sprites:** a move from `css/craft.css` to `css/portfolio-field.css`, with computed styles unchanged.

**Tech Stack:** HTML, CSS, and Node 22 with Playwright checks.

**Spec:** `docs/superpowers/specs/2026-11-11-retro-vellum-design.md`, section 2 ("Karla is retired") and the Amendments (homepage-only in PR 1), plus the deferred minors from the PR 1 final review.

## Global Constraints

- **Branch:** `feat/retro-pr4`, cut from `main` after Retro PR 3 merges. Merge by PR.
- **Karla:** replaced by `var(--font-body)` (Lato) everywhere. Research, report and chat headings stay Lato bold. Ruling: making them pixel type would redesign those pages, which is outside this scope.
- **No visual change** beyond the five items. The sprite move must leave computed styles identical.
- Every existing suite stays green, and the word budget holds.

## Review Focus

1. **Pages that load only `research.css`, `report.css` or the chat CSS** must still get Lato. `site-theme.css` defines `--font-body`, so every such page must load it. Task 1 checks that every page that uses the token also loads `site-theme.css`.
2. **The launcher at 320×640 must stay reachable** after it moves or shrinks. It needs a visible, focusable target of at least 44×44.
3. **No-JS cards at 390.** All 11 show, and the filter buttons, which do nothing without JS, do not hide any of them.
4. **Hover guard and keyboard focus.** `:focus-visible` styles must not move inside `@media (hover: hover)`.
5. **The sprite move must keep its cascade order.** `portfolio-field.css` loads before `craft.css`, so a moved rule could lose to an earlier one. Task 5 diffs computed styles to prove nothing changed.

---

### Task 1: Retire Karla on every page

**Files:**
- Modify: the 26 HTML files whose Google Fonts link includes `family=Karla` (find them with `git grep -l "family=Karla" -- '*.html'`).
- Modify: `css/research.css` (25 uses), `css/report.css` (19), `css/engineering-chat.css` (31) and `css/shared-chat.css` (5).
- Modify: `scripts/check-polish.mjs`.
- Modify: `README.md`, line 163. Drop "research, report and chat pages still use Karla".

- [ ] **Step 1: Write the failing check.** In `check-polish`:
  - `git ls-files '*.html'`: no file contains `Karla`.
  - The CSS files above contain no `Karla`.
  - Every HTML file that uses `var(--font-body)` through its CSS (research, report, chat, `log.html`, `colophon.html`) links `site-theme.css`.
- [ ] **Step 2:** Run `node scripts/check-polish.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - In the font links, drop `family=Karla…&` (keep Lato and Inconsolata).
  - In the CSS, replace `Karla, Arial, sans-serif`, `Karla,sans-serif` and `'Karla', sans-serif` with `var(--font-body)`. Inside the minified `font:` shorthands, replace only the family part.
- [ ] **Step 4:** Run `check-polish`, `smoke-theme`, `smoke-chat`, `smoke-shared`, `check-research-navigation` and the `smoke-responsive` temp copy. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: retire Karla sitewide`.

### Task 2: The Ask launcher never covers the hero actions

**Files:** Modify `css/chat-overlay.css` and `scripts/check-craft.mjs`

- [ ] **Step 1: Write the failing check.** At 320×640 and 390×844, take `.findAskLauncher`'s rect. It must not overlap `.heroButtonPrimary` or `.heroTextLink`. Use the shared `hit()` helper. The launcher must also stay visible and at least 44×44.
- [ ] **Step 2:** Run it. Expected: FAIL at 320×640.
- [ ] **Step 3: Implement.** At ≤560px, the launcher collapses to its icon: hide the label text with a visually-hidden class, so it keeps its accessible name. Size it to 48×48 and keep it `bottom: 16px; right: 16px`. If it still overlaps at 320×640, add `padding-bottom: 72px` to `.fieldIntro .heroActions` below 560px, so the actions clear it.
- [ ] **Step 4:** Run `check-craft` and `check-portfolio-field`. The launcher-yields-to-card checks at ≤390 must still pass. Expected: PASS.
- [ ] **Step 5:** Commit: `fix: Ask launcher stays clear of the hero actions on small phones`.

### Task 3: Project cards show with JS off

**Files:** Modify `css/style.css` (the `.filterItem { display: none }` rule near 2141) and `scripts/check-craft.mjs`.

- [ ] **Step 1: Write the failing check.** In a context with `javaScriptEnabled: false` at 1440 and 390, all 11 `.filterItem` have a nonzero rect and `display !== "none"`.
- [ ] **Step 2:** Run it. Expected: FAIL (0 visible).
- [ ] **Step 3: Implement.** Scope the hidden state to `.js .filterItem { display: none; }` and leave `.filterItem` visible by default. The `.show` rules stay. `index.html:67` adds the `js` class before first paint, so there is no flash with JS on.
- [ ] **Step 4:** Run `check-craft`, `check-polish`, the grid-mode Quant filter one-off and `check-portfolio-field`. Expected: PASS.
- [ ] **Step 5:** Commit: `fix: project cards visible without JS`.

### Task 4: Hover colours never stick after a tap

**Files:**
- Modify: `css/style.css`, at `body.dark-mode .btn:hover` (near 250), `.projectViewButton:hover` (near 1627) and the two `.contactLink:hover` rules (near 3445 and 4844).
- Modify: `css/portfolio-field.css`, at the cast/season `:hover` rules (lines 20 and 67).
- Modify: `scripts/check-polish.mjs`.

- [ ] **Step 1: Write the failing check.** For the selectors `.btn:hover`, `.projectViewButton:hover`, `.contactLink:hover`, `.fieldCastChoices button:hover` and `.fieldSeasonChoices button:hover`, every occurrence in our CSS must sit inside a `@media (hover: hover)` block. Check this with a small brace-depth scan that tracks the enclosing at-rule. Rules that only set `transform: none` are exempt.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Wrap each colour-changing hover rule in `@media (hover: hover) { … }`. Keep `:focus-visible` rules outside.
- [ ] **Step 4:** Run `check-polish`, `check-craft` (its hover colour assertions run in desktop Chromium, where `(hover: hover)` is true) and `check-portfolio-field`. Expected: PASS.
- [ ] **Step 5:** Commit: `fix: hover colours only on devices that hover`.

### Task 5: Sprite sizing lives in `css/portfolio-field.css`

**Files:** Modify `css/craft.css` (remove the "cast at whole-number scale" rules and the ≥900 `.personaStation` sizing) and `css/portfolio-field.css` (edit the original rules in place).

- [ ] **Step 1:** Dump the computed styles of `.personaStill`, `.personaAnimated` (idle and walking), `.personaStation` and `.personaStation::before`. Do it at 1440, 1024, 768, 390 and 320, in day and night. Use the scratchpad dump script from the pixel-snap plan, extended with these selectors and `width`, `height`, `left`, `top`, `transform`, `backgroundSize`, `animationName`, `gridTemplateColumns` and `minHeight`. Save the result as `before.json`.
- [ ] **Step 2:** Move the values into the matching rules in `portfolio-field.css`:
  - `.personaStill` and `.personaAnimated`: 128×160
  - idle `background-size: 512px 160px`
  - the walk rule: `768px 160px` and `fieldWalkFrames` at -768px. Rename it to `fieldWalkFrames` and delete `fieldWalkFrames2x`.
  - the ≥900 station sizing, `round()` positions and `translate(-68px, -156px)`
  - the ≤899 64px column and 64×80 still

  Delete the craft.css copies.
- [ ] **Step 3:** Update `check-craft`'s walk-frame assertion to accept the renamed keyframes. Expect `fieldWalkFrames` with a -768px end. Ruling: the name changes with the move.
- [ ] **Step 4:** Dump to `after.json` and diff it against `before.json`. The only difference may be `animationName`. Run `check-craft`, `check-portfolio-field`, `check-isometric-field` and `check-portfolio-field-assets`. Expected: PASS.
- [ ] **Step 5:** Commit: `refactor: sprite sizing lives in portfolio-field.css`.

### Task 6: Full suite, review, PR, merge, deploy

- [ ] **Step 1:** Run the full suite (`check-*`, `smoke-*`, `node --test`, and the smoke-responsive temp copy). Check `uptime` first. Expected: all PASS.
- [ ] **Step 2:** Run a fresh-context final review on the most capable model, then do one TDD fix pass.
- [ ] **Step 3:** Push `feat/retro-pr4` and open a PR. Merge it, wait for the Pages build of the merge commit, and confirm the live `research/index.html` contains no `Karla`.
