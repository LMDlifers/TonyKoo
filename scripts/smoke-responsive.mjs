import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const playwrightPath =
  process.env.PLAYWRIGHT_MODULE ||
  "/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright";
const { chromium } = require(playwrightPath);

const chromePath = process.env.PLAYWRIGHT_BROWSER_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseURL = process.env.SITE_BASE_URL || "http://localhost:8000";
const launchOptions = fs.existsSync(chromePath)
  ? { headless: true, executablePath: chromePath }
  : { headless: true };

const pages = [
  "/",
  "/reports/agentic-healthcare-analytics.html",
  "/reports/judicial-analytics-legal-nlp.html",
  "/reports/faiss-caching-llm-cost-latency.html",
  "/reports/human-in-the-loop-ai-sensitive-data.html",
  "/reports/yield-curve-quant-engineering-notes.html",
  "/research/",
  "/research/what-language-models-learn.html",
  "/research/when-agents-need-search.html",
  "/research/where-autonomy-stops.html",
  "/research/how-to-prove-an-agent-works.html",
  "/research/when-an-ml-model-is-ready.html",
  "/research/how-data-becomes-reliable-evidence.html",
  "/research/how-to-choose-a-system-boundary.html",
  "/research/what-the-cloud-should-own.html",
  "/research/how-to-decide-under-uncertainty.html",
  "/research/how-money-compounds-and-risk-interrupts-it.html",
];
const widths = [1440, 1024, 768, 390, 375, 320];
const expectedVisuals = {
  "/research/": 1,
  "/research/what-language-models-learn.html": 2,
  "/research/when-agents-need-search.html": 3,
  "/research/where-autonomy-stops.html": 2,
  "/research/how-to-prove-an-agent-works.html": 2,
  "/research/when-an-ml-model-is-ready.html": 1,
  "/research/how-data-becomes-reliable-evidence.html": 1,
  "/research/how-to-choose-a-system-boundary.html": 1,
  "/research/what-the-cloud-should-own.html": 2,
  "/research/how-to-decide-under-uncertainty.html": 1,
  "/research/how-money-compounds-and-risk-interrupts-it.html": 1,
};

const browser = await chromium.launch(launchOptions);
const results = [];

