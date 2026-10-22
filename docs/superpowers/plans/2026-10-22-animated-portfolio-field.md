# Animated Portfolio Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the portfolio's static technical hero with an original pixel-art field where three animated versions of Tony lead to Projects, Research, and Background.

**Architecture:** Keep the existing static HTML/GitHub Pages site. Native links form fixed, accessible stations; original local sprite sheets animate only the artwork inside them. A small standalone script activates motion when visible and selects the existing AI project filter before following its native anchor. A separate stylesheet owns the scene, and the current proof material moves below it.

**Tech Stack:** HTML, CSS animations, vanilla JavaScript, original SVG/PNG assets, Node checks, existing Playwright/Chrome smoke tooling. No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-10-22-animated-portfolio-field-design.md`

## Global Constraints

- Publish original art only. Maples.im may inform a local concept, but no MapleStory logo, map, monster, music, exported frame, or traced sprite enters the public repo.
- Three destinations: AI Engineer → `#portfolio` with AI filter; Researcher → `research/`; Student → `#resume`.
- Each station remains a native link with a fixed, labeled hit area; the artwork may move only inside that area.
- Keep top navigation, search, existing evidence claims, project cards, resume, contact, and AI guide functional.
- At widths below 768 px, use still artwork and stacked touch-sized persona links. Honor `prefers-reduced-motion: reduce` and no-JavaScript browsing.
- Keep GitHub Pages static and preserve selectable HTML text. No animation framework, new backend, sound, or second scene.
- Publish only after local visual review at 1440, 1024, 768, 390, and 320 px plus the repository checks.
- Run browser checks against the local site at `http://localhost:8000`, started with `python3 -m http.server 8000` from the repository root.

## Review Focus

- No JavaScript: all three native links and the direct Projects CTA still navigate; Task 2 checks this.
- A missing sprite: labels, scene background, and link hit areas remain usable; Task 2 checks this.
- AI Engineer activation: the AI filter and its active button agree before arriving at `#portfolio`; Task 3 checks this.
- Background tab or offscreen hero: continuous animation pauses; Task 3 checks this.
- Reduced motion and a 320 px viewport: no moving sprites, overlap, horizontal overflow, or clipped labels; Task 4 checks this.

---

### Task 1: Produce original field and persona assets

**Files:**
- Create: `images/portfolio-field/field.svg`, `field-night.svg`, three persona source SVGs, `*-idle.png`, `*-walk.png`, `*-still.png`, and `ASSETS.md`
- Create: `scripts/check-portfolio-field-assets.mjs`

**Interfaces:**
- Produces: light and dark field SVGs; for each `ai-engineer`, `researcher`, and `student`, aligned `idle` (4 × 64×80 frames), `walk` (6 × 64×80 frames), and `still` (64×80) transparent PNGs. Later CSS may rely on these names and dimensions.

- [ ] **Step 1: Write the failing asset check.** Assert exact asset names, PNG signatures/dimensions (256×80 idle, 384×80 walk, 64×80 still), local-only SVG references, and a total shipped scene-asset budget of 600 KB.
- [ ] **Step 2: Run `node scripts/check-portfolio-field-assets.mjs` and confirm it fails for missing assets.**
- [ ] **Step 3: Design the original shared character base and three role variants.** Use dark hair and a neutral face as the common visual identity without tracing the existing site logo or MapleStory sprites. Dress AI Engineer in navy with a laptop, Researcher in amber with a notebook, and Student in cream/green with a backpack. Make a muted teal/cream field with a small workshop, path, and three station props; author a darker night version for `body.dark-mode`. Create aligned idle/walk/still frames. Keep source artwork in the asset directory; write `ASSETS.md` with authoring method, provenance, and a note that Maples.im exports were not copied.
- [ ] **Step 4: Run the asset check and inspect a contact sheet of every frame at 1× and 2×.** Confirm no clipping, transparent halos, frame jumps, or visual confusion between roles.
- [ ] **Step 5: Commit the assets, provenance, and check** as `feat: add original portfolio field art`.

### Task 2: Build the static, accessible entrance

**Files:**
- Modify: `index.html` (current `#heroSection` and project-filter controls)
- Create: `css/portfolio-field.css`
- Modify: `scripts/check-launch-readiness.mjs`
- Create: `scripts/check-portfolio-field.mjs`

**Interfaces:**
- Produces: `#portfolioField` containing `.fieldIntro`, `.fieldScene`, and three `.personaStation` anchors with `data-persona="ai-engineer|researcher|student"`; `#fieldProof` follows the header. Each anchor contains a decorative `.personaStill` image and a hidden `.personaAnimated` sprite span, plus visible label text. Add `data-project-filter="ai"` to the existing AI filter button for Task 3.

- [ ] **Step 1: Write the failing static check.** Assert exactly three labeled native persona links and their hrefs, a visible `View Projects` CTA, proof claims/media still present once, and no meaningful text baked into image alt text alone.
- [ ] **Step 2: Run the check with the local server started and confirm the expected missing-scene failure.**
- [ ] **Step 3: Replace the old hero markup with the field composition.** Keep Tony's name/positioning and the two existing primary actions as HTML. Put still images and inactive sprite spans inside fixed link stations with decorative empty-alt images; include descriptive visible labels. Move the evidence-board rows/media and hero metrics into `#fieldProof` immediately after the header without changing their claims.
- [ ] **Step 4: Add static desktop/mobile layout in `css/portfolio-field.css` and load it after `css/style.css`.** Reserve scene space before images load. The three stations use a stable three-column desktop layout; below 768 px, show still images with stacked links. Broken images must not hide station labels or links.
- [ ] **Step 5: Run static checks and a Playwright no-JavaScript, missing-image, and keyboard-focus pass.** Confirm all three links remain usable. Commit as `feat: add accessible portfolio field entrance`.

