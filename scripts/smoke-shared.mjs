import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const chrome = process.env.PLAYWRIGHT_BROWSER_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
const base = process.env.SITE_BASE_URL || 'http://localhost:8000';
const shareId = 'abcdefghijklmnopqrstuvwx';
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route(`**/shares/${shareId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      expiresAt: Date.now() + 30 * 86400_000,
      turns: [{ role: 'user', content: '<img src=x onerror=alert(1)> How are agents evaluated?' },
        { role: 'assistant', content: 'Use held-out tasks and a baseline.', status: 'supported',
          citations: ['research-how-to-prove-an-agent-works'] }],
    }) }));
    await page.goto(`${base}/chat/shared.html#${shareId}`);
    await page.locator('.sharedTurn').first().waitFor();
    assert.equal(await page.locator('.sharedTurn').count(), 2);
    assert.equal(await page.locator('.sharedTurn img').count(), 0, 'shared content is text, not HTML');
    assert.match(await page.locator('.sharedTurn a').first().getAttribute('href'), /\/research\/how-to-prove-an-agent-works\.html$/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Shared chat browser checks passed: read-only rendering, safe text, source links, and mobile width.');
} finally { await browser.close(); }
