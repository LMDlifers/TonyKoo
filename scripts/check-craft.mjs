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
  for (const selector of [".heroButtonPrimary", "#filter .btn.active", "#filter .btn:nth-of-type(2)", ".fieldCastChoices button:nth-of-type(2)", ".filterItem:visible .labelMore > summary"]) {
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
    const pressedState = await state(button);
    const pressed = scaleOf(pressedState.transform);
    if (selector === ".heroButtonPrimary") {
      const luminance = (bg) => button.evaluate((el, c) => {
        const ctx = document.createElement("canvas").getContext("2d");
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return (r + g + b) / 765;
      }, bg);
      assert.ok((await luminance(pressedState.background)) < (await luminance(hover.background)) - 0.02, `${selector} press is a darker step than hover`);
    }
    assert.ok(pressed >= 0.96 && pressed <= 0.98, `${selector} press scale ${pressed}`);
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    assert.equal(scaleOf((await state(button)).transform), 1, `${selector} returns to rest`);
  }

  // An open selection card never covers the season control.
  for (const width of [1440, 1024, 900]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator(".fieldScene").scrollIntoViewIfNeeded();
    await page.locator('[data-persona="researcher"]').click();
    await page.waitForTimeout(200);
    const rects = await page.evaluate(() => [".fieldSelectionCard", ".fieldSeasonChoices"].map((s) => document.querySelector(s).getBoundingClientRect().toJSON()));
    const [c, z] = rects;
    const overlap = c.left < z.right && c.right > z.left && c.top < z.bottom && c.bottom > z.top;
    assert.ok(!overlap, `selection card covers the season control at ${width}`);
    await page.locator(".fieldSelectionClose").click();
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  // Card images keep the old 300px ceiling at tablet width.
  await page.setViewportSize({ width: 768, height: 1024 });
  const tabletImg = await page.locator(".filterItem:visible .filterItemImg").first().evaluate((el) => el.getBoundingClientRect().height);
  assert.ok(tabletImg <= 300, `card image ${tabletImg}px tall at 768`);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Type: display heads tighten as they grow; each face has one role.
  const type = await page.evaluate(() => {
    const ratio = (el) => {
      const cs = getComputedStyle(el);
      const ls = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing);
      return ls / parseFloat(cs.fontSize);
    };
    const font = (el) => {
      const cs = getComputedStyle(el);
      return [cs.fontFamily, cs.fontSize, cs.fontWeight, cs.letterSpacing, cs.textTransform].join("|");
    };
    return {
      h1: ratio(document.querySelector("h1.heroTitle")),
      titles: [...document.querySelectorAll(".sectionTitle")].map(ratio),
      buttonSpacing: parseFloat(getComputedStyle(document.querySelector(".heroButton")).letterSpacing) || 0,
      subtitleFont: getComputedStyle(document.querySelector(".heroSubtitle")).fontFamily,
      findFont: font(document.querySelector(".navFindButton")),
      navFont: font(document.querySelector("a.nav-link")),
    };
  });
  assert.ok(type.h1 >= -0.03 && type.h1 <= -0.015, `hero title tracking ratio ${type.h1}`);
  for (const r of type.titles) assert.ok(r >= -0.025 && r <= -0.01, `section title tracking ratio ${r}`);
  assert.ok(type.buttonSpacing <= 0, `hero button tracking ${type.buttonSpacing}`);
  assert.doesNotMatch(type.subtitleFont, /Inconsolata/, "subtitle uses the body face; mono is for data");
  assert.equal(type.findFont, type.navFont, "Find matches its nav siblings");

  // Hero controls: the season pair sits quietly inside the map; toolbar groups match the 8px control radius.
  const controls = await page.evaluate(() => {
    const season = document.querySelector(".fieldSeasonChoices");
    return {
      seasonInWorld: Boolean(season?.closest(".fieldWorld")),
      seasonLabels: [...season.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") || ""),
      seasonSizes: [...season.querySelectorAll("button")].map((b) => Math.round(b.getBoundingClientRect().width)),
      radii: [".fieldCastChoices", ".fieldSeasonChoices"].map((s) => parseFloat(getComputedStyle(document.querySelector(s)).borderTopLeftRadius)),
    };
  });
  assert.ok(controls.seasonInWorld, "season control sits inside the field map");
  assert.deepEqual(controls.seasonLabels, ["Summer", "Snow"], "season buttons are labelled");
  for (const w of controls.seasonSizes) assert.ok(w >= 40 && w <= 48, `season button is icon-sized (${w}px)`);
  for (const r of controls.radii) assert.ok(r <= 10, `toolbar group radius ${r}px, not a pill`);

  // Links: a tinted, offset underline that takes the link colour on hover.
  const link = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector(".logEntry a"));
    return { deco: cs.textDecorationColor, color: cs.color, offset: parseFloat(cs.textUnderlineOffset) || 0, transition: cs.transitionProperty };
  });
  assert.notEqual(link.deco, link.color, "link underline is tinted, not currentColor");
  assert.ok(link.offset >= 2, `link underline offset ${link.offset}px`);
  assert.match(link.transition, /text-decoration-color|all/, "underline colour fades");

  // A checkable proof line in the hero.
  const proof = await page.locator(".heroProof").textContent();
  assert.match(proof.trim(), /^\d+ pages logged, latest added \d{1,2} [A-Z][a-z]{2} \d{4}$/, "hero proof line");

  // Surfaces: cards have a hairline plus soft layers, never lift, and hold a tinted image box before load.
  for (const dark of [false, true]) {
    await page.evaluate((isDark) => document.body.classList.toggle("dark-mode", isDark), dark);
    const card = page.locator(".filterItem:visible").first();
    await card.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    const surface = await card.evaluate((el) => {
      const cs = getComputedStyle(el);
      const img = el.querySelector(".filterItemImg");
      const ics = getComputedStyle(img);
      return {
        shadow: cs.boxShadow,
        cardBg: cs.backgroundColor,
        imgBg: ics.backgroundColor,
        imgHeight: img.getBoundingClientRect().height,
      };
    });
    const layers = surface.shadow.split(/,(?![^(]*\))/);
    assert.ok(layers.length >= 2, `card shadow has ${layers.length} layer(s) (dark=${dark})`);
    assert.ok(layers.some((l) => /0px 0px 0px 1px/.test(l)), `card shadow has a hairline (dark=${dark})`);
    assert.notEqual(surface.imgBg, "rgba(0, 0, 0, 0)", `image box is tinted (dark=${dark})`);
    assert.notEqual(surface.imgBg, surface.cardBg, `image box differs from card (dark=${dark})`);
    assert.ok(surface.imgHeight >= 200, `image box holds its height ${surface.imgHeight} (dark=${dark})`);
    await card.hover();
    await page.waitForTimeout(300);
    const cardTransform = await card.evaluate((el) => getComputedStyle(el).transform);
    const m = cardTransform === "none" ? [1, 0, 0, 1, 0, 0] : cardTransform.match(/matrix\(([^)]+)\)/)[1].split(",").map(Number);
    assert.ok(m[0] === 1 && m[3] === 1 && m[5] === 0, `card does not lift: ${cardTransform} (dark=${dark})`);
  }
} finally {
  await browser.close();
}

console.log("Craft checks passed.");
