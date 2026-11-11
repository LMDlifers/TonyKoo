# Pixel Snap, Walk-Frame Check, Toggle Icon, Ponytail Cuts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development). Steps use checkbox (`- [ ]`) syntax.

**Goal:** This plan closes out the three items PR #5 left for later:
- The characters sit at fractional pixel positions.
- Nothing checks the walk animation frames.
- The night-mode toggle shows the wrong icon.

It also applies the safe cuts from the ponytail review of `css/craft.css` and `scripts/check-craft.mjs`.

**Architecture:** The changes stay small and live where the behaviour is defined.
- **Snapping:** CSS `round()` snaps each station to whole pixels. No JS change.
- **Walk frames:** one new assertion block in `scripts/check-craft.mjs`.
- **Toggle icon:** a one-line fix in `js/script.js`, so Font Awesome redraws the icon.
- **Cleanup:** deletions and merges in `css/craft.css` and `scripts/check-craft.mjs`. Behaviour does not change.

**Tech Stack:** CSS (`round()`), jQuery, Font Awesome 5.10.1 SVG+JS (`js/all.min.js`), and Node 22 with Playwright for the checks.

**Spec:** `docs/superpowers/specs/2026-11-11-retro-vellum-design.md`, section 3 and the Amendments (sprites at whole-number scale, 2× at 900px and wider). The ponytail review findings are recorded below.

## Global Constraints

- Work on branch `fix/pixel-snap-toggle`, cut from `main` at `eb5d67c` or later. Merge by PR.
- Every existing check stays green: all `check-*` and `smoke-*` scripts, `node --test tests/*.test.mjs` (61), and the `smoke-responsive` temp copy with the "system boundary" line skipped. The word budget stays at or under 1744.
- No visual change except the toggle icon. The cleanup tasks must leave every computed style identical.

## Review Focus

1. **Snapping must not move characters off their walk route.** `round()` moves a station by at most 0.5px. The `check-isometric-field` drag and route tests must pass unchanged.
2. **Walking keeps snapping.** Walking updates `--x`/`--y` every frame, and every frame must still snap, so the sprite never sits between pixels. Task 1 samples the sprite while it walks.
3. **The toggle icon on first paint for a night visitor.** The page loads with `dark-mode` set before jQuery runs, so the sun must show without a click. Task 3 tests a stored-night load.
4. **Reduced motion after deleting craft.css's own block.** The global `prefers-reduced-motion` rule in `css/style.css` (3502–3509, `transition-duration: 0.01ms !important`) must still make the press instant. Task 4 asserts this.
5. **Font Awesome redraw timing.** Font Awesome converts `<i>` to `<svg>` asynchronously. Task 3 waits for `svg[data-icon]` before it asserts.

---

### Task 1: Snap the cast to whole pixels

**Files:**
- Modify: `css/craft.css`, inside the existing `@media (min-width: 900px)` block that holds `.personaStation`.
- Modify: `scripts/check-craft.mjs`.

**Interfaces:**
- Produces: `.personaStation` boxes whose `left`/`top` land on whole CSS pixels at 900px and wider.

- [ ] **Step 1: Write the failing check.**
  - At 1440×900 and 1280×800, scroll `.fieldScene` into view and wait 300ms.
  - For every visible sprite (`.personaStill` or `.personaAnimated` with a nonzero rect), assert that `Math.abs(r.left - Math.round(r.left)) < 0.01` and the same for `r.top`. Message: `` `sprite at ${r.left},${r.top} is between pixels (width ${width})` ``.
  - Then add `is-walking` to the first station (with `.fieldScene[data-active="true"]`), wait 200ms, and assert the same on its `.personaAnimated`.
- [ ] **Step 2:** Run `node scripts/check-craft.mjs` with the server on :8000. Expected: FAIL. The reviewer measured `-156.8` from `translate(-50%, -80%)`.
- [ ] **Step 3: Implement.** In the `≥900px` block:
  ```css
  .personaStation {
      left: round(nearest, calc(var(--x) * 100%), 1px);
      top: round(nearest, calc(var(--y) * 100%), 1px);
      transform: translate(-68px, -156px);
  }
  ```
  The station is 136×196, so `-68px` is exactly half its width and `-156px` is 80% of its height, rounded down. Leave the base rule in `css/portfolio-field.css` alone; the phone list resets `transform` and `position` itself.
