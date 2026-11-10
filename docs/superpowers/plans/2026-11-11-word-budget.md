# Homepage Word Budget Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bring the homepage's visible word count back to the main baseline (1,744) or lower, so draft PR #3 can leave draft. No claim is deleted or reworded. Text either moves behind a disclosure on the same page or moves to another page that the homepage links.

**Architecture:** This builds on branch `feat/evidence-trust` (PR #3). The budget is enforced in a browser: a Playwright step added to `scripts/check-portfolio-field.mjs` reads `document.body.innerText` at 1440×900 and fails above 1,744 words. `scripts/check-polish.mjs` covers the label structure statically.

**Spec:** `docs/superpowers/plans/2026-11-10-evidence-redesign.md` Global Constraints ("Word budget"), plus `_audit/evidence-redesign-result.md`.

## Measured now (1440×900, PR #3 head)

| Area | Visible words |
|---|---|
| Projects (11 cards, full labels) | 1,081 |
| Writing | 201 |
| Testimonials | 101 |
| Reading | 99 |
| Proof | 87 |
| Hero | 75 |
| Resume summary | 72 |
| Lab log | 64 |
| About | 58 |
| Certifications | 44 |
| Contact | 35 |
| **Total** | **1,931** (main: 1,744; budget: ≤ 1,744) |

The project grid alone is 56% of the page.

## Options

| # | Change | Saves (est.) | Moves content off homepage? |
|---|---|---|---|
| A | **Compact labels.** Each card shows Problem, Evidence and Does not claim. Built, Stack and Report added go into a `<details>` with the summary "Full label". All six rows stay in the DOM in the same order, and the check-evidence and check-polish row assertions still pass. | about 550 | No |
| B | **Six cards first.** The grid shows the 6 most recent or strongest cards, followed by a "Show all 11 projects" button. Filters still search all 11. | about 480 | No |
| C | **Move Reading and Certifications** to a new `about.html` page, linked from the resume summary. | about 140 | Yes |
| D | **Shorter empty rows.** Change "Not stated publicly" to "None stated" (10 cards). | about 10 | No |

**Recommended: A + D.** A recruiter scanning the page still sees each card's problem, the evidence for it and what it does not claim; those are the three rows that build trust. The build detail is one click away. A + D comes to about 1,370 words, well under budget, with no section removed. B hides whole projects, which works against the evidence goal. C is a content decision best made separately.

## Review Focus

1. **JS off:** `<details>` is native HTML, so it opens without JS. The visible rows must not depend on JS.
2. **Deck view:** it reads `.filterItemArchitecture` and `.techBadge` through jQuery `.find()`. Text inside a closed `<details>` is still in the DOM, so deck content must not change.
3. **Keyboard:** the "Full label" summary is focusable, has a visible `:focus-visible` outline and toggles with Enter and Space.
4. **Fixed format:** all 11 labels keep the same six rows in the same order, and the split falls at the same place on every card.

---

### Task 1: Budget check (fails first)

**Files:** Modify: `scripts/check-portfolio-field.mjs` (desktop width only)

- [ ] **Step 1:** At width 1440, after load, add:
  ```js
  const words = await page.evaluate(() => document.body.innerText.split(/\s+/).filter(Boolean).length);
  assert.ok(words <= 1744, `Homepage visible words ${words} exceed the 1744 budget`);
  ```
- [ ] **Step 2:** Run it. Expected: FAIL with "1931 exceed".

### Task 2: Compact evidence labels (option A)

**Files:** Modify `index.html` (11 labels), `css/style.css`, `scripts/check-polish.mjs`

- [ ] **Step 1: Write the failing check-polish assertion.** For each label, check that the `<dt>` sequence is unchanged, and that the Built, Stack and Report added rows sit inside `<details class="labelMore"><summary>Full label</summary>…</details>`:
  ```js
  for (const l of labels) assert.match(l, /<details class="labelMore"><summary>Full label<\/summary>[\s\S]*<dt>Built<\/dt>[\s\S]*<dt>Stack<\/dt>[\s\S]*<dt>Report added<\/dt>[\s\S]*<\/details>/, "build detail behind Full label");
  ```
  Keep the row order the same in the DOM. To do that, restructure each label as two `<dl>` blocks inside one wrapper (`<div class="evidenceLabel">`):
  - the first `<dl>` holds Problem, Evidence and Does not claim
  - the `<details>` holds a second `<dl>` with Built, Stack and Report added

  Update the existing row-order assertion to read the `<dt>`s across the wrapper in the order Problem, Evidence, Does not claim, Built, Stack, Report added. Also update the matching regex in `check-evidence.mjs`.
- [ ] **Step 2:** Run `check-polish`. Expected: FAIL.
- [ ] **Step 3:** Restructure the 11 labels with a one-off Python transform. Keep every `<dd>` class. Style:
  - `summary` uses the body face, sentence case, the muted token and a visible `:focus-visible` outline
  - the second `<dl>` uses the same grid as the first
- [ ] **Step 4:** Run `check-polish`, `check-evidence` and `check-portfolio-field`. Expected: PASS, except the budget assertion, which may still fail until Task 3.

### Task 3: Shorter empty rows (option D) and verify

- [ ] **Step 1:** Change `Not stated publicly` to `None stated` in the 10 cards. Update `_audit/evidence-label-copy.md`.
- [ ] **Step 2:** Run every suite, plus the `smoke-responsive` temp copy with the "system boundary" line skipped. Expected: all PASS, including the budget assertion.
- [ ] **Step 3:** Take screenshots at 1440 and 390 of one card closed and one card open. Use the browser-pane DevTools emulation with JS off to confirm "Full label" still opens.
- [ ] **Step 4:** Commit: `feat: compact evidence labels within the word budget`. Push to `feat/evidence-trust`. Update the "Needs your decision" section of PR #3 with the new count.
