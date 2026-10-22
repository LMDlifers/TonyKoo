import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
const root = new URL('../images/portfolio-field/', import.meta.url);
const roles = ['ai-engineer', 'researcher', 'student'];
for (const name of ['field.svg', 'field-night.svg', 'ASSETS.md', ...roles.map(r => `${r}.svg`)]) {
  const data = await readFile(new URL(name, root), 'utf8');
  if (name.endsWith('.svg')) {
    assert.match(data, /<svg\b/);
    assert.doesNotMatch(data, /(?:href\s*=\s*["'](?!#)|url\(\s*["']?(?!#)|<!ENTITY|<script\b|<foreignObject\b)/i, `${name}: only internal SVG references allowed`);
  }
}
for (const role of roles) for (const [state, width] of [['idle', 256], ['walk', 384], ['still', 64]]) {
  const name = `${role}-${state}.png`;
  const data = await readFile(new URL(name, root));
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${name}: PNG signature`);
  assert.equal(data.readUInt32BE(16), width, `${name}: width`);
  assert.equal(data.readUInt32BE(20), 80, `${name}: height`);
  assert.equal(data[25], 6, `${name}: RGBA transparency`);
}
let bytes = 0;
for (const name of await readdir(root)) bytes += (await stat(new URL(name, root))).size;
assert.ok(bytes <= 600 * 1024, `scene assets exceed 600 KB: ${bytes}`);
console.log(`Portfolio field assets OK: 9 transparent sheets, 5 local SVGs; ${bytes} / 614400 bytes`);
