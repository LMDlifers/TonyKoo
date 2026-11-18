import assert from "node:assert/strict";
import { createRequire } from "node:module";

// The selling homepage (docs/superpowers/specs/2026-11-19-sell-homepage-design.md):
// short, one visual system, results on the first screen.
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    "/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const base = process.env.SITE_BASE_URL || "http://localhost:8000";
const squash = (t) => t.replace(/\s+/g, " ").trim();
// Reads any CSS colour as 0-255 RGBA by painting it on a 1px canvas. Runs in the page.
const HELPERS = `
window.__rgba = (c) => { const x = document.createElement("canvas").getContext("2d"); x.clearRect(0,0,1,1); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data]; };
window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
// Contrast of an element's text against the first opaque background behind it.
window.__contrast = (el) => {
  const fg = __rgba(getComputedStyle(el).color);
  let bg = [246, 244, 238, 255];
  for (let e = el; e; e = e.parentElement) { const c = __rgba(getComputedStyle(e).backgroundColor); if (c[3] > 250) { bg = c; break; } }
  const [a, b] = [__lum(fg), __lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};`;

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const open = async (opts = {}, night = false) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", ...opts });
  if (opts.javaScriptEnabled !== false) await ctx.addInitScript(HELPERS);
  if (night) await ctx.addInitScript(() => localStorage.setItem("darkMode", "enabled"));
  const page = await ctx.newPage();
  await page.goto(base + "/");
  return page;
};
try {
  const page = await open();

  // Budgets: a short page with no sideways scroll.
  for (const [width, height, max] of [[1440, 900, 9000], [390, 844, 13000]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(200);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    assert.ok(total <= max, `page is ${total}px tall at ${width}; budget ${max}`);
  }
  for (const width of [320, 390, 768, 899, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `no sideways scroll at ${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  // The pixel face is an accent: the wordmark and the field title only.
  const pixel = await page.evaluate(() => [...document.querySelectorAll("body *")]
    .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && /^"?Pixelify Sans/.test(getComputedStyle(el).fontFamily) && !el.matches(".title-word, .fieldToolbarTitle"))
    .map((el) => `${el.tagName}.${el.className}`).slice(0, 8));
  assert.deepEqual(pixel, [], "Pixelify Sans only on the wordmark and the field title");

  /* TASKS */
  await page.context().close();
} finally {
  await browser.close();
}

console.log("Home checks passed.");
