import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.match(html, /class="fieldScene" data-season="summer" data-cast="work"/);
assert.match(html, /data-season-choice="summer"/);
assert.match(html, /data-season-choice="snow"/);
assert.match(html, /data-cast-choice="work"/);
assert.match(html, /data-cast-choice="ideas"/);
const stations = [...html.matchAll(/<a\b([^>]*class="personaStation"[^>]*)>([\s\S]*?)<\/a>/g)];
assert.equal(stations.length, 5, 'Five native persona links across two casts');
for (const [index, [, attrs, body]] of stations.entries()) {
  const [persona, href, label] = [['ai-engineer','#portfolio','AI Engineer · Projects'],['researcher','research/','Researcher · Research'],['student','#resume','Student · Background'],['writer','#writing','Writer · Writing'],['reader','#reading','Reader · Reading']][index];
  assert.ok(attrs.includes(`data-persona="${persona}"`) && attrs.includes(`href="${href}"`));
  assert.ok(body.includes(label), `Missing visible label: ${label}`);
  assert.match(body, /class="personaStill"[^>]*alt=""/);
}
assert.match(html, /href="#portfolio"[^>]*>[^<]*<i[^>]*><\/i> View Projects/);
assert.match(html, /data-project-filter="ai"/);

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const base = process.env.SITE_BASE_URL || 'http://localhost:8000';
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    for (const dark of [false, true]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await page.goto(base);
      await page.evaluate(isDark => document.body.classList.toggle('dark-mode', isDark), dark);
      await page.locator('.fieldScene').scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => {
        const rect = el => el.getBoundingClientRect().toJSON();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          intro: rect(document.querySelector('.fieldIntro')),
          world: rect(document.querySelector('.fieldWorld')),
          targets: [...document.querySelectorAll('.personaStation:not([hidden])')].map(rect),
          images: [...document.querySelectorAll('.personaStill')].map(img => img.complete && img.naturalWidth > 0),
          map: getComputedStyle(document.querySelector('.fieldWorld')).backgroundImage,
        };
      });
      assert.equal(geometry.overflow, false, `Overflow at ${width}`);
      assert.ok(geometry.images.every(Boolean), `Missing sprites at ${width}`);
      assert.equal(geometry.targets.length, 3, `Work cast shows three characters at ${width}`);
      assert.match(geometry.map, dark ? /field-summer-night\.svg/ : /field-summer\.svg/);
      assert.ok(geometry.intro.right <= geometry.world.left || geometry.intro.bottom <= geometry.world.top, `Intro overlaps world at ${width}`);
      for (const [index, target] of geometry.targets.entries()) {
        assert.ok(target.width >= 44 && target.height >= 44, `Touch target at ${width}`);
        for (const other of geometry.targets.slice(index + 1)) {
          assert.ok(target.right <= other.left || other.right <= target.left || target.bottom <= other.top || other.bottom <= target.top, `Persona overlap at ${width}`);
        }
      }
      if (width <= 390) {
        const covered = await page.evaluate(() => {
          const launcher = document.querySelector('.findAskLauncher')?.getBoundingClientRect();
          if (!launcher) return false;
          return [...document.querySelectorAll('.personaStation, .fieldSelectionCard:not([hidden])')].some(el => {
            const r = el.getBoundingClientRect();
            return r.left < launcher.right && r.right > launcher.left && r.top < launcher.bottom && r.bottom > launcher.top;
          });
        });
        assert.equal(covered, false, `Chat launcher covers field controls at ${width}`);
        await page.locator('[data-persona="student"]').click();
        assert.equal(await page.locator('.fieldSelectionCard').isVisible(), true);
        assert.equal(await page.locator('.findAskLauncher').isVisible(), false, `Chat launcher yields to the selected character card at ${width}`);
        await page.locator('.fieldSelectionClose').click();
        assert.equal(await page.locator('.findAskLauncher').isVisible(), true, `Chat launcher returns after closing the card at ${width}`);
      }
      const first = page.locator('.personaStation').first();
      await first.focus();
      assert.ok(await first.evaluate(el => getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) >= 3), `Focus indicator at ${width}`);
      assert.equal(await page.locator('.personaAnimated').first().isVisible(), false);
      assert.equal(await page.locator('.personaStill').first().isVisible(), true);
      await page.locator('[data-cast-choice="ideas"]').click();
      assert.equal(await page.locator('.fieldScene').getAttribute('data-cast'), 'ideas');
      assert.deepEqual(await page.locator('.personaStation:visible').evaluateAll(els => els.map(el => el.dataset.persona)), ['researcher','writer','reader']);
      await page.locator('[data-persona="writer"]').click();
      assert.equal(await page.locator('.fieldSelectionLink').getAttribute('href'), '#writing');
      await page.locator('[data-cast-choice="work"]').click();
      assert.equal(await page.locator('.fieldSelectionCard').isVisible(), false, 'Cast change closes the destination card');
      assert.deepEqual(await page.locator('.personaStation:visible').evaluateAll(els => els.map(el => el.dataset.persona)), ['ai-engineer','researcher','student']);
      await page.close();
    }
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base);
  const scene = page.locator('.fieldScene');
  await scene.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.fieldScene').dataset.active === 'true');
  await page.locator('[data-persona="ai-engineer"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.fieldSelectionCard').isVisible(), true);
  await page.locator('.fieldSelectionLink').click();
  await page.waitForFunction(() => location.hash === '#portfolio');
  assert.ok(await page.locator('[data-project-filter="ai"]').evaluate(el => el.classList.contains('active')));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForFunction(() => document.querySelector('.fieldScene').dataset.active === 'false');
  await page.close();

  const native = await browser.newPage({ javaScriptEnabled: false });
  await native.goto(base);
  assert.equal(await native.locator('.personaStation:visible').count(), 3);
  assert.equal(await native.locator('.fieldFallbackLinks a').count(), 2);
  assert.equal(await native.locator('.fieldFallbackLinks a').first().getAttribute('href'), '#writing');
  assert.equal(await native.locator('.fieldFallbackLinks a').last().getAttribute('href'), '#reading');
  await native.locator('[data-persona="ai-engineer"]').click();
  assert.equal(new URL(native.url()).hash, '#portfolio');
  await native.close();
  console.log('Portfolio field responsive, theme, keyboard, offscreen and no-JS checks passed.');
} finally { await browser.close(); }
