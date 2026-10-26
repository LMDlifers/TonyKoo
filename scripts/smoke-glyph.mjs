import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const chrome = process.env.PLAYWRIGHT_BROWSER_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
const base = process.env.SITE_BASE_URL || 'http://localhost:8765';
const cases = [['/', '.fieldIntro > .glyphField'], ['/chat/', '#glyphField'], ['/research/', '.researchHero > .glyphField']];
try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const [path, selector] of cases) {
        await page.goto(base + path, { waitUntil: 'networkidle' });
        const canvas = page.locator(selector);
        await canvas.waitFor();
        await page.waitForTimeout(80);
        const before = await canvas.evaluate(node => node.toDataURL());
        const region = page.locator(path === '/' ? '.fieldIntro' : path === '/chat/' ? '.chatScroll' : '.researchHero');
        const box = await region.boundingBox();
        assert.ok(box, `${path}: region missing`);
        await page.mouse.move(box.x + box.width * .65, box.y + box.height * .38);
        await page.mouse.move(box.x + box.width * .82, box.y + box.height * .55);
        await page.waitForTimeout(110);
        const during = await canvas.evaluate(node => node.toDataURL());
        if (reducedMotion === 'reduce') assert.equal(during, before, `${path}: reduced motion changed canvas`);
        else assert.notEqual(during, before, `${path}: cursor did not reveal glyph wake`);
        await page.waitForTimeout(1250);
        const after = await canvas.evaluate(node => node.toDataURL());
        assert.equal(after, before, `${path}: glyph wake did not settle to still frame`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, `${path}: horizontal overflow`);
      }
      for (const path of ['/research/when-agents-need-search.html', '/reports/faiss-caching-llm-cost-latency.html']) {
        await page.goto(base + path, { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('canvas.glyphField').count(), 0, `${path}: reading page has moving canvas`);
      }
      assert.deepEqual(errors, [], `console errors at ${width}px/${reducedMotion}`);
      await context.close();
    }
  }
  console.log('Glyph browser checks passed across 3 surfaces, 2 widths, both motion preferences, and still reading pages.');
} finally { await browser.close(); }
