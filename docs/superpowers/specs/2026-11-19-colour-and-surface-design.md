# Colour and Surface Design (proposal)

**Date:** 2026-11-19
**Status:** proposal, not approved. It follows Tony's note that the Meta "Muse" chat interface has a good layout and nuanced colouring, with one screenshot of it in dark mode.
**Evidence limit:** this reads one screenshot. meta.ai returned 403 to the research pass, so nothing here is taken from Meta's code.

## What the screenshot does

1. **Warm neutral dark, not blue-black.** The page is a soft near-black. Panels and controls are the same hue, one and two steps lighter.
2. **Tone separates surfaces; borders do not.** Message panels, the input and the "Chats" button have no outline. Each is a slightly lighter fill.
3. **One warm accent, used for one thing.** The visitor's own messages are a muted brown. Nothing else is coloured.
4. **Text is off-white, with one muted grey** for secondary text ("Message", "Click or drag to open").
5. **Large, soft shapes.** Panels have a radius of about 28px. The input, the button and the status chip are full pills.
6. **Roomy type.** Body text is about 20px with open line spacing, in one weight.
7. **A fixed frame.** A thin icon rail on the left, a centred reading column, and floating controls at the corners.

## What this site would take

| # | Change | Now | Proposed |
|---|---|---|---|
| C1 | Night background family | graphite-blue `#121519`, panels `#20252a` | warm neutral: page `#161514`, panel `#201f1d`, control `#2b2927` |
| C2 | Night accent | silver `#dce5eb` | one warm accent, a muted clay `#b9794a`, for links, the primary button and the progress bars |
| C3 | Night text | `#f3f5f6` and `#b7c2cb` | off-white `#ece9e4` and warm grey `#a8a29a` |
| C4 | Day palette | paper `#f6f4ee`, green accent `#2f5d50` | keep the paper and the green; add two tonal steps (`#efece4`, `#e6e2d8`) so day surfaces can layer the same way |
| C5 | Surfaces | 1px hairline, 16px radius, no fill difference | tonal fill one step from the page, no hairline, 20px radius; the hairline stays only on images and figures |
| C6 | Controls | 8px radius buttons | pill radius on buttons, the theme toggle, the Ask launcher and the Find field; inner-page metadata stays plain text |
| C7 | Body size | 16–18px | 18px on the homepage too, to match the inner pages |

## What it would not take

- **The icon rail and app frame.** That layout suits an app with many tools. This site has six destinations and a reading column; the sticky header already does the job.
- **Brown message bubbles.** There are no visitor messages outside the chat page.

## Conflicts with decisions already shipped

- The homepage and inner-pages specs set "one surface: 1px hairline, 16px radius" and removed pills. C5 and C6 replace both rules. `scripts/check-home.mjs` and `scripts/check-pages.mjs` assert the old surface and would change with it.
- The night accent moves from silver to clay, so every night contrast check must be rerun; `#b9794a` on `#161514` is about 5.3:1, which passes for text.

## Order

Motion first, then this. The motion plan uses colour tokens, not colour values, so it does not need redoing after the palette changes.
