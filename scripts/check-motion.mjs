import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";

// Motion (docs/superpowers/specs/2026-11-19-motion-design.md): each item exists with its timing when motion
// is allowed, and nothing but the reading-progress bar runs when the visitor asks for reduced motion.
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    "/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const base = process.env.SITE_BASE_URL || "http://localhost:8000";
const root = new URL("..", import.meta.url);
const REPORT = "reports/agentic-healthcare-analytics.html";
const ESSAY = "research/when-agents-need-search.html";

// Static rules.
const pages = execFileSync("git", ["ls-files", "*.html"], { cwd: root, encoding: "utf8" }).trim().split("\n");
for (const f of pages) {
  const html = fs.readFileSync(new URL(f, root), "utf8");
  const sheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]).filter((h) => !h.startsWith("http"));
  assert.match(sheets.at(-1) ?? "", /css\/motion\.css$/, `${f}: motion.css is the last local stylesheet`);
  assert.match(html, /js\/motion\.js" defer/, `${f}: loads motion.js`);
}
const cssDir = new URL("css/", root);
for (const f of fs.readdirSync(cssDir).filter((f) => f.endsWith(".css") && !["all.min.css", "superslides.css"].includes(f))) {
  assert.doesNotMatch(fs.readFileSync(new URL(f, cssDir), "utf8"), /transition:\s*all\b/, `${f}: no transition: all`);
}
// Every keyframe animation and moving transition in motion.css sits behind the reduced-motion gate,
// except the scroll-linked progress bar and the navigation hairline (which has its own reduced rule).
{
  const src = fs.readFileSync(new URL("motion.css", cssDir), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const stack = [];
  let start = 0;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === "{") { stack.push(src.slice(start, i).trim()); start = i + 1; }
    else if (src[i] === ";") start = i + 1;
    else if (src[i] === "}") {
      const head = stack.pop() ?? "";
      const body = src.slice(src.lastIndexOf("{", i) + 1, i);
      const moving = /\banimation:|transition:[^;]*(scale|translate|block-size|text-underline-offset)/.test(body);
      const exempt = /read-progress|nav-hairline|animation:\s*none/.test(body);
      const gated = stack.some((h) => /prefers-reduced-motion:\s*no-preference/.test(h));
      if (!head.startsWith("@") && moving && !exempt) assert.ok(gated, `motion.css: "${head.slice(0, 60)}" moves outside the reduced-motion gate`);
      start = i + 1;
    }
  }
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const open = async (path, { motion = true, width = 1440, height = 900, touch = false, js = true } = {}) => {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: motion ? "no-preference" : "reduce", hasTouch: touch, isMobile: touch, javaScriptEnabled: js });
  if (js) await ctx.addInitScript(() => {
    addEventListener("pagereveal", (e) => { window.__vt = !!e.viewTransition; });
    // The launcher is added by a script: record its entrance the moment it appears.
    new MutationObserver((_, obs) => {
      const el = document.querySelector(".findAskLauncher");
      if (!el) return;
      obs.disconnect();
      requestAnimationFrame(() => { const t = el.getAnimations().find((x) => x.animationName === "launcher-in")?.effect.getTiming(); window.__launcher = t ? [t.duration, t.delay, t.iterations] : null; });
    }).observe(document, { childList: true, subtree: true });
    // Entrances finish before the load event, so record them as the page first renders.
    addEventListener("DOMContentLoaded", () => requestAnimationFrame(() => {
      window.__caret = document.querySelector(".claimCaret")?.getAnimations().map((a) => a.effect.getTiming().iterations) ?? [];
      window.__entrance = document.getAnimations().filter((a) => a.animationName === "rise").map((a) => {
        const t = a.effect.getTiming();
        return { el: a.effect.target, duration: t.duration, delay: t.delay, props: [...new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k)).filter((k) => !["offset", "easing", "composite", "computedOffset"].includes(k)))].sort().join(",") };
      });
    }));
  });
  const page = await ctx.newPage();
  await page.goto(`${base}/${path}`);
  return page;
};
// Animations on elements matching a selector: name, duration, delay, easing, iterations, pseudo-element.
const anims = (page, selector) => page.evaluate((sel) => document.getAnimations().filter((a) => a.effect?.target?.matches?.(sel)).map((a) => {
  const t = a.effect.getTiming();
  return { name: a.animationName ?? a.transitionProperty ?? "", duration: t.duration, delay: t.delay, easing: t.easing, iterations: t.iterations, pseudo: a.effect.pseudoElement ?? "", timeline: a.timeline?.constructor?.name ?? "" };
}), selector);
const settle = (page) => page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect.getTiming().iterations !== Infinity && a.timeline?.constructor?.name === "DocumentTimeline").map((a) => a.finished.catch(() => {}))));
const near = (a, b, tol = 0.03) => Math.abs(a - b) <= tol;

