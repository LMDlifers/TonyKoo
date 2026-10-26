import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const chrome = process.env.PLAYWRIGHT_BROWSER_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
const base = process.env.SITE_BASE_URL || 'http://localhost:8000';
const receipt = `${Buffer.from(JSON.stringify({ exp: Date.now() + 7 * 86400_000 })).toString('base64url')}.signature`;
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    const requests = [];
    const shares = [];
    const feedback = [];
    const revocations = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/feedback', (route) => {
      feedback.push(JSON.parse(route.request().postData()));
      route.fulfill({ status: 201, contentType: 'application/json', body: '{"saved":true}' });
    });
    await page.route('**/shares', (route) => {
      shares.push(JSON.parse(route.request().postData()));
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
        id: 'abcdefghijklmnopqrstuvwx', revokeToken: 'r'.repeat(43), expiresAt: Date.now() + 30 * 86400_000,
      }) });
    });
    await page.route('**/shares/abcdefghijklmnopqrstuvwx', (route) => {
      revocations.push(JSON.parse(route.request().postData()));
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"revoked":true}' });
    });
    await page.route('**/ask', (route) => {
      requests.push(JSON.parse(route.request().postData()));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        status: 'supported', answer: requests.length === 1 ? 'Compare a simple baseline on held-out tasks.' : 'Check the outcome and cost per validated success. Include withheld cases to avoid overfitting and compare total reviewer minutes before expanding the pilot.',
        citations: [{ id: 'research-how-to-prove-an-agent-works', url: 'https://wrong.example/' }],
        answerId: requests.length === 1 ? '00000000-0000-4000-8000-000000000001' : '00000000-0000-4000-8000-000000000002',
        receipt,
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
    await page.locator('.chatTurn--assistant .feedbackHelpful').first().click();
    await page.locator('.chatTurn--assistant .feedbackComment').first().fill('Clear baseline.');
    await page.locator('.chatTurn--assistant .feedbackSubmit').first().click();
    await page.locator('.chatTurn--assistant .feedbackThanks').first().waitFor();
    assert.equal(feedback.length, 1);
    assert.equal(feedback[0].comment, 'Clear baseline.');
    await page.locator('#shareChat').click();
    assert.equal(await page.locator('#shareDialog').isVisible(), true);
    assert.match(await page.locator('#sharePairs').innerText(), /before expanding the pilot\./, 'full answers appear in the preview');
    assert.equal(await page.locator('#sharePairs input[type=checkbox]:checked').count(), 0, 'sharing starts with nothing selected');
    await page.locator('#sharePairs input[type=checkbox]').last().check();
    await page.locator('#shareReviewed').check();
    await page.locator('#shareSubmit').click();
    await page.locator('#shareLink').waitFor({ state: 'visible' });
    assert.equal(shares.length, 1);
    assert.equal(shares[0].turns.length, 2, 'only the selected pair is shared');
    assert.match(await page.locator('#shareLink').inputValue(), /shared\.html#abcdefghijklmnopqrstuvwx$/);
    await page.locator('#shareClose').click();
    if (width < 851) await page.locator('#menuButton').click();
    await page.locator('#myShares').click();
    assert.match(await page.locator('#manageList').innerText(), /abcdefghijklmnopqrstuvwx/);
    assert.match(await page.locator('#manageList a').first().getAttribute('href'), /shared\.html#abcdefghijklmnopqrstuvwx$/);
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('#manageList button').click();
    await page.locator('#manageList').getByText('No active links').waitFor();
    assert.equal(revocations.length, 1);
    assert.equal(revocations[0].revokeToken, 'r'.repeat(43));
    await page.locator('#manageClose').click();
    await page.reload();
    assert.equal(await page.locator('.chatTurn').count(), 4, 'session transcript survives reload');
    assert.equal(await page.locator('#shareChat').isEnabled(), true);
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
