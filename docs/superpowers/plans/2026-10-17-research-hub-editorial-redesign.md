# Research Hub Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Research index read like a calm editorial publication while keeping every existing essay and curated source easy to find.

**Architecture:** Recompose the existing static homepage into one lead essay, two supporting essays, and a text-first index, all within the existing `.storyFeed` filter surface. Reuse one credited paper figure as a disclosed crop; retain the site's CSS, JavaScript, navigation, dark mode, and article pages.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Python/Pillow for a one-time image crop, local browser preview.

**Spec:** `docs/superpowers/specs/2026-10-17-research-hub-editorial-design.md`

## Global Constraints

- Redesign `research/index.html` only; article bodies, URLs, RSS entries, and the portfolio stay unchanged.
- Preserve all twelve essay URLs, six curated-source URLs, and existing article-level figure credits.
- Keep the existing blue accent, Karla/Lato type system, white background, and dark mode.
- Keep static HTML/CSS/JS; add no framework, runtime dependency, external news imagery, or copied news-site branding.
- Keep `#guides`, `#reading-path`, and `#reads` working.
- Review a local preview before any publication; do not push or publish in this plan.

## Review Focus

1. A 320px viewport must have no page-level horizontal scroll; Task 3 checks `scrollWidth <= clientWidth`.
2. A selected topic plus typed search must narrow within that topic, while selecting another topic clears the query; Task 2 checks both transitions.
3. A topic with no matching query must show `0 of 18 items shown` and the empty state, without showing curated reads; Task 2 checks it.
4. The lead crop must not imply it is the entire paper figure; Tasks 1–2 check crop dimensions, visible credit, source/license links, alt text, and full-figure link.
5. Saved dark mode and keyboard focus must survive the new homepage layout; Task 3 checks persisted theme, contrast, and tab/focus order.

---

### Task 1: Prepare the credited lead figure

**Files:**
- Create: `research/assets/source-tree-of-thoughts-detail.png`
- Modify: `research/assets/SOURCES.md`

**Interfaces:**
- Consumes: `research/assets/source-tree-of-thoughts.png` (1390×680), the existing Tree of Thoughts Figure 1.
- Produces: a 545×590 PNG cropped from pixel box `(845, 0, 1390, 590)`; the original full figure remains untouched.

