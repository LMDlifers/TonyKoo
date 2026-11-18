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

  // No sideways scroll.
  for (const width of [320, 390, 768, 899, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `no sideways scroll at ${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  // Hero: one claim, then the proof numbers on the first screen.
  const hero = await page.evaluate(() => ({
    line: document.querySelector(".title-line")?.textContent ?? "",
    gone: [".heroSubtitle", ".heroPositioning", ".proofSection"].filter((s) => document.querySelector(s)),
    inHero: !!document.querySelector("#heroSection #proof"),
    items: document.querySelectorAll("#proof .proofItem").length,
    complete: [...document.querySelectorAll("#proof .proofItem")].every((li) => li.querySelector(".proofValue") && li.querySelector(".proofLabel")),
    nums: getComputedStyle(document.querySelector("#proof .proofValue") ?? document.body).fontVariantNumeric,
    values: [...document.querySelectorAll("#proof .proofValue")].map((el) => el.textContent.trim()),
    body: document.body.textContent,
  }));
  assert.deepEqual(hero.values, ["0.86s", "~90%", "RAG"], "proof values");
  assert.equal(squash(hero.line), "I build AI and quant systems whose results you can check.", "hero claim");
  assert.deepEqual(hero.gone, [], "old hero copy and the proof section are gone");
  assert.ok(hero.inHero && hero.items === 3 && hero.complete, "three proof items sit in the hero");
  assert.match(hero.nums, /tabular-nums/, "proof numbers use tabular figures");
  for (const text of ["6.09 seconds", "Approximate field-level accuracy on a project-scoped sanitized evaluation sample; not a production benchmark."]) {
    assert.equal(squash(hero.body).split(text).length - 1, 1, `"${text}" appears once`);
  }
  for (const [width, height, max] of [[1440, 900, 900], [390, 844, 1700]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(200);
    const bottom = await page.evaluate(() => document.querySelector("#proof .proofValue").getBoundingClientRect().bottom + scrollY);
    assert.ok(bottom <= max, `first proof number ends at ${Math.round(bottom)}px at ${width}; limit ${max}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const contrast = async (selector, night) => {
    const p = await open({}, night);
    const worst = await p.evaluate((sel) => Math.min(...[...document.querySelectorAll(sel)].filter((el) => el.getBoundingClientRect().height > 0).map((el) => __contrast(el))), selector);
    await p.context().close();
    return worst;
  };
  for (const night of [false, true]) {
    const c = await contrast("#proof .proofValue, #proof .proofLabel, #proof .proofNote", night);
    assert.ok(c >= 4.5, `proof text contrast ${c.toFixed(2)} (${night ? "night" : "day"})`);
  }

  // Work: four featured cards that lead with an outcome, then the rest as a plain list.
  const FEATURED = ["Agentic Healthcare Analytics Chatbot", "Self-RL & RAG Extraction Pipelines", "Fixed Income Analytics: Yield Curve Modeling", "Judicial Analytics: Legal NLP"];
  const OTHERS = ["IBKR Mean-Reversion Trading Prototype", "RentLock: Smart Contract Escrow dApp", "Smoodee: Sustainable Food Tech Startup", "Loan Default Analytics Pipeline", "FairTracker: Event Management & Analytics Platform", "WelfareHome: Social Impact Web Platform", "Black-Scholes Options Analytics Dashboard"];
  const readWork = (p) => p.evaluate(async () => {
    // Lazy images only load near the viewport: load them eagerly, with a time limit so nothing can hang.
    await Promise.all([...document.querySelectorAll(".workCard img")].map((img) => { img.loading = "eager"; return Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 3000))]); }));
    return {
      cards: [...document.querySelectorAll(".workGrid .workCard")].map((c) => ({
        title: c.querySelector(".workTitle")?.textContent.trim(),
        img: [...c.querySelectorAll("img")].map((i) => [i.getAttribute("alt"), i.naturalWidth, i.naturalHeight]),
        parts: [".workOutcome", ".workContext", ".workStack"].map((s) => c.querySelectorAll(s).length),
        links: c.querySelectorAll("a").length,
        h: c.getBoundingClientRect().height,
        overflow: [...c.querySelectorAll("*")].some((el) => el.getBoundingClientRect().right > c.getBoundingClientRect().right + 0.5),
        style: [getComputedStyle(c).borderRadius, getComputedStyle(c).borderColor, getComputedStyle(c).boxShadow].join("|"),
      })),
      rows: [...document.querySelectorAll(".workList > li")].map((li) => ({ title: li.querySelector(".workListTitle")?.textContent.trim(), links: li.querySelectorAll("a").length, h: li.getBoundingClientRect().height, img: li.querySelectorAll("img").length })),
      old: [".projectDeck", "#filter", ".filterItem", "#portfolio .pixelFrame", ".evidenceLabel"].filter((s) => document.querySelector(s)),
      body: document.body.textContent,
    };
  });
  const work = await readWork(page);
  assert.deepEqual(work.cards.map((c) => c.title), FEATURED, "four featured cards, in order");
  for (const c of work.cards) {
    assert.deepEqual(c.img, [["", 800, 500]], `${c.title}: one decorative 800x500 image`);
    assert.deepEqual(c.parts, [1, 1, 1], `${c.title}: outcome, context and stack`);
    assert.equal(c.links, 1, `${c.title}: one link`);
  }
  assert.equal(new Set(work.cards.map((c) => c.style)).size, 1, "every card shares one radius, border and shadow");
  assert.deepEqual(work.rows.map((r) => r.title), OTHERS, "the other seven projects are a list");
  assert.ok(work.rows.every((r) => r.links <= 1 && r.img === 0), "list rows are text with at most one link");
  assert.equal(work.rows.filter((r) => r.links === 1).length, 4, "the four rows with a public page link to it");
  assert.deepEqual(work.old, [], "deck, filters, pixel card frames and evidence labels are gone");
  for (const label of ["Does not claim", "Full label", "Report added"]) assert.ok(!work.body.includes(label), `"${label}" is off the homepage`);
  {
    const p = await open({ javaScriptEnabled: false });
    const off = await readWork(p);
    assert.ok(off.cards.length === 4 && off.cards.every((c) => c.h > 0) && off.rows.length === 7 && off.rows.every((r) => r.h > 0), "cards and list show without JS");
    await p.context().close();
  }
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(200);
  assert.ok((await readWork(page)).cards.every((c) => !c.overflow), "card content stays inside the card at 320px");
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const night of [false, true]) {
    const c = await contrast(".workCard .workTitle, .workCard .workOutcome, .workCard .workContext, .workCard .workStack li, .workCard a, .workList li, .workList a", night);
    assert.ok(c >= 4.5, `work text contrast ${c.toFixed(2)} (${night ? "night" : "day"})`);
  }

  /* TASKS */

  // The pixel face is an accent: the wordmark and the field title only.
  const pixel = await page.evaluate(() => [...document.querySelectorAll("body *")]
    .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && /^"?Pixelify Sans/.test(getComputedStyle(el).fontFamily) && !el.matches(".title-word, .fieldToolbarTitle, .fieldSelectionTitle"))
    .map((el) => `${el.tagName}.${el.className}`).slice(0, 8));
  assert.deepEqual(pixel, [], "Pixelify Sans only on the wordmark and inside the field");

  // Budgets: a short page.
  for (const [width, height, max] of [[1440, 900, 9000], [390, 844, 13000]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(200);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    assert.ok(total <= max, `page is ${total}px tall at ${width}; budget ${max}`);
  }
  await page.context().close();
} finally {
  await browser.close();
}

console.log("Home checks passed.");
