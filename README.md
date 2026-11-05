# Ohio Geometry OST — Released Items by Standard

Vite + React viewer for released Ohio Geometry OST items, grouped by standard. Each card's "View question" button opens the released question (and, for 2016–2025, its scoring guidelines) in a pop-up. Everything is served from this app — no links to Ohio's site are needed.

## Run

```bash
npm install
npm run dev
```

`npm run build` writes a static site to `dist/`.

## Data

All items live in `src/data/items.json` (years and colors, sidebar sections, and each standard's description and items). Counts in the header, sidebar, and welcome screen are computed from it. Each item's `images` (question pages) and `scoringImages` (scoring guideline pages) point into `public/questions/<year>/`.

### 2016–2025: rendered from the PDFs

`scripts/render-pdf-questions.mjs` renders each item's pages from Ohio's Item Release Scoring Guides into WebP images. It finds each question in the PDF by its "Question N" heading, renders the question page(s) and the scoring guideline pages that follow (stopping before sample student responses), trims the margins and page footer, and writes the image paths into `items.json`.

The PDFs themselves are archived in `source-pdfs/` — keep that folder; if Ohio removes the PDFs, the script still works from these copies (it only downloads a PDF that's missing).

The original viewer also listed Practice Test items, but they didn't match the published Practice Test guide, so they were dropped (`npm run extract` skips them).

### Spring 2026 and later: screenshots from the Item Release Library

Ohio stopped publishing scoring-guide PDFs in 2026. Released items now live in Cambium's [Item Release Library](https://irl.cambiumast.com/ohio/), which renders questions in an embedded player.

- `scripts/add-spring-2026.mjs` holds the 2026 Geometry items (text, answers, image paths) and merges them into `items.json`.
- `scripts/capture-2026-questions.mjs` takes the screenshots by driving your installed Chrome through the library (add `--headed` to watch it).

### Rebuilding the data from scratch

The scripts are safe to re-run. In order:

```bash
npm run extract -- path/to/ohio_geometry_items.html
```

```bash
node scripts/add-spring-2026.mjs
```

```bash
node scripts/render-pdf-questions.mjs
```

```bash
node scripts/capture-2026-questions.mjs
```