- [ ] Crop the source with Pillow's `Image.crop((845, 0, 1390, 590))` and save the new asset; do not upscale or modify the diagram content.
- [ ] Open the crop at its native size and check that the right-hand branching diagram is complete, legible, and free of cut-off labels. If that box clips a label, adjust the box and record the final coordinates in `SOURCES.md` before continuing.
- [ ] Add a `SOURCES.md` entry naming Yao et al., Tree of Thoughts Figure 1, [paper](https://arxiv.org/abs/2305.10601), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), the crop coordinates, and the retained full-size local file.
- [ ] Verify dimensions and unchanged source: `python3 -c "from PIL import Image; from pathlib import Path; p=Path('research/assets'); assert Image.open(p/'source-tree-of-thoughts-detail.png').size==(545,590); assert Image.open(p/'source-tree-of-thoughts.png').size==(1390,680)"`; if coordinates changed, use the recorded dimensions.
- [ ] Commit only the crop and source record: `git add research/assets/source-tree-of-thoughts-detail.png research/assets/SOURCES.md && git commit -m "docs: credit research lead figure detail"`.

### Task 2: Recompose the index and keep search behavior coherent

**Files:**
- Modify: `research/index.html`
- Modify: `js/research.js`

**Interfaces:**
- Consumes: `research/assets/source-tree-of-thoughts-detail.png` from Task 1.
- Produces: twelve unique `.storyFeed [data-research-card]` essay cards, six `.readingCard[data-research-card]` source cards, and five `[data-topic-filter]` values: `all`, `ai-agents`, `ml-data`, `systems-cloud`, `decisions-money`.
- Preserve each essay's existing `data-topic`; in `js/research.js`, map `ml-data` to `machine-learning` and `data-retrieval`, and `systems-cloud` to `system-design` and `cloud-operations`. The other groups match their existing values.

- [ ] Before editing, record the twelve essay hrefs and six curated-source hrefs from `research/index.html` and the three fragment targets; use these as a preservation checklist.
- [ ] Move the existing “When agents need search” feature into `.storyFeed` as `.topicCard--lead`; place it first and remove its separate duplicate section. Its cropped image links to the full local figure, while its headline links to the essay; caption links to the paper and license and says “detail cropped from Figure 1.”
- [ ] Mark “How coding agents find and change code” and “From specification to verified release” as `.topicCard--secondary`, text only. Keep each title, summary, topic, and URL; remove homepage thumbnails from all other essay cards while keeping their article figures untouched. Give the remaining nine cards `.topicCard--row`.
- [ ] Place the compact masthead, five topic filters, and search before `.storyFeed`; move the four-step `.readingPath` after the essay list and before the six-card “Interesting reads” section. Retain `#guides`, `#reading-path`, and `#reads`.
- [ ] In `js/research.js`, use one group-to-existing-topics map in the story filter. Preserve current theme behavior, `aria-pressed`, result count, empty state, source-card search, and the current rule that selecting a topic clears the search field.
- [ ] Verify `node --check js/research.js`; compare the recorded hrefs and fragments with the finished HTML; confirm exactly 12 essay cards and 6 curated-source cards, with no duplicate lead story.
- [ ] In a local browser, check counts for All/AI & agents/ML & data/Systems & cloud/Decisions & money are `18/6/2/2/2`; type a unique query inside a selected group, then switch groups to confirm query clearing; type a no-match query within a topic and confirm `0 of 18 items shown`, empty state visible, curated reads hidden.
- [ ] Commit only HTML/JS: `git add research/index.html js/research.js && git commit -m "feat: give research index an editorial story hierarchy"`.

### Task 3: Style and visually verify the local preview

**Files:**
- Modify: `css/research.css` (homepage rules and relevant media queries only)

**Interfaces:**
- Consumes: `.topicCard--lead`, `.topicCard--secondary`, `.topicCard--row`, `.storyFeed`, `.readingPath`, `.branchNav` from Task 2.
- Produces: a two-column lead above 850px, a stacked lead at 850px and below, two supporting stories, and compact full-width text rows; article-specific CSS remains unchanged.

- [ ] Replace homepage-specific `.featuredStory` and 205px/96px thumbnail rules with the new lead, secondary, and row treatments. Keep one restrained accent, readable headline contrast, visible link/focus styling, and a legible source caption. Remove the sticky reading-path rule.
- [ ] Render the exact local page at 320, 390, 768, and 1440 CSS pixels in light and dark mode. Check headline hierarchy, line lengths, card spacing, caption size, article visibility, and that the lead starts within the first screen at 390px.
- [ ] At 320px, assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth`; inspect long filter labels and the lead figure for clipping. Check that the figure opens its full local image and its paper/license links resolve.
- [ ] Using only the keyboard, traverse navigation, all filters, search, lead image and title, supporting stories, remaining essays, reading path, and selected reads. Check the focused item is visible and `aria-pressed` follows the active filter.
- [ ] Enable dark mode, reload, and confirm it persists; check headline, body, caption, filter, and focus contrast. Confirm the article pages' layout and theme still work at mobile and desktop widths.
- [ ] Run `git diff --check`, inspect all changed files, and repeat the Task 2 link/card-count and filter checks after styling. Save desktop/mobile preview screenshots for editorial review; do not publish.
- [ ] Commit only CSS: `git add css/research.css && git commit -m "style: simplify research homepage layout"`.

The implementation is complete only when the local preview and preservation checks pass. Publication requires a separate review of the preview and an explicit publish step.
