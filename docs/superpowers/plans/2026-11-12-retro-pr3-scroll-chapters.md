# Retro PR 3: Two Scroll Chapters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship spec section 5: exactly two scroll chapters.
- One sits before Projects, with the AI Engineer.
- One sits before Contact, with the Student.

In each, one character, drawn large, walks in as the chapter scrolls through the screen. A pixel-frame dialogue box shows that section's existing intro sentence.

**Architecture:**
- **Markup:** each chapter is a small static `<section class="chapter">` in `index.html`.
- **Motion:** two CSS animations on the sprite.
  - A time-based walk cycle uses the existing walk sheet scaled 8× (`steps(6)`).
  - A scroll-driven slide-in uses `animation-timeline: view()`.
  - Both sit inside `@supports (animation-timeline: view())` and `@media (prefers-reduced-motion: no-preference)`. Everywhere else the chapter is static and complete.
- **No JS:** no script, listener or library.
- **Check:** one new script, `scripts/check-chapters.mjs`.

**Tech Stack:** HTML, CSS scroll-driven animations, and Node 22 with Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-retro-vellum-design.md` (section 5, Testing for PR 3, and the Amendments).

## Global Constraints

- **Branch:** `feat/retro-pr3`, cut from `main` after Retro PR 2 merges. It needs `.pixelFrame` from PR 2. Merge by PR.
- **Count:** exactly two chapters. Each is at most one screen tall: `max-height: 100svh`.
- **Copy:** no new words. The dialogue text **moves** from the section it introduces; it is not copied.
  - Projects' `.sectionIntro` (`index.html:222`) moves into chapter 1.
  - The Contact paragraph that starts "Open to AI engineering…" (`index.html:1656`) moves into chapter 2.
  - The homepage word budget (1744 or fewer) must still pass.
- **Sprite scale:** 8× from 900px wide (512×640), and 4× below 900px (256×320). Both are whole-number scales, and both stay crisp with `image-rendering: pixelated`.
- **Hallmark floor:** no scroll-linked effect except these two. Content must stay visible with JS off, and under reduced motion. No horizontal overflow from 320 to 1440.

## Review Focus

1. **Reduced motion and unsupported browsers.** The character stands in its final place and the dialogue is visible. Task 2 tests this under `reducedMotion: 'reduce'`, and statically checks that every animation rule sits inside both guards.
2. **The slide-in must not cause horizontal scroll.** The sprite starts off-screen to the left. The chapter gets `overflow-x: clip`, and Task 1 checks every width.
3. **Anchor links and `#portfolio` / `#contact` targets.** The chapters sit before those sections, so nav links must still land on the section heading, not the chapter. Task 1 checks that clicking the nav's Projects link scrolls `#portfolio` to the top, and Contact likewise.
4. **Screen readers.** The sprite is decorative (`aria-hidden="true"`). The dialogue text is the section's intro, so it must stay readable and in order. Each chapter carries `aria-label`, and its text is not hidden.
5. **The moved Contact sentence.** `check-launch-readiness` or other checks may assert it inside `.contactCopy`. Task 1 searches every script and test for the sentence and updates any assertion that pins its location. Each such change is recorded as a ruling.

---

### Task 1: Static chapters with the moved intro sentences

**Files:**
- Modify: `index.html`. Add the two `<section class="chapter">` blocks, and move the two sentences into them.
- Modify: `css/craft.css`. Add the chapter layout.
- Create: `scripts/check-chapters.mjs`.
- Modify: `README.md`. Add `check-chapters` to the launch-readiness block.

**Interfaces:**
- Produces:
  ```html
  <section class="chapter" id="chapter-projects" aria-label="Before the projects">
    <div class="chapterSprite chapterSprite--ai-engineer" aria-hidden="true"></div>
    <p class="chapterDialogue pixelFrame">…moved sentence…</p>
  </section>
  ```
  The second chapter is the same with `id="chapter-contact"`, `aria-label="Before contact"` and `--student`.

  `.chapterSprite` is a `div` whose background is the character's still PNG, at 512×640 (or 256×320 on phones), with `background-size` set to fit. Task 2 adds the walk sheet.

- [ ] **Step 1: Write the failing check** (`scripts/check-chapters.mjs`). It uses the same Playwright and Chrome setup as `check-craft.mjs`.
  - **Count:** `document.querySelectorAll(".chapter").length === 2`. The ids are `chapter-projects`, which sits immediately before `#portfolio`, and `chapter-contact`, which sits immediately before `#contact`. Check this with `nextElementSibling` after skipping comments.
  - **Moved text:** each `.chapterDialogue` text, trimmed, equals the original sentence (copy both strings exactly from `index.html` before moving them). That text no longer appears in `#portfolio .sectionIntro` or `#contact .contactCopy p`.
  - **Size:** at 1440×900, `.chapterSprite` measures 512×640. At 390×844 it measures 256×320. In both, `imageRendering === "pixelated"`.
  - **Height:** each chapter's height is at most `innerHeight` at 1440×900 and 390×844.
  - **No overflow:** `scrollWidth <= clientWidth` at 320, 390, 768, 1024 and 1440.
  - **JS off:** in a context with `javaScriptEnabled: false`, both dialogues are visible (nonzero rect, `opacity` not 0).
  - **Anchors:** at 1440, click `a.nav-link[href="#portfolio"]` and wait 800ms. `#portfolio` `getBoundingClientRect().top` is between 0 and 120, which allows for the fixed nav. Do the same for `#contact`.
