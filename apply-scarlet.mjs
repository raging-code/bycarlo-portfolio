#!/usr/bin/env node
// Changes every accent / highlight colour on the site to Scarlet red (#E02B20).
//
// Usage (run from the project root; commit first so you can review with git diff):
//   node apply-scarlet.mjs --dry-run   (shows what would change, writes nothing)
//   node apply-scarlet.mjs             (applies the patch)
//
// Replaced (11 spots):
//   app/globals.css         --accent (also drives the text-selection highlight) + one more spot
//   tailwind.config.js      the `accent` colour
//   app/page.js             LIGHT.accent, navbar accent, the 4 project accents, device mockup default
//   app/IntroAnimation.jsx  the red panel of the first-load intro
// Not touched: the gold secondary (--accent-2 #C9A66B) and the third-party brand colours of the
// tech-stack icons (Cloudflare, Postman, Jest ...).
//
// Safe to re-run. It also catches any red from the earlier colour pickers, in case one was applied.

import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry-run");
const ROOT = process.cwd();

const SCARLET = "#E02B20";
const OLD = ["#CC3419", "#A31621", "#7B1E24", "#8A1538", "#A3281E", "#B3202A", "#6E1423",
             "#D7263D", "#C8102E", "#E5483A", "#A50F2E", "#B83A26"];
const FILES = ["app/globals.css", "tailwind.config.js", "app/page.js", "app/IntroAnimation.jsx"];

let total = 0;
const out = [];
for (const rel of FILES) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    console.error(`✗ ${rel} not found. Run this from the project root.`);
    process.exit(1);
  }
  let src = fs.readFileSync(p, "utf8");
  let count = 0;
  for (const old of OLD) src = src.replace(new RegExp(old, "gi"), () => { count++; return SCARLET; });
  if (!count) { console.log(`  - skipped (nothing to change, maybe already scarlet): ${rel}`); continue; }
  console.log(`  ✓ ${rel}: ${count} replacement${count > 1 ? "s" : ""}`);
  total += count;
  out.push([p, src]);
}

console.log("");
if (DRY) {
  console.log(`Dry run: ${total} replacement(s) in ${out.length} file(s), nothing written.`);
} else {
  for (const [p, src] of out) fs.writeFileSync(p, src);
  console.log(`Done: accent is now Scarlet ${SCARLET} (${total} replacements in ${out.length} file(s)).`);
}
