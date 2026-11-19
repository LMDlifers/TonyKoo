# Native CSS motion: what works today (research note, 2026-11-19)

Support data: `@mdn/browser-compat-data` 8.1.9. Stable at the time: Chrome and Edge 157, Firefox 160, Safari 27.2. Snippets were run in headless Chrome 157 only; Safari and Firefox behaviour is from the data, not tested.

## Motion already in the repo

- `css/site-theme.css`: tokens `--ease-out`, `--ease-standard`, `--dur-press` 100ms, `--dur-hover` 160ms, `--dur-ui` 240ms.
- `css/craft.css`: press states (`transform` + hard shadow), colour hovers, underline colour transition.
- `css/research.css`: `@view-transition { navigation: auto }` inside `prefers-reduced-motion: no-preference`, root fade 90ms out and 180ms in. Loaded by research pages, the log and the colophon only.
- `css/report.css`: smooth scroll and a global reduced-motion reset. No view transition.
- `css/style.css`: `.motion-reveal` (620ms), `#scrollProgress`, `.fixedNav` shadow, a global reduced-motion reset.
- `js/script.js`: jQuery scroll handler sets `#scrollProgress` **width** (layout on every scroll event) and toggles `body.fixedNav`; an IntersectionObserver adds `.visible` to `.motion-reveal`.
- `js/research.js`: forces `details.articleToc` open on desktop at load.
- Nearly every existing check runs with `reducedMotion: "reduce"`, so motion gated on `no-preference` needs its own check context.

## Support summary

| Feature | Chrome/Edge | Safari | Firefox | Class |
|---|---|---|---|---|
| `linear()` easing | 113 | 17.2 | 112 | safe |
| `translate` / `rotate` / `scale` properties | 104 | 14.1 | 72 | safe |
| `@property` | 85 | 16.4 | 128 | safe |
| `@starting-style` (entry) | 117 | 17.5 | 129 | safe |
| `:has()`, `color-mix()` | 105 / 111 | 15.4 / 16.2 | 121 / 113 | safe |
| SVG `pathLength` draw-on, `clip-path` animation | all | all | all | safe |
| Cross-document view transitions | 126 | 18.2 | no | enhancement |
| Scroll-driven animation (`scroll()`, `view()`) | 115 | 26 | 159 | enhancement |
| `::details-content` | 131 | 18.4 | 143 | enhancement |
| `display` / `content-visibility` exit transitions | 117 | 18 | no | enhancement |
| `interpolate-size`, `calc-size()` | 129 | no | no | enhancement |
| `overlay` | 117 | no | no | enhancement |
| `scroll-state()` queries | 133 | no | no | enhancement |
| `sibling-index()` | 138 | 26.2 | 154 | enhancement |
| Navigation API `navigate` event | 102 | 26.2 | 147 | enhancement |
| `animation-trigger` | 146 | no | no | avoid |
| CSS `d` path morph | 52 | no | 97 | avoid |

## Gotchas that matter here

- **View transitions:** both pages must opt in. Names must be unique among rendered elements or the whole transition is skipped. Reduced motion is not applied automatically, and the repo's `*` reset does not reach `::view-transition-*`; gate the opt-in in `no-preference`. Snapshots cross-fade while the box resizes; text does not reflow.
- **Scroll-driven:** `animation-timeline` must come after the `animation` shorthand. Use `scroll(root)` for sticky or fixed elements. The repo's reduced-motion reset does **not** stop a scroll-driven animation (tested), so decorative ones need the `no-preference` gate. `view()` reveals are scrubbed and reverse on scroll back; the existing one-shot reveal should keep its IntersectionObserver.
- **`@starting-style`:** adds no specificity; put it after the normal rule.
- **`<details>`:** the grid `0fr → 1fr` variant stalls if the wrapper has block padding (tested with `.resumeDetailsInner`). The `interpolate-size` variant needs no markup change but animates in Chromium only. After `details.open = true`, wait one frame before reading computed styles in a test.
- **`linear()` springs:** must sit behind `@supports`, because an invalid value in a custom property kills the whole `transition` at use time. Springs need a longer duration than `--dur-ui`.
- **Transforms:** `craft.css` uses `transform` for presses. Add hover movement with `translate` / `scale` so the two compose.
- **Testing:** `document.getAnimations()`, `animation.finished` (never on infinite animations), `currentTime`; for scroll-driven animation set the scroll position and read the computed value; `pagereveal` with `e.viewTransition` proves a cross-page transition ran.

## Spring easing strings (Open Props, verbatim)

```css
:root { --ease-spring: cubic-bezier(0.32, 0.72, 0, 1); }
@supports (transition-timing-function: linear(0, 1)) {
  :root { --ease-spring: linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001); }
}
```

