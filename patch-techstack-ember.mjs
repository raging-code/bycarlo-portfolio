// patch-techstack-ember.mjs
// Makes the active Tech Stack tab a solid ember (vermilion) pill.
// Run from the project root:  node patch-techstack-ember.mjs
//
// - Idempotent: safe to run more than once.
// - Writes a one-time backup: app/page.js.bak-patch-techstack-ember
//
// Dark  : pill #FF6A4D, text #121212
// Light : pill #CC3419, text #F6F5F2

import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "app/page.js");

if (!fs.existsSync(file)) {
  console.error("✗ app/page.js not found - run this from the project root");
  process.exit(1);
}

const original = fs.readFileSync(file, "utf8");
let src = original;

const EDITS = [
  [
    'const thumbBg = useTransform(themeProgress, [0, 1], ["#F6F5F2", "#141414"]);',
    'const thumbBg = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);',
  ],
  [
    'const inkActive = useTransform(themeProgress, [0, 1], ["#141414", "#F6F5F2"]);',
    'const inkActive = useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]);',
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
  console.log(`= app/page.js: already up to date (${skipped} edits already applied)`);
  process.exit(0);
}

const backup = `${file}.bak-patch-techstack-ember`;
if (!fs.existsSync(backup)) fs.writeFileSync(backup, original);
fs.writeFileSync(file, src);

console.log(`✓ app/page.js: ${applied} edits applied, ${skipped} already in place`);
console.log('\nDone. Restart "npm run dev" if it is running.');
