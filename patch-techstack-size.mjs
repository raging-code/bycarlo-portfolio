// patch-techstack-size.mjs
// Tech Stack tab buttons: shorter height, slightly wider.
// Run from the project root:  node patch-techstack-size.mjs
//
// - Idempotent: safe to run more than once.
// - Writes a one-time backup: app/globals.css.bak-patch-techstack-size
//
// Height  : vertical padding 11px -> 8px (all screen sizes)
// Width   : desktop side padding 7px -> 12px, phones clamp(3px,1.4vw,7px) -> clamp(3px,1.6vw,8px)
//
// To tweak later, edit --ts-pad-y (height) and the side padding in .ts-seg.
// The pill measures the tabs automatically, so nothing in page.js needs to change.

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
  ["--ts-pad-y: 11px;", "--ts-pad-y: 8px;"],
  [
    "padding: var(--ts-pad-y) clamp(3px, 1.4vw, 7px);",
    "padding: var(--ts-pad-y) clamp(3px, 1.6vw, 8px);",
  ],
  [
    ".ts-seg { font-size: 16px; padding: 11px 7px; }",
    ".ts-seg { font-size: 16px; padding: var(--ts-pad-y) 12px; }",
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

const backup = `${file}.bak-patch-techstack-size`;
if (!fs.existsSync(backup)) fs.writeFileSync(backup, original);
fs.writeFileSync(file, src);

console.log(`✓ app/globals.css: ${applied} edits applied, ${skipped} already in place`);
console.log('\nDone. Restart "npm run dev" if it is running.');
