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
