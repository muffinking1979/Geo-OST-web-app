// Adds the Spring 2026 Geometry items to src/data/items.json.
// Starting in 2026, Ohio stopped publishing Item Release Scoring Guide PDFs; released
// items live in Cambium's Item Release Library instead, which has no per-item URLs.
// These were collected from https://irl.cambiumast.com/ohio/ (Year 2026, Grade 9-12, Math),
// keeping only Geometry standards (G.* and S.CP.*). Safe to re-run.
// Question images come from scripts/capture-2026-questions.mjs.
// Usage: node scripts/add-spring-2026.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const YEAR = 'Spring 2026';
const COLOR = '#5d4037';
const LIBRARY_URL = 'https://irl.cambiumast.com/ohio/';

const items2026 = [
  { standard: 'G.CO.11', itemId: 42818, type: 'Multiple Choice', title: 'Finding the Measure of an Unknown Angle', answer: 'B (80°)',
    text: 'Parallelogram PQRS is shown, with ∠S = 80°. What is the measure of ∠PQR? A) 40°  B) 80°  C) 100°  D) 160°' },
  { standard: 'S.CP.6', itemId: 45477, type: 'Multiple Choice', title: 'Interpreting Conditional Probability in Context', answer: 'C',
    text: 'Sloan asks people in her neighborhood what kind of music they like. Event W: a randomly selected person is an adult. Event X: a randomly selected person likes country music. W and X are dependent. What is P(X|W) in this situation?' },
  { standard: 'G.SRT.1', itemId: 26243, type: 'Equation Item', title: "Slope of Dilated Triangle's Side", answer: '2',
    text: "Triangle ABC has vertices A(0, 1), B(3, 7), and C(4, 0). Triangle A′B′C′ is created by dilating triangle ABC by a scale factor of 3 about the origin. What is the slope of side A′B′?" },
  { standard: 'G.SRT.8', itemId: 29375, type: 'Equation Item', title: 'Unknown Side', answer: '10.6 (10.6–10.7)',
    text: 'Right triangle ABC has a right angle at B, AB = 17, and ∠A = 32°. What is the length of BC? Round to the nearest tenth.' },
  { standard: 'G.GMD.6', itemId: 39150, type: 'Equation Item', title: 'Dilated Rectangular Prism', answer: '4',
    text: 'A rectangular prism measures 7 by 3 by 5. The prism is dilated so that the face with the smallest area is 240 square units. What is the scale factor of the dilation?' },
  { standard: 'G.MG.2', itemId: 47040, type: 'Equation Item', title: 'Density of Sheep in Fenced-In Area', answer: '0.05',
    text: 'A farmer has a fenced-in area for her 20 sheep. The fenced-in area is 400 square meters. What is the density, in sheep per square meter, of the fenced-in area?' },
  { standard: 'G.GMD.3', itemId: 46954, type: 'Multiple Choice', title: 'Compare Volume of Cone and Cylinder', answer: 'A',
    text: 'A cone is shown with radius r and height h. Which cylinder has the same volume as the cone? A) radius r, height ⅓h  B) radius ⅓r, height h  C) radius r, height h  D) radius r, height 3h' },
  { standard: 'G.SRT.5', itemId: 37597, type: 'Equation Item', title: 'Using Congruence to Determine Perimeter of Triangle', answer: '28 units',
    text: 'In the figure, ∠A ≅ ∠D, ∠C ≅ ∠F, DE = 9, and BC ≅ EF. Triangle ABC has sides x + 3, 8, and 2y + 1; triangle DEF has sides y + 3, 9, and x + 5. What is the perimeter of triangle ABC?' },
  { standard: 'G.MG.3', itemId: 47046, type: 'Equation Item', title: 'Determine Maximum Area Given Perimeter', answer: '4 ft × 4 ft',
    text: 'Shaina has 16 feet of fencing to put around her rectangular section of a community garden. She wants to use all the fencing and make her section as large as possible. What are the dimensions, in feet, of the section with the largest area?' },
  { standard: 'G.C.2', itemId: 46832, type: 'Equation Item', title: 'Inscribed Angle to Find Measure of Arc', answer: '110°',
    text: 'In circle O, ∠DCA measures 35° and diameter AC bisects ∠DCB. What is the measure, in degrees, of minor arc DC?' },
  { standard: 'S.CP.4', itemId: 34326, type: 'Table Item', title: 'Voters in Ohio and Michigan', answer: 'Ohio 5.6 / 2.4; Michigan 4.8 / 2.7',
    text: 'A table shows registered voters (in millions) in Ohio (8) and Michigan (7.5) in 2012, with 10.4 who voted and 5.1 who did not. The probability that a registered voter voted, given that they live in Ohio, is 70%. Complete the two-way table.' },
  { standard: 'G.GPE.4', itemId: 46722, type: 'Equation Item', title: 'Identifying Coordinates of Rectangle', answer: 'Any a, b with |a − 1|·|b − 2| = 20',
    text: 'The vertices of a rectangle are (1, 2), (1, b), (a, b), and (a, 2). The area of the rectangle is 20 square units. Enter possible values for a and b.' },
];

const file = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/items.json');
const data = JSON.parse(readFileSync(file, 'utf8'));

if (!data.years.some((y) => y.label === YEAR)) {
  data.years.push({ label: YEAR, color: COLOR });
}

for (const std of Object.values(data.standards)) {
  std.items = std.items.filter((item) => item.year !== YEAR);
}

for (const { standard, itemId, type, title, answer, text } of items2026) {
  const std = data.standards[standard];
  if (!std) throw new Error(`Unknown standard ${standard}`);
  const item = {
    year: YEAR, question: `Item ${itemId}`, type, answer, title, text,
    // Screenshot captured by scripts/capture-2026-questions.mjs.
    images: [`questions/2026/${itemId}.png`],
    libraryUrl: LIBRARY_URL,
  };
  std.items.push(item);
}

writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`Added ${items2026.length} ${YEAR} items to ${file}`);
