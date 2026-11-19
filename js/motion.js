// The navigation hairline: mark the page as leaving while the next same-site page loads.
// CSS (css/motion.css) draws the bar. Browsers without the Navigation API simply show nothing.
window.navigation?.addEventListener("navigate", (e) => {
  if (!e.destination.sameDocument && !e.downloadRequest && new URL(e.destination.url).origin === location.origin) {
    document.documentElement.classList.add("is-leaving");
  }
});
// A page restored from the back/forward cache must not come back with the bar still on.
addEventListener("pageshow", () => document.documentElement.classList.remove("is-leaving"));
// The theme icon animates in only after the visitor toggles it, never on page load.
addEventListener("click", (e) => {
  if (e.target.closest?.("[data-theme-toggle], #darkModeToggle")) document.documentElement.classList.add("did-toggle");
}, true); // capture: the homepage toggle's own handler stops the click from bubbling
