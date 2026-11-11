# Retro PR 1: Day Theme, Pixel Type, Vellum-Shaped Hero

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship sections 1–3 of the retro spec:
- day theme by default, sitewide, with a remembered night toggle
- three typefaces with fixed roles
- a hero shaped like Vellum's, with Tony's pixel cast drawn at whole-number scale

**Architecture:**
- **Theme:** one rule applies on every page. `dark-mode` is added before first paint only when `localStorage.darkMode === 'enabled'`.
- **Fonts:** typeface roles become tokens (`--font-display`, `--font-body`, `--font-data`), set in `css/site-theme.css` and used everywhere.
- **Hero:** changes stay inside `css/craft.css` and `css/portfolio-field.css`, plus small markup edits in `index.html`.
- **Checks:** new assertions go in `scripts/check-craft.mjs`. Existing assertions change only where noted.

**Tech Stack:** HTML, CSS, jQuery and ES modules; Node 22 checks with Playwright; Google Fonts (Pixelify Sans).

**Spec:** `docs/superpowers/specs/2026-11-11-retro-vellum-design.md` (sections 1, 2, 3, plus Testing for PR 1).

## Global Constraints

- **Branch:** `feat/retro-redesign` (the spec is already committed there). Merge by PR only.
- **Typefaces:**
  - Pixelify Sans: wordmark, `.sectionTitle`, and RPG labels only. Sizes are multiples of 8px and never below 16px. Letter spacing is `0`.
  - Lato: body text, nav and buttons.
  - Inconsolata: dates and data only.
  - Karla must not appear anywhere on the homepage.
- **Sprites:** the native frame is 64×80. Only whole-number scales are allowed:
  - 2× (128×160) at 900px and wider. The 3× tier was dropped; see the spec's amendments.
  - 1× (64×80) in the mobile list layout below 900px
- **Content:** no new copy beyond the hero edits named in Task 3. Homepage words stay at 1744 or fewer; `check-portfolio-field` enforces this.
- **Colour:** every colour is a token. The day accent comes from the field palette, green or teal (`#2f5d50` family). No purple or indigo. Body text contrast is at least 4.5:1 in both modes.
- **Hooks:** every `data-*` attribute, id and test hook stays. `check-portfolio-field`, `check-isometric-field` and `check-field-routing` keep passing.

## Review Focus

1. **First paint:** a visitor who chose night must never see a flash of day.
2. **Cross-page preference:** day or night carries across the homepage, reports, research, chat, `log.html` and `colophon.html`.
3. **Pixel glyphs:** they must stay crisp at every size. That means no negative tracking, no fractional sizes and no `text-rendering` hacks.
4. **Field at 2× and 3×:** characters must not overlap each other or the season control, and touch targets stay at least 44px.
5. **Mobile:** the 96px wordmark must not overflow at 320px. On mobile the wordmark is 48px.

---

### Task 1: Day by default, sitewide

**Files:**
- Modify: every HTML file whose `<body class="dark-mode">` is set by default. That is `index.html`, `log.html`, `colophon.html`, `research/*.html`, `reports/*.html` and `chat/*.html` (25+ files; list them with `grep -l 'class="dark-mode"'`).
- Modify: the inline theme scripts in those files.
- Modify: `js/script.js:40`, `js/research.js:15` and `js/engineering-chat.mjs:655`.
- Modify: `scripts/smoke-theme.mjs`, but only the line-17 assertion. It currently expects night by default.
- Modify: `css/site-theme.css` (day palette tokens).
- Modify: `scripts/check-craft.mjs`.

- [ ] **Step 1: Write the failing checks.**
  - **check-craft:** open a fresh context with no storage. At `DOMContentLoaded`, `document.body.classList.contains('dark-mode')` must be `false`.
  - **check-craft:** in a second context, set `localStorage.darkMode='enabled'` via `addInitScript` (with no other change), then load the page. At `DOMContentLoaded`, `dark-mode` must be `true`.
  - **smoke-theme line 17:** flip the expectation to "did not open light". Ruling: the spec changes the default, so this one assertion changes with it.
- [ ] **Step 2:** Run both checks. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Remove `class="dark-mode"` from the default `<body>` everywhere.
  - Every inline or first-run script becomes `try{if(localStorage.getItem('darkMode')==='enabled')document.body.classList.add('dark-mode')}catch(_){}`.
  - `js/script.js` and `js/engineering-chat.mjs` stop removing the class on `'disabled'`, because day is now the base.
  - `js/research.js` changes from `!== 'disabled'` to `=== 'enabled'`.
- [ ] **Step 4: Day palette.** In `css/site-theme.css` `:root`:
  - `--lab-bg: #f6f4ee`
  - `--lab-bg-soft: #ece9df`
  - `--lab-ink: #1f2a2a`
  - `--lab-muted: #56625e`
  - `--lab-accent: #2f5d50`
  - `--lab-accent-hover: #234a3f`
  - `--lab-line: rgba(31,42,42,.16)`
  - `--lab-line-strong: rgba(31,42,42,.32)`
  - Mirror these into the legacy `--color-*` and `--ink`/`--body`/`--muted`/`--line`/`--wash`/`--accent` tokens.
  - Night tokens stay as they are.
  - Add a contrast check to check-craft. Compute the luminance of the body text colour against `--lab-bg` in both modes and require a ratio of at least 4.5. Read colours through a canvas, as the press-shade probe does.
- [ ] **Step 5:** Run `check-craft`, `smoke-theme`, `check-portfolio-field` (it toggles both modes), `smoke-chat` and `check-research-navigation`. Expected: PASS.
- [ ] **Step 6:** Commit: `feat: day theme by default, night remembered`.

### Task 2: Three typefaces with fixed roles

