import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const playwrightPath =
  process.env.PLAYWRIGHT_MODULE ||
  "/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright";
const { chromium } = require(playwrightPath);

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
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
  "/research/what-the-cloud-should-own.html": 1,
  "/research/how-to-decide-under-uncertainty.html": 1,
  "/research/how-money-compounds-and-risk-interrupts-it.html": 1,
};

const browser = await chromium.launch(launchOptions);
const results = [];

for (const pagePath of pages) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`http://localhost:8000${pagePath}`, { waitUntil: "load" });
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
          window.setTimeout(resolve, 1200);
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
        ".heroMetrics",
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
await research.goto("http://localhost:8000/research/");
await research.locator("[data-research-search]").fill("outbox");
assert.equal(await research.locator("#machine-learning").isVisible(), false);
assert.equal(await research.locator("#system-design").isVisible(), true);
await research.locator('.branchNav a[href="#machine-learning"]').click();
assert.equal(await research.locator("#machine-learning").isVisible(), true);
assert.equal(await research.locator("[data-research-search]").inputValue(), "");
await research.locator("[data-research-search]").fill("zzzxxy");
assert.equal(await research.locator("[data-research-empty]").isVisible(), true);
await research.close();
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
