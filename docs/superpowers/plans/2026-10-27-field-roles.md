# Writer and Reader Field Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Writer and Reader to the homepage field through an accessible Work/Ideas cast switch while keeping only three characters visible at a time.

**Architecture:** Keep the existing native persona links and field controller. Add two generated sprite sets, cast metadata on the links, and a small cast switch that changes visibility and the active movement set. Preserve the scene, season switch, and no-JavaScript navigation.

**Tech Stack:** Static HTML/CSS, vanilla JavaScript modules, Python standard-library pixel-art generator, Node/Playwright checks.

**Spec:** `docs/superpowers/specs/2026-10-27-field-roles-design.md`

## Global Constraints

- Work initially shows AI Engineer, Researcher, Student; Ideas shows Writer, Researcher, Reader.
- Writer links to `#writing`; Reader links to `#reading`.
- Researcher keeps its position when switching casts. Each other role keeps its last position during the page session.
- Both seasons and themes use the existing isometric scene; no new dependency or persistence.
- No JavaScript: original three map links remain and Writer/Reader appear as links below the map.
- Reduced motion and narrow screens keep characters still.

## Review Focus

- Switching casts while a card is open should close it and restore the launcher.
- Hidden cast members must not block wandering or dragging.
- Switching cast after dragging must restore each role at its own prior position.
- At narrow widths, cast controls and fallback links must not overflow or overlap the chat launcher.
- Keyboard users must reach both cast buttons and every active character.

---

### Task 1: Original role artwork

**Files:** Modify `scripts/build-portfolio-field-art.py`, `images/portfolio-field/ASSETS.md`, `scripts/check-portfolio-field-assets.mjs`; generate `writer-{still,idle,walk}.png`, `reader-{still,idle,walk}.png`, `writer.svg`, `reader.svg`.

**Interfaces:** Two new role names, `writer` and `reader`, use the existing 64 × 80 frame contract and transparent PNG sheet dimensions.

- [ ] Extend the asset check for both roles and run it to confirm it fails on missing files.
- [ ] Draw a pen/page Writer and book Reader in the existing generator; generate assets.
- [ ] Update the artwork provenance and run the asset check to confirm it passes.

### Task 2: Cast switch and navigation

**Files:** Modify `index.html`, `css/portfolio-field.css`, `js/portfolio-field.mjs`, `scripts/check-portfolio-field.mjs`, `scripts/check-isometric-field.mjs`.

**Interfaces:** `data-cast-choice="work|ideas"`, `data-casts="work|ideas|work ideas"`, and `data-destination-label` on native role links. `fieldScene.dataset.cast` holds the active cast.

- [ ] Add browser and static checks for initial cast, switching, selected-card reset, destinations, no-JavaScript fallback, reduced motion, and layout; run them to confirm failure.
- [ ] Add the two role links and fallback links, the cast buttons, CSS visibility, and controller filtering for movement and collision.
- [ ] Run field checks in both themes at desktop/tablet/mobile widths, then existing chat and site checks.
- [ ] Visually inspect representative pages and correct any spacing or overlap issues.

### Task 3: Release

**Files:** This plan, approved design spec, and the files above.

- [ ] Check the full diff and stage only this feature plus the chat mascot change requested in the same session.
- [ ] Commit the change; push the fast-forward to the portfolio GitHub repository under prior publication authorization.
- [ ] Verify the live homepage cast and chat mascot load from GitHub Pages.
