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
const ownCss = ["style.css", "site-theme.css", "portfolio-field.css", "log.css", "craft.css"].map((f) => [f, read(`../css/${f}`)]);

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

  // Buttons: hover changes colour in place, press gives a little, release returns.
  const scaleOf = (t) => (t === "none" ? 1 : Number(t.match(/matrix\(([^,]+)/)?.[1] ?? 1));
  const state = (loc) => loc.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { transform: cs.transform, background: cs.backgroundColor, shadow: cs.boxShadow };
  });
  for (const selector of [".heroButtonPrimary", "#filter .btn:nth-of-type(2)", ".fieldCastChoices button:nth-of-type(2)"]) {
    const button = page.locator(selector).first();
    await button.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    const rest = await state(button);
    assert.equal(rest.transform, "none", `${selector} rests flat`);
    await button.hover();
    await page.waitForTimeout(300);
    const hover = await state(button);
    assert.equal(scaleOf(hover.transform), 1, `${selector} does not move on hover`);
    assert.doesNotMatch(hover.transform, /matrix\([^)]*,\s*-?[1-9][\d.]*\)$/, `${selector} does not lift on hover`);
    assert.doesNotMatch(hover.shadow, /rgba\(249, 168, 37/, `${selector} has no amber glow`);
    if (selector === ".heroButtonPrimary") assert.notEqual(hover.background, rest.background, `${selector} hover changes colour`);
    await page.mouse.down();
    await page.waitForTimeout(160);
    const pressed = scaleOf((await state(button)).transform);
    assert.ok(pressed >= 0.96 && pressed <= 0.98, `${selector} press scale ${pressed}`);
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    assert.equal(scaleOf((await state(button)).transform), 1, `${selector} returns to rest`);
  }
} finally {
  await browser.close();
}

console.log("Craft checks passed.");
