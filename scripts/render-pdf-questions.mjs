// Renders every PDF-sourced item (2016–2025) into images under
// public/questions/<year>/ so the app works without Ohio's PDFs being online.
// For each item it renders the question page(s) and the scoring-guideline pages that
// follow (stopping before sample student responses), then records them in
// src/data/items.json as `images` and `scoringImages`.
// PDFs are cached in source-pdfs/ (downloaded from each item's pdfUrl if missing).
// Safe to re-run. Usage: node scripts/render-pdf-questions.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = resolve(root, 'src/data/items.json');
const pdfDir = resolve(root, 'source-pdfs');
const SCALE = 2; // 612pt letter page -> 1224px wide
const QUALITY = 82;

const data = JSON.parse(readFileSync(dataFile, 'utf8'));
mkdirSync(pdfDir, { recursive: true });

const docs = new Map();
async function openPdf(url) {
  const name = url.split('#')[0].split('/').pop();
  if (!docs.has(name)) {
    const file = resolve(pdfDir, name);
    if (!existsSync(file)) {
      console.log(`Downloading ${name}…`);
      const res = await fetch(url.split('#')[0]);
      if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
    const doc = await getDocument({ data: new Uint8Array(readFileSync(file)), verbosity: 0 }).promise;
    const text = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const content = await (await doc.getPage(p)).getTextContent();
      text[p] = content.items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
    }
    docs.set(name, { name, doc, text });
  }
  return docs.get(name);
}

// Page text starts with the printed page number, sometimes followed by "(2025)".
const body = (t) => t.replace(/^\S+ (\(\d{4}\) )?/, '');
const isQuestionStart = (t, n) => new RegExp(`^Question ${n ?? '\\d+'} \\d{4,}`).test(body(t));
const isCover = (t) => /Question \d+ (Question and Scoring Guidelines|Sample Responses)$/.test(t);
const isSampleResponse = (t) => /^(Sample Response|Notes on Scoring)/.test(body(t));
const isBackCover = (t) => /does not discriminate/.test(t);
// Scoring pages can start with stray text ("27343", "Drop Down Choices") before the heading.
const isScoring = (t) => /Scoring Guidelines|Rationale for/.test(body(t).slice(0, 100));

function pageRange(pdf, n, hint) {
  const { text, doc } = pdf;
  let start = hint && isQuestionStart(text[hint] || '', n) ? hint : 0;
  if (!start) start = text.findIndex((t, p) => p > 0 && isQuestionStart(t || '', n));
  if (start <= 0) throw new Error(`Question ${n} not found in ${pdf.name}`);
  if (hint && start !== hint) console.warn(`  ${pdf.name} Question ${n}: stored page ${hint}, found on page ${start}`);
  const question = [start];
  const scoring = [];
  // Some question pages also begin the scoring guidelines; what follows is scoring.
  let inScoring = /Scoring Guidelines/.test(text[start]);
  for (let p = start + 1; p <= doc.numPages; p++) {
    const t = text[p];
    if (isQuestionStart(t) || isCover(t) || isSampleResponse(t) || isBackCover(t)) break;
    if (!t) continue; // blank separator page
    inScoring ||= isScoring(t);
    (inScoring ? scoring : question).push(p);
  }
  return { question, scoring };
}

// Renders a page and trims the white margins.
async function renderPage(doc, p, outFile) {
  const page = await doc.getPage(p);
  const viewport = page.getViewport({ scale: SCALE });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  // Drop the footer (page number, copyright), which sits below 90% of the page height
  // in every guide; question content ends above ~89%.
  const { width } = canvas;
  const height = Math.floor(canvas.height * 0.9);
  const px = ctx.getImageData(0, 0, width, height).data;
  let top = height, bottom = -1, left = width, right = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (px[i] < 240 || px[i + 1] < 240 || px[i + 2] < 240) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (bottom < 0) return false; // blank page
  const pad = 24;
  const x0 = Math.max(0, left - pad), y0 = Math.max(0, top - pad);
  const w = Math.min(width, right + pad) - x0, h = Math.min(height, bottom + pad) - y0;
  const out = createCanvas(w, h);
  const octx = out.getContext('2d');
  octx.fillStyle = '#fff';
  octx.fillRect(0, 0, w, h);
  octx.drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
  writeFileSync(outFile, await out.encode('webp', QUALITY));
  return true;
}

let rendered = 0;
for (const [code, std] of Object.entries(data.standards)) {
  for (const item of std.items) {
    if (!item.pdfUrl) continue;
    const n = Number(item.question.replace(/^Q/, ''));
    const pdf = await openPdf(item.pdfUrl);
    const hint = Number(item.pdfUrl.split('#page=')[1]);
    const { question, scoring } = pageRange(pdf, n, hint);

    const slug = item.year.replace(/^Spring /, '');
    const dir = resolve(root, 'public/questions', slug);
    mkdirSync(dir, { recursive: true });
    const renderAll = async (pages, kind) => {
      const paths = [];
      for (const [k, p] of pages.entries()) {
        const rel = `questions/${slug}/${item.question}-${kind}${k + 1}.webp`;
        if (await renderPage(pdf.doc, p, resolve(root, 'public', rel))) paths.push(rel);
      }
      return paths;
    };
    item.images = await renderAll(question, 'q');
    item.scoringImages = await renderAll(scoring, 's');
    rendered++;
    console.log(`✓ ${item.year} ${item.question} (${code}): pages ${question.join(',')} + scoring ${scoring.join(',') || '—'}`);
  }
}

writeFileSync(dataFile, JSON.stringify(data, null, 2) + '\n');
console.log(`Rendered ${rendered} items.`);
