# Brand and loading motion in the wild (research note, 2026-11-19)

Tags: **[CSS]** / **[JS]** read from the site's own shipped code on 2026-11-19; **[SRC]** read from the company's open-source repo; **[3P]** a third party's statement.

**Could not verify:** the claude.ai web spark (403), Meta AI's generation loader (403), which ChatGPT keyframe belongs to which element, and any published Anthropic brand-motion guideline.

## Logo and wordmark

### Anthropic: "ANTHROPIC" collapses to "A\" [JS + Lottie data, anthropic.com]

- A Lottie SVG animation, not CSS. Each letter is a layer with animated x-position and opacity. The A never moves; the slash slides left and stays.
- 18 frames at 30 fps: 0.6s. Position easing `cubic-bezier(.77, 0, .175, 1)`.
- Letter opacity goes 100 to 0 in the first 0.3s with the same curve.
- No stagger. Every letter shares one move; the perceived stagger comes from the different distances.
- Trigger: collapsed when `scrollY > 15` or the viewport is 870px wide or less. First paint jumps with no animation.
- Wrapper re-centres with `transition: transform .633s`, inside `prefers-reduced-motion: no-preference`.

### Unless: per-letter opacity lockup [stated by the company]

- Mark stays put. Letters fade out right to left on scroll and back in left to right at the top.
- 140ms per letter, `ease`, 100ms stagger. Trigger at 8px of scroll. Reduced motion: no stagger.
- https://unless.com/en/design/foundations/motion/logo-lockup/

### Notion: nav hairline by scroll-driven CSS [CSS]

`animation: linear both navShadowScrolled; animation-timeline: --nav-stuck; animation-range: exit 100%`, from `box-shadow: 0 1px #0000` to the border colour.

## Thinking and loading indicators

### Claude Code spinner [JS, `@anthropic-ai/claude-code@1.0.100`]

- Frames `· ✢ ✳ ✶ ✻ ✽`, played forward then reversed. Frame swap, no tweening. 120ms per frame.
- The verb beside it has a 3-character highlight that steps through the letters every 200ms.

### The same spinner on claude.com, in pure CSS [CSS]

```css
.welcomeGlyph { width: 1ch; height: 1em; overflow: hidden; }
.welcomeGlyph span { display: block; white-space: pre; animation: 1.2s steps(8, end) infinite welcomeGlyph; }
@keyframes welcomeGlyph { to { transform: translateY(-8em); } }
```

- A vertical strip of 8 glyphs, 150ms each. Wrapped in `role="status"`, glyph `aria-hidden`.
- Verb shimmer: a 300%-wide gradient on `background-clip: text`, `background-position` 300% to -300% at `16s linear infinite`. Very slow and quiet.
- Paused with `animation-play-state: paused` when idle.
- Caret: `to { opacity: .3 }`, `.65s ease-out infinite alternate`. It breathes; it does not blink.
- Typed line: `clip-path: inset(0 100% 0 0)` to `inset(0)` with `steps(var(--chars), jump-start)`.

### Others

| Source | Pattern | Numbers |
|---|---|---|
| Vercel Geist spinner [CSS] | 10 bars, opacity 1 to .15 | 1000ms linear, delays in steps of duration/10 |
| Geist loading dots [CSS] | 3 dots, opacity .2 → 1 at 20% → .2 | 1.4s, delays 0 / .2s / .4s |
| Apple spoke spinner [CSS] | 8 opacity steps | .8s `cubic-bezier(1,.1,0,.3)` |
| GitHub Primer ellipsis [CSS] | "..." revealed by `steps(4, jump-none)` | 1.2s |
| Linear caret [CSS] | `50% { visibility: hidden }` | 1.2s `step-end` |
| Linear status pulse [CSS] | box-shadow ring to 10px transparent | 1.75s `cubic-bezier(.66,0,0,1)` |
| Material 3 Expressive [SRC] | one shape morphs through 7 shapes while rotating | 650ms per shape, spring 200 / 0.6 |
| Carbon loading [SRC] | spin | 690ms linear; `animation: none` under reduced motion |

## Progress bars

- **Raycast top hairline** [CSS]: 200×1px, `linear-gradient(90deg, #0000, #fff 50%, #0000)`, opacity .5, `2s ease-in-out infinite`, sliding `left: 0` to `left: 100%; translate(-100%)` and back.
- **Vercel** [CSS]: `scaleX(0)` to `scaleX(1)`.
- **Polaris** [SRC]: `scaleX` transition, origin `0 50%`, 500ms, `cubic-bezier(.25,.1,.25,1)`.
- **Material 3 wavy progress** [SRC]: amplitude 3dp, wavelength 40dp, one wavelength per second; flat below 10% and above 95%.

## Skeletons and text shimmer

| Source | Mechanism | Numbers |
|---|---|---|
| Geist skeleton [CSS] | `::after` overlay, `translate(-50%)` | 1.5s ease-in-out infinite reverse |
| Primer skeleton [CSS] | `::before` 300% wide, 75° mask, `translate` 0 to 66.67% | 1s |
| Carbon skeleton [SRC] | `scaleX` bar with switching origin | 3000ms; none under reduced motion |
| Polaris skeleton text [SRC] | static grey bars, no animation | n/a |
| Vercel thinking text [CSS] | `linear-gradient(90deg, #666 33%, #ccc 50%, #666 66%)`, 300% wide, position 100% to 0% | 1.5s linear |
| Notion shimmer text [CSS] | `currentColor` at 50% → 100% → 50%, 200% wide | 1.5s linear |
| Raycast label [CSS] | position `100% 0` to `-100% 0` by 80%, then rests | 1.5s linear |

## Text reveal

- **Anthropic hero word rise** [CSS]: each word `inline-block`, delay `calc(var(--i) * 34ms)`. Fade `.5s cubic-bezier(.2,.7,.1,1)`; rise `.8s cubic-bezier(.16,1,.3,1)` from `translateY(.42em)`; unblur `.5s ease` from `blur(4px)`. All `backwards`. Off under reduced motion.
- **claude.com section raise** [CSS]: `translateY(16px)` and opacity 0 to rest, `.4s cubic-bezier(.19,1,.22,1) backwards`.
- **Primer Brand cursor** [CSS]: blinks three times, then stops.

## Buttons and controls

- **Press scale** [CSS]: Linear `.97`; Raycast `.98`; Vercel `.97`. Polaris swaps to an inset shadow with no scale.
- **Hover arrows** [CSS]: Stripe in `.3s` from `translateX(-3px)` and opacity 0, out `.15s`; Apple `.24s cubic-bezier(.4,0,.6,1)` from `translate(-4px)`; Anthropic `translate(8px)`, `.2s cubic-bezier(.77,0,.175,1)`.
- **Anthropic sibling dimming** [CSS]: hovering one list item dims the other titles; `transition: color .3s`.
- **Anthropic disclosure** [CSS]: `grid-template-rows .5s cubic-bezier(.165,.84,.44,1)`, body `opacity .3s` from `translateY(10px)`, plus icon `rotate(45deg) .3s`.
- **Anthropic tokens** [CSS]: ease-out-quart `(.165,.84,.44,1)`, ease-in-out-quart `(.77,0,.175,1)`.
- **Linear tokens** [CSS]: quick `.1s`, regular `.25s`; highlight fades in at `0s` and out at `.15s`.
