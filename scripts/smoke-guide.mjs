import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE ||
  '/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const executablePath = process.env.PLAYWRIGHT_BROWSER_EXECUTABLE ||
  (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
const browser = await playwright.chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const base = process.env.SITE_BASE_URL || 'http://localhost:8000';

try {
  for (const path of ['/', '/research/', '/reports/faiss-caching-llm-cost-latency.html']) {
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      await page.locator('.tkGuideLaunch').click();
      assert.equal(await page.locator('.tkGuidePanel').evaluate((node) => node.open), true);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'tkGuideQuestion');
      assert.equal(await page.locator('.tkGuideAvatar img').evaluate((node) => getComputedStyle(node).animationName), 'none');
      await page.locator('#tkGuideQuestion').fill('FAISS cache');
      await page.locator('.tkGuideForm button').click();
      await page.locator('.tkGuideSource').first().waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.tkGuidePanel').evaluate((node) => node.open), false);
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('tkGuideLaunch')), true);
      assert.deepEqual(errors, []);
      await page.close();
    }
  }
  console.log('Guide browser checks passed: 3 pages × 3 widths, search, dialog focus, Escape, and reduced motion.');
} finally {
  await browser.close();
}
