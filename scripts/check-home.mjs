import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
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
    const worst = await p.evaluate((sel) => {
      const els = [...document.querySelectorAll(sel)].filter((el) => el.getBoundingClientRect().height > 0);
      return els.length ? Math.min(...els.map((el) => __contrast(el))) : 0; // nothing matched: fail, never pass on an empty set
    }, selector);
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
  assert.equal(work.rows.filter((r) => r.links === 1).length, 3, "the three rows with a live public page link to it");
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

  // One heading system, and no chapters.
  for (const [width, size] of [[1440, "40px"], [390, "28px"]]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    const heads = await page.evaluate(() => ({
      chapters: document.querySelectorAll(".chapter").length,
      h2: [...document.querySelectorAll("h2:not(.fieldToolbarTitle)")].filter((el) => el.getBoundingClientRect().height > 0).map((el) => { const cs = getComputedStyle(el); return [el.textContent.trim().slice(0, 24), cs.fontFamily.split(",")[0].replace(/"/g, ""), cs.fontWeight, cs.fontSize, cs.textWrap ?? cs.textWrapStyle].join("|"); }),
      prose: [...document.querySelectorAll(".section p")].filter((el) => !/pretty/.test(getComputedStyle(el).textWrap ?? getComputedStyle(el).textWrapStyle)).length,
    }));
    assert.equal(heads.chapters, 0, "no chapters");
    assert.ok(heads.h2.length >= 5, "section headings found");
    for (const h of heads.h2) assert.match(h, new RegExp(`\\|Lato\\|700\\|${size}\\|balance$`), `heading "${h}" is Lato 700 ${size}, balanced`);
    assert.equal(heads.prose, 0, "section paragraphs wrap pretty");
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  // Short page: six nav links; Reading and Certifications are closed sections under Resume.
  const tail = await page.evaluate(() => ({
    nav: [...document.querySelectorAll("#navbarNav .nav-link")].map((el) => el.textContent.trim()),
    folded: ["reading", "certifications"].map((id) => { const el = document.getElementById(id); return [el?.tagName, el?.open, !!el?.closest("#resume"), !!el?.querySelector("summary")?.textContent.trim()]; }),
  }));
  assert.deepEqual(tail.nav, ["Projects", "Writing", "Research", "Find", "Resume", "Contact"], "six nav links");
  for (const f of tail.folded) assert.deepEqual(f, ["DETAILS", false, true, true], "folded section is a closed, titled <details> inside Resume");
  // Every link to a homepage anchor, from any tracked page or script, still has a target.
  const root = new URL("..", import.meta.url);
  const ids = new Set(await page.evaluate(() => [...document.querySelectorAll("[id]")].map((el) => el.id)));
  // research/ pages link to their own index.html, so they are skipped.
  for (const f of execFileSync("git", ["ls-files", "*.html"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter((f) => !f.startsWith("research/"))) {
    const src = fs.readFileSync(new URL(f, root), "utf8");
    const links = f === "index.html" ? /href="#([\w-]+)"/g : /href="(?:\.\.\/)?index\.html#([\w-]+)"/g;
    for (const [, id] of src.matchAll(links)) assert.ok(ids.has(id), `${f} links to homepage #${id}, which is missing`);
  }
  // Nav anchors land on their sections, below the fixed nav.
  for (const id of ["portfolio", "writing", "resume", "contact"]) {
    await page.locator(`a.nav-link[href="#${id}"]`).click();
    let last = -1;
    for (let i = 0; i < 40; i++) { // smooth scrolling: wait until the position stops moving
      await page.waitForTimeout(150);
      const y = await page.evaluate(() => scrollY);
      if (y === last) break;
      last = y;
    }
    const { top, atBottom } = await page.evaluate((i) => ({ top: document.getElementById(i).getBoundingClientRect().top, atBottom: Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 1 }), id);
    assert.ok((top >= -1 && top <= 120) || (atBottom && top < 900), `#${id} lands after its nav link (top ${Math.round(top)})`);
  }
  // A closed section reopens from an in-page link even when the hash has not changed.
  {
    const p = await open();
    await p.goto(`${base}/#reading`);
    await p.waitForTimeout(300);
    await p.evaluate(() => { document.getElementById("reading").open = false; });
    await p.locator('.fieldFallbackLinks a[href="#reading"]').evaluate((a) => a.click());
    await p.waitForTimeout(200);
    assert.equal(await p.evaluate(() => document.getElementById("reading").open), true, "an in-page link reopens #reading");
    await p.context().close();
  }
  // Night: the focus ring on a card link is visible against the card (3:1 or better).
  {
    const p = await open({}, true);
    const link = p.locator(".workCard a").first();
    await link.scrollIntoViewIfNeeded();
    await p.keyboard.press("Tab");
    await link.focus();
    const ratio = await link.evaluate((el) => {
      const cs = getComputedStyle(el);
      if (cs.outlineStyle === "none") return 0;
      const ring = __lum(__rgba(cs.outlineColor)), card = __lum(__rgba(getComputedStyle(el.closest(".workCard")).backgroundColor));
      return (Math.max(ring, card) + 0.05) / (Math.min(ring, card) + 0.05);
    });
    assert.ok(ratio >= 3, `card link focus ring contrast at night ${ratio.toFixed(2)}`);
    await p.context().close();
  }
  for (const id of ["reading", "certifications"]) {
    const p = await open();
    await p.goto(`${base}/#${id}`);
    await p.waitForTimeout(300);
    assert.equal(await p.evaluate((i) => document.getElementById(i).open, id), true, `a link to #${id} opens it`);
    await p.context().close();
  }

  // One surface: every card has the same hairline, radius and no shadow, in both themes, at rest and on hover.
  for (const night of [false, true]) {
    const p = await open({}, night);
    const surfaces = await p.evaluate(() => [".workCard", ".resumePriorityCard", ".testimonialCard", ".writingCard", ".contactPanel", ".resumeDetails"].map((sel) => {
      const el = document.querySelector(sel);
      const cs = getComputedStyle(el);
      return [sel, [cs.borderTopWidth, cs.borderTopColor, cs.borderTopLeftRadius, cs.boxShadow].join("|")];
    }));
    assert.equal(new Set(surfaces.map((x) => x[1])).size, 1, `cards share one surface (${night ? "night" : "day"}): ${JSON.stringify(surfaces)}`);
    assert.match(surfaces[0][1], /^1px\|.*\|16px\|none$/, "the surface is a 1px hairline, 16px radius, no shadow");
    for (const sel of [".writingCard", ".testimonialCard"]) {
      await p.locator(sel).first().scrollIntoViewIfNeeded();
      await p.locator(sel).first().hover();
      await p.waitForTimeout(400);
      assert.equal(await p.locator(sel).first().evaluate((el) => getComputedStyle(el).boxShadow), "none", `${sel} gains no shadow on hover`);
    }
    await p.context().close();
  }


  // The pixel face is an accent: the wordmark and the field title only.
  const pixel = await page.evaluate(() => [...document.querySelectorAll("body *")]
    .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && /^"?Pixelify Sans/.test(getComputedStyle(el).fontFamily) && !el.matches(".title-word, .fieldToolbarTitle, .fieldSelectionTitle"))
    .map((el) => `${el.tagName}.${el.className}`).slice(0, 8));
  assert.deepEqual(pixel, [], "Pixelify Sans only on the wordmark and inside the field");

  // Phone flows found by the 2026-11-19 UI flow tests.
  for (const [width, height] of [[390, 844], [320, 640]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await p.goto(base + "/");
    await p.waitForFunction(() => document.querySelector(".fieldScene")?.dataset.active !== undefined);
    // Tapping a field character shows its card on screen, and never jumps the page away.
    await p.locator('[data-cast-choice="ideas"]').tap();
    await p.locator('[data-persona="reader"]').tap();
    await p.waitForTimeout(700);
    const card = await p.evaluate(() => { const r = document.querySelector(".fieldSelectionCard").getBoundingClientRect(); return { hidden: document.querySelector(".fieldSelectionCard").hidden, top: r.top, bottom: r.bottom, readingOpen: document.getElementById("reading").open, hash: location.hash }; });
    assert.equal(card.hidden, false, `the Reader card opens at ${width}`);
    assert.ok(card.top >= 0 && card.bottom <= height, `the field card is fully on screen at ${width}x${height} (${Math.round(card.top)}-${Math.round(card.bottom)})`);
    assert.deepEqual([card.readingOpen, card.hash], [false, ""], `tapping a character does not jump to its destination at ${width}`);
    await p.locator(".fieldSelectionClose").tap();
    await p.evaluate(() => scrollTo(0, 0));
    // Tap targets are at least 44px tall, and no text is under 12px.
    await p.locator(".navbar-toggler").tap();
    await p.waitForTimeout(500);
    const small = await p.evaluate(() => {
      const tall = (sel) => [...document.querySelectorAll(sel)].filter((el) => el.getClientRects().length && el.getBoundingClientRect().height < 43.5).map((el) => `${sel} ${Math.round(el.getBoundingClientRect().height)}px`);
      return [...new Set([".navbar-nav .nav-link", ".workLink", ".workList a", ".fieldCastChoices button", ".fieldSeasonChoices button", ".heroTextLink"].flatMap(tall))];
    });
    assert.deepEqual(small, [], `tap targets are 44px tall at ${width}`);
    await p.locator(".navbar-toggler").tap();
    for (const id of ["reading", "certifications"]) await p.evaluate((i) => { document.getElementById(i).open = true; }, id);
    await p.evaluate(() => { document.querySelector("#resume details").open = true; });
    await p.waitForTimeout(300);
    const read = await p.evaluate(() => ({
      tiny: [...new Set([...document.querySelectorAll("body *")].filter((el) => !el.closest("svg, dialog, .findAskLauncher") && el.getClientRects().length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 12).map((el) => `${el.tagName.toLowerCase()}.${el.className} ${getComputedStyle(el).fontSize}`))].slice(0, 6),
      narrow: Math.min(...[...document.querySelectorAll("#resume details li, #resume details p")].filter((el) => el.getClientRects().length && el.textContent.trim().length > 40).map((el) => el.getBoundingClientRect().width)),
      cover: (() => { const c = document.querySelector(".bookStage img, .bookCoverFrame img")?.getBoundingClientRect(); const box = document.querySelector(".bookCarousel")?.getBoundingClientRect(); return c && box ? [c.left >= box.left - 1, c.right <= box.right + 1] : [true, true]; })(),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    assert.deepEqual(read.tiny, [], `no text under 12px at ${width}`);
    assert.ok(read.narrow >= width * 0.6, `resume text column is ${Math.round(read.narrow)}px of ${width}`);
    assert.deepEqual(read.cover, [true, true], `the book cover stays inside its carousel at ${width}`);
    assert.equal(read.overflow, false, `no sideways scroll with every section open at ${width}`);
    await ctx.close();
  }

  // Robustness findings from the 2026-11-19 flow tests.
  {
    const p = await open();
    await p.keyboard.press("Tab");
    assert.match(await p.evaluate(() => document.activeElement.textContent.trim()), /^Skip to content$/, "the first Tab stop is a skip link");
    await p.locator('[data-persona="ai-engineer"]').focus();
    await p.keyboard.press("Space");
    await p.waitForTimeout(200);
    assert.equal(await p.evaluate(() => document.querySelector(".fieldSelectionCard").hidden), false, "Space opens a field character's card");
    await p.keyboard.press("Escape");
    await p.waitForSelector(".findAskLauncher");
    await p.locator(".findAskLauncher").focus();
    await p.keyboard.press("Shift+Tab"); await p.keyboard.press("Tab"); // make the focus keyboard-driven
    const ring = await p.evaluate(() => { const cs = getComputedStyle(document.querySelector(".findAskLauncher")); const [a, b] = [__lum(__rgba(cs.outlineColor)), __lum([246, 244, 238])].sort((x, y) => y - x); return cs.outlineStyle === "none" ? 0 : (a + 0.05) / (b + 0.05); });
    assert.ok(ring >= 3, `the Ask launcher's focus ring is visible by day (${ring.toFixed(2)})`);
    await p.context().close();
    const night = await open({}, true);
    await night.evaluate(() => { document.querySelector("#resume details").open = true; });
    const low = await night.evaluate(() => [".writingLink", ".accent-success"].map((sel) => [sel, Math.min(...[...document.querySelectorAll(sel)].filter((el) => el.getClientRects().length).map((el) => __contrast(el)))]));
    for (const [sel, c] of low) assert.ok(c >= 4.5, `${sel} contrast at night ${c.toFixed(2)}`);
    await night.context().close();
    const off = await open({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const nav = await off.evaluate(() => ({ links: [...document.querySelectorAll("#navbarNav a.nav-link")].filter((el) => el.getBoundingClientRect().height > 0).length, dead: [".navbar-toggler", ".navFindButton", "#darkModeToggle"].filter((s) => document.querySelector(s)?.getBoundingClientRect().height > 0) }));
    assert.ok(nav.links >= 5, `nav links are reachable without JS on a phone (${nav.links})`);
    assert.deepEqual(nav.dead, [], "controls that need JS are hidden without it");
    await off.context().close();
  }

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