### Task 3: Add bounded animation and route behavior

**Files:**
- Create: `js/portfolio-field.mjs`
- Modify: `index.html`, `css/portfolio-field.css`, `scripts/check-portfolio-field.mjs`

**Interfaces:**
- Consumes: Task 1 sprites and Task 2 `.personaStation[data-persona]` links; existing global `filterSelection` remains owned by `js/script.js`.
- Produces: `initPortfolioField(root = document)` exported by `js/portfolio-field.mjs`; `.fieldScene[data-active="true"]` enables CSS sprite cycles only while visible and document-visible.

- [ ] **Step 1: Add failing browser checks.** Click AI Engineer and assert `#portfolio` is reached, the existing `data-project-filter="ai"` button is active, and non-AI project rows are hidden. Verify Researcher reaches `research/`, Student reaches `#resume`, and the AI link still has a useful native href when JavaScript is disabled.
- [ ] **Step 2: Add failing motion checks.** Assert the scene becomes active on entering the viewport, pauses when offscreen or when `document.hidden`, and each station keeps a stable bounding box while its image animates.
- [ ] **Step 3: Implement `initPortfolioField`.** Observe the scene with `IntersectionObserver`; combine viewport visibility with `visibilitychange`; activate only the CSS animation class/data attribute. On AI Engineer activation, click the existing `data-project-filter="ai"` button before the anchor's normal navigation. Do not prevent default navigation; keep Researcher and Student as plain links.
- [ ] **Step 4: Add 4-frame idle and 6-frame walk cycles on `.personaAnimated` using `steps()`, small bounded transforms, and hover/focus pause.** Keep `.personaStill` visible until animation is active, then swap it with the sprite span without changing layout. Keep motion within each station and avoid timers, pathfinding, random positions, canvas, or sound. Load the module after `js/script.js`.
- [ ] **Step 5: Run `node scripts/check-portfolio-field.mjs`, review a desktop screen recording or timed screenshots, then commit** as `feat: animate portfolio personas`.

### Task 4: Responsive, accessibility, and legacy-hero cleanup

**Files:**
- Modify: `css/portfolio-field.css`, `css/style.css`, `js/script.js`, `scripts/smoke-responsive.mjs`, `scripts/check-portfolio-field.mjs`

**Interfaces:**
- Consumes: Tasks 2–3 scene markup and motion attributes. No new public interface.

- [ ] **Step 1: Extend browser checks for 1440, 1024, 768, 390, and 320 px.** Assert no horizontal overflow or scene/title/target overlap; test pointer/touch-sized targets, focus indication, dark mode, and `prefers-reduced-motion: reduce` still poses.
- [ ] **Step 2: Run the new checks and capture the specific failures.**
- [ ] **Step 3: Tune the scene and proof strip for each breakpoint.** Disable sprite and ambient animation for reduced motion and mobile; retain visible focus and text contrast. Pause animations when inactive. Use image-rendering rules only on pixel sprites, not on body text.
- [ ] **Step 4: Remove obsolete hero-only parallax/typing code and CSS selectors once the new scene passes.** Keep shared CTA or typography rules still used elsewhere; update `scripts/smoke-responsive.mjs` to inspect the new hero selectors and preserve its existing project/report checks.
- [ ] **Step 5: With a local HTTP server at `http://localhost:8000`, run `node scripts/check-launch-readiness.mjs`, `node scripts/check-portfolio-field.mjs`, `node scripts/smoke-responsive.mjs`, and `node --test tests/*.test.mjs`; commit** as `fix: polish animated field across devices`.

### Task 5: Final visual review and publication

**Files:**
- Modify only any files needed to resolve review findings; do not add a new framework or content route.

**Interfaces:**
- Produces: published GitHub Pages homepage with unchanged destination URLs and documented source-art provenance.

- [ ] **Step 1: Preview the exact site locally.** Inspect first paint, one idle/walk cycle, hover/focus, AI filtering, Research and Resume navigation, proof strip, dark mode, no-JavaScript, and reduced motion at all five widths.
- [ ] **Step 2: Confirm asset size, no copied MapleStory material, page console/network errors, and no unexpected layout shift.** Compare hero text and evidence claims with the prior commit.
- [ ] **Step 3: Run the complete site checks and `git diff --check`.** Fix only attributable regressions, then rerun the affected checks.
- [ ] **Step 4: Publish the reviewed commit to GitHub Pages using the existing repository flow.** Verify the deployment run succeeds, the homepage serves the new scene, and the three destinations work live.

## Execution handoff

Recommended method: **Native execution with one independent final review**. The art, markup, and motion tasks share tightly coupled layout interfaces; one implementer can keep them coherent and use the browser checks after each task. The written spec and this plan are the review contract.
