import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const html = read("../index.html");
const js = read("../js/script.js");
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
assert.match(html, /<a class="heroTextLink" href="#contact">/, "secondary hero action is a text link");
for (const [, inner] of html.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>/g)) assert.doesNotMatch(inner, /<(em|i)\b/, "no italics or icon-font <i> inside h4");
assert.doesNotMatch(html, /class="dot |console-dots/, "no decorative window dots");
assert.match(html, /<h3>Data Scientist Intern, SKEZI<\/h3>/, "role reads as a phrase");
assert.doesNotMatch(html, /Explore the AI Engineering Research[^<]*→/, "no glued arrow");
assert.doesNotMatch(html, /&bull;|[·•]/, "no middle-dot meta strings");

assert.match(heroBlock, /class="fieldScene"/, "field scene in hero");
assert.doesNotMatch(html, /<section id="field"/, "no separate field section");
assert.match(heroBlock, /<h2 id="fieldHeading"/, "field keeps its h2 heading");

assert.doesNotMatch(css, /#portfolioField[^{]*\{[^}]*\d+vh/, "hero min-height uses svh");

assert.match(html, /data-project-view="grid"\s+aria-pressed="true"/, "grid pressed at load");
assert.match(js, /setProjectView\("grid"\);/, "grid is the initial view");

assert.doesNotMatch(css, /transition:\s*all/, "no transition: all");
assert.doesNotMatch(css, /(^|\})\s*(html|body)[^{]*\{[^}]*overflow-x:\s*hidden/m, "html/body use overflow-x: clip");
assert.doesNotMatch(css, /min-height:\s*calc\(100vh/, "hero uses svh");
for (const sel of ["bookStage", "projectDeckCard", "fieldWorld"]) {
  const rules = [...css.matchAll(new RegExp(`\\.${sel}\\s*\\{[^}]*grid-template-columns:([^;]*);`, "g"))];
  for (const [, cols] of rules) assert.doesNotMatch(cols.replace(/minmax\([^)]*\)/g, ""), /\b1fr/, `${sel} image track uses minmax(0, 1fr)`);
}
assert.doesNotMatch(css, /(^|\})\s*\.resumeSubsection\s*\{[^}]*opacity:\s*0/m, "resume visible without JS");
assert.match(html, /documentElement\.classList\.add\('js'\)/, "js class set in head");


const labels = [...html.matchAll(/<div class="evidenceLabel">([\s\S]*?<\/details>)\s*<\/div>/g)].map((m) => m[1]);
assert.equal(labels.length, 11, "every project has an evidence label");
for (const l of labels) assert.deepEqual([...l.matchAll(/<dt>([^<]+)<\/dt>/g)].map((m) => m[1]), ["Problem", "Evidence", "Does not claim", "Built", "Stack", "Report added"], "fixed label rows");
for (const l of labels) assert.doesNotMatch(l, /<dd[^>]*>\s*<\/dd>/, "no blank label rows");
for (const l of labels) assert.match(l, /<details class="labelMore"><summary>Full label<\/summary>\s*<dl>[\s\S]*<dt>Built<\/dt>[\s\S]*<dt>Stack<\/dt>[\s\S]*<dt>Report added<\/dt>[\s\S]*<\/dl>\s*<\/details>/, "build detail behind Full label");

assert.match(html, /<a href="colophon\.html"/, "homepage links the colophon");
assert.ok(fs.existsSync(new URL("../colophon.html", import.meta.url)), "colophon page exists");

const homeCss = ["style.css", "site-theme.css", "portfolio-field.css", "log.css"].map((f) => read(`../css/${f}`)).join("\n");
assert.doesNotMatch(homeCss, /text-transform:\s*uppercase/, "homepage labels, nav and titles use sentence case");
assert.doesNotMatch(html, /class="projectDeckHeader"/, "no empty projects header box");
assert.doesNotMatch(css, /\.sectionTitle::after/, "no bar under section titles");
assert.doesNotMatch(css, /\.(btn|projectViewButton|projectViewSwitch)[^{]*\{[^}]*border-radius:\s*(999px|50px|9999px|var\(--radius-pill\))/, "chips and view switch are not pills");

const colophon = read("../colophon.html");
assert.doesNotMatch(colophon, /every date on the site/i, "colophon does not overclaim date checks");
assert.doesNotMatch(colophon, /loads every page/i, "colophon does not overclaim page coverage");
assert.doesNotMatch(colophon, /The reports carry the same note/i, "colophon does not claim every report has the note");
assert.doesNotMatch(colophon.slice(colophon.indexOf("<main")), /Karla/, "colophon prose names the current typefaces");
assert.match(colophon, /Pixelify Sans/, "colophon names the display face");

// Karla is retired on every page; pages styled with var(--font-body) load the token's definition.
const tracked = execFileSync("git", ["ls-files", "*.html"], { cwd: new URL("..", import.meta.url), encoding: "utf8" }).trim().split("\n");
const tokenCss = new Set(fs.readdirSync(cssDir).filter((f) => f.endsWith(".css") && /var\(--font-body\)/.test(fs.readFileSync(new URL(f, cssDir), "utf8"))));
for (const f of tracked) {
  const page = read(`../${f}`);
  assert.doesNotMatch(page, /Karla/, `${f}: no Karla`);
  const links = [...page.matchAll(/href="([^"]*css\/([^"/]+\.css))"/g)].map((m) => m[2]);
  if (links.some((l) => tokenCss.has(l))) assert.ok(links.includes("site-theme.css"), `${f}: uses --font-body, so it loads site-theme.css`);
}
assert.doesNotMatch(css, /Karla/, "no Karla in our CSS");

console.log("Polish checks passed.");
