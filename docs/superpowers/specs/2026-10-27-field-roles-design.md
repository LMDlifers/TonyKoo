# Writer and Reader in the homepage field

## Intent

Let visitors discover more of Tony's work through the existing isometric homepage scene without crowding its three-character layout. The new roles are Writer, linking to Technical Writing, and Reader, linking to Reading & Research Diet. Each is a version of the same retro character rather than a new product feature.

## Approaches

- **Five visible characters:** Direct access to every role, but five 120-pixel targets and labels crowd the 746-pixel desktop map and its scenery. The mobile list also gets longer.
- **Two switchable casts of three (chosen):** Preserve three readable characters at a time. Keep Researcher at the centre as a bridge; swap AI Engineer and Student for Writer and Reader in the outer positions. The cast control adds one deliberate choice before a destination.

## Design

- Add a `Work / Ideas` cast control beside the existing Summer/Snow control. Work is the initial cast: AI Engineer → Projects, Researcher → Research, Student → Background. Ideas shows Writer → Writing, Researcher → Research, Reader → Reading.
- Keep the same island and season. Switching casts closes an open destination card, pauses the departing characters, and shows the arriving pair at their last in-page positions. Researcher keeps its position. Neither season nor cast choice requires persistence across visits.
- Draw original Writer and Reader sprites in the established 64 × 80 pixel style, with still, idle, and walking frames. Give them distinct props (a page/pen and a book) and colours while retaining the shared face and proportions. Reuse the scenery and its walkable mask.
- Give all five roles native destination links. With JavaScript unavailable, keep the original three visible in the map and expose Writer and Reader as labelled links beneath it. With JavaScript, show only the active cast in both the desktop map and the mobile character list.
- On desktop, active roles wander, pause on selection, and can be dragged within the safe walk area without overlapping others. On narrow screens and in reduced-motion mode, roles stay still and use large selection targets. Keyboard selection, card links, Escape, and visible focus remain available.

## Boundaries and checks

Change only the homepage field and its original artwork/tests. Do not add a chat persona, game engine, account state, or new destination page. Check both casts in both seasons and themes at desktop, tablet, and mobile sizes; verify destinations, no-JavaScript links, no character/card/launcher overlap, reduced motion, and the published homepage after release.
