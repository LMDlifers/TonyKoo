import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const chrome = process.env.PLAYWRIGHT_BROWSER_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
const base = process.env.SITE_BASE_URL || 'http://localhost:8000';
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    const requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/ask', (route) => {
      requests.push(JSON.parse(route.request().postData()));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        status: 'supported', answer: requests.length === 1 ? 'Compare a simple baseline on held-out tasks.' : 'Check the outcome and cost per validated success.',
        citations: [{ id: 'research-how-to-prove-an-agent-works', url: 'https://wrong.example/' }],
      }) });
    });
    await page.goto(base + '/chat/');
    assert.equal(await page.locator('#chatEmpty').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false);
    await page.locator('[data-prompt]').first().click();
    assert.match(await page.locator('#chatInput').inputValue(), /RAG evaluation/);
    assert.equal(requests.length, 0, 'starter must not spend a model call');
    await page.locator('#chatInput').fill('How are agents evaluated?');
    await page.locator('#chatInput').press('Enter');
    await page.locator('.chatTurn--assistant .turnText').first().filter({ hasText: 'held-out tasks' }).waitFor();
    assert.deepEqual(requests[0].history, []);
    assert.match(await page.locator('.turnSources a').first().getAttribute('href'), /\/research\/how-to-prove-an-agent-works\.html$/);
    await page.locator('#chatInput').fill('How would I test that?');
    await page.locator('#chatInput').press('Enter');
    await page.locator('.chatTurn--assistant .turnText').last().filter({ hasText: 'validated success' }).waitFor();
    assert.equal(requests[1].history.length, 2);
    assert.equal(await page.locator('.chatTurn').count(), 4);
    await page.reload();
    assert.equal(await page.locator('.chatTurn').count(), 4, 'session transcript survives reload');
    if (width < 851) {
      await page.locator('#menuButton').click();
      assert.equal(await page.locator('#chatRail').evaluate((node) => node.classList.contains('isOpen')), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#chatRail').evaluate((node) => node.classList.contains('isOpen')), false);
    }
    page.once('dialog', (dialog) => dialog.accept());
    if (width < 851) await page.locator('#menuButton').click();
    await page.locator('#newChat').click();
    assert.equal(await page.locator('.chatTurn').count(), 0);
    assert.equal(await page.locator('#chatEmpty').isVisible(), true);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Chat browser checks passed: empty state, starters, bounded follow-up, citations, reload, new chat and mobile navigation.');
} finally { await browser.close(); }
