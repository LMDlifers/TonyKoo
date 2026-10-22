# Animated portfolio field — design specification

## Purpose and boundaries

Replace the homepage's current technical-banner hero with a small, animated pixel-art field that introduces Tony's different working roles and routes visitors into the existing portfolio. The scene should be memorable without delaying someone who came to inspect work. Keep the existing navigation, search, Research section, project evidence, resume, contact details, and source-backed AI guide. The scene is a homepage entrance, not a separate game or a new route.

The first release is an **animated navigation scene**, not free-roam gameplay. Desktop visitors can click a character or use Tab and Enter to follow a destination. Visitors who do not interact can read the title and primary links immediately. The field is the single scene; a small workshop/study structure suggests the kitchen/workroom idea without requiring a second level or transition.

## Composition and destinations

The first viewport has a quiet sky and field, a path across the lower half, and three distinct stations. Tony's name and a one-sentence positioning statement stay readable in a dedicated area above or to the left of the scene. A visible “View projects” link remains a direct path for visitors who skip the artwork. The scene's color palette adapts the site's existing ink, teal, cream, and restrained warm accents. Pixel elements have crisp nearest-neighbor scaling and enough negative space for labels.

| Persona | Scene role | Label and destination | Visual cue |
| --- | --- | --- | --- |
| AI Engineer | Builds at a field workbench | “AI Engineer · Projects” → `#portfolio`, selecting the AI filter after arrival | Laptop, small circuit/tool motif |
| Researcher | Reads and sketches near the workshop | “Researcher · Research” → `research/` | Notebook, papers, diagram board |
| Student | Studies near a bench or tree | “Student · Background” → `#resume` | Book, backpack, study notes |

The same character silhouette and face/hair language should connect the three roles; outfits and props distinguish them. These are editorial versions of Tony, not claims about his current job title or credentials. The labels and links are always readable when the scene is static. Hover, focus, or tap may expand a short one-line description, but the first click/tap follows the destination rather than opening an extra modal.

The existing evidence-board content and hero metrics move into a compact proof strip immediately below the scene, with their existing claims and links preserved. The current top navigation remains in place. The Research tab and direct project/resume links continue to work independently of the scene.

## Motion and interaction

Each persona has a short idle cycle and a bounded walk within its own station. Movement should feel alive but not make link targets chase the pointer: each station's anchor and label stay fixed while the artwork moves within that station. A character pauses or slows on hover/focus, highlights its route, and resumes after the visitor leaves. Ambient details (grass, a page turn, a lamp) move less than the characters. No autoplay sound, timer-driven navigation, or random teleporting.

Implement the scene with ordinary HTML links and local CSS/JavaScript; keep artwork and motion separate from navigation semantics. A small persona configuration maps each fixed anchor to its label, destination, and art state. The AI filter is applied only for the AI Engineer route; Research and Student use existing URLs/anchors. If JavaScript fails, the three native links still navigate. Keep the scene independent of the Cloudflare guide Worker.

At widths below 768 px, simplify the composition to a cropped/static field with three vertically stacked, touch-sized persona links and visible text. On `prefers-reduced-motion: reduce`, show still poses and disable ambient movement, while preserving hover/focus feedback without motion. Keyboard order follows the visual route order; every destination has an obvious focus indicator, descriptive link text, and sufficient contrast against the scene. Scene artwork is decorative to assistive technology; link text carries meaning.

## Artwork and rights

Use [Maples.im](https://maples.im/) as a character-design and animation reference in a local concept pass. Its exported MapleStory art is not assumed licensed for a public professional portfolio. The published scene uses original pixel characters, props, and field art, with no MapleStory logos, monsters, maps, music, or copied sprite frames. If separately documented permission is obtained later, the asset decision can be revisited without changing the navigation component. Keep an asset-provenance note alongside the art.

Create the three personas from a shared base and export aligned transparent sprite sheets or frame sequences for idle and walk states, plus still fallback frames. Limit frames to the movement needed for the homepage; avoid a full character-rigging system. Compress and size assets before shipping. The scene must never depend on Maples.im at runtime.

## Quality, release, and acceptance

The static site remains GitHub Pages compatible and adds no animation framework, backend, account, or analytics service. Initial hero content must remain usable before art loads; reserve scene space to avoid layout shift. Target a lightweight first viewport by loading only the field background and three essential personas initially, deferring optional detail. Keep links and hero text as selectable HTML rather than baking them into an image.

Acceptance checks:

- All three routes work by pointer, touch, and keyboard; the AI Engineer route opens the existing AI project filter.
- The existing top navigation, evidence claims, project cards, search, AI guide, and contact flow still work.
- At desktop, tablet, and narrow mobile widths, labels remain legible and no persona overlaps the title or another target.
- Reduced-motion and no-JavaScript modes retain an attractive static scene and usable links.
- The first viewport has no horizontal overflow, significant layout shift, or unnecessary continuous high-cost animation.
- Published artwork has recorded provenance and no unlicensed MapleStory source assets.
- Preview the exact live-style page locally and run current site checks before publishing. Publishing occurs after visual review of the complete scene.

## Design decisions and deferred ideas

This specification adopts the approved open-field direction with a small workshop, original public artwork, and animated navigation. A playable movement mode, a second kitchen scene, sound, collectibles, and a character-selection screen are deferred. They would add control and accessibility complexity without improving the first visitor task: finding relevant work.