try {
  // ---- Reduced motion: nothing runs but the progress bar, and everything is in place.
  for (const path of ["", REPORT, ESSAY]) {
    const page = await open(path, { motion: false });
    await page.waitForTimeout(300);
    const running = await page.evaluate(() => document.getAnimations().map((a) => `${a.animationName ?? a.transitionProperty}@${a.effect?.target?.tagName}.${a.effect?.target?.className}${a.effect?.pseudoElement ?? ""}`).filter((n) => !n.startsWith("read-progress")));
    assert.deepEqual(running, [], `/${path}: only the progress bar animates under reduced motion`);
    await page.evaluate(() => scrollTo(0, 200));
    await page.waitForTimeout(100);
    const still = await page.evaluate(() => ({
      wm: [...document.querySelectorAll(".wmRest")].map((el) => Math.round(el.getBoundingClientRect().width)),
      hidden: [".title-word", ".title-line", ".proofItem", "main h1", ".findAskLauncher"].flatMap((s) => [...document.querySelectorAll(s)]).filter((el) => getComputedStyle(el).opacity !== "1").length,
    }));
    assert.ok(still.wm.length >= 2 && still.wm.every((w) => w > 10), `/${path}: the wordmark stays whole under reduced motion (${still.wm})`);
    assert.equal(still.hidden, 0, `/${path}: nothing is left faded under reduced motion`);
    await page.context().close();
  }
  {
    const page = await open("", { motion: false });
    const link = page.locator(".workCard .workLink").first();
    await link.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL("**/agentic-healthcare-analytics.html"), link.click()]);
    await page.waitForFunction(() => window.__vt !== undefined);
    assert.equal(await page.evaluate(() => window.__vt), false, "a link click runs no view transition under reduced motion");
    await page.context().close();
  }
  // JS off: the entrance never hides content.
  {
    const page = await open("", { js: false });
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => [".title-word", ".title-line", ".proofItem"].flatMap((s) => [...document.querySelectorAll(s)]).filter((el) => getComputedStyle(el).opacity !== "1").length), 0, "the hero is fully visible without JS once its entrance ends");
    await page.context().close();
  }

  // ---- S1 wordmark, S4 progress, R7 header edge.
  for (const [path, navSel, pseudo] of [["", "#navigation", "::before"], [REPORT, ".researchNav", "::after"], [ESSAY, ".researchNav", "::after"], ["log.html", ".researchNav", "::after"]]) {
    const page = await open(path);
    await settle(page);
    const read = () => page.evaluate(([sel, ps]) => ({
      wm: [...document.querySelectorAll(".wmRest")].map((el) => el.getBoundingClientRect().width),
      bar: getComputedStyle(document.querySelector(sel), ps).scale,
      navH: document.querySelector(sel).getBoundingClientRect().height,
      brand: document.querySelector(".navbar-brand, .researchBrand").textContent.replace(/\s+/g, " ").trim(),
      name: document.querySelector(".navbar-brand, .researchBrand").getAttribute("aria-label") ?? document.querySelector(".navbar-brand, .researchBrand").textContent.replace(/\s+/g, " ").trim(),
    }), [navSel, pseudo]);
    const top = await read();
    assert.match(top.brand, /^Tony Koo/, `/${path}: the brand still reads "Tony Koo"`);
    assert.match(top.name, /^Tony Koo/, `/${path}: the brand's accessible name starts with the name`);
    assert.ok(await page.getByRole("link", { name: /^Tony Koo( |$)/ }).count() >= 1, `/${path}: assistive technology reads the brand as "Tony Koo"`);
    const linkX = () => page.evaluate(() => Math.round(document.querySelector("#navbarNav .nav-link, .researchNavLinks a").getBoundingClientRect().left));
    const restX = await linkX();
    assert.ok(top.wm.every((w) => w > 10), `/${path}: wordmark is whole at the top (${top.wm.map(Math.round)})`);
    assert.ok(near(parseFloat(top.bar), 0), `/${path}: progress bar is empty at the top (${top.bar})`);
    await page.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
    await page.waitForTimeout(150);
    const down = await read();
    assert.ok(down.wm.every((w) => w < 1), `/${path}: wordmark collapses by 200px (${down.wm.map((w) => w.toFixed(1))})`);
    assert.equal(down.navH, top.navH, `/${path}: the header keeps its height`);
    assert.equal(await linkX(), restX, `/${path}: header links do not move as the wordmark collapses`);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    if (max > 800) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), max / 2);
      await page.waitForTimeout(150);
      assert.ok(near(parseFloat((await read()).bar), 0.5), `/${path}: progress bar is half full at half scroll`);
    }
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(150);
    assert.ok((await read()).wm.every((w) => w > 10), `/${path}: wordmark returns at the top`);
    await page.context().close();
  }

  // ---- E1–E4 entrances.
  {
    const page = await open("");
    const hero = await page.evaluate(() => [".title-word", ".title-line", ".heroActions", ".proofItem:nth-child(1)", ".proofItem:nth-child(2)", ".proofItem:nth-child(3)"].map((sel) => {
      const a = window.__entrance.find((x) => x.el === document.querySelector(`.fieldIntro ${sel}`));
      return a ? [a.duration, a.delay, a.props] : null;
    }));
    assert.deepEqual(hero.map((h) => h?.[0]), [500, 500, 500, 500, 500, 500], "hero steps last 500ms");
    assert.deepEqual(hero.map((h) => h?.[1]), [0, 80, 160, 240, 320, 400], "hero steps are 80ms apart");
    assert.ok(hero.every((h) => h[2] === "opacity,translate"), `hero steps animate opacity and translate only (${hero[0][2]})`);
    const caret = await page.evaluate(() => window.__caret);
    assert.deepEqual(caret, [1], `the caret plays once (${caret})`);
    await page.waitForFunction(() => window.__launcher !== undefined);
    const launcher = await page.evaluate(() => window.__launcher);
    assert.deepEqual(launcher, [400, 600, 1], "the launcher arrives once, 600ms after it is added");
    await settle(page);
    const end = await page.evaluate(() => ({ faded: [".title-word", ".title-line", ".heroActions", ".proofItem", ".findAskLauncher"].flatMap((s) => [...document.querySelectorAll(s)]).filter((el) => getComputedStyle(el).opacity !== "1" || !["none", "0px", "0px 0px"].includes(getComputedStyle(el).translate)).length, caret: getComputedStyle(document.querySelector(".claimCaret")).opacity, infinite: document.getAnimations().filter((a) => a.effect.getTiming().iterations === Infinity && !/^field/.test(a.animationName ?? "")).map((a) => a.animationName) }));
    assert.equal(end.faded, 0, "after the entrance everything is in place");
    assert.equal(end.caret, "0", "the caret is gone when it finishes");
    assert.deepEqual(end.infinite, [], "nothing loops on an idle homepage, apart from the field's own walking characters");
    await page.context().close();
    for (const path of [REPORT, ESSAY]) {
      const p = await open(path);
      const steps = await p.evaluate(() => [...document.querySelector(".articleHero, .reportHeroCopy").children].slice(0, 3).map((el) => { const a = window.__entrance.find((x) => x.el === el); return a ? [a.duration, a.delay] : null; }));
      // A featured report's title is the handover target, so it does not also fade in.
      assert.deepEqual(steps, path === REPORT ? [[400, 0], null, [400, 120]] : [[400, 0], [400, 60], [400, 120]], `/${path}: title block rises in 400ms steps`);
      await settle(p);
      assert.deepEqual(await p.evaluate(() => document.getAnimations().filter((a) => a.effect.getTiming().iterations === Infinity).map((a) => a.animationName)), [], `/${path}: nothing loops on an idle page`);
      await p.context().close();
    }
  }

  // ---- S3 navigation hairline and S5 page handover.
  {
    const page = await open("");
    await settle(page);
    assert.equal(await page.evaluate(() => new Set([...document.querySelectorAll("*")].map((el) => getComputedStyle(el).viewTransitionName).filter((n) => n && n !== "none")).size === [...document.querySelectorAll("*")].map((el) => getComputedStyle(el).viewTransitionName).filter((n) => n && n !== "none").length), true, "view-transition names are unique on the homepage");
    await page.locator('a.nav-link[href="#writing"]').click();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("is-leaving")), false, "a hash link does not start the navigation hairline");
    const hairline = await page.evaluate(() => { document.documentElement.classList.add("is-leaving"); const a = document.getAnimations().find((x) => x.animationName === "nav-hairline"); const t = a?.effect.getTiming(); document.documentElement.classList.remove("is-leaving"); return t ? [t.duration, t.delay, t.iterations] : null; });
    assert.deepEqual(hairline, [1100, 200, 8], "the hairline waits 200ms and runs at most 8 times");
    {
      const nav = await open(REPORT);
      await settle(nav);
      await nav.route("**/index.html", async (route) => { await new Promise((r) => setTimeout(r, 700)); await route.continue(); });
      const leaving = nav.waitForFunction(() => document.documentElement.classList.contains("is-leaving"), null, { timeout: 5000 }).then(() => true, () => false);
      await nav.locator(".researchNavLinks a").first().click({ noWaitAfter: true });
      assert.equal(await leaving, true, "clicking a same-site link marks the page as leaving");
      await nav.waitForURL("**/index.html**");
      await nav.context().close();
    }
    for (const [slug, file] of [["healthcare", "agentic-healthcare-analytics"], ["extraction", "faiss-caching-llm-cost-latency"], ["yield-curve", "yield-curve-quant-engineering-notes"], ["judicial", "judicial-analytics-legal-nlp"]]) {
      // The browser may skip a transition when it cannot produce a frame in time (a loaded test machine),
      // which is the designed fallback: a plain navigation. So a skipped handover gets one more try.
      let ran = false;
      for (let attempt = 0; attempt < 2 && !ran; attempt++) {
        await page.goto(`${base}/`);
        await settle(page);
        await page.waitForTimeout(900); // let any smooth scroll from the previous step finish
        const link = page.locator(`.workCard:has([style*="wk-${slug}"]) .workLink`);
        await link.scrollIntoViewIfNeeded();
        await Promise.all([page.waitForURL(`**/${file}.html`), link.click()]);
        await page.waitForFunction(() => window.__vt !== undefined);
        ran = await page.evaluate(() => window.__vt);
      }
      assert.equal(ran, true, `${slug}: the card hands over to its report with a view transition`);
      assert.equal(await page.evaluate((s) => getComputedStyle(document.querySelector("main h1")).viewTransitionName, slug), `wk-${slug}`, `${slug}: the report title carries the card's name`);
      assert.equal(await page.evaluate(() => { const n = [...document.querySelectorAll("*")].map((el) => getComputedStyle(el).viewTransitionName).filter((x) => x && x !== "none"); return new Set(n).size === n.length; }), true, `${slug}: names are unique on the report`);
    }
    await page.goBack();
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("is-leaving")), false, "the hairline is cleared after going Back");
    await page.context().close();
  }

  // ---- R1–R10 responses.
  {
    const page = await open("");
    await settle(page);
    const css = (sel, prop, pseudo) => page.evaluate(([s, p, ps]) => getComputedStyle(document.querySelector(s), ps ?? undefined)[p], [sel, prop, pseudo]);
    const card = page.locator(".workCard").first();
    await card.scrollIntoViewIfNeeded();
    const before = await css(".workCard", "borderTopColor");
    await card.hover();
    await page.waitForTimeout(350);
    assert.equal(await css(".workCard .workArt", "scale"), "1.02", "card art eases to 1.02 on hover");
    assert.equal(await css(".workCard .workLink > span", "translate"), "3px", "the card's arrow moves 3px");
    assert.notEqual(await css(".workCard", "borderTopColor"), before, "the card's border steps on hover");
    assert.equal(await css(".workCard .workLink", "textUnderlineOffset"), "3px", "the link's underline rests at 3px while only the card is hovered");
    await page.locator(".workCard .workLink").first().hover();
    await page.waitForTimeout(350);
    assert.equal(await css(".workCard .workLink", "textUnderlineOffset"), "5px", "the underline settles to 5px on link hover");
    const durations = await page.evaluate(() => [".workArt", ".workLink", ".workLink > span", ".workCard", ".workListTitle", "#darkModeToggle"].map((s) => [s, Math.max(...getComputedStyle(document.querySelector(s)).transitionDuration.split(",").map((d) => parseFloat(d) * (d.includes("ms") ? 1 : 1000)))]));
    for (const [sel, ms] of durations) assert.ok(ms > 0 && ms <= 300, `${sel}: interaction transition is ${ms}ms (limit 300)`);
    const row = page.locator(".workList > li").first();
    await row.scrollIntoViewIfNeeded();
    const rowBefore = await css(".workList > li .workListTitle", "color");
    await row.hover();
    await page.waitForTimeout(350);
    assert.notEqual(await css(".workList > li .workListTitle", "color"), rowBefore, "a list row's title takes the accent on hover");
    // Theme: the page does not smear, and the icon settles in only after a toggle.
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll("#darkModeToggle svg")].flatMap((el) => el.getAnimations().map((a) => a.animationName))), [], "the theme icon does not animate on load");
    await page.locator("#darkModeToggle").click();
    await page.waitForSelector("#darkModeToggle svg"); // the icon library redraws the icon a moment after the click
    const icon = await page.evaluate(() => { const a = document.querySelector("#darkModeToggle svg")?.getAnimations().find((x) => /^icon-in-/.test(x.animationName)); return a ? a.effect.getTiming().duration : null; });
    assert.equal(icon, 160, "after a toggle the new icon settles in over 160ms");
    const fades = await page.evaluate(async () => { document.querySelector("#darkModeToggle").click(); await new Promise((r) => requestAnimationFrame(r)); const n = document.getAnimations().filter((a) => /color|background|border|shadow/.test(a.transitionProperty ?? "")).map((a) => `${a.transitionProperty}@${a.effect.target.tagName}.${a.effect.target.className}`.slice(0, 50)); document.querySelector("#darkModeToggle").click(); return n; });
    assert.deepEqual(fades.slice(0, 4), [], "no colour fades while the theme flips");
    await page.locator("#darkModeToggle").click();
    // Details: content fades and, in Chromium, the height animates.
    const details = page.locator("#resume details").first();
    await details.scrollIntoViewIfNeeded();
    // Chrome does not list ::details-content transitions, so sample the values while they move.
    const opening = await page.evaluate(async () => {
      const el = document.querySelector("#resume details");
      const cs = getComputedStyle(el, "::details-content");
      const declared = [cs.transitionProperty, cs.transitionDuration];
      el.querySelector("summary").click();
      const frames = [];
      for (let i = 0; i < 6; i++) { await new Promise((r) => requestAnimationFrame(r)); frames.push([parseFloat(cs.opacity), parseFloat(cs.blockSize)]); }
      await new Promise((r) => setTimeout(r, 400));
      return { declared, frames, end: [parseFloat(cs.opacity), parseFloat(cs.blockSize)] };
    });
    assert.deepEqual(opening.declared, ["block-size, opacity, content-visibility", "0.24s, 0.24s, 0.24s"], "details content declares 240ms transitions");
    assert.ok(opening.frames.some(([o]) => o > 0 && o < 1), `details content fades in (${opening.frames.map((f) => f[0].toFixed(2))})`);
    assert.ok(opening.frames.some(([, h]) => h > 0 && h < opening.end[1]), "details height animates where supported");
    assert.equal(opening.end[0], 1, "details content ends fully visible");
    // Ask dialog: opens from the launcher's corner.
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    // Hold the conversation frame back for a moment so the loading state can be observed.
    await page.route("**/chat/?embed=1", async (route) => { await new Promise((r) => setTimeout(r, 900)); await route.continue(); });
    await page.locator(".findAskLauncher").click();
    await page.waitForTimeout(40);
    const dlg = await page.evaluate(() => { const d = document.querySelector(".chatOverlay"); return { origin: getComputedStyle(d).transformOrigin, loading: d.hasAttribute("data-loading"), trans: d.getAnimations().map((a) => [a.transitionProperty, a.effect.getTiming().duration]) }; });
    assert.ok(dlg.trans.some(([p, d]) => p === "scale" && d === 240) && dlg.trans.some(([p, d]) => p === "opacity" && d === 240), `the dialog scales and fades in over 240ms (${JSON.stringify(dlg.trans)})`);
    assert.equal(dlg.loading, true, "the dialog is marked as loading until its frame arrives");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".chatOverlayBar .loadingMark")).visibility), "visible", "the loading mark shows while the frame loads");
    await page.waitForFunction(() => !document.querySelector(".chatOverlay").hasAttribute("data-loading"), null, { timeout: 15000 });
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".chatOverlayBar .loadingMark")).visibility), "hidden", "the loading mark leaves when the frame has loaded");
    await page.context().close();

    // Touch devices get no hover movement.
    const touch = await open("", { touch: true, width: 390, height: 844 });
    await settle(touch);
    await touch.locator(".workCard").first().scrollIntoViewIfNeeded();
    await touch.locator(".workCard .workArt").first().dispatchEvent("mouseover");
    await touch.locator(".workCard").first().hover({ force: true }).catch(() => {});
    await touch.waitForTimeout(300);
    assert.notEqual(await touch.evaluate(() => getComputedStyle(document.querySelector(".workCard .workArt")).scale), "1.02", "no hover movement on a touch device");
    await touch.context().close();

    // Header links on inner pages: the underline grows from the left.
    const inner = await open(REPORT);
    await settle(inner);
    const link = inner.locator(".researchNavLinks a").first();
    assert.equal(await inner.evaluate(() => getComputedStyle(document.querySelector(".researchNavLinks a"), "::after").scale), "0 1", "header underline starts empty");
    await link.hover();
    await inner.waitForTimeout(300);
    assert.match(await inner.evaluate(() => getComputedStyle(document.querySelector(".researchNavLinks a"), "::after").scale), /^1( 1)?$/, "header underline fills on hover");
    await inner.context().close();
  }

  // ---- S2 the loading mark in the chat.
  for (const motion of [true, false]) {
    const page = await open("chat/", { motion });
    await page.waitForTimeout(400);
    const mark = await page.evaluate(() => {
      const mk = (cls) => { const s = document.createElement("span"); s.className = `turnStatus ${cls}`; s.innerHTML = '<span class="loadingMark" aria-hidden="true"><span>·\n✢\n✳\uFE0E\n✶\n✻\n✽\n✻\n✶</span></span>Checking sources…'; document.body.append(s); return s; };
      const pending = mk("turnStatus--pending"), done = mk("turnStatus--supported");
      const info = (el) => ({ strip: el.querySelector(".loadingMark > span").getAnimations().map((a) => { const cs = getComputedStyle(a.effect.target); return [a.animationName, a.effect.getTiming().duration, cs.animationTimingFunction, cs.animationIterationCount]; }), label: el.getAnimations().map((a) => [a.animationName, a.effect.getTiming().duration, a.effect.getTiming().easing]), lines: Math.round(el.querySelector(".loadingMark > span").getBoundingClientRect().height / parseFloat(getComputedStyle(el.querySelector(".loadingMark")).fontSize)), box: [el.querySelector(".loadingMark").getBoundingClientRect().height, getComputedStyle(el.querySelector(".loadingMark")).overflow, el.querySelector(".loadingMark").getAttribute("aria-hidden")], rest: getComputedStyle(el.querySelector(".loadingMark > span")).translate, fs: parseFloat(getComputedStyle(el.querySelector(".loadingMark")).fontSize) });
      const out = { pending: info(pending), done: info(done) };
      pending.remove(); done.remove();
      return out;
    });
    assert.deepEqual([mark.pending.box[1], mark.pending.box[2]], ["hidden", "true"], "the mark is a clipped, decorative window");
    assert.ok(Math.abs(mark.pending.box[0] - mark.pending.fs) < 1, "the window is one line tall");
    assert.equal(mark.pending.lines, 8, "the strip holds eight glyph lines");
    assert.deepEqual(mark.done.strip, [], "a finished status does not animate its mark");
    if (motion) {
      assert.deepEqual(mark.pending.strip, [["loading-mark", 1200, "steps(8)", "infinite"]], `the mark steps through 8 glyphs in 1.2s (${JSON.stringify(mark.pending.strip)})`);
      assert.deepEqual(mark.pending.label, [["label-sheen", 1500, "linear"]], "the waiting label carries a 1.5s sheen");
    } else {
      assert.deepEqual([mark.pending.strip, mark.pending.label], [[], []], "under reduced motion the mark and label are still");
      assert.ok(Math.abs(parseFloat(mark.pending.rest.split(" ").at(-1)) + 4 * mark.pending.fs) < 1, `under reduced motion the mark rests on the full star (${mark.pending.rest})`);
    }
    await page.context().close();
  }
} finally {
  await browser.close();
}

console.log("Motion checks passed.");
