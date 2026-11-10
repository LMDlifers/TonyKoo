import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

// Every date on the site is the file's git add date. This check keeps it that way.
const root = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

if (git("rev-parse", "--is-shallow-repository") === "true") {
  throw new Error("check-evidence needs full git history");
}

const addDate = (path) => git("log", "--diff-filter=A", "--format=%as", "-1", "--", path);

function logEntries(html) {
  return [...html.matchAll(/<li class="logEntry"([^>]*)>([\s\S]*?)<\/li>/g)].map(([, attrs, body]) => {
    const attr = (name) => attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1];
    return {
      date: attr("data-date"),
      kind: attr("data-kind"),
      href: attr("data-href"),
      destination: attr("data-destination"),
      timeDatetime: body.match(/<time datetime="([^"]*)"/)?.[1],
    };
  });
}

function checkEntries(label, entries) {
  assert.ok(entries.length > 0, `${label}: log has entries`);
  for (const entry of entries) {
    assert.ok(entry.date && entry.kind && entry.href && entry.destination, `${label}: entry missing attributes (${entry.href})`);
    assert.equal(entry.timeDatetime, entry.date, `${label}: ${entry.href} <time> disagrees with data-date`);
    if (entry.href.startsWith("#")) continue;
    assert.ok(fs.existsSync(new URL(entry.href, root)), `${label}: ${entry.href} does not exist`);
    const gitDate = addDate(entry.href);
    if (!gitDate) throw new Error(`check-evidence needs full git history (no add date for ${entry.href})`);
    assert.equal(entry.date, gitDate, `${entry.href}: log says ${entry.date}, git says ${gitDate}`);
  }
  const dates = entries.map((entry) => entry.date);
  assert.deepEqual(dates, [...dates].sort().reverse(), `${label}: entries are newest first`);
}

const home = logEntries(read("index.html"));
const full = logEntries(read("log.html"));
checkEntries("index.html", home);
checkEntries("log.html", full);
assert.equal(home.length, 5, "homepage shows the 5 newest entries");
assert.deepEqual(home.map((e) => e.href), full.slice(0, 5).map((e) => e.href), "homepage entries are the first 5 of log.html");

// Receipts: every report states when it was added and the commit that added it.
const addSha = (path) => git("log", "--diff-filter=A", "--format=%h", "-1", "--", path);
const reports = fs.readdirSync(new URL("reports/", root)).filter((name) => name.endsWith(".html"));
for (const name of reports) {
  const path = `reports/${name}`;
  const page = read(path);
  const receipts = page.match(/<section class="reportReceipts"[\s\S]*?<\/section>/)?.[0];
  assert.ok(receipts, `${path}: has a receipts block`);
  const added = receipts.match(/<dt>Added to site<\/dt>\s*<dd><time datetime="([^"]+)"/)?.[1];
  assert.equal(added, addDate(path), `${path}: receipts date matches git`);
  const sha = receipts.match(/blob\/([0-9a-f]+)\/reports\//)?.[1];
  assert.ok(sha && sha.startsWith(addSha(path)), `${path}: receipts source commit matches git (${sha} vs ${addSha(path)})`);
}

// Project cards: "Report added" is the linked report's git add date.
const cards = [...read("index.html").matchAll(/<div class="evidenceLabel">([\s\S]*?<\/details>)\s*<\/div>([\s\S]*?)(?=<div class="evidenceLabel">|<section id="log")/g)];
assert.equal(cards.length, 11, "found all 11 project cards");
for (const [, label, rest] of cards) {
  const shown = label.match(/<dt>Report added<\/dt><dd[^>]*>(?:<time datetime="([^"]+)">)?/)?.[1] || null;
  const report = rest.match(/href="(reports\/[^"]+\.html)"/)?.[1] || null;
  assert.equal(shown, report ? addDate(report) : null, `card linking ${report || "no report"}: Report added date`);
}
console.log(`Evidence dates match git for ${full.length} log entries and ${reports.length} report receipts.`);