That is `--ease-spring-1`, about 1.7% overshoot. Source: https://github.com/argyleink/open-props/blob/main/src/props.easing.css

## Worked snippets for this site (tested in Chrome 157)

### (i) Wordmark collapses to a monogram on scroll

Use `<b>`, not `<span>`: existing rules target `.researchBrand span`.

```html
T<b class="wmRest"><b>ony</b></b> K<b class="wmRest"><b>oo</b></b>
```

```css
.wmRest, .wmRest > b { font: inherit; }
.wmRest { display: inline-grid; grid-template-columns: 1fr; vertical-align: bottom; }
.wmRest > b { overflow: hidden; min-width: 0; white-space: nowrap; }
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: scroll()) {
    .wmRest { animation: wm-collapse linear both; animation-timeline: scroll(root block); animation-range: 0 160px; }
    @keyframes wm-collapse { to { grid-template-columns: 0fr; opacity: 0; } }
  }
}
```

Fallback: the full wordmark stays. The text stays in the accessibility tree.

### (ii) Project card grows into its report title

```css
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }
  #navigation, .researchNav { view-transition-name: site-nav; }
  ::view-transition-group(.work-title) { animation-duration: 320ms; animation-timing-function: var(--ease-out); }
}
```

```html
<h3 class="workTitle" style="view-transition-name: wk-healthcare; view-transition-class: work-title; width: fit-content">…</h3>
<!-- and on the report -->
<h1 style="view-transition-name: wk-healthcare; view-transition-class: work-title; width: fit-content">…</h1>
```

The two titles differ in wording, so the result is a resize plus cross-fade. Firefox gets a plain navigation.

### (iii) Animated `<details>`

```css
@media (prefers-reduced-motion: no-preference) {
  .resumeDetails { interpolate-size: allow-keywords; }
  .resumeDetails::details-content {
    block-size: 0; overflow: clip;
    transition: block-size var(--dur-ui) var(--ease-out), content-visibility var(--dur-ui) allow-discrete;
  }
  .resumeDetails[open]::details-content { block-size: auto; }
}
```

Chromium animates; Safari 18.4+ and Firefox 143+ snap. Limit `details.articleToc` to widths of 850px and below, because `research.js` forces it open on desktop at load.

### (iv) Reading-progress bar on reports and essays

```css
@supports (animation-timeline: scroll()) {
  .researchNav::after {
    content: ""; position: absolute; inset: auto 0 -1px 0; height: 2px;
    background: var(--accent); transform-origin: 0 50%; scale: 0 1;
    animation: read-progress linear both; animation-timeline: scroll(root block);
  }
  @keyframes read-progress { to { scale: 1 1; } }
}
```

Compositor-only. It still tracks under reduced motion, which is defensible because it mirrors the reader's own scroll. The same pattern can replace the homepage `#scrollProgress` and its jQuery handler.

### (v) Thin loading bar during navigation

```html
<script>
window.navigation?.addEventListener("navigate", e => {
  if (!e.destination.sameDocument && !e.downloadRequest && new URL(e.destination.url).origin === location.origin)
    document.documentElement.classList.add("is-leaving");
});
addEventListener("pageshow", () => document.documentElement.classList.remove("is-leaving"));
</script>
```

```css
html.is-leaving::after {
  content: ""; position: fixed; inset: 0 0 auto 0; height: 2px; z-index: 1000; pointer-events: none;
  background: var(--accent); opacity: 0;
  animation: nav-bar 1.1s var(--ease-standard) 200ms 8;
}
@keyframes nav-bar { from { opacity: 1; translate: -100% 0; scale: .4 1; } to { opacity: 1; translate: 100% 0; scale: .4 1; } }
@media (prefers-reduced-motion: reduce) { html.is-leaving::after { animation: none; opacity: .6; } }
```

The 200ms delay means fast loads show nothing; on GitHub Pages most navigations finish inside it. Eight runs, then it stops by itself.

### Chat dialog entry and exit

```css
.chatOverlay {
  opacity: 0; translate: 0 12px;
  transition: opacity var(--dur-ui) var(--ease-out), translate var(--dur-ui) var(--ease-out),
              display var(--dur-ui) allow-discrete, overlay var(--dur-ui) allow-discrete;
}
.chatOverlay[open] { opacity: 1; translate: 0 0; }
@starting-style { .chatOverlay[open] { opacity: 0; translate: 0 12px; } }
```

Firefox gets the entry and an instant exit.

## Not confirmed

Safari and Firefox runtime behaviour of every snippet; how a named sticky header with `backdrop-filter` looks inside a view-transition snapshot; whether the homepage `#loadingScreen` replays over an incoming transition.
