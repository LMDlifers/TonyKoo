import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

function decodeHtmlAttribute(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function metaContent(key) {
  const tag = [...html.matchAll(/<meta\b[^>]*>/gs)]
    .map((match) => match[0])
    .find(
      (candidate) =>
        candidate.includes(`property="${key}"`) ||
        candidate.includes(`name="${key}"`),
    );

  assert.ok(tag, `Missing meta tag: ${key}`);
  const content = tag.match(/\bcontent="([^"]*)"/s);
  assert.ok(content, `Missing content attribute: ${key}`);
  return decodeHtmlAttribute(content[1]);
}

const socialImageUrl =
  "https://lmdlifers.github.io/TonyKoo/images/portfolio/linkedin-preview.png";
const socialTitle = "Tony Koo — AI, Data & Quant Systems Portfolio";
const socialDescription =
  "Case studies in agentic analytics, legal NLP, quantitative engineering, and privacy-safe data systems.";

const expectedMetadata = new Map([
  ["og:type", "website"],
  ["og:title", socialTitle],
  ["og:description", socialDescription],
  ["og:url", "https://lmdlifers.github.io/TonyKoo/"],
  ["og:image", socialImageUrl],
  ["og:image:secure_url", socialImageUrl],
  ["og:image:type", "image/png"],
  ["og:image:width", "1200"],
  ["og:image:height", "627"],
  ["og:image:alt", "Tony Koo — AI, Data & Quant Systems portfolio preview"],
  ["twitter:card", "summary_large_image"],
  ["twitter:title", socialTitle],
  ["twitter:description", socialDescription],
  ["twitter:image", socialImageUrl],
]);

for (const [key, expected] of expectedMetadata) {
  assert.equal(metaContent(key), expected, `${key} has the wrong value`);
}

const png = fs.readFileSync(
  new URL("../images/portfolio/linkedin-preview.png", import.meta.url),
);
assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
assert.deepEqual(
  [png.readUInt32BE(16), png.readUInt32BE(20)],
  [1200, 627],
);
assert.ok(png.byteLength <= 5 * 1024 * 1024, "Preview image exceeds 5 MB");

for (const staleCopy of [
  /NUS Business Analytics student/,
  /expectedGraduation/,
  /Expected Graduation/,
  /\bCV extraction\b/,
  /walk-forward optimization/,
  /order management system \(OMS\)/,
]) {
  assert.doesNotMatch(html, staleCopy);
}

assert.match(
  html,
  /"graduation"<\/span>:\s*<span class="json-string">"Jun\s+2026"/,
);
assert.match(html, /Graduated:<b> Jun 2026<\/b>/);
assert.match(html, /field-level questionnaire extraction accuracy/i);
assert.match(html, /sanitized project evaluation sample/i);

const heroActions = html.match(
  /<div class="heroActions"[^>]*>([\s\S]*?)<\/div>/,
)?.[0];
assert.ok(heroActions, "Missing hero actions");
assert.equal(
  [...heroActions.matchAll(/class="heroButton\b/g)].length,
  2,
  "Hero must contain exactly two actions",
);
assert.match(heroActions, /View Projects/);
assert.match(heroActions, /Download Résumé/);
assert.match(heroActions, /download="Resume_TonyKooYeLong\.pdf"/);

assert.equal(
  (html.match(/IBKR Mean-Reversion Trading Prototype/g) ?? []).length,
  2,
);
assert.match(html, /<strong>Team project\.<\/strong>/);
assert.match(html, /<strong>Tony's contribution:<\/strong>/);
assert.match(html, /does not substantiate live profitability/i);

const repositoryLinks = [
  ...html.matchAll(
    /<a\b[^>]*href="https:\/\/github\.com\/df-Nic\/Trading-Algo"[^>]*>/g,
  ),
];
assert.equal(repositoryLinks.length, 2);
for (const [link] of repositoryLinks) {
  assert.match(link, /target="_blank"/);
  assert.match(link, /rel="noopener"/);
}

console.log("Launch-readiness checks passed.");
