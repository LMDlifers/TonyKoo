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
const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
// Reads any CSS colour (rgb, oklab, color()) as 0-255 RGB by painting it on a 1px canvas. Runs in the page.
const RGB_IN_PAGE = `window.__rgb = (c) => { const x = document.createElement("canvas").getContext("2d"); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3); };`;
try {
  // Day is the default; a remembered night choice applies before first paint.
  // The probe records the body class the moment the first non-script element is inserted,
  // which is before any deferred or jQuery-ready script can fix it up.
  const firstPaint = async (path, stored, { stripBootstrap = false } = {}) => {
    const ctx = await browser.newContext();
    await ctx.addInitScript((v) => {
      if (v) localStorage.setItem("darkMode", v);
      window.__firstPaintDark = null;
      new MutationObserver((_, obs) => {
        const el = document.body && [...document.body.children].find((c) => c.tagName !== "SCRIPT");
        if (el) { window.__firstPaintDark = document.body.classList.contains("dark-mode"); obs.disconnect(); }
      }).observe(document, { childList: true, subtree: true });
    }, stored);
    if (stripBootstrap) {
      await ctx.route("**/" , async (route) => {
        const res = await route.fetch();
        const body = (await res.text()).replace(/<script>[^<]*darkMode[^<]*<\/script>/, "");
        await route.fulfill({ response: res, body });
      });
    }
    const p = await ctx.newPage();
    await p.goto(base + path, { waitUntil: "domcontentloaded" });
    const dark = await p.evaluate(() => window.__firstPaintDark);
    await ctx.close();
    return dark;
  };
  for (const path of ["/", "/reports/faiss-caching-llm-cost-latency.html", "/research/when-agents-need-search.html", "/chat/", "/log.html"]) {
    for (const [stored, expectDark] of [[null, false], ["enabled", true], ["disabled", false]]) {
      assert.equal(await firstPaint(path, stored), expectDark, `${path} stored=${stored}: dark-mode at first paint`);
    }
  }
  // Negative control: without the inline bootstrap, a night visitor would see day first. The probe must notice.
  assert.equal(await firstPaint("/", "enabled", { stripBootstrap: true }), false, "first-paint probe is sensitive to a missing bootstrap");

  // Body text contrast holds in day and night.
  const contrastPage = await browser.newPage();
  await contrastPage.addInitScript(RGB_IN_PAGE);
  await contrastPage.goto(base);
  for (const dark of [false, true]) {
    await contrastPage.evaluate((isDark) => document.body.classList.toggle("dark-mode", isDark), dark);
    await contrastPage.waitForTimeout(600);
    const ratio = await contrastPage.evaluate(() => {
      const rgb = window.__rgb;
      const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
      const bg = getComputedStyle(document.body).backgroundColor;
      const fg = getComputedStyle(document.querySelector(".heroPositioning")).color;
      const [a, b] = [lum(rgb(fg)), lum(rgb(bg))].sort((x, y) => y - x);
      return (a + 0.05) / (b + 0.05);
    });
    assert.ok(ratio >= 4.5, `body text contrast ${ratio.toFixed(2)} (dark=${dark})`);
  }
  await contrastPage.close();

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(RGB_IN_PAGE);
  await page.goto(base);
  const easeOut = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim());
  assert.equal(easeOut, "cubic-bezier(0.32, 0.72, 0, 1)", "house ease-out token");

  // Buttons press like console buttons: a hard 2px shadow at rest, pressed 2px down into it,
  // hover a colour step in place, release back to rest. (Retro PR 2 replaces the 0.97 scale.)
  const dropOf = (t) => (t === "none" ? 0 : Number(t.match(/matrix\([^)]*,\s*(-?[\d.]+)\)$/)?.[1] ?? 0));
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
    const hard = !selector.includes("summary");
    if (hard) assert.match(rest.shadow, /0px 2px 0px( 0px)?$|0px 2px 0px( 0px)?,/, `${selector} rests on a hard 2px shadow (${rest.shadow})`);
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
    if (selector === ".heroButtonPrimary") {
      const luminance = (bg) => button.evaluate((el, c) => window.__rgb(c).reduce((a, v) => a + v, 0) / 765, bg);
      assert.ok((await luminance(pressedState.background)) < (await luminance(hover.background)) - 0.02, `${selector} press is a darker step than hover`);
    }
    assert.equal(scaleOf(pressedState.transform), 1, `${selector} press does not scale`);
    assert.equal(dropOf(pressedState.transform), hard ? 2 : 1, `${selector} presses down`);
    if (hard) assert.ok(pressedState.shadow === "none" || /0px 0px 0px/.test(pressedState.shadow), `${selector} settles into its shadow (${pressedState.shadow})`);
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    assert.equal((await state(button)).transform, "none", `${selector} returns to rest`);
  }

  // The cast renders at whole-number scale: 2x from 900px up (the field is capped at 1000px, so wide screens stay 2x), 1x in the phone list. Stations never overlap.
  for (const [width, w, h] of [[1440, 128, 160], [1680, 128, 160], [390, 64, 80]]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator(".fieldScene").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const cast = await page.evaluate(() => {
      const sprites = [...document.querySelectorAll(".personaStation:not([hidden]) .personaStill, .personaStation:not([hidden]) .personaAnimated")]
        .filter((el) => el.getBoundingClientRect().width > 0)
        .map((el) => ({ w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height, r: getComputedStyle(el).imageRendering }));
      const boxes = [...document.querySelectorAll(".personaStation:not([hidden])")].map((el) => el.getBoundingClientRect().toJSON());
      const season = document.querySelector(".fieldSeasonChoices").getBoundingClientRect().toJSON();
      return { sprites, boxes, season };
    });
    assert.ok(cast.sprites.length > 0, `sprites visible at ${width}`);
    for (const s of cast.sprites) {
      assert.deepEqual([Math.round(s.w), Math.round(s.h)], [w, h], `sprite ${Math.round(s.w)}x${Math.round(s.h)} at ${width}`);
      assert.equal(s.r, "pixelated", `sprite rendering at ${width}`);
    }
    if (width < 900) {
      const rows = await page.evaluate(() => {
        const world = document.querySelector(".fieldWorld");
        const cs = getComputedStyle(world);
        const inner = world.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        return [...document.querySelectorAll(".personaStation:not([hidden])")].map((el) => el.getBoundingClientRect().width / inner);
      });
      for (const r of rows) assert.ok(r > 0.9, `phone list row spans the field (${r.toFixed(2)}) at ${width}`);
    }
    if (width >= 900) {
      cast.boxes.forEach((a, i) => cast.boxes.slice(i + 1).forEach((b) => assert.ok(!hit(a, b), `stations overlap at ${width}`)));
      for (const a of cast.boxes) assert.ok(!hit(a, cast.season), `station covers the season control at ${width}`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  // Hero: one button plus a text link; the field spills past the hero's bottom edge.
  const hero = await page.evaluate(() => {
    const link = document.querySelector("#heroSection a.heroTextLink");
    const heroBox = document.querySelector("#heroSection").getBoundingClientRect();
    const field = document.querySelector(".fieldScene").getBoundingClientRect();
    return { link: link?.textContent.trim() || "", buttons: document.querySelectorAll("#heroSection .heroButton").length, fieldBottom: field.bottom, heroBottom: heroBox.bottom };
  });
  assert.match(hero.link, /Discuss a project/i, "secondary action is a text link");
  assert.equal(hero.buttons, 1, "one hero button");
  assert.ok(hero.fieldBottom > hero.heroBottom, `field spills past the hero (${Math.round(hero.fieldBottom)} vs ${Math.round(hero.heroBottom)})`);

  // The cast reaches the first screen on a common laptop: at least half of one character is visible at 1280x800.
  {
    const laptop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await laptop.goto(base);
    await laptop.waitForTimeout(600);
    const tops = await laptop.evaluate(() => [...document.querySelectorAll(".personaStation:not([hidden]) .personaStill, .personaStation:not([hidden]) .personaAnimated")]
      .map((el) => el.getBoundingClientRect()).filter((r) => r.height > 0).map((r) => r.top + r.height / 2));
    assert.ok(tops.length > 0, "visible character sprites found at 1280x800");
    assert.ok(tops.some((t) => t <= 800), `a character is half on screen at 1280x800 (${tops.map(Math.round)})`);
    await laptop.close();
  }

  // The cast sits on whole pixels, standing still and while walking.
  for (const [w, h] of [[1440, 900], [1280, 800]]) {
    const snap = await browser.newPage({ viewport: { width: w, height: h } });
    await snap.goto(base);
    await snap.locator(".fieldScene").scrollIntoViewIfNeeded();
    await snap.waitForTimeout(300);
    // Offsets are measured from the map's own box: the page above it has text-height fractions the
    // browser snaps at paint, but anything fractional inside the map comes from our positioning.
    const spriteRects = () => snap.evaluate(() => {
      const world = document.querySelector(".fieldWorld").getBoundingClientRect();
      return [...document.querySelectorAll(".personaStation:not([hidden]) .personaStill, .personaStation:not([hidden]) .personaAnimated")]
        .map((el) => el.getBoundingClientRect()).filter((r) => r.height > 0).map((r) => [r.left - world.left, r.top - world.top]);
    });
    const onPixel = (rects, note) => {
      assert.ok(rects.length > 0, `sprites found (${note})`);
      for (const [x, y] of rects) assert.ok(Math.abs(x - Math.round(x)) < 0.01 && Math.abs(y - Math.round(y)) < 0.01, `sprite at ${x},${y} is between pixels (${note})`);
    };
    onPixel(await spriteRects(), `still, width ${w}`);
    await snap.evaluate(() => {
      document.querySelector(".fieldScene").dataset.active = "true";
      document.querySelector(".personaStation:not([hidden])").classList.add("is-walking");
    });
    await snap.waitForTimeout(200);
    onPixel(await spriteRects(), `walking, width ${w}`);

    // Walk frames: six 128px frames, stepped, ending exactly one strip away.
    if (w === 1440) {
      const walk = await snap.evaluate(() => {
        const el = document.querySelector(".personaStation.is-walking .personaAnimated");
        const cs = getComputedStyle(el);
        let end = null;
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === "fieldWalkFrames2x") end = rule.cssRules[rule.cssRules.length - 1].style.backgroundPositionX;
            }
          } catch {}
        }
        return { size: cs.backgroundSize, name: cs.animationName, timing: cs.animationTimingFunction, end };
      });
      assert.equal(walk.size, "768px 160px", "walk strip is 6 frames x 128px");
      assert.equal(walk.name, "fieldWalkFrames2x", "2x walk keyframes");
      assert.match(walk.timing, /steps\(6/, "walk steps through 6 frames");
      assert.equal(walk.end, "-768px", "walk keyframes end one full strip away");
    }
    await snap.close();
  }

  // The theme toggle shows the icon for the theme it switches to.
  {
    const iconOf = (p) => p.locator("#darkModeToggle svg[data-icon]").getAttribute("data-icon");
    const day = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await day.goto(base);
    await day.waitForSelector("#darkModeToggle svg[data-icon]");
    assert.equal(await iconOf(day), "moon", "day shows the moon");
    assert.equal(await day.locator("#darkModeToggle").getAttribute("aria-label"), "Switch to dark mode");
    await day.locator("#darkModeToggle").click();
    await day.waitForSelector('#darkModeToggle svg[data-icon="sun"]', { timeout: 2000 });
    assert.equal(await day.locator("#darkModeToggle").getAttribute("aria-label"), "Switch to light mode");
    await day.locator("#darkModeToggle").click();
    await day.waitForSelector('#darkModeToggle svg[data-icon="moon"]', { timeout: 2000 });
    await day.close();
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => localStorage.setItem("darkMode", "enabled"));
    const night = await ctx.newPage();
    await night.goto(base);
    await night.waitForSelector('#darkModeToggle svg[data-icon="sun"]', { timeout: 2000 });
    await ctx.close();
  }

  // The pixel frame: one class, a day frame by default and a night frame in dark mode.
  {
    const frame = await page.evaluate(async () => {
      const el = Object.assign(document.createElement("div"), { className: "pixelFrame" });
      document.body.append(el);
      const day = getComputedStyle(el).borderImageSource;
      document.body.classList.add("dark-mode");
      const night = getComputedStyle(el).borderImageSource;
      document.body.classList.remove("dark-mode");
      el.remove();
      return { day, night };
    });
    assert.match(frame.day, /pixel-frame-day\.svg/, "pixel frame uses the day art");
    assert.match(frame.night, /pixel-frame-night\.svg/, "pixel frame uses the night art in dark mode");
  }

  // Projects are item cards: every card in the pixel frame, titles in pixel type, focus still visible.
  {
    const cards = await page.evaluate(() => [...document.querySelectorAll(".filterItem")].map((el) => ({
      framed: el.classList.contains("pixelFrame") && getComputedStyle(el).borderImageSource !== "none",
      title: (() => { const t = el.querySelector(".filterItemName"); const cs = getComputedStyle(t); return [cs.fontFamily, cs.fontSize, cs.letterSpacing]; })(),
    })));
    assert.equal(cards.length, 11, "11 project cards");
    for (const c of cards) {
      assert.ok(c.framed, "card sits in the pixel frame");
      assert.match(c.title[0], /^"?Pixelify Sans/, "card title is pixel type");
      assert.equal(c.title[1], "24px", "card title is 24px");
      assert.ok(c.title[2] === "normal" || c.title[2] === "0px", "card title untracked");
    }
    const link = page.locator(".filterItem:visible a").first();
    await link.focus();
    assert.notEqual(await link.evaluate((el) => getComputedStyle(el).outlineStyle), "none", "card links keep a focus ring");
  }

  // Filters are a game menu: a pixel cursor on the active choice, width reserved so nothing shifts.
  {
    const cursor = (sel) => page.evaluate((s) => getComputedStyle(document.querySelector(s), "::before").content, sel);
    await page.locator("#filter").scrollIntoViewIfNeeded();
    const widths = () => page.evaluate(() => [...document.querySelectorAll("#filter .btn")].map((b) => b.getBoundingClientRect().width));
    const before = await widths();
    assert.match(await cursor("#filter .btn.active"), /►/, "active menu item shows the cursor");
    assert.doesNotMatch(await cursor("#filter .btn:not(.active)"), /►/, "inactive items show no cursor");
    await page.locator('#filter [data-project-filter="quant"]').click();
    await page.waitForTimeout(200);
    const after = await widths();
    before.forEach((w, i) => assert.ok(Math.abs(w - after[i]) < 0.5, `menu item ${i} keeps its width (${w} vs ${after[i]})`));
    assert.match(await cursor('#filter [data-project-filter="quant"]'), /►/, "cursor follows the active item");
    const chipFont = await page.evaluate(() => getComputedStyle(document.querySelector("#filter .btn")).fontFamily);
    assert.match(chipFont, /^"?Pixelify Sans/, "menu items are pixel type");
    await page.locator("#filter .btn").first().click();
  }

  // The field card is a dialogue box: pixel frame, pixel name tag, the character's portrait.
  {
    await page.locator(".fieldScene").scrollIntoViewIfNeeded();
    const dialogue = async (persona) => {
      // Walking characters never hold still for Playwright's stability wait, so force the click.
      await page.locator(`[data-persona="${persona}"]`).click({ force: true });
      await page.waitForTimeout(200);
      const d = await page.evaluate(() => {
        const card = document.querySelector(".fieldSelectionCard");
        const img = card.querySelector(".fieldSelectionPortrait");
        const r = img.getBoundingClientRect();
        const tag = getComputedStyle(card.querySelector(".fieldSelectionTitle"));
        const link = card.querySelector(".fieldSelectionLink").getBoundingClientRect();
        const title = card.querySelector(".fieldSelectionTitle").getBoundingClientRect();
        return { frame: getComputedStyle(card).borderImageSource, src: img.getAttribute("src"), w: r.width, h: r.height, font: tag.fontFamily, size: tag.fontSize, linkLeft: link.left, titleLeft: title.left, linkHeight: link.height };
      });
      await page.locator(".fieldSelectionClose").click();
      return d;
    };
    await page.locator('[data-cast-choice="work"]').click(); // an earlier press test leaves the Ideas cast showing
    const engineer = await dialogue("ai-engineer");
    assert.match(engineer.frame, /pixel-frame/, "dialogue box sits in the pixel frame");
    assert.match(engineer.src || "", /ai-engineer-still\.png$/, "dialogue shows the AI Engineer's portrait");
    assert.deepEqual([Math.round(engineer.w), Math.round(engineer.h)], [64, 80], "portrait at 1x");
    assert.match(engineer.font, /^"?Pixelify Sans/, "name tag is pixel type");
    assert.ok(engineer.linkLeft >= engineer.titleLeft - 0.5, "dialogue link sits in the text column, not under the portrait");
    assert.ok(engineer.linkHeight < 40, `dialogue link stays on one line (${engineer.linkHeight}px)`);
    assert.equal(engineer.size, "16px", "name tag is 16px");
    await page.locator('[data-cast-choice="ideas"]').click();
    const researcher = await dialogue("researcher");
    assert.match(researcher.src || "", /researcher-still\.png$/, "portrait follows the selected character in another cast");
    await page.locator('[data-cast-choice="work"]').click();
  }

  // Framed boxes stay see-through outside the art in night mode, so the stepped corners show.
  {
    const bgs = await page.evaluate(() => {
      document.body.classList.add("dark-mode");
      const card = document.querySelector(".fieldSelectionCard");
      card.hidden = false;
      const out = [getComputedStyle(card).backgroundColor, getComputedStyle(document.querySelector(".filterItem")).backgroundColor];
      card.hidden = true;
      document.body.classList.remove("dark-mode");
      return out;
    });
    for (const bg of bgs) assert.equal(bg, "rgba(0, 0, 0, 0)", `framed box paints no rectangle under the frame at night (${bg})`);
  }

  // The pressed toggle rests on the same hard shadow as every other control.
  {
    const pressedShadow = await page.evaluate(() => getComputedStyle(document.querySelector('.fieldCastChoices button[aria-pressed="true"]')).boxShadow);
    assert.match(pressedShadow, /0px 2px 0px/, `pressed toggle uses the hard 2px shadow (${pressedShadow})`);
  }

  // On phones every menu item keeps one line and the same height.
  {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#filter").scrollIntoViewIfNeeded();
    const heights = await page.evaluate(() => [...document.querySelectorAll("#filter .btn")].map((b) => Math.round(b.getBoundingClientRect().height)));
    assert.equal(new Set(heights).size, 1, `menu items share one height at 390 (${heights})`);
    await page.setViewportSize({ width: 1440, height: 900 });
  }

  // An open selection card never covers the season control.
  for (const width of [1440, 1024, 900]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator(".fieldScene").scrollIntoViewIfNeeded();
    await page.locator('[data-persona="researcher"]').click();
    await page.waitForTimeout(200);
    const rects = await page.evaluate(() => [".fieldSelectionCard", ".fieldSeasonChoices"].map((s) => document.querySelector(s).getBoundingClientRect().toJSON()));
    const [c, z] = rects;
    assert.ok(!hit(c, z), `selection card covers the season control at ${width}`);
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
  assert.equal(type.h1, 0, `hero title tracking ${type.h1}: pixel glyphs stay untracked`);
  for (const r of type.titles) assert.equal(r, 0, `section title tracking ${r}: pixel glyphs stay untracked`);
  assert.ok(type.buttonSpacing <= 0, `hero button tracking ${type.buttonSpacing}`);
  assert.doesNotMatch(type.subtitleFont, /Inconsolata/, "subtitle uses the body face; mono is for data");
  assert.equal(type.findFont, type.navFont, "Find matches its nav siblings");

  // Three faces, fixed roles: Pixelify Sans for display, Lato for body, Inconsolata for data. Karla is retired.
  const faces = await page.evaluate(() => {
    const fam = (el) => getComputedStyle(el).fontFamily;
    const all = [...document.querySelectorAll("body *")].filter((el) => el.offsetParent || el === document.body);
    const pixel = all.filter((el) => /^"?Pixelify Sans/.test(fam(el)) && el.textContent.trim());
    return {
      karla: all.filter((el) => /Karla/i.test(fam(el))).map((el) => el.tagName + "." + el.className).slice(0, 5),
      h1: fam(document.querySelector("h1.heroTitle")),
      titles: [...document.querySelectorAll(".sectionTitle")].map(fam),
      body: [fam(document.body), fam(document.querySelector("a.nav-link")), fam(document.querySelector(".heroButton"))],
      pixelSizes: pixel.map((el) => [el.className, parseFloat(getComputedStyle(el).fontSize)]),
    };
  });
  assert.deepEqual(faces.karla, [], "no Karla on the homepage");
  assert.match(faces.h1, /^"?Pixelify Sans/, "wordmark is pixel type");
  for (const f of faces.titles) assert.match(f, /^"?Pixelify Sans/, "section titles are pixel type");
  for (const f of faces.body) assert.match(f, /^"?Lato/, "body, nav and buttons are Lato");
  for (const [cls, size] of faces.pixelSizes) assert.ok(size >= 16 && size % 8 === 0, `pixel type ${cls} at ${size}px`);

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
        frame: cs.borderImageSource,
        cardBg: cs.backgroundColor,
        imgBg: ics.backgroundColor,
        imgHeight: img.getBoundingClientRect().height,
      };
    });
    // Retro PR 2: the pixel frame (with its built-in hard shadow) replaces the soft shadow layers.
    assert.match(surface.frame, dark ? /pixel-frame-night/ : /pixel-frame-day/, `card is framed (dark=${dark})`);
    assert.equal(surface.shadow, "none", `framed card drops the soft shadow (dark=${dark})`);
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
