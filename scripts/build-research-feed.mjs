import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const directory = path.join(root, 'research');
const hub = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
const files = [...new Set([...hub.matchAll(/<h3><a href="([^"]+\.html)"/g)].map(match => match[1]))];
const expected = [...hub.matchAll(/class="topicCard topicCard--(?:lead|secondary|row)"/g)].length;
if (files.length !== expected) throw new Error(`Expected ${expected} research essays; found ${files.length}`);

const value = (html, pattern, label) => {
  const match = html.match(pattern);
  if (!match) throw new Error(`Missing ${label}`);
  return match[1];
};
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const items = files.map(file => {
  const html = fs.readFileSync(path.join(directory, file), 'utf8');
  const title = value(html, /<h1>([^<]+)<\/h1>/, `${file} title`);
  const description = value(html, /<meta name="description" content="([^"]+)"/, `${file} description`);
  const date = value(html, /<meta name="date" content="(\d{4}-\d{2}-\d{2})"/, `${file} date`);
  const url = `https://lmdlifers.github.io/TonyKoo/research/${file}`;
  return { title, description, date, url };
}).sort((a, b) => b.date.localeCompare(a.date));

const feed = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n<title>Tony Koo Research</title>\n<link>https://lmdlifers.github.io/TonyKoo/research/</link>\n<description>Essays on machine learning, agentic systems, cloud architecture and decisions under uncertainty.</description>\n<language>en</language>\n<atom:link href="https://lmdlifers.github.io/TonyKoo/research/feed.xml" rel="self" type="application/rss+xml"/>\n${items.map(item => `<item><title>${escape(item.title)}</title><link>${item.url}</link><guid isPermaLink="true">${item.url}</guid><description>${escape(item.description)}</description><pubDate>${new Date(`${item.date}T00:00:00+08:00`).toUTCString()}</pubDate></item>`).join('\n')}\n</channel></rss>\n`;
fs.writeFileSync(path.join(directory, 'feed.xml'), feed);
console.log(`Built Research RSS feed with ${items.length} essays.`);