**Files:**
- Modify: `index.html` (font links: add Pixelify Sans; remove the Karla link at `:55`).
- Modify: `css/site-theme.css` (tokens).
- Modify: `css/style.css`, `css/portfolio-field.css`, `css/craft.css`, `css/guide-widget.css` and `css/log.css`. Replace every `'Karla'` family with the role token.
- Modify: `scripts/check-craft.mjs`.

- [ ] **Step 1: Write the failing checks.**
  - Walk every element on the homepage. No computed `font-family` includes `Karla`.
  - `h1.heroTitle` and every `.sectionTitle` compute to a family starting with `"Pixelify Sans"`.
  - `body`, `a.nav-link` and `.heroButton` compute to a family starting with `Lato`.
  - Every element whose family is Pixelify Sans has a computed `font-size` that is an integer multiple of 8 and at least 16. Its `letter-spacing` is `normal` or `0px`.
  - **Change** the Task-3 craft assertions from the craft-layer plan. The h1 tracking ratio was -0.03..-0.015 and section titles -0.025..-0.01; for Pixelify elements both now expect `0`. Ruling: negative tracking smears pixel glyphs (spec Review Focus 3).
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Add the `:root` tokens:
    - `--font-display: "Pixelify Sans", ui-monospace, monospace`
    - `--font-body: "Lato", system-ui, sans-serif`
    - `--font-data: "Inconsolata", ui-monospace, monospace`
  - Replace every `font-family: 'Karla'…` with `var(--font-body)`. Use `var(--font-display)` instead for `.heroTitle`, `.sectionTitle` and `.fieldToolbarTitle`.
  - Remove the tracking rules in `css/craft.css` for `.heroTitle` and `.sectionTitle`.
  - Set display sizes:
    - `.heroTitle` 96px, and 48px at ≤560px
    - `.sectionTitle` 48px, and 32px at ≤560px
    - `.fieldToolbarTitle` 24px
  - Load Pixelify Sans: `https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap`.
- [ ] **Step 4:** Run `check-craft`, `check-polish` and the `smoke-responsive` temp copy (with the "system boundary" line skipped). At 320px nothing may overflow. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: pixel display type, three fixed roles`.

### Task 3: Vellum-shaped hero

**Files:**
- Modify: `index.html` (hero markup only).
- Modify: `css/portfolio-field.css` and `css/craft.css`.
- Modify: `scripts/check-polish.mjs`, but only the outlined-secondary-button assertion, which changes to a text link.
- Modify: `scripts/check-craft.mjs`.

- [ ] **Step 1: Write the failing checks.**
  - **check-craft, at 1440:**
    - Every visible `.personaStill` (or `.personaAnimated`) has a rendered width/height of exactly 128×160.
    - `image-rendering` computes to `pixelated`.
  - **check-craft, at 1680:** the same sprites render at exactly 192×240.
  - **check-craft, at 390:** list-layout sprites render at 64×80.
  - **check-craft, at 1440 and 1680:**
    - No two visible `.personaStation` rects overlap.
    - No station overlaps `.fieldSeasonChoices`.
  - **check-craft:** the hero's secondary action is an `a.heroTextLink` (not a `.heroButton`), and its text matches `/Discuss a project/i`.
  - **check-craft:** the `.fieldScene` bottom edge sits below the `#heroSection` content box bottom at 1440. This is the "spills past the hero" bleed.
  - **check-polish:** replace the outlined-secondary assertion with `assert.match(html, /class="heroTextLink"/)`. Ruling: the spec makes the secondary action a text link.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Markup:** the secondary `.heroButton.heroButtonSecondary` becomes `<a class="heroTextLink" href="#contact">Discuss a project</a>`. The primary button keeps its classes. The copy is otherwise unchanged.
  - **Sprites:**
    - `.personaStill` and `.personaAnimated` become 128×160.
    - Idle `background-size` becomes 512px 160px.
    - Walk `background-size` becomes 768px 160px, and the `fieldWalkFrames` keyframe ends at -768px.
    - `.personaStation` width becomes 136px, and its `min-height` grows to fit.
    - At ≥1600px: 192×240, idle 768px 240px, walk 1152px 240px, a matching keyframe (`fieldWalkFrames3x` at -1152px), and station width 200px.
    - At ≤899px (list layout): 64×80, with the grid column at 64px.
  - **Bleed:**
    - `#heroSection` keeps `overflow: visible`.
    - `.fieldScene` gets `margin-bottom: -96px` at ≥900px.
    - The next section gets `padding-top` so its content clears the field, and the section background sits behind the field (`position: relative; z-index` below the hero).
  - **Text link:** `font-family: var(--font-body)`, underlined with the craft link tokens, with a hover colour step.
- [ ] **Step 4:** Run every suite:
  - `check-*`
  - `smoke-*`, with `smoke-glyph` on :8765
  - `node --test tests/*.test.mjs`
  - the `smoke-responsive` temp copy

  Confirm the word budget passes. Expected: all PASS.
- [ ] **Step 5:** Commit: `feat: vellum-shaped hero with the pixel cast at whole-number scale`.

### Task 4: Compare against the references and open the PR

- [ ] **Step 1:** Take screenshots of `localhost:8000` at 1440 and 390, in day and night, for the hero and the first section below it. Put them next to `.hallmark/references/2026-11-11/vellum/desktop-1440x900.png` and the current live site. Bar: the first screen is unmistakably Tony's game world and reads as calmly as Vellum's. Record the verdict in `_audit/retro-pr1-result.md`.
- [ ] **Step 2:** Run a fresh-context final review on the most capable model. Point it at the spec's Testing section and this plan's Review Focus. Do one fix pass, using TDD.
- [ ] **Step 3:** Push `feat/retro-redesign` and open a PR against `main` titled "Retro PR 1: day theme, pixel type, hero".
