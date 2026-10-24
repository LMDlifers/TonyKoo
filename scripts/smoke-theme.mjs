import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const chrome = process.env.PLAYWRIGHT_BROWSER_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
const base = process.env.SITE_BASE_URL || 'http://localhost:8000';
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const path of ['/', '/chat/', '/research/', '/research/when-agents-need-search.html', '/reports/faiss-caching-llm-cost-latency.html']) {
      await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      assert.equal(await page.locator('body').evaluate(node => node.classList.contains('dark-mode')), true, `${path} did not open dark`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, `${path} overflows`);
    }
    await page.locator('.reportThemeButton').click();
    assert.equal(await page.locator('body').evaluate(node => node.classList.contains('dark-mode')), false);
    await page.goto(base + '/chat/');
    assert.equal(await page.locator('body').evaluate(node => node.classList.contains('dark-mode')), false, 'light preference did not follow visitor');
    await page.locator('#themeToggle').click();
    await page.goto(base + '/research/');
    assert.equal(await page.locator('body').evaluate(node => node.classList.contains('dark-mode')), true, 'dark preference did not follow visitor');
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Theme browser checks passed: dark default, report toggle, cross-page preference, and no overflow.');
} finally { await browser.close(); }
