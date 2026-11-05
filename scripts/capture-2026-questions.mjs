// Screenshots each Spring 2026 question from Cambium's Item Release Library into
// public/questions/2026/<itemId>.png. The library has no per-item URLs and renders
// questions in an embedded player, so this drives a real browser through the search
// results and captures the player frame at full height.
// Uses your installed Chrome (set CHROME_PATH to override).
// Usage: node scripts/capture-2026-questions.mjs [--headed]
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'public/questions/2026');
const CHROME_PATH = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const data = JSON.parse(readFileSync(resolve(root, 'src/data/items.json'), 'utf8'));
const wanted = new Map(); // title -> itemId
for (const std of Object.values(data.standards)) {
  for (const item of std.items) {
    if (item.year === 'Spring 2026') wanted.set(item.title, item.question.replace(/^Item /, ''));
  }
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: !process.argv.includes('--headed') });
const page = await browser.newPage({ viewport: { width: 1280, height: 2400 }, deviceScaleFactor: 2 });

await page.goto('https://irl.cambiumast.com/ohio/');
// The library's fixed header, toasts, and accessibility button would otherwise overlap the shots.
await page.addStyleTag({
  content: 'header.uH-unifiedHeader, footer, .cambium-accessibility-widget-button, .p-toast, .message-container { display: none !important; }',
});
for (const label of ['2026', '9-12', 'Math']) {
  await page.getByRole('checkbox', { name: label, exact: true }).check();
}
await page.getByRole('button', { name: 'Search for Items' }).click();

const currentTitle = () =>
  page.evaluate(() => (document.querySelector('main')?.innerText.match(/Item View\n+([^\n]+)\n+Item is loaded/) || [])[1]?.trim());
const position = () =>
  page.evaluate(() => (document.querySelector('main')?.innerText.match(/Item: (\d+) of (\d+)/) || []).slice(1).map(Number));

// Open any wanted item from the first results page, step back to item 1, then walk
// the whole result list with "Next".
const titles = [...wanted.keys()];
await page.waitForFunction((ts) => [...document.querySelectorAll('a')].some((a) => ts.includes(a.textContent.trim())), titles);
const firstLink = await page.evaluate((ts) => [...document.querySelectorAll('a')].map((a) => a.textContent.trim()).find((t) => ts.includes(t)), titles);
await page.getByRole('link', { name: firstLink, exact: true }).click();
await page.waitForFunction(() => /Item is loaded/.test(document.querySelector('main')?.innerText || ''));
while ((await position())[0] > 1) {
  const [at] = await position();
  await page.getByRole('button', { name: 'Previous' }).click();
  await page.waitForFunction((n) => !(document.querySelector('main')?.innerText || '').includes(`Item: ${n} of`), at);
}
const [, total] = await position();
const captured = new Set();

for (let i = 1; i <= total; i++) {
  await page.waitForFunction((n) => (document.querySelector('main')?.innerText || '').includes(`Item: ${n} of`), i);
  await page.waitForFunction(() => /Item is loaded/.test(document.querySelector('main')?.innerText || ''));
  const title = await currentTitle();
  const itemId = wanted.get(title);

  if (itemId) {
    const frameEl = page.locator('#iris-frame');
    const frame = await (await frameEl.elementHandle()).contentFrame();
    // Wait for this item (not the previous one) and its images to finish loading.
    const question = frame.locator(`#Item_${itemId} table.structure`);
    await question.waitFor();
    await frame.waitForFunction(() => [...document.images].every((img) => img.complete));
    await page.waitForTimeout(1000);
    // Let the question grow to full height instead of scrolling inside the player,
    // and hide the scroll hint.
    await frame.addStyleTag({
      content: '.theQuestions, .theQuestions > .padding { overflow: visible !important; height: auto !important; max-height: none !important; } .scroll-progress-button { display: none !important; }',
    });
    // Make the frame taller than any question so the shot never runs past its bottom edge.
    await frameEl.evaluate((el) => { el.style.height = '2200px'; });
    await page.waitForTimeout(500);
    await question.screenshot({ path: resolve(outDir, `${itemId}.png`) });
    captured.add(title);
    console.log(`✓ ${itemId}  ${title}`);
  }

  if (i < total) await page.getByRole('button', { name: 'Next' }).click();
}

await browser.close();
const missing = [...wanted.keys()].filter((t) => !captured.has(t));
if (missing.length) {
  console.error(`Not found in the library: ${missing.join('; ')}`);
  process.exit(1);
}
console.log(`Captured ${captured.size} questions into ${outDir}`);
