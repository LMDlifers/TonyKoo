# Evidence redesign result (2026-11-10)

Plan: `docs/superpowers/plans/2026-11-10-evidence-redesign.md`. Spec: `_audit/2026-11-10-design-directions.md`.

## Hallmark gate lines on index.html

Each row counts FAIL lines for one gate: after the polish, then after this redesign.

| Gate | After polish | After redesign |
|---|---|---|
| 6a hero in vh | 0 | 0 |
| 10a transition all / animated size | 0 | 0 |
| 34 overflow and 100vw | 2 | 2 (the waived full-screen chat dialog) |
| 38i italic inside heading | 0 | 0 |
| 50 bare 1fr image tracks | 0 | 0 |
| 54 eyebrows | 0 | 0 |
| 62 hidden at rest | 3 | 3 (state-driven, waived) |
| 63 meta strings, dots, glued arrows | 0 | 0 |
| 67 tracked capitals in labels | 34 | 0 |

Most of the remaining total FAILs are colour literals (gate 48). Many of them come from the vendor file `css/all.min.css`.

## Boredom gate

**First screen: pass.** At 1280×800 and 1440×900, the intro and the full isometric field sit side by side, with both actions above the fold. This matches the pre-polish first screen (`2d77078`) and keeps the polish fixes. At 390 the field stacks below the intro.

**Trust is cheap to check: pass.**
- Every project shows the same six-row evidence label.
- The lab log dates and the report receipts come from git, and `check-evidence.mjs` verifies them.
- The colophon explains how all of this works.

**Word budget: fail.** Visible words at 1440 went from 1744 (main) to 1942, an increase of 198:
- about 60 from the five lab log entries
- about 135 from the label row names and the "Not stated publicly" rows

Paying this back without rewriting claims means taking content off the homepage. For example, the reading list and the certifications could move to their own pages, as the 2026-11-09 audit suggested. That decision belongs to the site owner, so this PR opens as a draft.

## Word budget follow-up (2026-11-11)

Plan: `docs/superpowers/plans/2026-11-11-word-budget.md`, options A and D.
- Each label now shows Problem, Evidence and Does not claim.
- Built, Stack and Report added sit behind a native "Full label" disclosure. It opens with Enter and also works with JS off.
- "Not stated publicly" became "None stated" on 10 cards.

Visible words at 1440 dropped from 1931 to 1473, against a budget of 1744. `check-portfolio-field.mjs` now fails above 1744.

