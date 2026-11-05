// One-off: converts the original single-file HTML viewer into src/data/items.json.
// Usage: node scripts/extract-items.mjs <path-to-ohio_geometry_items.html>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/extract-items.mjs <html file>');
  process.exit(1);
}
const html = readFileSync(src, 'utf8');

const decode = (s) =>
  s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();

// Sidebar: section labels followed by standard codes, in order.
const nav = html.match(/<nav class="sidebar">([\s\S]*?)<\/nav>/)[1];
const sections = [];
for (const m of nav.matchAll(/sidebar-section-label">([^<]*)<|<span class="std-code">([^<]*)</g)) {
  if (m[1] !== undefined) sections.push({ label: decode(m[1]), standards: [] });
  else sections.at(-1).standards.push(m[2]);
}

// Detail blocks: description + question cards per standard.
const standards = {};
const yearColors = {};
const detailRe = /<div class="std-detail" id="detail-([^"]+)"[\s\S]*?<p class="std-full-desc">([\s\S]*?)<\/p>([\s\S]*?)(?=<div class="std-detail"|<\/main>)/g;
const cardRe = /<div class="question-card">([\s\S]*?)<div class="card-note">[\s\S]*?<a href="([^"]+)"/g;
for (const [, code, desc, body] of html.matchAll(detailRe)) {
  const items = [];
  for (const [, card, pdfUrl] of body.matchAll(cardRe)) {
    const [, color, year] = card.match(/year-tag" style="background:([^"]+)">([^<]*)</);
    // The original's Practice items don't match the published Practice Test guide, so skip them.
    if (year === 'Practice') continue;
    yearColors[year] = color;
    const answer = card.match(/<span class="answer-key">Answer: ([\s\S]*?)<\/span>/);
    items.push({
      year,
      question: decode(card.match(/<span class="q-num">([^<]*)</)[1]),
      type: decode(card.match(/<span class="q-type">([^<]*)</)[1]),
      ...(answer ? { answer: decode(answer[1]) } : {}),
      text: decode(card.match(/<p class="question-text">([\s\S]*?)<\/p>/)[1]),
      pdfUrl,
    });
  }
  standards[code] = { description: decode(desc), items };
}

const yearOrder = Object.keys(yearColors).sort((a, b) => a.localeCompare(b));
const years = yearOrder.map((label) => ({ label, color: yearColors[label] }));

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/items.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ years, sections, standards }, null, 2) + '\n');

const total = Object.values(standards).reduce((n, s) => n + s.items.length, 0);
console.log(`Wrote ${out}: ${Object.keys(standards).length} standards, ${total} items`);
