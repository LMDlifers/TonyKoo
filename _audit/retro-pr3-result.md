# Retro PR 3 result: scroll chapters

- Two chapters: `#chapter-projects` before `#portfolio`, and `#chapter-contact` before `#contact`. Each intro sentence moved into a pixel-frame dialogue and appears exactly once on the page.
- Sprite size uses whole-number scales:
  - 512×640 at 900px wide or more, when the screen is at least 880 tall.
  - 256×320 on short desktop screens and on phones.
  - 128×160 on phones under 700 tall.
- Motion has a 6-frame walk and a walk-in driven by `view()`. It runs only with JS on, motion allowed, and scroll-timeline support. Otherwise the still sprite stands in its final place.
- Final review fixes:
  - Content overflowed on short screens. The `max-height` clamp was hiding it; it is removed and the sprite steps down a scale instead.
  - Two vacuous asserts now measure the real content and the real sentence count.
  - The chapter wrappers had junk landmarks. They are plain `div`s now.
  - The sideways-scroll sweep now includes 899 and 900.
- Accepted:
  - The walk cycle loops on the spot after arrival, like an RPG idle.
  - The dialogue sits before its section heading in reading order.
- Screenshots: `_audit/retro-pr3/` (1440 and 390, day and night, reduced motion).
- Suite: every check and smoke script, plus `node --test` (61), passes.
