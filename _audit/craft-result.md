# Craft layer result (2026-11-11)

Plan: `docs/superpowers/plans/2026-11-11-craft-layer.md`. References: `.hallmark/references/2026-11-11/` (private, git-ignored).

## Measured on the hero's primary button (1440×900, dark theme)

| Value | Tony (after) | Tony (before) | Reference |
|---|---|---|---|
| Press scale | 0.97 | none (button kept its 2px lift) | Linear 0.97, Muse 0.98 |
| Hover | colour step in place (light grey to white), no movement | lifts 2px, amber glow | colour change in place (Vercel, Stripe, Apple) |
| Press colour | one step darker than hover | unchanged | Muse darkens through 3 steps |
| Release | scale back in 100ms, colour in 160ms | n/a | Muse about 160ms |
| Curves | `cubic-bezier(0.32,0.72,0,1)` for transform; `(0.4,0,0.2,1)` for colour | `ease` (86 uses) | Linear and Vercel curves |
| Durations | 100ms press, 160ms hover, 240ms UI on controls; older `--motion-fast` (160ms), `--motion-standard` (260ms) and slow 0.25 to 0.8s reveals remain | 0.3s almost everywhere | 0.1 to 0.24s |
| h1 tracking | -1.296px at 51.84px (-2.5%) | normal | Apple -1.5%, Linear -2.2% |
| Button tracking | 0 | +0.32px | 0 or negative |

## Other changes
- Cards have a hairline plus two soft shadow layers, and no lift on hover.
- Image boxes hold their size and a tint until the image loads.
- The season control is a pair of labelled 44px icon buttons in the map's top-left corner, clear of the selection card and the Ask launcher.
- Toolbar groups use the 8px control radius.
- Links have a tinted, offset underline.
- The hero proof line ("22 pages logged, latest added 22 Oct 2026") is checked against `log.html`.

## Verdict
- The press reads as the button giving under the finger, as on Linear and Muse.
- Hover is a colour step, and nothing lifts.
- `scripts/check-craft.mjs` measures these values, so they cannot drift.
