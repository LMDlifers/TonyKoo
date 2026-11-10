import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const html = read("../index.html");
const cssDir = new URL("../css/", import.meta.url);
const css = fs
  .readdirSync(cssDir)
  .filter((f) => f.endsWith(".css") && !["all.min.css", "superslides.css"].includes(f))
  .map((f) => fs.readFileSync(new URL(f, cssDir), "utf8"))
  .join("\n");

const heroBlock = html.slice(html.indexOf('<header id="heroSection"'), html.indexOf("</header>"));

assert.doesNotMatch(html, /heroGuideLine/, "hero offers projects or contact, not chat");
assert.match(html, /<a class="nav-link" href="chat\/"/, "nav Chat link kept");
assert.equal((heroBlock.match(/heroButtonPrimary/g) || []).length, 1, "one primary hero action");
assert.doesNotMatch(heroBlock, /heroEyebrow/, "no hero eyebrow");

assert.doesNotMatch(html, /heroGuideLine|projectDeckEyebrow|sectionKicker|bookCarouselEyebrow/, "no eyebrow markup left");
assert.doesNotMatch(css, /\.heroGuideLine|\.heroEyebrow|\.sectionKicker|\.projectDeckEyebrow|\.bookCarouselEyebrow/, "no eyebrow css left");
assert.match(css, /\.heroButtonSecondary\s*\{[^}]*background:\s*transparent/, "secondary hero button is outlined");
assert.doesNotMatch(html, /<h4[^>]*>[\s\S]*?<(em|i)\b[\s\S]*?<\/h4>/, "no italics or icon-font <i> inside h4");
assert.doesNotMatch(html, /class="dot |console-dots/, "no decorative window dots");
assert.match(html, /<h3>Data Scientist Intern, SKEZI<\/h3>/, "role reads as a phrase");
assert.doesNotMatch(html, /Explore the AI Engineering Research[^<]*→/, "no glued arrow");
assert.doesNotMatch(html, /&bull;|[·•]/, "no middle-dot meta strings");

assert.doesNotMatch(heroBlock, /class="fieldScene"/, "field scene not in hero");
const iPortfolioEnd = html.indexOf("</section>", html.indexOf('id="portfolio"'));
const iField = html.indexOf('id="field"');
assert.ok(iField > iPortfolioEnd && iField < html.indexOf('id="proof"'), "field between projects and proof");

console.log("Polish checks passed.");
