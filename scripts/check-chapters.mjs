import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

// Two scroll chapters (retro spec section 5): exactly two, each one screen at most, the intro
// sentence moved (not copied) into a pixel-frame dialogue, the character at whole-number scale,
// visible with JS off and under reduced motion, and nav anchors still landing on their sections.
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    "/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const base = process.env.SITE_BASE_URL || "http://localhost:8000";
const css = fs.readFileSync(new URL("../css/craft.css", import.meta.url), "utf8");

const SENTENCES = {
  "chapter-projects": "Public-safe summaries structured for fast review: problem, build, evidence boundary, stack, and deeper case-study notes.",
  "chapter-contact": "Open to AI engineering, data science, and quant tooling conversations where the work needs to be explainable, measurable, and responsibly shipped.",
};
const squash = (t) => t.replace(/\s+/g, " ").trim();

// Every chapter animation rule sits inside the reduced-motion and support guards.
const guarded = css.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*@supports \(animation-timeline: view\(\)\)\s*\{[\s\S]*?\n\s{4}\}\n\}/)?.[0] ?? "";
const outside = css.replace(guarded, "");
assert.doesNotMatch(outside, /chapterWalk|animation-timeline/, "chapter motion lives only inside the reduced-motion and support guards");

const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base);
  const layout = await page.evaluate(() => {
    const next = (el) => { let n = el.nextElementSibling; while (n && n.tagName === "SCRIPT") n = n.nextElementSibling; return n; };
    return {
      ids: [...document.querySelectorAll(".chapter")].map((c) => c.id),
      after: [...document.querySelectorAll(".chapter")].map((c) => next(c)?.id),
      dialogue: Object.fromEntries([...document.querySelectorAll(".chapter")].map((c) => [c.id, c.querySelector(".chapterDialogue")?.textContent ?? ""])),
      body: document.body.textContent,
    };
  });
  assert.deepEqual(layout.ids, ["chapter-projects", "chapter-contact"], "exactly two chapters, in order");
  assert.deepEqual(layout.after, ["portfolio", "contact"], "each chapter sits right before its section");
  for (const [id, sentence] of Object.entries(SENTENCES)) {
    assert.equal(squash(layout.dialogue[id]), sentence, `${id} dialogue carries the moved sentence`);
  }
  for (const sentence of Object.values(SENTENCES)) {
    assert.equal(squash(layout.body).split(sentence).length - 1, 1, `sentence appears once on the page (moved, not copied): ${sentence.slice(0, 30)}`);
  }

  // Short screens step down to the next whole-number scale so the chapter still fits one screen.
  for (const [width, height, w, h] of [[1440, 900, 512, 640], [1366, 768, 256, 320], [1280, 720, 256, 320], [390, 844, 256, 320], [320, 568, 128, 160]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(200);
    const sizes = await page.evaluate(() => [...document.querySelectorAll(".chapter")].map((c) => {
      const s = c.querySelector(".chapterSprite");
      const r = s.getBoundingClientRect();
      // Measure the content, not the box: the last child's bottom from the chapter's top, plus padding.
      const top = c.getBoundingClientRect().top;
      const bottom = Math.max(r.bottom, c.querySelector(".chapterDialogue").getBoundingClientRect().bottom);
      return { w: r.width, h: r.height, rendering: getComputedStyle(s).imageRendering, chapter: bottom - top + parseFloat(getComputedStyle(c).paddingBottom), box: c.getBoundingClientRect().height, hidden: s.getAttribute("aria-hidden") };
    }));
    for (const s of sizes) {
      assert.deepEqual([Math.round(s.w), Math.round(s.h)], [w, h], `chapter sprite ${Math.round(s.w)}x${Math.round(s.h)} at ${width}`);
      assert.equal(s.rendering, "pixelated", "chapter sprite stays crisp");
      assert.equal(s.hidden, "true", "chapter sprite is decorative");
      assert.ok(s.chapter <= height + 0.5, `chapter is one screen at most (${Math.round(s.chapter)} at ${width}x${height})`);
      assert.ok(s.chapter <= s.box + 0.5, `chapter content stays inside the chapter (${Math.round(s.chapter)} > ${Math.round(s.box)} at ${width}x${height})`);
    }
  }
  for (const width of [320, 390, 768, 899, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `no sideways scroll at ${width}`);
  }

  // Nav anchors still land on their sections, not on the chapters before them.
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const id of ["portfolio", "contact"]) {
    await page.locator(`a.nav-link[href="#${id}"]`).click();
    // Smooth scrolling over a long page takes a while: wait until the position stops moving.
    let last = -1;
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(150);
      const y = await page.evaluate(() => scrollY);
      if (y === last) break;
      last = y;
    }
    const { top, atBottom } = await page.evaluate((i) => ({
      top: document.getElementById(i).getBoundingClientRect().top,
      atBottom: Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 1,
    }), id);
    // The last section may not reach the top when the page ends; then it must at least be in view.
    assert.ok((top >= -1 && top <= 120) || (atBottom && top < 900), `#${id} lands after the nav link (top ${Math.round(top)})`);
  }
  await page.close();

  // Motion on: the character walks (6 whole frames at 8x) and slides in as the chapter scrolls into view.
  {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(base);
    const sprite = (prop) => p.evaluate((k) => getComputedStyle(document.querySelector("#chapter-projects .chapterSprite"))[k], prop);
    assert.match(await sprite("animationName"), /chapterWalkFrames/, "walk frames run");
    assert.match(await sprite("animationName"), /chapterWalkIn/, "walk-in runs");
    assert.match(await sprite("animationTimeline"), /view\(\)/, "walk-in follows the scroll");
    assert.equal(await sprite("backgroundSize"), "3072px 640px", "walk strip is 6 frames x 512px at 8x");
    const xAt = async (offset) => {
      await p.evaluate((o) => { const c = document.getElementById("chapter-projects"); scrollTo(0, c.offsetTop - innerHeight + o); }, offset);
      await p.waitForTimeout(150);
      const t = await sprite("transform");
      return t === "none" ? 0 : Number(t.match(/matrix\(([^)]+)\)/)[1].split(",")[4]);
    };
    const early = await xAt(120);
    const later = await xAt(520);
    assert.ok(early < later, `sprite moves in as the chapter scrolls (${Math.round(early)} -> ${Math.round(later)})`);
    await p.close();
  }

  // JS off and reduced motion: the chapters are complete and still.
  for (const opts of [{ javaScriptEnabled: false }, { reducedMotion: "reduce" }]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
    const p = await ctx.newPage();
    await p.goto(base);
    for (const id of Object.keys(SENTENCES)) {
      await p.locator(`#${id}`).scrollIntoViewIfNeeded();
      const st = await p.evaluate((i) => {
        const c = document.getElementById(i);
        const d = c.querySelector(".chapterDialogue").getBoundingClientRect();
        const s = getComputedStyle(c.querySelector(".chapterSprite"));
        return { dialogueH: d.height, opacity: getComputedStyle(c.querySelector(".chapterDialogue")).opacity, animation: s.animationName, transform: s.transform, bg: s.backgroundImage };
      }, id);
      const label = Object.keys(opts)[0];
      assert.ok(st.dialogueH > 0 && st.opacity !== "0", `${id} dialogue visible (${label})`);
      assert.equal(st.animation, "none", `${id} sprite does not animate (${label})`);
      assert.equal(st.transform, "none", `${id} sprite stands in its final place (${label})`);
      assert.match(st.bg, /-still\.png/, `${id} shows the still sprite (${label})`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}

console.log("Chapter checks passed.");
