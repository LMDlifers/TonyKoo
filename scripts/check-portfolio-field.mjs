import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.match(html, /id="portfolioField"/, 'Missing portfolio field scene');
const stations = [...html.matchAll(/<a\b([^>]*class="personaStation"[^>]*)>([\s\S]*?)<\/a>/g)];
assert.equal(stations.length, 3, 'Exactly three native persona links');
for (const [index, [ , attrs, body]] of stations.entries()) {
  const [persona, href, label] = [['ai-engineer','#portfolio','AI Engineer · Projects'],['researcher','research/','Researcher · Research'],['student','#resume','Student · Background']][index];
  assert.ok(attrs.includes(`data-persona="${persona}"`) && attrs.includes(`href="${href}"`));
  assert.ok(body.includes(label), `Missing visible label: ${label}`);
  assert.match(body, /class="personaStill"[^>]*alt=""/);
  assert.match(body, /class="personaAnimated"[^>]*hidden/);
}
assert.match(html, /href="#portfolio"[^>]*>[^<]*<i[^>]*><\/i> View Projects/);
assert.match(html, /<\/header>\s*<section id="fieldProof"/);
for (const claim of ['6.09s -> 0.86s APAC analytics runtime','Leakage-aware legal NLP evaluation design','FAISS cache with freshness and fallback gates','images/reports/healthcare_agentic_pipeline_light.svg','Approximate field-level questionnaire extraction accuracy on a sanitized project evaluation sample']) {
  assert.equal(html.split(claim).length - 1, 1, `Proof must appear once: ${claim}`);
}
assert.match(html, /data-project-filter="ai"/);
console.log('Portfolio field static checks passed.');

const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const base = process.env.SITE_BASE_URL || 'http://localhost:8000';
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(base);
  await page.waitForTimeout(1100);
  const scene = page.locator('.fieldScene');
  await scene.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.fieldScene').dataset.active === 'true');
  const boxes = await page.locator('.personaStation').evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON()));
  const pose = await page.locator('.personaAnimated').first().evaluate(el => getComputedStyle(el).backgroundPosition);
  await page.waitForTimeout(1150);
  assert.notEqual(await page.locator('.personaAnimated').first().evaluate(el => getComputedStyle(el).backgroundPosition), pose);
  assert.deepEqual(await page.locator('.personaStation').evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON())), boxes);
  await page.locator('.personaStation').first().hover();
  assert.ok((await page.locator('.personaAnimated').first().evaluate(el => getComputedStyle(el).animationPlayState)).split(', ').every(state => state === 'paused'));
  await page.mouse.move(0, 0);
  await page.screenshot({ path: '/tmp/portfolio-field-motion-0.png' });
  await page.waitForTimeout(4200);
  await page.screenshot({ path: '/tmp/portfolio-field-motion-1.png' });
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.equal(await scene.getAttribute('data-active'), 'false');
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForFunction(() => document.querySelector('.fieldScene').dataset.active === 'true');
  await page.locator('[data-persona="ai-engineer"]').click();
  await page.waitForFunction(() => location.hash === '#portfolio');
  assert.ok(await page.locator('[data-project-filter="ai"]').evaluate(el => el.classList.contains('active')));
  assert.ok(await page.locator('.projectIndexRow:not(.ai)').evaluateAll(els => els.length > 0 && els.every(el => el.classList.contains('projectIndexHidden'))));
  await page.waitForFunction(() => document.querySelector('.fieldScene').dataset.active === 'false');
  await page.locator('[data-persona="student"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.hash === '#resume');
  await page.locator('[data-persona="researcher"]').click();
  await page.waitForURL('**/research/');
  const native = await browser.newPage({ javaScriptEnabled: false });
  await native.goto(base);
  await native.locator('[data-persona="ai-engineer"]').click();
  assert.equal(new URL(native.url()).hash, '#portfolio');
  for (const options of [{ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } }, { viewport: { width: 390, height: 844 } }]) {
    const still = await browser.newPage(options);
    await still.goto(base);
    await still.locator('.fieldScene').scrollIntoViewIfNeeded();
    assert.equal(await still.locator('.personaStill').first().isVisible(), true);
    assert.equal(await still.locator('.personaAnimated').first().isVisible(), false);
    await still.close();
  }
  console.log('Portfolio field route, motion, stable-target, offscreen, background and no-JS checks passed.');
} finally { await browser.close(); }
