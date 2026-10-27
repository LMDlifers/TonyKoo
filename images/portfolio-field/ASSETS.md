# Original portfolio field artwork

Authored for this portfolio on 2026-10-22 with original geometric pixel drawing instructions by Codex. No external image inputs, traced silhouettes, downloaded sprite packs, logos, or proprietary artwork were used. Maples.im exports and MapleStory sprites were not copied. The visual reference is the approved field brief; all shapes and coordinates are newly authored.

`field.svg` and `field-night.svg` are 960 × 400 crisp-edged vector scenes. Each includes a workshop, path, laptop workbench, research easel, and study bench/tree. The night palette is authored separately, including a moon and stars.

The interactive field adds four original 960 × 520 isometric SVGs: `field-summer.svg`, `field-summer-night.svg`, `field-snow.svg`, and `field-snow-night.svg`. They share exactly the same island geometry and character walk area, with separate seasonal and site-theme palettes. The supplied isometric screenshot informed the general viewpoint only; no source image pixels, geometry, text, or assets were traced or reused. The builder script generates these four files locally.

The three persona SVGs are editable 64 × 80 source stills. All roles share dark hair, neutral eyes, and aligned proportions: navy/laptop AI Engineer, amber/notebook Researcher, cream/green/backpack Student. PNGs use straight RGBA with fully transparent empty pixels, no antialiasing or matte. Idle sheets contain four 64 × 80 frames, walk sheets six, and still images one. Frames run left to right with no padding. Idle moves one pixel; walk alternates legs around the same anchor. Feet remain inside the canvas.

Rebuild with `python3 scripts/build-portfolio-field-art.py` from the repository root. This uses only Python's standard library and emits a diagnostic contact sheet into `/tmp/portfolio-contact.svg`; diagnostic sheets are not shipped. Validate with `node scripts/check-portfolio-field-assets.mjs`. Render at integer scale with nearest-neighbor sampling; display artwork as decorative beside real HTML labels.
