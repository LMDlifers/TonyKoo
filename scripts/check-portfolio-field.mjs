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
  for (const width of [1440, 1024, 768, 390, 320]) {
    for (const dark of [false, true]) {
      const responsive = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      await responsive.goto(base);
      await responsive.waitForTimeout(1100);
      if (dark) await responsive.evaluate(() => document.body.classList.add('dark-mode'));
      await responsive.evaluate(() => document.fonts.ready);
      await responsive.waitForTimeout(350);
      const geometry = await responsive.evaluate(() => {
        const box = el => el.getBoundingClientRect().toJSON();
        return { overflow: document.documentElement.scrollWidth > innerWidth, title: box(document.querySelector('.fieldIntro')), targets: [...document.querySelectorAll('.personaStation')].map(box), labels: [...document.querySelectorAll('.personaLabel')].map(box) };
      });
      assert.equal(geometry.overflow, false, `Overflow at ${width}`);
      for (const [index, target] of geometry.targets.entries()) {
        assert.ok(target.width >= 44 && target.height >= 44, `Touch target at ${width}`);
        assert.ok(target.top >= geometry.title.bottom, `Title overlap at ${width}`);
        for (const other of geometry.targets.slice(index + 1)) assert.ok(target.right <= other.left || other.right <= target.left || target.bottom <= other.top || other.bottom <= target.top, `Target overlap at ${width}`);
        const label = geometry.labels[index];
        assert.ok(label.left >= target.left && label.right <= target.right && label.bottom <= target.bottom, `Clipped label at ${width}`);
      }
      if (width >= 768) assert.ok(geometry.labels.every(label => label.bottom < 900), `Desktop labels below first viewport at ${width}`);
      if (width === 1440) assert.ok(geometry.labels.every(label => label.bottom < 820), 'Desktop labels should appear earlier');
      const station = responsive.locator('.personaStation').first();
      await station.focus();
      assert.ok(await station.evaluate(el => getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) >= 3), `Focus indicator at ${width}`);
      assert.equal(await responsive.locator('.personaAnimated').first().isVisible(), false);
      assert.equal(await responsive.locator('.personaStill').first().isVisible(), true);
      assert.ok(await responsive.locator('.fieldScene').evaluate(el => el.getAnimations({ subtree: true }).every(animation => animation.constructor.name !== 'CSSAnimation')));
      if (width < 768) {
        for (const position of ['start', 'center', 'end']) {
          await responsive.locator('[data-persona="researcher"]').evaluate((el, block) => el.scrollIntoView({ block }), position);
          await responsive.waitForTimeout(350);
          const blocked = await responsive.locator('.personaStation').evaluateAll(stations => {
            const navBottom = document.querySelector('#navigation').getBoundingClientRect().bottom;
            return stations.flatMap(station => {
              const rect = station.getBoundingClientRect();
              const points = [.2, .5, .8].flatMap(x => [.2, .5, .8].map(y => [rect.left + rect.width * x, rect.top + rect.height * y]));
              for (const text of station.querySelectorAll('.personaLabel, .personaDescription')) {
                const label = text.getBoundingClientRect();
                points.push([label.left + label.width / 2, label.top + label.height / 2]);
              }
              return points.filter(([x, y]) => y > navBottom + 4 && y < innerHeight - 4 && !station.contains(document.elementFromPoint(x, y))).map(([x, y]) => ({ persona: station.dataset.persona, x, y, covering: document.elementFromPoint(x, y)?.className }));
            });
          });
          assert.deepEqual(blocked, [], `Mobile persona hit area blocked at ${width}/${position}/${dark ? 'dark' : 'light'}`);
        }
        await responsive.evaluate(() => scrollTo(0, 0));
      }
      await responsive.screenshot({ path: `/tmp/portfolio-field-${width}-${dark ? 'dark' : 'light'}.png`, fullPage: false });
      await responsive.close();
    }
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(base);
  await page.waitForTimeout(1100);
  const scene = page.locator('.fieldScene');
  await scene.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.fieldScene').dataset.active === 'true');
  const motionToggle = page.locator('.fieldMotionToggle');
  await motionToggle.waitFor({ state: 'visible' });
  assert.equal(await motionToggle.getAttribute('aria-pressed'), 'false');
  assert.equal((await motionToggle.innerText()).trim(), 'Pause motion');
  await motionToggle.click();
  assert.equal(await motionToggle.getAttribute('aria-pressed'), 'true');
  assert.equal((await motionToggle.innerText()).trim(), 'Play motion');
  const allPaused = () => page.locator('.personaAnimated').evaluateAll(els => els.every(el =>
    el.getAnimations().length === 2 && el.getAnimations().every(animation => animation.playState === 'paused')));
  assert.equal(await allPaused(), true, 'Scene pause button stops all six sprite animations');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(() => document.querySelector('.fieldScene').dataset.active === 'false');
  await scene.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.fieldScene').dataset.active === 'true');
  assert.equal(await allPaused(), true, 'Scene pause persists through offscreen and reentry');
  await page.locator('[data-persona="researcher"]').focus();
  assert.equal(await allPaused(), true, 'Scene pause persists after focus moves');
  await page.locator('[data-persona="student"]').focus();
  assert.equal(await allPaused(), true, 'Scene pause persists across station focus changes');
  await motionToggle.click();
  assert.equal(await motionToggle.getAttribute('aria-pressed'), 'false');
  assert.equal((await motionToggle.innerText()).trim(), 'Pause motion');
  await page.waitForFunction(() => [...document.querySelectorAll('.personaAnimated')].every(el =>
    el.getAnimations().length === 2 && el.getAnimations().every(animation => animation.playState === 'running')));
  await motionToggle.focus();
  await page.keyboard.press('Enter');
  assert.equal(await motionToggle.getAttribute('aria-pressed'), 'true');
  assert.equal((await motionToggle.innerText()).trim(), 'Play motion');
  assert.equal(await allPaused(), true, 'Keyboard activation pauses the whole scene');
  await page.keyboard.press('Enter');
  assert.equal(await motionToggle.getAttribute('aria-pressed'), 'false');
  assert.equal((await motionToggle.innerText()).trim(), 'Pause motion');
  await page.waitForFunction(() => [...document.querySelectorAll('.personaAnimated')].every(el =>
    el.getAnimations().length === 2 && el.getAnimations().every(animation => animation.playState === 'running')));
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
  assert.equal(await native.locator('.fieldMotionToggle').isVisible(), false, 'No-JS page hides the nonfunctional motion control');
  await native.locator('[data-persona="ai-engineer"]').click();
  assert.equal(new URL(native.url()).hash, '#portfolio');
  for (const options of [{ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } }, { viewport: { width: 390, height: 844 } }]) {
    const still = await browser.newPage(options);
    await still.goto(base);
    assert.equal(await still.locator('.fieldMotionToggle').isVisible(), false, 'Hide toggle when motion is unavailable');
    await still.locator('.fieldScene').scrollIntoViewIfNeeded();
    assert.equal(await still.locator('.personaStill').first().isVisible(), true);
    assert.equal(await still.locator('.personaAnimated').first().isVisible(), false);
    await still.close();
  }
  console.log('Portfolio field route, motion, stable-target, offscreen, background and no-JS checks passed.');
} finally { await browser.close(); }
