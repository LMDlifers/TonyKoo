import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

// Inner pages (docs/superpowers/specs/2026-11-19-inner-pages-design.md): reports, research, log and colophon
// share the homepage's system: one header, one reading column, Lato, one surface.
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    "/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const base = process.env.SITE_BASE_URL || "http://localhost:8000";
const root = new URL("..", import.meta.url);
const PAGES = execFileSync("git", ["ls-files", "reports/*.html", "research/*.html", "log.html", "colophon.html"], { cwd: root, encoding: "utf8" }).trim().split("\n");
const REPORTS = PAGES.filter((p) => p.startsWith("reports/"));
const ESSAYS = PAGES.filter((p) => p.startsWith("research/") && !p.endsWith("index.html"));
assert.ok(REPORTS.length === 8 && ESSAYS.length >= 14, "found the reports and essays");

const HELPERS = `
window.__rgba = (c) => { const x = document.createElement("canvas").getContext("2d"); x.clearRect(0,0,1,1); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data]; };
window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
window.__bg = (el) => { for (let e = el; e; e = e.parentElement) { const c = __rgba(getComputedStyle(e).backgroundColor); if (c[3] > 250) return c; } return document.body.classList.contains("dark-mode") ? [18, 21, 25, 255] : [246, 244, 238, 255]; };
window.__contrast = (el) => { const [a, b] = [__lum(__rgba(getComputedStyle(el).color)), __lum(__bg(el))].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05); };
// Elements that carry their own visible text, outside embedded diagrams, the chat launcher and hidden boxes.
window.__texts = () => [...document.querySelectorAll("body *")].filter((el) => !el.closest("svg, .findAskLauncher, dialog, script, style, noscript") && el.getClientRects().length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
// Width of an element in units of its own "0" glyph.
window.__ch = (el) => { const s = document.createElement("span"); s.textContent = "0".repeat(20); s.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap"; el.append(s); const ch = s.getBoundingClientRect().width / 20; s.remove(); return el.getBoundingClientRect().width / ch; };
window.__surface = (el) => { const cs = getComputedStyle(el); return [cs.borderTopWidth, cs.borderTopLeftRadius, cs.boxShadow].join("|"); };
`;
const SURFACE = "1px|16px|none";
const name = (el) => `${el.tagName.toLowerCase()}.${el.className}`;

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const open = async (path, { night = false, width = 1440 } = {}) => {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(HELPERS);
  if (night) await ctx.addInitScript(() => localStorage.setItem("darkMode", "enabled"));
  const page = await ctx.newPage();
  await page.goto(`${base}/${path}`);
  return page;
};
try {
  for (const path of PAGES) {
    for (const night of [false, true]) {
      const page = await open(path, { night });
      const label = `${path} (${night ? "night" : "day"})`;
      const r = await page.evaluate(() => {
        const texts = __texts();
        const tag = (el) => `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 50);
        const prose = [...document.querySelectorAll("main p")].filter((el) => el.getClientRects().length && el.textContent.trim().length > 60);
        return {
          dark: document.body.classList.contains("dark-mode"),
          fonts: [...new Set(texts.filter((el) => !/^"?(Lato|Inconsolata)/.test(getComputedStyle(el).fontFamily)).map((el) => `${tag(el)} ${getComputedStyle(el).fontFamily.slice(0, 30)}`))].slice(0, 5),
          upper: [...new Set(texts.filter((el) => getComputedStyle(el).textTransform === "uppercase").map(tag))].slice(0, 5),
          tracked: [...new Set(texts.filter((el) => !["normal", "0px"].includes(getComputedStyle(el).letterSpacing)).map(tag))].slice(0, 5),
          prose: prose.length,
          contrast: prose.length ? Math.min(...prose.map((el) => __contrast(el))) : 0,
          // One header: brand first, a theme toggle, no report pills.
          headers: document.querySelectorAll(".researchNav").length,
          brand: document.querySelector(".researchNav a")?.textContent.trim() ?? "",
          toggle: document.querySelectorAll(".researchNav [data-theme-toggle]").length,
          pills: document.querySelectorAll(".reportNav, .reportThemeButton").length,
          // One surface: anything with a border on all sides or a shadow uses it; rules and dividers have no radius.
          surfaces: [...new Set([...document.querySelectorAll("main *, footer *")].filter((el) => {
            if (el.closest("svg, dialog, .findAskLauncher") || !el.getClientRects().length) return false;
            const cs = getComputedStyle(el);
            const boxed = parseFloat(cs.borderTopWidth) > 0 && parseFloat(cs.borderLeftWidth) > 0 && parseFloat(cs.borderRightWidth) > 0 && parseFloat(cs.borderBottomWidth) > 0;
            const round = cs.borderTopLeftRadius === "50%" || parseFloat(cs.borderTopLeftRadius) >= 999 ? false : true;
            const r = el.getBoundingClientRect();
            return round && r.width >= 160 && r.height >= 56 && (boxed || cs.boxShadow !== "none") && !["INPUT", "BUTTON", "A", "IMG", "VIDEO"].includes(el.tagName);
          }).filter((el) => __surface(el) !== "1px|16px|none").map((el) => `${tag(el)} ${__surface(el).slice(0, 60)}`))].slice(0, 6),
        };
      });
      assert.equal(r.dark, night, `${label}: theme applied`);
      assert.deepEqual(r.fonts, [], `${label}: only Lato and Inconsolata`);
      assert.deepEqual(r.upper, [], `${label}: no uppercase labels`);
      assert.deepEqual(r.tracked, [], `${label}: no tracked text`);
      assert.ok(r.prose > 0 && r.contrast >= 4.5, `${label}: body text contrast ${r.contrast.toFixed(2)} over ${r.prose} paragraphs`);
      assert.deepEqual([r.headers, r.brand.replace(/\s+/g, " ").startsWith("Tony Koo"), r.toggle, r.pills], [1, true, 1, 0], `${label}: one site header with the brand and a theme toggle`);
      assert.deepEqual(r.surfaces, [], `${label}: every boxed element uses the one surface`);
      await page.context().close();
    }
    // No sideways scroll, and nothing wider than the screen, at any width.
    const page = await open(path);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(120);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `${path}: no sideways scroll at ${width}`);
    }
    await page.context().close();
  }

  // Reports and essays: one reading column, one type scale.
  for (const path of [...REPORTS, ...ESSAYS]) {
    const report = path.startsWith("reports/");
    const page = await open(path);
    const r = await page.evaluate((isReport) => {
      const prose = [...document.querySelectorAll(isReport ? ".reportSection > p, .reportSection > ul > li, .reportSection > ol > li" : ".articleBody > section > p")].filter((el) => el.getClientRects().length);
      const cs = (el) => getComputedStyle(el);
      return {
        count: prose.length,
        widest: Math.max(...prose.map((el) => __ch(el))),
        body: prose.slice(0, 1).map((el) => [cs(el).fontSize, (parseFloat(cs(el).lineHeight) / parseFloat(cs(el).fontSize)).toFixed(2)].join("/"))[0],
        h1: [cs(document.querySelector("main h1")).fontSize, cs(document.querySelector("main h1")).fontWeight].join("/"),
        h2: [...new Set([...document.querySelectorAll(isReport ? ".reportSection > h2" : ".articleBody > section > h2")].map((el) => [cs(el).fontSize, cs(el).fontWeight].join("/")))],
        boxes: [".reportSection", ".reportHero", ".reportTldr"].flatMap((s) => [...document.querySelectorAll(s)]).filter((el) => parseFloat(cs(el).borderTopWidth) > 0 || cs(el).boxShadow !== "none" || __rgba(cs(el).backgroundColor)[3] > 0).length,
      };
    }, report);
    assert.ok(r.count > 0, `${path}: prose found`);
    assert.ok(r.widest <= 69, `${path}: prose is ${r.widest.toFixed(0)}ch wide; limit 68`);
    const [size, lh] = r.body.split("/");
    assert.ok(size === "18px" && lh >= 1.6 && lh <= 1.7, `${path}: body is Lato 18px at 1.6-1.7 (${r.body})`);
    assert.equal(r.h1, "40px/700", `${path}: title is 40px bold`);
    assert.deepEqual(r.h2, ["28px/700"], `${path}: section headings are 28px bold`);
    if (report) assert.equal(r.boxes, 0, `${path}: sections are not boxed`);
    // Phones: wide content scrolls inside its own box.
    await page.setViewportSize({ width: 320, height: 640 });
    await page.waitForTimeout(150);
    const wide = await page.evaluate(() => [...document.querySelectorAll("main *")].filter((el) => !el.closest("table, pre, svg, .tableScroll") && el.getClientRects().length && el.getBoundingClientRect().right > innerWidth + 1).map((el) => `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 40)).slice(0, 4));
    assert.deepEqual(wide, [], `${path}: nothing runs past a 320px screen`);
    const small = await page.evaluate(() => [getComputedStyle(document.querySelector("main h1")).fontSize, getComputedStyle(document.querySelector("main h2")).fontSize]);
    assert.deepEqual(small, ["28px", "22px"], `${path}: phone title and heading sizes`);
    await page.context().close();
  }

  // One report in depth: the toggle works and persists; in-page links land below the sticky header.
  {
    const page = await open("reports/faiss-caching-llm-cost-latency.html");
    await page.locator(".researchNav [data-theme-toggle]").click();
    assert.equal(await page.evaluate(() => document.body.classList.contains("dark-mode")), true, "report toggle switches to night");
    await page.reload();
    assert.equal(await page.evaluate(() => document.body.classList.contains("dark-mode")), true, "report theme survives a reload");
    await page.locator('a[href="#demo-video"]').first().click();
    let last = -1;
    for (let i = 0; i < 40; i++) { await page.waitForTimeout(150); const y = await page.evaluate(() => scrollY); if (y === last) break; last = y; }
    const top = await page.evaluate(() => document.getElementById("demo-video").getBoundingClientRect().top);
    assert.ok(top >= 40 && top <= 140, `#demo-video lands below the header (top ${Math.round(top)})`);
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".researchNavLinks a")].map((a) => a.textContent.trim())), ["Projects", "Writing", "Research"], "report header links");
    await page.context().close();
  }
} finally {
  await browser.close();
}

console.log(`Page checks passed for ${PAGES.length} inner pages.`);