- [ ] **Step 4:** Run `check-craft`, `check-portfolio-field`, `check-isometric-field` and `check-field-routing`. Expected: PASS.
- [ ] **Step 5:** If the 1280 assertion still fails because `.fieldWorld` itself sits at a fractional x, snap the world: `.fieldScene { max-width: 1000px; }` already gives an integer width, so centre it with `margin-inline: auto` on an even-width container. Record the measured world `left` in the commit message. Commit: `fix: snap the cast to whole pixels`.

### Task 2: Check the walk frames

**Files:**
- Modify: `scripts/check-craft.mjs`.

- [ ] **Step 1: Write the check.** At 1440×900, add `data-active="true"` to `.fieldScene` and `is-walking` to the first visible `.personaStation`, then read its `.personaAnimated`. Assert:
  - `backgroundSize === "768px 160px"`, which is 6 frames × 128px.
  - `animationName === "fieldWalkFrames2x"`.
  - `animationTimingFunction` matches `/steps\(6/`.
  - In `document.styleSheets`, the `CSSKeyframesRule` named `fieldWalkFrames2x` has a final keyframe whose `style.backgroundPositionX` is `"-768px"`. Skip cross-origin sheets with `try/catch`.

  Before trusting the check, confirm it can fail. Change `768px` to `480px` in `css/craft.css` temporarily, run the check and watch it fail on `backgroundSize`, then revert the edit. Write in the commit message that you did this.
- [ ] **Step 2:** Run `check-craft`. Expected: PASS with the real CSS, and FAIL with the temporary 480px edit.
- [ ] **Step 3:** Commit: `test: walk frames stay whole at 2x`.

### Task 3: Toggle shows the right icon

**Files:**
- Modify: `js/script.js:42-48` (`syncThemeToggle`).
- Modify: `scripts/check-craft.mjs`.

- [ ] **Step 1: Write the failing check.** Use a fresh context at 1440×900.
  - Load `/`, wait for `#darkModeToggle svg[data-icon]`, and assert `data-icon === "moon"` and `aria-label === "Switch to dark mode"`.
  - Click the toggle. Wait for `#darkModeToggle svg[data-icon="sun"]` with a 2000ms timeout, and assert `aria-label === "Switch to light mode"`.
  - Click again and expect `moon`.
  - In a second context, store night with `addInitScript` (`localStorage.darkMode = "enabled"`), load `/`, and expect `sun` without clicking.
- [ ] **Step 2:** Run it. Expected: FAIL on the first click (the icon stays `moon`).
- [ ] **Step 3: Implement.** Replace the `.find("i").toggleClass(...)` chain with
  ```js
  darkModeToggle.html(`<i class="fas fa-${isDark ? "sun" : "moon"}" aria-hidden="true"></i>`);
  ```
  This works because Font Awesome swaps `<i>` for `<svg>`, so toggling classes on the old `<i>` does nothing. Its mutation observer converts newly inserted `<i>` elements.
- [ ] **Step 4:** Run `check-craft` and `smoke-theme`. Expected: PASS.
- [ ] **Step 5:** Commit: `fix: theme toggle icon follows the theme`.

### Task 4: Ponytail cuts in `css/craft.css`

Line numbers are from `main` at `eb5d67c`. Every computed style must stay the same.

| Lines | Tag | Change |
|---|---|---|
| L72–84 | delete | The `prefers-reduced-motion` block. The global rule at `css/style.css:3502-3509` (`transition-duration: 0.01ms !important` on `*`) already covers it. |
| L301–311 | shrink | Remove the `.heroTextLink` underline and transition declarations, and add `.heroTextLink` to the link selector list at L171–176. Keep its own `color`, `font-family`, `font-weight`, `margin-left`, `align-self` and the hover colour step. |
| L335–341 + L374–376 | shrink | Merge the two `#portfolioField` rules in the same `@media (min-width: 900px)` block into one. |
| L86 | shrink | Fix the stale comment: tracking is now 0. Use "Type: balanced wrapping on display heads; buttons untracked." |
| L326 | delete | Remove the duplicate comment line. L327–328 says the same thing. |
| L99, L202 | shrink | Change `'Lato', sans-serif` and `'Inconsolata', monospace` to `var(--font-body)` and `var(--font-data)`. The line count does not change, but the type roles stay in one place. |

