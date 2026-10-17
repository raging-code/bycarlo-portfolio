#!/usr/bin/env node
/**
 * byCarlo - Ion Ember palette patch (Nocturne indigo + mint -> burnt vermilion + amber)
 *
 * Drop this file in the repo root (next to package.json) and run:
 *   node apply-ember-palette.mjs            apply
 *   node apply-ember-palette.mjs --dry      show what would change, write nothing
 *   node apply-ember-palette.mjs --revert   restore the .bak-ember backups
 *
 * Only colour values change. Layout, copy, animation and logic are untouched.
 * Safe to run twice: once the old values are gone there is nothing left to replace.
 * Backups are written once per file as <file>.bak-ember and never overwritten.
 *
 *   Base      #F8F6F5   warm porcelain (was #F4F5F9)
 *   Ink       #1A0D08   (was #0D1222)
 *   Muted     #6B5D57   (was #5A6277)
 *   Accent    #A32A0B   burnt vermilion, also the Work + Services bands (was #4338CA)
 *   Signal    #FFC24B   amber (was #5CD6C0)
 *   Deck      #3E1D12 / #2A1209 / #190A05   tech-stack cards (was navy ramp)
 *   Ribbon    #A32A0B -> #C73E12 -> #E8601F -> #F59A2E -> #FFC24B
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry");
const REVERT = process.argv.includes("--revert");
const BAK = ".bak-ember";

/* ------------------------------------------------------------------ palette */
// current (Nocturne) hex -> Ember hex, matched case-insensitively
const HEX = [
  ["#F4F5F9", "#F8F6F5"], // base / background
  ["#0D1222", "#1A0D08"], // ink
  ["#5A6277", "#6B5D57"], // muted text
  ["#4338CA", "#A32A0B"], // accent (bands, links, focus, intro curtain)
  ["#5CD6C0", "#FFC24B"], // signal (mint -> amber)
  ["#E6E9F0", "#EEE9E6"], // surface
  ["#D8DCE6", "#E0D8D3"], // surface 2
  ["#F0F2F8", "#F3EFEC"], // intro portrait ring
  ["#E8EBF4", "#EDE6E2"], // intro portrait ring
  ["#2C3354", "#3E1D12"], // tech card, lit corner
  ["#1C2240", "#2A1209"], // tech card, base
  ["#121730", "#190A05"], // tech card, shaded corner
];

// current rgb triplet -> Ember triplet (alpha and spacing are kept as written)
const RGB = [
  [[67, 56, 202], [163, 42, 11]],     // accent
  [[92, 214, 192], [255, 194, 75]],   // signal
  [[244, 245, 249], [248, 246, 245]], // base
  [[13, 18, 34], [26, 13, 8]],        // ink
  [[251, 251, 253], [252, 251, 250]], // glass tint
  [[17, 17, 26], [26, 13, 8]],        // glass shadow (was off-palette)
  [[31, 38, 135], [26, 13, 8]],       // glass glow (was off-palette blue)
  // Contact threads ribbon: indigo ramp -> ember ramp (ends in amber via the signal rule above)
  [[79, 70, 229], [199, 62, 18]],
  [[99, 102, 241], [232, 96, 31]],
  [[46, 170, 210], [245, 154, 46]],
];

// exact-string swaps in one file (for values that are shared with neutral black elsewhere)
const LITERALS = [
  {
    file: path.join("app", "page.js"),
    from: 'const dotIdle = "rgba(0,0,0,0.14)";',
    to: 'const dotIdle = "rgba(26,13,8,0.14)";', // testimonial dots: pure black -> ink
  },
];

/* --------------------------------------------------------------- file scope */
const TARGET_DIRS = [
  { dir: "app", exts: [".js", ".jsx", ".css"] },
  { dir: path.join("public", "logos"), exts: [".svg"] },
];
const TARGET_FILES = ["tailwind.config.js"];

