#!/usr/bin/env node
/**
 * byCarlo - Ember/amber palette, v2 (cleanup of the CURRENT repo state)
 *
 * Run from the repo root (next to package.json):
 *   node apply-ember-palette-v2.mjs                 apply the cleanup
 *   node apply-ember-palette-v2.mjs --dry           show what would change, write nothing
 *   node apply-ember-palette-v2.mjs --aa-accent     cleanup + darken the accent so small text passes WCAG AA
 *   node apply-ember-palette-v2.mjs --revert        restore the .bak-ember2 backups
 *
 * This targets the state the repo is in now (ink #0D1018, accent #D8552B, signal #F08A5D,
 * ink Work / Services / tech-stack bands, graphite deck). It does NOT re-theme anything.
 *
 * Default cleanup (colour values only):
 *   1. GlassSurface.css shadows/glow: leftover navy rgba(17,17,26) and blue rgba(31,38,135)
 *      -> ink tint rgba(13,16,24).
 *   2. Testimonial dots in page.js: pure black rgba(0,0,0,0.14) -> ink tint.
 *
 * Optional --aa-accent:
 *   Accent #D8552B on porcelain is 3.65:1, which passes for large text but fails WCAG AA for
 *   small text (e.g. initials/labels/buttons that sit on an accent fill). #BA3C17 is the same
 *   hue at 5.1:1. It also moves every rgba(216,85,43,...) to rgba(186,60,23,...).
 *   Off by default because your carlo-C logo (#DD4A1D) matches #D8552B almost exactly.
 *
 * Untouched: layout, copy, animation, logic, third-party brand logo colours, the logo SVGs,
 * neutral black drop shadows, the ribbon ramp. Safe to run twice.
 * Backups: <file>.bak-ember2, written once and never overwritten.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry");
const REVERT = process.argv.includes("--revert");
const AA = process.argv.includes("--aa-accent");
const BAK = ".bak-ember2";

/* ------------------------------------------------------------------ palette */
const HEX = AA ? [["#D8552B", "#BA3C17"]] : [];
const RGB = [
  [[17, 17, 26], [13, 16, 24]],   // glass shadow (was navy)
  [[31, 38, 135], [13, 16, 24]],  // glass glow (was blue)
  ...(AA ? [[[216, 85, 43], [186, 60, 23]]] : []),
];
const PAGE = path.join("app", "page.js");
const LITERALS = [
  { file: PAGE, from: 'const dotIdle = "rgba(0,0,0,0.14)";', to: 'const dotIdle = "rgba(13,16,24,0.14)";' },
];

/* --------------------------------------------------------------- file scope */
const TARGET_DIRS = [{ dir: "app", exts: [".js", ".jsx", ".css"] }];
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
  for (const [from, to] of HEX) text = text.replace(hexRe(from), () => (count++, to));
  for (const [from, [r2, g2, b2]] of RGB) {
    text = text.replace(rgbRe(from), (_m, a, b, c) => (count++, `${a}${r2}${b}${g2}${c}${b2}`));
  }
  for (const lit of LITERALS) {
    if (lit.file === file && text.includes(lit.from)) {
      text = text.split(lit.from).join(lit.to);
      count++;
    }
  }
  return { text, count };
}

/* --------------------------------------------------------------------- main */
if (!fs.existsSync(path.join(ROOT, "package.json")) || !fs.existsSync(path.join(ROOT, "app"))) {
  console.error("x Run this from the repo root (the folder with package.json and app/).");
  process.exit(1);
}

console.log(`\nbyCarlo - Ember v2 ${REVERT ? "(revert)" : DRY ? "(dry run)" : ""}${AA ? " [aa-accent]" : ""}\n`);

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

for (const f of listTargets()) {
  const abs = path.join(ROOT, f);
  const raw = fs.readFileSync(abs, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n"; // keep the file's own line endings
  const { text, count } = transform(raw.replace(/\r\n/g, "\n"), f);
  if (!count) continue;

  if (!DRY) {
    const bak = abs + BAK;
    if (!fs.existsSync(bak)) fs.writeFileSync(bak, raw); // never overwrite the first backup
    fs.writeFileSync(abs, eol === "\r\n" ? text.replace(/\n/g, "\r\n") : text);
  }
  console.log(`  ${DRY ? "would change" : "patched"}  ${f.padEnd(34)} ${count} value(s)`);
  changedFiles++;
  totalEdits += count;
}

if (!changedFiles) {
  console.log("  Nothing to do. Already up to date.\n");
} else if (DRY) {
  console.log(`\nDry run: ${totalEdits} value(s) in ${changedFiles} file(s). Nothing written.\n`);
} else {
  console.log(`\nOK ${totalEdits} value(s) updated in ${changedFiles} file(s). Backups saved as *${BAK}.`);
  console.log("  Next: npm run dev, check the site, then delete the *.bak-ember2 files.");
  console.log("  Undo anytime: node apply-ember-palette-v2.mjs --revert\n");
}