- [ ] **Step 1: Pin computed styles before changing anything.** Write a throwaway script, outside the repo in the scratchpad, that dumps computed `transition`, `transform`, `text-decoration-*`, `font-family`, `color`, `margin` and `padding` for the following, in day and night at 1440 and 390:
  - `.heroButtonPrimary`, `.heroTextLink`, `.logEntry a`, `#portfolioField`, `.heroSubtitle`, `.heroProof`
  - `.heroButtonPrimary` again under `reducedMotion: 'reduce'` with `:active`

  Save the output as `before.json`.
- [ ] **Step 2:** Apply the cuts in the table.
- [ ] **Step 3:** Run the same dump to `after.json`. Run `diff before.json after.json` and expect no differences, except that `transition-duration` under reduced motion becomes `1e-05s` instead of `0s`. That still counts as instant, and Review Focus 4 accepts it. Run `check-craft`, `check-polish`, `check-portfolio-field` and the `smoke-responsive` temp copy. Expected: PASS.
- [ ] **Step 4:** Commit: `refactor: trim craft.css (ponytail review)`.

### Task 5: Ponytail cuts in `scripts/check-craft.mjs`

| Lines | Tag | Change |
|---|---|---|
| 71 and 114 | shrink | Two inline canvas colour readers do the same thing. Define them once with `await page.addInitScript(() => { window.__rgb = (c) => { … } })` on each page that needs it, or as a page-evaluated helper string. Both call sites use `window.__rgb`. |
| 156 and 195 | shrink | `hit` and `overlap` are the same rectangle test. Define `const hit = (a, b) => …` once at the top level in Node, and use it in both places. |
| 129 | shrink | The comment says the field is "capped at 1440". It is capped at 1000 (spec Amendments). |

- [ ] **Step 1:** Make the edits. The checks' behaviour must not change.
- [ ] **Step 2:** Run `check-craft`. Expected: PASS. Confirm the line count dropped with `wc -l scripts/check-craft.mjs`; it was 314 before the Task 1–3 additions.
- [ ] **Step 3:** Commit: `refactor: share colour and overlap helpers in check-craft (ponytail review)`.

### Task 6: Full suite and PR

- [ ] **Step 1:** With the server on :8000 (and :8765 for `smoke-glyph`), run every `check-*` and `smoke-*` script, `node --test tests/*.test.mjs` and the `smoke-responsive` temp copy. Check `uptime` first; above load 20, rerun any failures once before you investigate. Expected: all PASS.
- [ ] **Step 2:** Push `fix/pixel-snap-toggle` and open a PR against `main`. Include the ponytail net line change and the one deliberate visual change (the toggle icon).

## Ponytail review (03c8ba3..main, craft, evidence and retro work)

```
css/craft.css:L72-84: delete: reduced-motion block. Global *-rule at style.css:3502 already sets transition-duration 0.01ms !important.
css/craft.css:L301-311: shrink: .heroTextLink repeats the link underline/transition declarations. Add it to the L171 link list.
css/craft.css:L335-341+L374-376: shrink: #portfolioField twice in one media block. One rule.
css/craft.css:L86: shrink: stale "tighten as they grow" comment; tracking is 0 now.
css/craft.css:L326: delete: duplicate comment line.
css/craft.css:L4-84: shrink (not taken): the same 9-selector list is repeated 4 times. :is() would merge them, but it raises every selector to #filter's ID specificity and changes which rules win. Left alone on purpose.
css/craft.css:L255-298: yagni (not taken): sprite sizes override css/portfolio-field.css instead of editing it. Moving them belongs to a later portfolio-field.css pass.
scripts/check-craft.mjs:L71+L114: shrink: two inline canvas colour readers. One helper.
scripts/check-craft.mjs:L156+L195: shrink: hit() and overlap are the same rectangle test. One helper.
scripts/check-evidence.mjs, scripts/check-polish.mjs, css/log.css: lean already.
net: about -30 lines possible (taken in Tasks 4–5).
```
