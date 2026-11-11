# Craft Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the site feel made rather than templated. This plan changes how things move, respond and sit on the page. It does not change what the page says. Every value below comes from measured references.

**Architecture:** Motion and depth tokens are declared once at `:root` in `css/site-theme.css` and used everywhere. A new Playwright check, `scripts/check-craft.mjs`, measures computed styles and interaction frames on the live page, the same way the reference study measured Linear and Muse. It fails on regressions. No new dependencies.

**Spec:** `.hallmark/references/2026-11-11/FINDINGS.md` (private reference library: 23 sites, screenshots, `tokens.json`, interaction frames). Hallmark Floor rules 1–16 still bind.

## Global Constraints

- Work on branch `feat/craft-layer` from `main` (`ce028db` or later). Merge by PR.
- **Copy stays as it is**: no new claims, no rewording, and the word budget holds. `check-portfolio-field` already fails above 1744 words.
- **Palette stays as it is**, except for the hover and press shades that Task 2 derives from the existing tokens.
- **Motion tokens** (exact values, from the references):
  - `--ease-out: cubic-bezier(0.32, 0.72, 0, 1)` (Linear)
  - `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)` (Vercel)
  - `--dur-press: 100ms`
  - `--dur-hover: 160ms`
  - `--dur-ui: 240ms`
