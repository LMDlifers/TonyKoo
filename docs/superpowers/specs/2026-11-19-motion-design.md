# Motion Design

**Date:** 2026-11-19
**Research:** `docs/research/2026-11-19-motion-craft.md`, `docs/research/2026-11-19-css-motion-support.md`, `docs/research/2026-11-19-brand-and-loading-motion.md`

## Goal

Many small, quiet responses across the site, plus three signature moves: a wordmark that collapses on scroll, a loading mark, and thin progress bars. The page should feel alive under the hand and still when left alone.

## Rules

1. **Movement answers the visitor.** Hover, press, open, navigate and scroll may move things. Nothing moves by itself for more than five seconds, except a loading mark while something is loading.
2. **One staged entrance per page**, played once.
3. **Durations.** Press 100ms. Hover 160ms. Small enters and toggles 240ms. The staged entrance 500ms per step, 80ms apart. Exits are shorter than enters. No interaction transition is longer than 300ms.
4. **Easing.** `--ease-out` for enters and presses. `--ease-inout-quart: cubic-bezier(.77, 0, .175, 1)` for things that travel (the wordmark). `linear` for progress. `--ease-spring` (a `linear()` string behind `@supports`) only for the launcher's entrance.
5. **Properties.** `opacity`, `translate`, `scale`, `rotate`, `clip-path` and colour. No `transition: all`. Layout properties animate only in two bounded cases: the wordmark letters and `<details>` height.
6. **Not animated:** the theme change, focus rings, proof numbers, table rows, anything keyboard-initiated beyond a fade.
7. **Reduced motion.** Every moving rule sits inside `@media (prefers-reduced-motion: no-preference)`; the default is the end state. Colour and opacity hovers stay. The reading-progress bar stays, because it mirrors the reader's own scroll.
8. **Pointer devices only** for hover movement: `@media (hover: hover)`.
9. **Progressive enhancement.** Scroll-driven animation, view transitions and `<details>` height are enhancements. Without them the page is static and complete.
10. **Almost no JavaScript.** One small script for the navigation bar. Dead scroll JavaScript is removed.

## Inventory

### Signature

| # | Motion | Where | Spec |
|---|---|---|---|
| S1 | Wordmark collapses "Tony Koo" → "T K" | every header | Scroll-driven over the first 160px, reversible. Letters narrow and fade. After Anthropic's "ANTHROPIC" → "A\". |
| S2 | Loading mark `· ✢ ✳ ✶ ✻ ✽ ✻ ✶` | chat "Checking sources…" state; the chat overlay while its frame loads | A glyph strip stepped with `steps(8, end)` over 1.2s, after the Claude Code spinner. Its label carries a slow text shimmer (1.5s linear). Runs only while pending. |
| S3 | Navigation hairline | every page | A 2px bar at the top while the next page loads. Waits 200ms; runs at most 8 times. |
| S4 | Reading progress | reports, essays, homepage | A 2px bar on the header's lower edge, scroll-linked, `scale` only. Replaces the homepage's JavaScript bar. |
| S5 | Card grows into its report title | four featured cards ↔ their reports | Cross-document view transition, 320ms. Other navigation cross-fades (90ms out, 180ms in). The header holds still. |

### Entrance

| # | Motion | Spec |
|---|---|---|
| E1 | Homepage hero | Name, claim, actions, then each proof item: opacity 0 → 1 and `translate: 0 8px` → 0, 500ms, 80ms apart. |
| E2 | Inner page title block | Label, title, deck rise 8px and fade, 400ms, 60ms apart. |
| E3 | Caret after the hero claim | A thin caret breathes (opacity 1 ↔ .3, 650ms) three times, then fades out. |
| E4 | Ask launcher | Appears 600ms after load: opacity and `scale: .92` → 1 with the spring, 400ms. |

### Response

| # | Element | Hover (pointer) | Press |
|---|---|---|---|
| R1 | Featured card | Border colour steps to the accent mix; art scales to 1.02 inside its clip; the link arrow moves 3px. 160ms in. | Link `scale: .98`. |
| R2 | "More projects" row | Title takes the accent colour; the link arrow moves 3px. | none |
| R3 | Text links | Underline offset settles from 3px to 5px; underline colour takes the link colour. | none |
| R4 | Header and nav links | An underline grows from the left (`scale` on a pseudo-element), 160ms. | none |
| R5 | Theme toggle | Border colour step. | `scale: .94`; the icon cross-fades with `scale: .9` and `blur(2px)`, 160ms. |
| R6 | `<details>` | Summary background step. | Marker rotates 90°, 240ms. Content height animates where supported; content fades in 240ms. |
| R7 | Header | A hairline shadow appears once the page has scrolled 8px (scroll-driven). | n/a |
| R8 | Ask dialog | n/a | Opens from the launcher's corner: opacity and `scale: .96` → 1, origin bottom right, 240ms; closes in 160ms. Backdrop fades. |
| R9 | Log entries | Row title colour step; the tick mark nudges 2px. | none |
| R10 | Figures on reports | Outline colour step. | none |

## Checks

A new `scripts/check-motion.mjs` runs with motion allowed and again with reduced motion:

- Each inventory item exists: the element has the named animation or transition, with the duration and easing above.
- With reduced motion, `document.getAnimations()` holds nothing except the reading-progress bar, and every element is in its end state.
- No interaction transition exceeds 300ms. No rule uses `transition: all`.
- No infinite animation runs on an idle page.
- The wordmark is full at the top and collapsed at 200px of scroll.
- Navigating from a featured card to its report runs a view transition (`pagereveal` with `viewTransition`).

## Out of scope

Count-up numbers, scroll reveals on every section, tilt or spotlight cards, theme wipes, a header that hides on scroll, parallax. The research argues against each.
