import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { walkable } from '../js/portfolio-field-routing.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const base = process.env.SITE_BASE_URL || 'http://localhost:8000';

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base);
  const scene = page.locator('.fieldScene');
  const engineer = scene.locator('[data-persona="ai-engineer"]');
  assert.equal(await scene.getAttribute('data-season'), 'summer');
  const positionsBeforeSeason = await scene.locator('.personaStation').evaluateAll(els => els.map(el => [el.dataset.x, el.dataset.y]));
  await scene.locator('[data-season-choice="snow"]').click();
  assert.equal(await scene.getAttribute('data-season'), 'snow');
  const positionsAfterSeason = await scene.locator('.personaStation').evaluateAll(els => els.map(el => [el.dataset.x, el.dataset.y]));
  assert.ok(positionsAfterSeason.every((pair, i) => pair.every((value, j) => Math.abs(Number(value) - Number(positionsBeforeSeason[i][j])) < .01)), 'Changing seasons preserves character locations');
  await engineer.click();
  assert.equal(await engineer.getAttribute('aria-expanded'), 'true');
  const selectedDepths = await scene.locator('.personaStation').evaluateAll(els => els.map(el => ({ selected: el.getAttribute('aria-expanded') === 'true', depth: Number(getComputedStyle(el).zIndex) })));
  assert.ok(selectedDepths.find(item => item.selected).depth > Math.max(...selectedDepths.filter(item => !item.selected).map(item => item.depth)), 'Selected character stays above the other characters');
  assert.equal(new URL(page.url()).hash, '');
  assert.equal(await scene.locator('.fieldSelectionCard').isVisible(), true);
  assert.match(await scene.locator('.fieldSelectionCard a').getAttribute('href'), /#portfolio/);
  const before = await engineer.evaluate(el => [Number(el.dataset.x), Number(el.dataset.y)]);
  await page.waitForTimeout(180);
  assert.deepEqual(await engineer.evaluate(el => [Number(el.dataset.x), Number(el.dataset.y)]), before, 'Selected character stays paused');
  const box = await engineer.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 35, { steps: 5 });
  await page.mouse.up();
  const after = await engineer.evaluate(el => [Number(el.dataset.x), Number(el.dataset.y)]);
  assert.notDeepEqual(after, before, 'Dragging repositions the selected character');
  assert.ok(after.every(value => value >= 0 && value <= 1), 'Dropped character remains inside the map');
  await page.reload();
  const longStart = await engineer.boundingBox();
  const longWorld = await scene.locator('.fieldWorld').boundingBox();
  await page.mouse.move(longStart.x + longStart.width / 2, longStart.y + longStart.height / 2);
  await page.mouse.down();
  await page.mouse.move(longWorld.x + longWorld.width * .15, longWorld.y + longWorld.height * .55, { steps: 8 });
  await page.mouse.up();
  assert.ok(Number(await engineer.getAttribute('data-x')) <= .18, 'Long drags reach a distant walkable position');
  await page.reload();
  const researcher = scene.locator('[data-persona="researcher"]');
  const researcherPosition = await researcher.evaluate(el => [Number(el.dataset.x), Number(el.dataset.y)]);
  const worldBox = await scene.locator('.fieldWorld').boundingBox();
  const draggedBox = await engineer.boundingBox();
  await page.mouse.move(draggedBox.x + draggedBox.width / 2, draggedBox.y + draggedBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(worldBox.x + worldBox.width * researcherPosition[0], worldBox.y + worldBox.height * researcherPosition[1], { steps: 5 });
  await page.mouse.up();
  const draggedRect = await engineer.boundingBox();
  const researcherRect = await researcher.boundingBox();
  assert.ok(draggedRect.x + draggedRect.width <= researcherRect.x || researcherRect.x + researcherRect.width <= draggedRect.x || draggedRect.y + draggedRect.height <= researcherRect.y || researcherRect.y + researcherRect.height <= draggedRect.y, 'Dragged character target stays clear of the researcher');
  const separation = await scene.evaluate(el => {
    const a = el.querySelector('[data-persona="ai-engineer"]');
    const b = el.querySelector('[data-persona="researcher"]');
    return Math.hypot(Number(a.dataset.x) - Number(b.dataset.x), Number(a.dataset.y) - Number(b.dataset.y));
  });
  assert.ok(separation >= .09, 'Characters cannot be dropped on top of one another');
  await page.keyboard.press('Escape');
  assert.notEqual(await engineer.getAttribute('aria-expanded'), 'true');
  await scene.locator('[data-season-choice="snow"]').click();
  const researcherBeforeCast = await researcher.evaluate(el => [Number(el.dataset.x), Number(el.dataset.y)]);
  await scene.locator('[data-cast-choice="ideas"]').click();
  assert.equal(await scene.getAttribute('data-cast'), 'ideas');
  assert.equal(await scene.getAttribute('data-season'), 'snow', 'Cast switching preserves the chosen season');
  assert.ok((await researcher.evaluate(el => [Number(el.dataset.x), Number(el.dataset.y)])).every((value, index) => Math.abs(value - researcherBeforeCast[index]) < .01), 'Researcher stays in place during cast switch');
  const writer = scene.locator('[data-persona="writer"]');
  const writerStart = await writer.evaluate(el => [Number(el.dataset.x), Number(el.dataset.y)]);
  const writerBox = await writer.boundingBox();
  await page.mouse.move(writerBox.x + writerBox.width / 2, writerBox.y + writerBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(writerBox.x + writerBox.width / 2 + 55, writerBox.y + writerBox.height / 2 + 20, { steps: 5 });
  await page.mouse.up();
  const writerDropped = await writer.evaluate(el => [Number(el.dataset.x), Number(el.dataset.y)]);
  assert.notDeepEqual(writerDropped, writerStart, 'Writer can be dragged');
  await scene.locator('[data-cast-choice="work"]').click();
  assert.equal(await scene.locator('.fieldSelectionCard').isVisible(), false, 'Cast switch closes an open card');
  await scene.locator('[data-cast-choice="ideas"]').click();
  assert.deepEqual(await writer.evaluate(el => [Number(el.dataset.x), Number(el.dataset.y)]), writerDropped, 'Writer returns to the last position');
  assert.equal(await scene.locator('[data-persona="reader"]').isVisible(), true);
  await scene.locator('[data-cast-choice="work"]').click();
  await scene.locator('[data-persona="researcher"]').click();
  assert.match(await scene.locator('.fieldSelectionLink').getAttribute('href'), /research\//);
  await scene.locator('.fieldSelectionLink').click();
  await page.waitForURL('**/research/');
  await page.close();

  const roaming = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await roaming.goto(base);
  const roamingScene = roaming.locator('.fieldScene');
  const student = roamingScene.locator('[data-persona="student"]');
  const studentBox = await student.boundingBox();
  const roamingWorld = await roamingScene.locator('.fieldWorld').boundingBox();
  await roaming.mouse.move(studentBox.x + studentBox.width / 2, studentBox.y + studentBox.height / 2);
  await roaming.mouse.down();
  await roaming.mouse.move(roamingWorld.x + roamingWorld.width * .86, roamingWorld.y + roamingWorld.height * .51, { steps: 8 });
  await roaming.mouse.up();
  assert.ok(Number(await student.getAttribute('data-x')) > .83, 'Student can be placed beyond the scenery');
  const cardLinkOnTop = await roamingScene.locator('.fieldSelectionLink').evaluate(link => {
    const box = link.getBoundingClientRect();
    return link.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  });
  assert.ok(cardLinkOnTop, 'The destination card stays clickable above selected characters');
  await roaming.keyboard.press('Escape');
  for (let sample = 0; sample < 30; sample++) {
    const [x, y] = await student.evaluate(el => [Number(el.dataset.x), Number(el.dataset.y)]);
    assert.ok(walkable(x, y), `Wandering student entered scenery at ${x}, ${y}`);
    const overlap = await roamingScene.locator('.personaStation').evaluateAll(els => {
      const boxes = els.map(el => el.getBoundingClientRect());
      return boxes.some((a, index) => boxes.slice(index + 1).some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top));
    });
    assert.equal(overlap, false, 'Wandering characters remain visually separate');
    await roaming.waitForTimeout(120);
  }
  await roaming.close();

  const castCollision = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await castCollision.goto(base);
  const collisionScene = castCollision.locator('.fieldScene');
  await collisionScene.scrollIntoViewIfNeeded();
  const collisionWorld = await collisionScene.locator('.fieldWorld').boundingBox();
  async function dragRole(role, x, y) {
    const box = await collisionScene.locator(`[data-persona="${role}"]`).boundingBox();
    await castCollision.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await castCollision.mouse.down();
    await castCollision.mouse.move(collisionWorld.x + collisionWorld.width * x, collisionWorld.y + collisionWorld.height * y, { steps: 8 });
    await castCollision.mouse.up();
  }
  await dragRole('student', .85, .51);
  await dragRole('ai-engineer', .68, .58);
  await dragRole('researcher', .28, .62);
  await collisionScene.locator('[data-cast-choice="ideas"]').click();
  const restoredOverlap = await collisionScene.evaluate(sceneEl => {
    const a = sceneEl.querySelector('[data-persona="writer"]').getBoundingClientRect();
    const b = sceneEl.querySelector('[data-persona="researcher"]').getBoundingClientRect();
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  });
  assert.equal(restoredOverlap, false, 'Restored cast never overlaps the shared Researcher');
  await castCollision.close();

  const still = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await still.goto(base);
  await still.locator('.fieldScene').scrollIntoViewIfNeeded();
  assert.equal(await still.locator('.personaAnimated').first().isVisible(), false);
  await still.close();
  const quietDesktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await quietDesktop.goto(base);
  const quietEngineer = quietDesktop.locator('[data-persona="ai-engineer"]');
  const quietBox = await quietEngineer.boundingBox();
  const quietBefore = Number(await quietEngineer.getAttribute('data-x'));
  await quietDesktop.mouse.move(quietBox.x + quietBox.width / 2, quietBox.y + quietBox.height / 2);
  await quietDesktop.mouse.down();
  await quietDesktop.mouse.move(quietBox.x + quietBox.width / 2 + 55, quietBox.y + quietBox.height / 2 + 20, { steps: 5 });
  await quietDesktop.mouse.up();
  assert.ok(Number(await quietEngineer.getAttribute('data-x')) > quietBefore + .03, 'Reduced motion keeps drag interaction available');
  assert.equal(await quietDesktop.locator('.personaAnimated').first().isVisible(), false);
  await quietDesktop.close();
  console.log('Interactive isometric field checks passed.');
} finally {
  await browser.close();
}
