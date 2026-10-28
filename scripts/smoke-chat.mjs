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
        nextStep: requests.length === 1 ? 'Run one held-out task.' : undefined,
        limits: requests.length === 1 ? 'A judge score is not the final outcome.' : undefined,
        visual: requests.length === 1 ? { kind: 'figure', id: 'agent-evaluation' } : undefined,
        citations: [{ id: 'research-how-to-prove-an-agent-works', url: 'https://wrong.example/' }],
        answerId: requests.length === 1 ? '00000000-0000-4000-8000-000000000001' : '00000000-0000-4000-8000-000000000002',
        receipt,
      }) });
    });
    await page.goto(base + '/chat/');
    assert.equal(await page.locator('#chatEmpty').isVisible(), true);
    assert.equal(await page.locator('#chatInput').getAttribute('maxlength'), '3000');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false);
    await page.locator('[data-prompt]').first().click();
    assert.match(await page.locator('#chatInput').inputValue(), /RAG evaluation/);
    assert.equal(requests.length, 0, 'starter must not spend a model call');
    await page.locator('#chatInput').fill('How are agents evaluated?');
    await page.locator('#chatInput').press('Enter');
    await page.locator('.chatTurn--assistant .turnText').first().filter({ hasText: 'held-out tasks' }).waitFor();
    assert.equal(await page.locator('.answerVisual img').count(), 1);
    assert.match(await page.locator('.answerNextStep').innerText(), /held-out task/);
    await page.locator('.answerVisual button').click();
    assert.equal(await page.locator('.figureDialog').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.figureDialog').isVisible(), false);
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
  const webPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const webRequests = [];
  await webPage.route('**/ask', (route) => {
    const body = JSON.parse(route.request().postData());
    webRequests.push(body);
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body.searchWeb
      ? { status: 'supported', answer: 'Use a client token to retry safely.', sourceScope: 'web',
        citations: [{ id: 'web-1', title: 'Making retries safe with idempotent APIs',
          url: 'https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/' }] }
      : { status: 'unknown', answer: 'The approved sources do not answer this.', webAvailable: true }) });
  });
  await webPage.goto(base + '/chat/');
  await webPage.locator('#chatInput').fill('What changed in the newest cloud architecture today?');
  await webPage.locator('#chatInput').press('Enter');
  await webPage.getByRole('button', { name: 'Search current docs' }).click();
  await webPage.locator('.chatTurn--assistant .turnText').last().filter({ hasText: 'client token' }).waitFor();
  assert.equal(webRequests[0].searchWeb, undefined);
  assert.equal(webRequests[1].searchWeb, true);
  assert.match(await webPage.locator('.chatTurn--assistant .turnStatus').last().innerText(), /current publisher documentation/i);
  assert.match(await webPage.locator('.chatTurn--assistant .turnSources a').last().getAttribute('href'), /^https:\/\/aws\.amazon\.com/);
  assert.equal(await webPage.locator('.answerVisual').count(), 0);
  await webPage.close();

  const longWeb = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await longWeb.route('**/ask', (route) => {
    const body = JSON.parse(route.request().postData());
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body.searchWeb
      ? { status: 'unknown', answer: 'No current publisher source was sufficient.', sourceScope: 'web' }
      : { status: 'unknown', answer: 'Curated sources were insufficient.', webAvailable: true }) });
  });
  await longWeb.goto(base + '/chat/');
  const brief = 'Review this architecture: '.padEnd(3000, 'x');
  await longWeb.locator('#chatInput').fill(brief);
  await longWeb.locator('#chatInput').press('Enter');
  await longWeb.getByRole('button', { name: 'Search current docs' }).click();
  await longWeb.locator('.chatTurn--assistant .turnText').last().filter({ hasText: 'No current publisher' }).waitFor();
  await longWeb.reload();
  assert.equal(await longWeb.locator('.chatTurn').count(), 4, 'long opt-in search survives reload');
  await longWeb.close();

  const legacy = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await legacy.goto(base + '/chat/');
  await legacy.evaluate(() => sessionStorage.setItem('tonyEngineeringChatV1', JSON.stringify([
    { role: 'user', content: 'What is RAG?' },
    { role: 'assistant', content: 'Retrieval adds evidence before generation.', status: 'supported', citations: [] },
  ])));
  await legacy.reload();
  assert.match(await legacy.locator('.chatTurn--assistant .turnText').innerText(), /Retrieval adds evidence/);
  assert.equal(await legacy.locator('.answerVisual').count(), 0);
  await legacy.close();

  const diagram = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await diagram.route('**/ask', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    status: 'inference', answer: 'My inference is that the write and event intent should share a transaction.',
    citations: [{ id: 'primary-aws-outbox' }],
    visual: { kind: 'diagram', title: 'Proposed outbox flow', sourceIds: ['primary-aws-outbox'],
      nodes: [{ id: 'api', type: 'api' }, { id: 'db', type: 'database' },
        { id: 'publisher', type: 'publisher' }, { id: 'consumer', type: 'consumer' }],
      edges: [{ from: 'api', to: 'db', type: 'write' }, { from: 'db', to: 'publisher', type: 'publish' },
        { from: 'publisher', to: 'consumer', type: 'deliver' }] },
  }) }));
  await diagram.goto(base + '/chat/');
  await diagram.locator('#chatInput').fill('Review a transactional outbox design.');
  await diagram.locator('#chatInput').press('Enter');
  await diagram.locator('.designDiagramViewport svg').waitFor();
  assert.match(await diagram.locator('.visualKind').innerText(), /Illustrative design/i);
  assert.match(await diagram.locator('.designConnections').innerText(), /API service.*Database/);
  assert.equal(await diagram.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false);
  await diagram.close();

  const comparison = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await comparison.route('**/ask', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    status: 'supported', answer: 'An outbox keeps event intent with the state change.',
    citations: [{ id: 'primary-aws-outbox' }],
    visual: { kind: 'comparison', title: 'Delivery choices', sourceIds: ['primary-aws-outbox'], rows: [
      { option: 'Direct call', fit: 'Synchronous response', tradeoff: 'Commit and publish can diverge' },
      { option: 'Outbox', fit: 'Durable intent', tradeoff: 'Needs a publisher' },
    ] },
  }) }));
  await comparison.goto(base + '/chat/');
  await comparison.locator('#chatInput').fill('Compare direct calls and an outbox.');
  await comparison.locator('#chatInput').press('Enter');
  await comparison.locator('.comparisonViewport table').waitFor();
  assert.equal(await comparison.locator('.comparisonViewport tbody tr').count(), 2);
  assert.equal(await comparison.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false);
  await comparison.close();

  const overlay = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await overlay.goto(base + '/');
  await overlay.getByRole('button', { name: 'Open AI Engineering Lab chat' }).click();
  const frame = overlay.frameLocator('#tonyChatOverlay iframe');
  await frame.locator('#chatInput').waitFor();
  assert.equal(await frame.locator('#chatInput').getAttribute('maxlength'), '3000');
  assert.equal(await overlay.locator('#tonyChatOverlay').isVisible(), true);
  await overlay.locator('#tonyChatOverlay .chatOverlayActions button').click();
  assert.equal(await overlay.locator('#tonyChatOverlay').isVisible(), false);
  await overlay.close();
  console.log('Chat browser checks passed: empty state, starters, bounded follow-up, citations, reload, new chat and mobile navigation.');
} finally { await browser.close(); }
