# Task 4 — responsive, accessibility and legacy hero cleanup

## RED / GREEN
- Added browser assertions before implementation for 1440, 1024, 768, 390 and 320 px: overflow, fixed-target separation, intro separation, label containment, minimum 44 px target dimensions, focus outline and reduced-motion still frames in both themes.
- RED: `Desktop labels should appear earlier` at 1440 px, before tuning. The old responsive baseline also reproduced its known strict selector failure against the two system-design cards.
- GREEN: final `check-portfolio-field.mjs` passes all width/theme and existing motion/route checks.

## Changes
- Preserved the first existing subtitle phrase as selectable static copy; removed the typing timer and retired header-image scroll parallax.
- Reduced intro/scene spacing: desktop field starts around y560; labels finish around y806 in the 1440×1000 preview. Preserved hero text, direct actions, proof claims and destinations.
- Mobile uses a 64 px art column and flexible wrapping text column, avoiding clipping at 320 px. Fixed focused mobile targets to opaque cream to retain dark-ink contrast in the night scene.
- Removed obsolete header-image, overlay, particles, lab-grid/node, cursor and scroll-hint CSS and their unused animation definitions. Kept shared CTA, typography and evidence-panel styles.
- Smoke baseline inspects the new field selectors and locates the intended boundary article precisely. Updated assertions to the existing 20 Research cards / 7 AI-agent cards / 3 systems-cloud cards without changing Research content.

## Browser evidence
- `/tmp/portfolio-field-{1440,1024,768,390,320}-{light,dark}.png` captures all five widths and both themes with reduced motion; `/tmp/portfolio-field-motion-{0,1}.png` captures desktop animated poses.
- Visually inspected desktop 1440, tablet 768 and narrow 320 screenshots. Desktop routes remain distinct with readable labels. Tablet wraps labels inside each fixed target. Mobile stacks the three full-width links and retains all copy; vertical scrolling is intentional.
- Existing checks additionally cover route clicks, keyboard activation, AI filter selection, fixed hit areas during animation, hover pause, offscreen/hidden pause, mobile still frames and no-JavaScript native navigation.

## Validation and self-review
- `node scripts/check-launch-readiness.mjs`: passed.
- `node --test tests/*.test.mjs`: 25 passed.
- `git diff --check`: passed; CSS braces balanced.
- `node scripts/check-portfolio-field.mjs`: passed.
- `node scripts/smoke-responsive.mjs`: passed all 102 page/width checks plus Research interaction checks, with 20 total / 7 AI-agent / 3 systems-cloud fixed expectations.
- Final self-review removed remaining dead responsive banner selectors; launch-readiness and whitespace checks passed again.
- Self-review: no Research content, project claims, destinations, guide Worker or contact behavior changed. Still imagery remains available when JavaScript or motion is disabled. Pixel rendering remains scoped to artwork only.

## Concerns
- Browser verification uses local Chrome and remote font dependencies can make full runs slow. No publishing performed; final visual approval remains outside this task.

Commit: `030eb32` — `fix: polish animated field across devices`.

## Fix round 1 — guide launcher overlap at 320 px

### RED / GREEN
- RED: `node scripts/check-portfolio-field.mjs` — static portfolio checks passed, then Playwright failed before launching its first page: `browserType.launch: Timeout 180000ms exceeded` (Chrome process did not become available). `node scripts/smoke-guide.mjs` also failed at `browserType.launch` with Chrome aborting before any page opened. These are runner/browser startup failures; neither reached an assertion.
- GREEN: `node scripts/check-launch-readiness.mjs` — `Launch-readiness checks passed.` `node scripts/check-portfolio-field-assets.mjs` — `Portfolio field assets OK: 9 transparent sheets, 5 local SVGs; 28326 / 614400 bytes`. The static portion of `node scripts/check-portfolio-field.mjs` — `Portfolio field static checks passed.`

### Review
- Moved the guide widget into the portfolio field before the scene and made its mobile presentation static, so it occupies intro flow instead of overlaying the Researcher station.
- Added a mobile `elementFromPoint` assertion at station sample points and label centers across scroll positions to detect actual hit-area occlusion.
- Inspected `/tmp/portfolio-field-320-{light,dark}.png` and `/tmp/portfolio-field-390-{light,dark}.png`. At both widths, the guide pill remains in the intro above the scene, with visible separation before the stations. No launcher/station overlap is visible.
- Browser assertions and new post-fix captures could not be completed in this environment because Chrome launch timed out/aborted. Existing screenshots show the corrected layout; this remains the main verification limitation.
