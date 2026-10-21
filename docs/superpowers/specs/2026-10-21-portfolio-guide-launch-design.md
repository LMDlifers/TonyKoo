# Portfolio guide launch design

The existing GitHub Pages portfolio remains the source of truth. Its optional guide first offers search across published research and case-study pages. A Cloudflare Worker adds source-backed answers when deployed; search remains useful when that service is unavailable.

The avatar is a discreet launcher with greeting, searching, result, and unavailable states. The panel uses a native dialog for predictable keyboard focus, Escape handling, and mobile behavior. Reduced-motion visitors see a still avatar. The guide always identifies itself as AI.

The build index includes public pages and two GitHub navigation links. External GitHub links are search-only until their excerpts and contribution claims are reviewed; only approved page excerpts reach the model. The Worker limits input, rate-limits requests, retrieves relevant excerpts, rejects malformed or invented citation IDs, and returns an unknown response where evidence is insufficient. Citation IDs are a structural check, not proof of semantic support, so a human-reviewed question set is required before launch.

Success means search returns relevant public pages, every public page loads the guide, the panel works on mobile and by keyboard, the Worker passes local tests, and a live model call is tested after account setup. No visitor history or personal data is intentionally stored. Publishing the Worker and site is a separate release step after visual and answer review.
