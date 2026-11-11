import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

// Craft checks: motion, press and type values measured the way the 2026-11-11 reference study measured them.
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    "/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const ownCss = ["style.css", "site-theme.css", "portfolio-field.css", "log.css"].map((f) => [f, read(`../css/${f}`)]);

// Every transition part names one of the house curves; bare or missing timing falls back to `ease`.
for (const [file, css] of ownCss) {
  for (const [, value] of css.matchAll(/transition(?:-timing-function)?\s*:\s*([^;}]+)/g)) {
    if (/^\s*(none|inherit|initial|unset)\s*$/.test(value)) continue;
    for (const part of value.split(/,(?![^(]*\))/)) {
      assert.match(part, /var\(--ease-|cubic-bezier\(|steps\(|linear/, `${file}: "${part.trim()}" uses a default curve`);
    }
  }
}

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const base = process.env.SITE_BASE_URL || "http://localhost:8000";
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base);
  const easeOut = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim());
  assert.equal(easeOut, "cubic-bezier(0.32, 0.72, 0, 1)", "house ease-out token");
} finally {
  await browser.close();
}

console.log("Craft checks passed.");