function listTargets() {
  const out = [...TARGET_FILES];
  for (const { dir, exts } of TARGET_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      if (exts.includes(path.extname(f).toLowerCase())) out.push(path.join(dir, f));
    }
  }
  return out.filter((f) => fs.existsSync(path.join(ROOT, f)));
}

/* ------------------------------------------------------------------ helpers */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hexRe = (h) => new RegExp(esc(h) + "(?![0-9A-Fa-f])", "gi");
const rgbRe = ([r, g, b]) =>
  new RegExp(`(rgba?\\(\\s*)${r}(\\s*,\\s*)${g}(\\s*,\\s*)${b}(?=\\s*[,)])`, "g");

function transform(text, file) {
  let count = 0;
  for (const [from, to] of HEX) {
    text = text.replace(hexRe(from), () => (count++, to));
  }
  for (const [[r1, g1, b1], [r2, g2, b2]] of RGB) {
    text = text.replace(rgbRe([r1, g1, b1]), (_m, a, b, c) => (count++, `${a}${r2}${b}${g2}${c}${b2}`));
  }
  for (const lit of LITERALS) {
    if (lit.file === file && text.includes(lit.from)) {
      text = text.split(lit.from).join(lit.to);
      count++;
    }
  }
  return { text, count };
}

// after patching, anything still carrying a Nocturne value is reported (not changed)
function leftovers(text) {
  const hits = [];
  for (const [from] of HEX) if (hexRe(from).test(text)) hits.push(from);
  for (const [from] of RGB) if (rgbRe(from).test(text)) hits.push(`rgb(${from.join(",")})`);
  return hits;
}

/* --------------------------------------------------------------------- main */
if (!fs.existsSync(path.join(ROOT, "package.json")) || !fs.existsSync(path.join(ROOT, "app"))) {
  console.error("x Run this from the repo root (the folder with package.json and app/).");
  process.exit(1);
}

console.log(`\nbyCarlo - Ion Ember palette ${REVERT ? "(revert)" : DRY ? "(dry run)" : ""}\n`);

if (REVERT) {
  let restored = 0;
  for (const f of listTargets()) {
    const bak = path.join(ROOT, f + BAK);
    if (!fs.existsSync(bak)) continue;
    fs.copyFileSync(bak, path.join(ROOT, f));
    fs.unlinkSync(bak);
    console.log(`  restored  ${f}`);
    restored++;
  }
  console.log(restored ? `\nOK ${restored} file(s) restored.\n` : "Nothing to restore.\n");
  process.exit(0);
}

let changedFiles = 0;
let totalEdits = 0;
const warnings = [];

for (const f of listTargets()) {
  const abs = path.join(ROOT, f);
  const raw = fs.readFileSync(abs, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n"; // keep the file's own line endings
  const { text, count } = transform(raw.replace(/\r\n/g, "\n"), f);

  const left = leftovers(text);
  if (left.length) warnings.push(`${f}: still contains ${left.join(", ")}`);
  if (!count) continue;

  if (!DRY) {
    const bak = abs + BAK;
    if (!fs.existsSync(bak)) fs.writeFileSync(bak, raw); // never overwrite the first backup
    fs.writeFileSync(abs, eol === "\r\n" ? text.replace(/\n/g, "\r\n") : text);
  }
  console.log(`  ${DRY ? "would change" : "patched"}  ${f.padEnd(34)} ${count} colour value(s)`);
  changedFiles++;
  totalEdits += count;
}

if (warnings.length) {
  console.log("\n! Check these by hand:");
  for (const w of warnings) console.log(`  ${w}`);
}

if (!changedFiles) {
  console.log("  Nothing to do. The Ion Ember palette is already applied.\n");
} else if (DRY) {
  console.log(`\nDry run: ${totalEdits} value(s) in ${changedFiles} file(s). Nothing written.\n`);
} else {
  console.log(`\nOK ${totalEdits} value(s) updated in ${changedFiles} file(s). Backups saved as *${BAK}.`);
  console.log("  Next: npm run dev, check the site, then delete the *.bak-ember files.");
  console.log("  Undo anytime: node apply-ember-palette.mjs --revert\n");
}
