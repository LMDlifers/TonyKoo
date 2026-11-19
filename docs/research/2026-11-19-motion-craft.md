# Motion craft guidance (research note, 2026-11-19)

Condensed from a research pass over practitioner sources. Numbers are quoted from the pages read. "(mine)" marks synthesis.

## Sources read

- Jakub Krehel (JK): https://jakub.kr/writing/details-that-make-interfaces-feel-better , https://jakub.kr/writing/less-is-more
- Emil Kowalski (EK): https://emilkowal.ski/ui/7-practical-animation-tips , /great-animations , /you-dont-need-animations , /good-vs-great-animations , /building-a-toast-component , /building-a-drawer-component , /the-magic-of-clip-path ; https://animations.dev/learn/animation-theory/the-easing-blueprint
- Rauno Freiberg (RF): https://rauno.me/craft/interaction-design , https://interfaces.rauno.me/ ; Vercel guidelines (V): https://vercel.com/design/guidelines
- Josh Comeau (JC): css-transitions, linear-timing-function, spring physics, prefers-reduced-motion articles on joshwcomeau.com
- Tokens: Carbon motion overview; Fluent 2 motion; Material 3 `material-tokens` motion.css; Polaris tokens
- NN/g animation duration and response times; Laws of UX (Doherty threshold)
- WCAG 2.2 Understanding 2.3.3 and 2.2.2; Val Head on A List Apart; web.dev prefers-reduced-motion
- Not readable: Material 3 and Polaris prose guidance, paid animations.dev and interfaces.dev material.

## Durations

| Interaction | Number | Source |
|---|---|---|
| General UI cap | under 300ms | EK |
| Interaction cap | 200ms or less | RF |
| General range | 100–400ms; 500ms+ drags | NN/g |
| Toggle feedback | about 100ms | NN/g |
| Micro-interactions | 70ms buttons, 110ms fades, 150ms small expansion | Carbon |
| Expansion | 240ms; large 400ms | Carbon |
| Button press | `scale(0.97)`, 150ms ease-out | EK |
| Tooltip | 125ms ease-out from `scale(0.97)` | EK |
| Hover | 125–150ms in, slower out (up to 450ms) | JC |
| Enter vs exit | 300ms in, 200–250ms out | NN/g |
| One-off staged page enter | 800ms per chunk, 100ms stagger, 80ms between title words | JK |
| Loading indicator | show after 150–300ms; keep at least 300–500ms | V |

## Easing

- Default for user-initiated enter/exit: `ease-out`, custom not built-in (EK).
- Elements moving on screen: `ease-in-out` (EK). Colour and opacity hover: `ease` (EK). Progress: `linear` (EK).
- Staged enter: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (JK).
- Ease-out-expo: `cubic-bezier(0.19, 1, 0.22, 1)` (EK). iOS sheet: `cubic-bezier(0.32, 0.72, 0, 1)` (EK).
- Carbon productive: standard `(0.2, 0, 0.38, 0.9)`, entrance `(0, 0, 0.38, 0.9)`, exit `(0.2, 0, 1, 0.9)`.
- Material 3: emphasized-decelerate `(0.05, 0.7, 0.1, 1)`, standard `(0.2, 0, 0, 1)`.
- Exits: EK uses ease-out both ways; JC, NN/g and Carbon accelerate on exit. Either is defensible.
- Springs: for movement only, high friction, no bounce (JC). CSS `linear()` needs 25–50 points and must be gated by `@supports` (JC).

## Distances

- Press scale 0.97 (EK); 0.96–0.9, smaller change on larger elements (RF).
- Enter: `translateY(8px)` + `blur(8px)` + opacity 0 (JK). Never from `scale(0)`; start at 0.9 or above (EK).
- Blur: 2px to bridge a crossfade (EK); 4px on exits and icon swaps (JK).
- Exits are subtler than enters (JK).

## What not to animate

- Keyboard-initiated actions (EK, RF).
- High-frequency interactions (EK, JK, Apple HIG).
- Theme switches (RF).
- Layout properties; never `transition: all` (EK, V, JC).
- Functional data such as numbers and charts (EK).
- Font weight on hover or selection (RF).

## Mechanics

- `transform-origin` at the trigger (EK, V).
- Transitions for interactions, keyframes only for one-off sequences, so motion is interruptible (JK, EK).
- Hover inside `@media (hover: hover)` (RF).
- Hover on the parent, transform the child, to avoid flicker (JC).
- Pause loops off-screen (RF).
- `@starting-style` + `transition-behavior: allow-discrete` for entry from `display: none`.
- `interpolate-size: allow-keywords` + `::details-content` for `<details>`; enhancement only.

## Accessibility

- WCAG 2.3.3 (AAA): motion from interaction can be disabled. Colour and opacity changes are not "motion animation".
- WCAG 2.2.2 (A): anything that starts automatically, runs over five seconds beside other content, needs pause or stop. Scroll-into-view counts as automatic.
- Triggers: large movement, parallax, motion against scroll direction, zoom, spin (Val Head, JC, web.dev).
- Pattern: base styles have no motion; add it inside `@media (prefers-reduced-motion: no-preference)` (JC, web.dev). Do not use a global near-zero-duration override.

## Catalogue verdicts for this site

**Essential:** balanced headlines; tabular figures; card shadow step on hover (pointer devices only); press give on cards, links and buttons; list row hover; underline colour shift; chevron turn on `<details>`; nav link hover; instant focus ring; no transition on theme change; contents active state; panel that opens from the Ask button; waiting indicator only for real waits.

**Nice:** one staged hero enter with the proof row as its last step; image nudge and arrow nudge on card hover; image fade on load; `<details>` height and content fade; header edge appearing on scroll; sun/moon icon cross-fade; smooth anchor scroll with offset; heading anchor reveal; figure zoom; table scroll-edge shadow; page cross-fade; Ask button late entrance.

**Risky or overdone:** per-word title stagger; count-up numbers; clip-path image wipes; tilt or spotlight cards; scroll-reveal on every section; pulsing markers; theme wipe; header that hides on scroll; reading progress bar (persistent motion; acceptable only if thin and scroll-linked).