- **Press:** `transform: scale(0.97)` on `:active`. **Hover:** colour or shadow change in place. No `translateY` lift and no glow.
- **Reduced motion:** under `prefers-reduced-motion: reduce`, press scale and colour fades become instant. States stay visible.
- **Do not copy:** signature pieces (Rauno's disc, Ciechanowski's simulations, Stripe's ribbon), mascots, particle bursts, terminal or neon "quant" looks, glass panels (Hallmark warning 29), or Apple's exact tracking values.

## Review Focus

1. **Touch:** `:active` scale must not get stuck on iOS Safari after the finger lifts. Use `@media (hover: hover)` for hover rules only.
2. **Keyboard:** Enter or Space on a button shows the press state. `:focus-visible` rings never animate in, so they appear instantly.
3. **Dark and light themes:** derived hover and press shades keep text contrast at 4.5:1 or better in both themes.
4. **Lazy images:** a card whose image has not loaded shows a tinted placeholder of the right height in both themes. It is never an empty dark box.
5. **The field:** cast and season toggles get the same press and hover treatment. `check-portfolio-field` and `check-isometric-field` still pass, including their reduced-motion runs.

---

### Task 1: Craft check + motion tokens

**Files:**
- Create: `scripts/check-craft.mjs`
- Modify: `css/site-theme.css` (`:root` tokens)
- Modify: `css/style.css` and `css/portfolio-field.css` (transition curves)

**Interfaces:**
- Produces: `scripts/check-craft.mjs`, a Playwright check at 1440×900 against `http://localhost:8000/`. Later tasks append to it.
- Produces: the tokens `--ease-out`, `--ease-standard`, `--dur-press`, `--dur-hover`, `--dur-ui`.

- [ ] **Step 1: Write the failing check.**
  - Assert that `getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim()` equals `cubic-bezier(0.32, 0.72, 0, 1)`.
  - Statically, assert that our CSS (`style.css`, `site-theme.css`, `portfolio-field.css`, `log.css`) has no `transition` declaration whose timing is bare `ease`, `ease-in-out` or no curve at all. Use the regex `/transition:[^;]*\b(ease|ease-in-out|ease-in)\b(?!-)/`, then allow only `var(--ease-…)` or `cubic-bezier(`.
- [ ] **Step 2:** Run `node scripts/check-craft.mjs` (server on :8000). Expected: FAIL on the missing token.
- [ ] **Step 3:** Add the tokens. Then replace every transition curve with `var(--ease-standard)` (colour, background, border) or `var(--ease-out)` (transform, opacity). Map durations: `0.3s` becomes `var(--dur-ui)`, and anything at 0.15–0.2s becomes `var(--dur-hover)`.
- [ ] **Step 4:** Run `check-craft`, `check-polish`, `check-portfolio-field` and `check-isometric-field`. Expected: PASS.
- [ ] **Step 5:** Commit: `style: one motion system`.

### Task 2: Buttons respond like objects

**Files:** Modify `css/style.css`, `css/portfolio-field.css`, `css/log.css`, `scripts/check-craft.mjs`

**Targets:** `.heroButton` (both variants), `#filter .btn`, `.projectViewButton`, `.fieldCastChoices button`, `.fieldSeasonChoices button`, `.contactLink`, `.labelMore > summary`, `.fieldSelectionLink`.

- [ ] **Step 1: Write the failing check.** On `.heroButtonPrimary`, do the following, sampling `getComputedStyle(el).transform` 120ms after each action:
  - **Rest:** `transform` is `none`.
  - **Hover:** `transform` is still `none`, and `background-color` differs from rest.
  - **Mouse down:** `transform` matches a scale between 0.96 and 0.98 (parse the matrix `a`).
  - **Mouse up:** the button is back to rest.

  Repeat the mouse-down assertion for one `#filter .btn` and one `.fieldCastChoices button`.

  Also, at rest and on hover, assert that `.heroButtonPrimary`'s `box-shadow` contains no `rgba(249, 168, 37`, which is the amber glow.
- [ ] **Step 2:** Run it. Expected: FAIL on hover (the `translateY(-2px)` lift).
- [ ] **Step 3: Implement.**
  - Remove the hover `translateY` and the amber glow. Hover becomes one step of colour.
    - For the primary button: `color-mix(in srgb, var(--lab-accent) 88%, var(--lab-ink))`, or the theme's existing `--lab-accent-hover`. Prefer the existing token.
    - For secondary and outlined controls: `var(--lab-accent-soft)` fill.
  - `:active { transform: scale(0.97); transition-duration: var(--dur-press); }`. On press, the colour steps one shade darker than the hover shade.
  - Put hover rules inside `@media (hover: hover)`.
  - Add a reduced-motion block that sets these transitions to `0s` but keeps the states.
- [ ] **Step 4:** Run `check-craft` and the field checks. Then, in the browser pane, tab to the hero button and press Space: the press state shows. Expected: PASS.
- [ ] **Step 5:** Commit: `style: press and hover states from the reference study`.

### Task 3: Type with contrast

**Files:** Modify `css/style.css`, `css/portfolio-field.css`, `scripts/check-craft.mjs`

- [ ] **Step 1: Write the failing check.**
  - `h1.heroTitle`'s computed `letter-spacing` in px, divided by its `font-size`, is between -0.03 and -0.015.
  - Each `.sectionTitle`'s ratio is between -0.025 and -0.01.
  - `.heroButton`'s `letter-spacing` is not positive.
  - `.heroSubtitle`'s `font-family` does not include Inconsolata.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Set `.heroTitle { letter-spacing: -0.025em; text-wrap: balance; }` and `.sectionTitle { letter-spacing: -0.02em; text-wrap: balance; }`.
  - Set button `letter-spacing` to `0`.
  - Give type faces fixed roles: Karla for display, Lato for body, and Inconsolata only for dates, versions and code, as the log already does. `.heroSubtitle` moves to Lato.
  - Align the "Find" nav item: same face, size and weight as its siblings.
- [ ] **Step 4:** Run `check-craft` and `smoke-responsive` (temp copy with the known 'system boundary' line skipped). At 320px, check that no heading wraps worse. Expected: PASS.
- [ ] **Step 5:** Commit: `style: display tracking and type roles`.

### Task 4: Surfaces with depth, and no blank cards

**Files:** Modify `css/site-theme.css` (shadow tokens), `css/style.css`, `scripts/check-craft.mjs`

- [ ] **Step 1: Write the failing checks.**
  - `.filterItem`'s computed `box-shadow` has at least 2 layers, one of them a hairline (0 0 0 1px).
  - Load the page and take `.filterItemImg` elements before they scroll into view. Each one's computed `background-color` is not transparent and not equal to the card background, and its height is at least 200px in both themes.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Add `--shadow-card: 0 0 0 1px var(--lab-line), 0 1px 2px rgb(0 0 0 / 0.12), 0 8px 24px -12px rgb(0 0 0 / 0.35)`. This is a hairline plus two soft layers, after Linear.
  - Card hover deepens only the last layer, on `var(--dur-hover)`. The card does not lift.
  - Placeholder: `.filterItemImg { background: var(--lab-bg-soft); aspect-ratio: 16 / 10; }`. Keep `object-fit: contain`. Use `aspect-ratio` instead of the fixed 300px height, so the box holds its size before the image loads.
- [ ] **Step 4:** Run `check-craft` and the `smoke-responsive` temp copy. Then scroll at 390 in the browser pane: no empty dark boxes. Expected: PASS.
- [ ] **Step 5:** Commit: `style: card depth and image placeholders`.

### Task 5: Fewer control layers in the hero

**Files:** Modify `index.html`, `css/portfolio-field.css`, `js/portfolio-field.mjs` (only if a selector changes), `scripts/check-portfolio-field.mjs` (only if the season control moves)

- [ ] **Step 1: Decide by measurement.** Count the interactive controls above the fold at 1280×800. Currently there are 2 hero buttons, 3 cast buttons and 2 season buttons.
  - Target: 2 hero buttons plus the cast choice.
  - The season control becomes one icon button, `aria-label="Switch to snow"` / `"Switch to summer"`, with `aria-pressed`, placed inside the field's corner.
  - Its `data-season-choice` hooks must still work. Read `js/portfolio-field.mjs` first and keep the existing handler.
- [ ] **Step 2:** Update the `check-portfolio-field` season assertions to drive the one button, then run it. Expected: FAIL until the markup changes.
- [ ] **Step 3:** Implement. Give the toolbar groups the 8px control radius, matching the chips.
- [ ] **Step 4:** Run `check-portfolio-field`, `check-isometric-field` and `check-craft`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: one season control inside the field`.

### Task 6: Links and a live proof line

**Files:** Modify `css/style.css`, `css/log.css`, `index.html`, `js/portfolio-field.mjs` (or a small inline module), `scripts/check-craft.mjs`, `scripts/check-evidence.mjs`

- [ ] **Step 1: Write the failing checks.**
  - Body links: `text-decoration-color` is not `currentColor` at rest (it is tinted), `text-underline-offset` is 2px or more, and the transition includes `text-decoration-color`.
  - A hero line `.heroProof` exists with the text `/^\d+ pages logged, latest added \d{1,2} [A-Z][a-z]{2} \d{4}$/`.
  - In `check-evidence`, its count equals the number of `.logEntry` items in `log.html`, and its date equals the newest entry's date.
- [ ] **Step 2:** Run both checks. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Links: `text-decoration-color: var(--lab-line-strong); text-underline-offset: 3px; transition: text-decoration-color var(--dur-ui) var(--ease-standard);`. On hover, the decoration takes the link colour.
  - `.heroProof` is static HTML in the hero, under the actions, in Inconsolata, muted, linking to `log.html`. Write the values by hand from the log. `check-evidence` keeps them honest. No JS and no animation: this is the "live" signal, and it can be checked.
- [ ] **Step 4:** Run every suite:
  - `check-*` scripts
  - `smoke-*` scripts, with `smoke-glyph` on :8765
  - `node --test tests/*.test.mjs`
  - the `smoke-responsive` temp copy

  Confirm the word budget still passes. Expected: all PASS.
- [ ] **Step 5:** Commit: `feat: tinted links and a checkable proof line`.

### Task 7: Compare against the references and open the PR

- [ ] **Step 1:** Run `scripts/check-craft.mjs` in a measuring mode that prints the same token set the reference study recorded: h1 tracking, button radius and transition, press scale, and hover delta. Save the output to `_audit/craft-result.md` next to the Linear, Muse and Apple values from `FINDINGS.md`.
- [ ] **Step 2:** Screenshot `localhost:8000` at 1440 and 390, plus 5 frames of a press on the hero button (80ms apart). Compare them with `.hallmark/references/2026-11-11/linear/button-press-*.png` and `meta-muse/trymuse-press-*.png`.
  - The bar: the press reads as a give, hover reads as a colour step, and nothing lifts.
  - Record the verdict.
- [ ] **Step 3:** Run a fresh-context final review. Then open a PR against `main`.

**Deferred** (until there is material for them):
- A swapping hero word with an inline icon, as on Muse. That needs a real set of verbs and dated work behind each one.
- A real chart in the hero. That needs a public, real data series.
