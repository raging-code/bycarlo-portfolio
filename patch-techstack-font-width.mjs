// patch-techstack-font-width.mjs
// Tech Stack tab buttons: slightly bigger font, wider buttons on mobile.
// Run from the project root:  node patch-techstack-font-width.mjs
//
// - Idempotent: safe to run more than once.
// - Writes a one-time backup: app/globals.css.bak-patch-techstack-font-width
//
// Phones : font  clamp(9px, 2.9vw, 16px)      -> clamp(9.5px, 3.1vw, 17px)
//          sides clamp(3px, 1.6vw, 8px)       -> clamp(4px, 1.9vw, 9px)
// Desktop: font  16px -> 17px (side padding stays 12px)
//
// Fit check (measured with the real Titillium Web metrics): all six tabs still
// fit on screens from 320px up, with the least spare room on the smallest phones.
// If it ever feels tight, lower the 1.9vw (sides) or 3.1vw (font) value.

import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "app/globals.css");

if (!fs.existsSync(file)) {
  console.error("✗ app/globals.css not found - run this from the project root");
  process.exit(1);
}

const original = fs.readFileSync(file, "utf8");
let src = original;

const EDITS = [
  ["font-size: clamp(9px, 2.9vw, 16px);", "font-size: clamp(9.5px, 3.1vw, 17px);"],
  [
    "padding: var(--ts-pad-y) clamp(3px, 1.6vw, 8px);",
    "padding: var(--ts-pad-y) clamp(4px, 1.9vw, 9px);",
  ],
  [
    ".ts-seg { font-size: 16px; padding: var(--ts-pad-y) 12px; }",
    ".ts-seg { font-size: 17px; padding: var(--ts-pad-y) 12px; }",
  ],
];

let applied = 0;
let skipped = 0;

for (const [from, to] of EDITS) {
  if (src.includes(from)) {
    src = src.replace(from, to);
    applied++;
  } else if (src.includes(to)) {
    skipped++;
  } else {
    console.warn(`  ! pattern not found, skipped -> ${from}`);
  }
}

if (src === original) {
  console.log(`= app/globals.css: already up to date (${skipped} edits already applied)`);
  process.exit(0);
}

const backup = `${file}.bak-patch-techstack-font-width`;
if (!fs.existsSync(backup)) fs.writeFileSync(backup, original);
fs.writeFileSync(file, src);

console.log(`✓ app/globals.css: ${applied} edits applied, ${skipped} already in place`);
console.log('\nDone. Restart "npm run dev" if it is running.');
