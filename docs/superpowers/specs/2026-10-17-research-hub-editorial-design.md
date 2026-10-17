# Research hub editorial redesign

## Purpose and scope

Make the public [Research hub](https://lmdlifers.github.io/TonyKoo/research/) feel like a readable publication that helps a visitor choose an essay quickly. The portfolio remains the main site; Research and Reading remain secondary destinations. This redesign changes the Research **index page only**, its homepage-specific CSS, and the small filter/search behavior needed by the new layout. Article bodies, URLs, RSS items, and the portfolio are outside the visual redesign.

## Evidence and reference research

- The 17 October 2026 audit found twelve essay cards and six curated-source cards. The current page has a large masthead, a separate featured story, six topic tabs, search, a sticky four-step reading rail, tiny source diagrams on every essay row, and another reading grid. Several systems compete to tell the reader where to start.
- At a true 390 CSS-pixel viewport, the page has **no horizontal overflow** (`scrollWidth = clientWidth = 390`). The first essay index is pushed below a tall introduction and a dense paper figure; the diagram's text is too small to serve as a mobile cover.
- A contact sheet of the existing credited figures showed that most are detailed flowcharts, not small thumbnails. The Tree of Thoughts figure has a self-contained right-hand tree detail that can be cropped for a lead image, with the full figure linked and the crop disclosed.
- [CNBC](https://www.cnbc.com/) showed a useful lead/secondary/latest-story hierarchy in the browser audit, although its advertising and dense controls are unsuitable for this personal publication. Reuters presented a device-verification interstitial, so no current Reuters layout claim informs the design.
- [Nielsen Norman Group's original eyetracking study](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/) and [later clarification](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/) support clear, front-loaded headlines and grouped information; they do not imply that every reader follows a fixed F-shaped path.
- [WCAG 2.2](https://www.w3.org/TR/wcag/) informs contrast, focus visibility, and reflow checks. [W3C's image tutorial](https://www.w3.org/WAI/tutorials/images/) informs alt text for the lead crop and linked complex diagrams.

## Design decision

Use a restrained newsroom hierarchy, not a magazine grid. The reader sees one strong lead story, two supporting stories, then a concise index. The existing blue accent, Karla/Lato type system, white background, and dark mode remain so Research still belongs to Tony's portfolio.

Considered alternatives:

1. **Twelve image cards:** visually busy, slow to scan, and makes detailed figures unreadable.
2. **Filter-first directory:** efficient lookup but little editorial invitation to start reading.
3. **One lead + two supporting stories + text-first index (chosen):** a clear starting point and quick access to the full archive without repeating every figure.

## Page anatomy

```text
Tony Koo / Research                         Essays · Portfolio · Theme

Ideas worth testing.
One concise sentence about evidence-led essays.

All | AI & agents | ML & data | Systems & cloud | Decisions & money
Search essays and sources                                Result count

LEAD STORY — When agents need search
[headline + two-line summary]           [credited Tree of Thoughts detail]

[How coding agents find and change code] [From specification to verified release]

LATEST ESSAYS
Text-first rows: topic label · headline · one-line reason to read · date

START HERE  Understand → Design → Bound → Verify
INTERESTING READS  Six annotated primary-source links
```

The lead and supporting stories are three of the twelve existing essay cards, not duplicates. All twelve stay inside `.storyFeed` so the same search/filter surface can find them. The two supporting stories are text-only. Remaining essays are compact full-width rows; detailed source figures and credits stay in their individual articles. The home page displays only the credited lead detail.

The lead image is a reversible crop of the right-hand Tree of Thoughts branch from `research/assets/source-tree-of-thoughts.png`. Its visible caption says it is a crop, links to the [original paper](https://arxiv.org/abs/2305.10601) and [CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/), and the image opens the full local figure. The image's alt text describes the branch-and-evaluate idea, not merely its colors.

## Interaction and responsive behavior

- Replace six narrow topic labels with **All**, **AI & agents**, **ML & data**, **Systems & cloud**, and **Decisions & money**. Map each essay to one broad group while retaining its visible topic label.
- Search scans all twelve essays and six selected reads. A topic selection limits essays and hides the selected-reads section, as it does today. Typing keeps the selected topic; selecting a topic clears the search field, as it does today. Show a plain result count and an empty state.
- Keep `#guides`, `#reading-path`, and `#reads` working; turn the current sticky reading rail into a compact, non-sticky path after the essay list.
- At desktop widths, the lead is a two-column image-and-copy composition; at 850px and below it stacks. At 390px the first story should begin within the first screen after a concise masthead and controls. At 320px the page must reflow without page-level horizontal scrolling; complex figures inside articles may retain their existing local scroll affordance.
- Every title remains a descriptive link. Filter buttons expose `aria-pressed`; focus styling remains visible. Dark mode preserves contrast and readable figures.

## Acceptance and exclusions

- Preserve all twelve essay URLs, six curated-source URLs, article text, RSS entries, and existing article-level figure credits. Do not import news-site imagery or copy Reuters/CNBC branding.
- Keep the static HTML/CSS/JS architecture and existing typefaces; add no framework or dependency.
- Verify the twelve cards and six selected reads, search and every topic filter, zero-result state, keyboard order, 320/390/768/1440px layouts, dark mode, image caption/alt text, and all local links.
- Review a local preview before publishing. Publication is a separate action after the design and implementation review.