for (const pagePath of pages) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`${baseURL}${pagePath}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(async () => {
      const localImages = [...document.querySelectorAll("img")].filter(
        (img) => new URL(img.currentSrc || img.src, window.location.href).origin === window.location.origin,
      );

      for (const img of localImages) {
        img.scrollIntoView({ block: "center", inline: "nearest" });
        await new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }

          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
          window.setTimeout(resolve, 5000);
        });
      }

      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(350);

    const result = await page.evaluate(async () => {
      const images = [...document.querySelectorAll("img")]
        .map((img) => ({
          src: img.currentSrc || img.src,
          complete: img.complete,
          width: img.naturalWidth,
        }))
        .filter((img) => new URL(img.src, window.location.href).origin === window.location.origin);

      const videos = await Promise.all(
        [...document.querySelectorAll("video")].map(
          (video) =>
            new Promise((resolve) => {
              const src = video.querySelector("source")?.getAttribute("src") || video.currentSrc || "";
              const finish = () =>
                resolve({
                  src,
                  duration: Number.isFinite(video.duration) ? video.duration : 0,
                  hasError: Boolean(video.error),
                  tracks: video.querySelectorAll("track[kind='captions']").length,
                });

              video.addEventListener("loadedmetadata", finish, { once: true });
              video.addEventListener("error", finish, { once: true });
              video.load();
              window.setTimeout(finish, 2000);
            }),
        ),
      );

      const heroSelectors = [
        ".heroEyebrow",
        ".heroTitle",
        ".heroSubtitle",
        ".heroPositioning",
        ".heroActions",
        "#portfolio",
        ".fieldIntro",
        ".fieldScene",
        ".personaStation",
      ];
      const viewportWidth = document.documentElement.clientWidth;
      const clippedHeroElements = heroSelectors
        .map((selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;

          const rect = element.getBoundingClientRect();
          return {
            selector,
            left: rect.left,
            right: rect.right,
            viewportWidth,
          };
        })
        .filter(
          (item) =>
            item && (item.left < -1 || item.right > item.viewportWidth + 1),
        );

      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        missingImages: images
          .filter((img) => !img.complete || img.width === 0)
          .map((img) => img.src),
        evidenceBlocks: document.querySelectorAll(
          ".visualStoryCard, .visualEvidenceItem, .researchFigure, .demoVideo",
        ).length,
        visualCount: document.querySelectorAll(".researchMap, .conceptFigure, .diagram").length,
        clippedHeroElements,
        videos,
      };
    });

    results.push({
      page: pagePath,
      width,
      overflow: result.scrollWidth > result.clientWidth + 1,
      ...result,
    });

    await page.close();
  }
}

const research = await browser.newPage({ viewport: { width: 390, height: 900 } });
await research.goto(`${baseURL}/research/`);
const leadLayout = await research.evaluate(() => {
  const card = document.querySelector('.topicCard--lead').getBoundingClientRect();
  const image = document.querySelector('.leadFigure img').getBoundingClientRect();
  return { cardTop: card.top, cardRight: card.right, imageRight: image.right, imageWidth: image.width };
});
assert.ok(leadLayout.cardTop < 900, 'Lead story starts below the first mobile screen');
assert.ok(leadLayout.imageRight <= leadLayout.cardRight + 1, 'Lead figure is clipped by its card');
assert.ok(leadLayout.imageWidth >= 220, 'Lead figure is too narrow to read');
await research.locator('[data-find-ask-trigger]').click();
await research.locator('#findAskQuery').fill('boundary');
assert.match(await research.locator('.findAskSource').first().textContent(), /system boundary/i);
await research.keyboard.press('Escape');
for (const [filter, count] of [['all', 14], ['ai-agents', 7], ['ml-data', 2], ['systems-cloud', 3], ['decisions-money', 2]]) {
  await research.locator(`[data-topic-filter="${filter}"]`).click();
  assert.equal(await research.locator('.storyFeed [data-research-card]:visible').count(), count);
}
await research.locator('[data-topic-filter="ml-data"]').click();
assert.equal(await research.locator('[data-topic="machine-learning"]').isVisible(), true);
assert.equal(await research.locator('[data-topic-filter="ml-data"]').getAttribute('aria-pressed'), 'true');
await research.close();
const narrowFilters = await browser.newPage({ viewport: { width: 320, height: 900 } });
await narrowFilters.goto(`${baseURL}/research/`);
await narrowFilters.locator('[data-topic-filter="all"]').focus();
for (const filter of ['ai-agents', 'ml-data', 'systems-cloud', 'decisions-money']) {
  await narrowFilters.keyboard.press('Tab');
  await narrowFilters.waitForTimeout(250);
  const focus = await narrowFilters.evaluate(() => {
    const nav = document.querySelector('.branchNav').getBoundingClientRect();
    const active = document.activeElement.getBoundingClientRect();
    return { filter: document.activeElement.dataset.topicFilter, visible: active.left >= nav.left - 1 && active.right <= nav.right + 1 };
  });
  assert.equal(focus.filter, filter);
  assert.ok(focus.visible, `${filter} is clipped while focused at 320px`);
}
await narrowFilters.close();
const desktopResearch = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desktopResearch.goto(`${baseURL}/research/`);
assert.notEqual(await desktopResearch.locator('.readingPath').evaluate((element) => getComputedStyle(element).position), 'sticky');
const leadTitle = desktopResearch.locator('.topicCard--lead h3 a');
const titleBefore = await leadTitle.evaluate((element) => getComputedStyle(element).textDecorationColor);
assert.equal(await leadTitle.evaluate((element) => getComputedStyle(element).textDecorationLine), 'underline');
await leadTitle.hover();
await desktopResearch.waitForTimeout(250);
assert.notEqual(await leadTitle.evaluate((element) => getComputedStyle(element).textDecorationColor), titleBefore);
const leadFigure = desktopResearch.locator('.leadFigureLink');
await leadFigure.hover();
await desktopResearch.waitForTimeout(250);
assert.notEqual(await leadFigure.evaluate((element) => getComputedStyle(element).transform), 'none');
const supportsPageTransitions = await desktopResearch.evaluate(() => 'CSSViewTransitionRule' in window && 'onpageswap' in window);
await desktopResearch.evaluate(() => {
  sessionStorage.removeItem('researchViewTransition');
  window.addEventListener('pageswap', (event) => sessionStorage.setItem('researchViewTransition', String(Boolean(event.viewTransition))), { once: true });
});
await leadTitle.click();
assert.match(desktopResearch.url(), /\/research\/when-agents-need-search\.html$/);
if (supportsPageTransitions) assert.equal(await desktopResearch.evaluate(() => sessionStorage.getItem('researchViewTransition')), 'true');
await desktopResearch.close();
const reducedResearch = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
await reducedResearch.goto(`${baseURL}/research/`);
assert.equal(await reducedResearch.locator('.topicCard--lead h3 a').evaluate((element) => getComputedStyle(element).transitionDuration), '0s');
const reducedFigure = reducedResearch.locator('.leadFigureLink');
await reducedFigure.hover();
assert.equal(await reducedFigure.evaluate((element) => getComputedStyle(element).transform), 'none');
await reducedResearch.evaluate(() => {
  sessionStorage.removeItem('researchViewTransition');
  window.addEventListener('pageswap', (event) => sessionStorage.setItem('researchViewTransition', String(Boolean(event.viewTransition))), { once: true });
});
await reducedResearch.locator('.topicCard--lead h3 a').click();
assert.match(reducedResearch.url(), /\/research\/when-agents-need-search\.html$/);
if (supportsPageTransitions) assert.equal(await reducedResearch.evaluate(() => sessionStorage.getItem('researchViewTransition')), 'false');
await reducedResearch.close();
const article = await browser.newPage({ viewport: { width: 390, height: 900 } });
await article.goto(`${baseURL}/research/how-to-decide-under-uncertainty.html`);
assert.equal(await article.locator('details.articleToc').getAttribute('open'), null);
await article.locator('details.articleToc summary').click();
assert.equal(await article.locator('details.articleToc').getAttribute('open'), '');
await article.close();
await browser.close();

const failures = results.filter(
  (result) =>
    result.overflow ||
    (expectedVisuals[result.page] !== undefined && result.visualCount !== expectedVisuals[result.page]) ||
    result.clippedHeroElements.length ||
    result.missingImages.length ||
    result.videos.some((video) => video.hasError || video.duration < 10 || video.tracks === 0),
);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(results, null, 2));
