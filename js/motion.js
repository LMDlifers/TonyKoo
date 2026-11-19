// The navigation hairline: mark the page as leaving while the next same-site page loads.
// CSS (css/motion.css) draws the bar. Browsers without the Navigation API simply show nothing.
window.navigation?.addEventListener("navigate", (e) => {
  if (!e.destination.sameDocument && !e.downloadRequest && new URL(e.destination.url).origin === location.origin) {
    document.documentElement.classList.add("is-leaving");
    // A stopped or unanswered navigation never fires pageshow, so the mark is also taken off after a while.
    setTimeout(() => document.documentElement.classList.remove("is-leaving"), 10000);
  }
});
// A page restored from the back/forward cache must not come back with the bar still on.
addEventListener("pageshow", () => document.documentElement.classList.remove("is-leaving"));
// The theme icon animates in only after the visitor toggles it, never on page load.
addEventListener("click", (e) => {
  if (!e.target.closest?.("[data-theme-toggle], #darkModeToggle")) return;
  const root = document.documentElement;
  root.classList.add("did-toggle", "theme-switching"); // no colour fades while the theme flips
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
}, true); // capture: the homepage toggle's own handler stops the click from bubbling