- [ ] **Step 2:** Run `node scripts/check-chapters.mjs` with the server on :8000. Expected: FAIL (no chapters yet).
- [ ] **Step 3: Implement.**
  - Insert the two sections and move the two sentences.
  - **Layout:** a two-column grid at 900px and wider (sprite on the left, dialogue on the right), and stacked below 900px. Add `overflow-x: clip` and `max-height: 100svh`.
  - **Sprite:**
    - `background: url(images/portfolio-field/<role>-still.png) no-repeat 0 0 / 100% 100%`
    - `width: 512px; height: 640px` at 900px and wider, and `256px × 320px` below 900px
    - `image-rendering: pixelated`
  - **Dialogue:** `.pixelFrame` (from PR 2), `var(--font-body)`, 20px.
  - Run `grep -rn "Open to AI engineering\|Public-safe summaries" scripts tests` and update any assertion that pins the old location. Record each change as a ruling.
- [ ] **Step 4:** Run `check-chapters`, `check-polish`, `check-launch-readiness`, `check-portfolio-field` (it enforces the word budget) and the `smoke-responsive` temp copy. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: two static story chapters with the moved intro sentences`.

### Task 2: Walk in on scroll, static everywhere else

**Files:** Modify `css/craft.css` and `scripts/check-chapters.mjs`

- [ ] **Step 1: Write the failing checks.**
  - **Motion on (default context, Chromium):** the `.chapterSprite` computed `animationTimeline` contains `view()` for the slide, and its `animationName` contains both `chapterWalkIn` and `chapterWalkFrames`.
    - Scroll chapter 1 to the top of the screen.
    - Scroll so the chapter is entering, then sample its `transform` matrix `e` value at two scroll positions. `e` at the later position must be greater (closer to 0) than at the earlier one.
  - **Reduced motion** (`reducedMotion: 'reduce'`):
    - `animationName === "none"` and `transform === "none"`. The sprite is in its final place.
    - The dialogue is visible.
    - The sprite background is the still PNG, not the walk sheet.
  - **Static guard:** read `css/craft.css` as text. Every block that mentions `chapterWalk` or `animation-timeline` sits inside a `@supports (animation-timeline: view())` block, which itself sits inside `@media (prefers-reduced-motion: no-preference)`. Assert this by extracting that nested block with a regex and checking that no `chapterWalk` occurrence falls outside it.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Implement**, inside `@media (prefers-reduced-motion: no-preference) { @supports (animation-timeline: view()) { … } }`:
  ```css
  .chapterSprite {
      background-image: var(--chapter-walk);
      background-size: calc(6 * 100%) 100%;
      animation:
          chapterWalkFrames .75s steps(6) infinite,
          chapterWalkIn linear both;
      animation-timeline: auto, view();
      animation-range: normal, entry 0% cover 45%;
  }
  @keyframes chapterWalkFrames { to { background-position-x: -500%; } }
  @keyframes chapterWalkIn { from { transform: translateX(-60vw); } to { transform: none; } }
  ```
  Set `--chapter-walk` per role to `url(images/portfolio-field/<role>-walk.png)`. Each walk sheet is 6 frames; at 600% width and `steps(6)`, the position runs over -500% in 5 steps. Check that the frame math lands on whole frames: at 8× each frame is 512px and the strip is 3072px. Add a check for this, sampling `backgroundSize` and confirming it is `3072px 640px` at 1440.
- [ ] **Step 4:** Run `check-chapters`, `check-craft`, the `smoke-responsive` temp copy, `check-portfolio-field` and `check-isometric-field`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: chapters walk in on scroll, static under reduced motion`.

### Task 3: Verify, review, PR, merge, deploy

- [ ] **Step 1:** Run the full suite: `check-*` (including `check-chapters`), `smoke-*` (glyph on :8765), `node --test tests/*.test.mjs`, and the `smoke-responsive` temp copy. Check `uptime` first. Above load 20, rerun a failure once before investigating. Expected: all PASS.
- [ ] **Step 2:** Take screenshots of both chapters at 1440 and 390, in day and night. For each, capture three scroll positions: entering, mid-way and settled. Record the verdict against the Vellum reference in `_audit/retro-pr3-result.md`. Bar: it feels like one quiet story beat, not a gimmick.
- [ ] **Step 3:** Run a fresh-context final review on the most capable model, then one TDD fix pass.
- [ ] **Step 4:** Push `feat/retro-pr3`, open a PR against `main`, merge it, wait for the Pages build of the merge commit, and confirm the live HTML contains both `id="chapter-projects"` and `id="chapter-contact"`.
