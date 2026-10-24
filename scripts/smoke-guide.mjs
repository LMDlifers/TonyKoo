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
  for (const path of ['/', '/research/']) {
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      const launcher = page.locator('.findAskLauncher');
      assert.equal(await launcher.isVisible(), true);
      assert.match(await launcher.getAttribute('aria-label'), /Open AI Engineering Lab chat/);
      await launcher.click();
      assert.equal(page.url(), base + path);
      assert.equal(await page.locator('#tonyChatOverlay').evaluate((node) => node.open), true);
      await page.frameLocator('#tonyChatOverlay iframe').locator('#chatInput').waitFor();
      await page.locator('.chatOverlayActions button').click();
      assert.equal(await page.locator('#tonyChatOverlay').evaluate((node) => node.open), false);
      if (path === '/' && width < 992) await page.locator('.navbar-toggler').click();
      await page.locator('[data-find-ask-trigger]').click();
      assert.equal(await page.locator('.findAskDialog').evaluate((node) => node.open), true);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'findAskQuery');
      assert.equal(await page.locator('[data-mode="find"]').getAttribute('aria-pressed'), 'true');
      await page.locator('[data-mode="find"]').click();
      await page.locator('#findAskQuery').fill('HNSW');
      await page.locator('.findAskSource').first().waitFor();
      assert.match(await page.locator('.findAskSource').first().textContent(), /data becomes reliable evidence/i);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.findAskDialog').evaluate((node) => node.open), false);
      assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-find-ask-trigger')), true);
      await page.keyboard.press('Control+k');
      assert.equal(await page.locator('.findAskDialog').evaluate((node) => node.open), true);
      await page.route('**/ask', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        status: 'supported', answer: 'Compare a baseline on held-out tasks.', citations: [],
      }) }));
      await page.locator('[data-mode="ask"]').click();
      await page.locator('#findAskQuery').fill('How are agents evaluated?');
      await page.locator('.findAskForm button').click();
      await page.locator('.findAskMessage').filter({ hasText: 'Compare a baseline' }).waitFor();
      assert.deepEqual(errors, []);
      await page.close();
    }
  }
  for (const path of ['/research/when-agents-need-search.html', '/reports/faiss-caching-llm-cost-latency.html']) {
    const page = await browser.newPage();
    await page.goto(base + path);
    assert.equal(await page.locator('[data-find-ask-trigger]').count(), 0);
    assert.equal(await page.locator('.findAskLauncher').count(), 1);
    await page.locator('.findAskLauncher').click();
    assert.equal(await page.locator('#tonyChatOverlay').evaluate((node) => node.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#tonyChatOverlay').evaluate((node) => node.open), false);
    await page.close();
  }
  const navigation = await browser.newPage();
  await navigation.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await navigation.locator('a.nav-link[href="chat/"]').click();
  assert.equal(navigation.url(), base + '/');
  assert.equal(await navigation.locator('#tonyChatOverlay').evaluate((node) => node.open), true);
  await navigation.locator('.chatOverlayActions a').click();
  assert.match(navigation.url(), /\/chat\/$/);
  await navigation.close();
  console.log('Find / Ask browser checks passed: homepage and Research hub at 3 widths, HNSW search, focus, Escape, shortcut and chat overlays across articles and reports.');
} finally {
  await browser.close();
}
