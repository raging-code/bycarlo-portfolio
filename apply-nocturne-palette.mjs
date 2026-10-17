#!/usr/bin/env node
/**
 * byCarlo - Nocturne palette patch (indigo + mint)
 *
 * Drop this file in the repo root (next to package.json) and run:
 *   node apply-nocturne-palette.mjs            apply
 *   node apply-nocturne-palette.mjs --dry      show what would change, write nothing
 *   node apply-nocturne-palette.mjs --revert   restore the .bak-nocturne backups
 *
 * Only colour values change. Layout, copy, animation and logic are untouched.
 * Safe to run twice: once the old values are gone there is nothing left to replace.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry");
const REVERT = process.argv.includes("--revert");
const BAK = ".bak-nocturne";

/* ------------------------------------------------------------------ palette */
// old hex -> new hex (matched case-insensitively)
const HEX = [
  ["#F6F5F2", "#F4F5F9"], // background (ivory -> porcelain)
  ["#141414", "#0D1222"], // ink
  ["#6B6762", "#5A6277"], // muted text
  ["#E02B20", "#4338CA"], // accent (red -> indigo)
  ["#C9A66B", "#5CD6C0"], // second accent (gold -> mint)
  ["#EAE6DF", "#E6E9F0"], // surface
  ["#DDD8CF", "#D8DCE6"], // surface 2
  ["#F2ECE2", "#F0F2F8"], // intro portrait ring, warm cream -> cool
  ["#EFE5D6", "#E8EBF4"], // intro portrait ring, warm cream -> cool
  ["#3C3C41", "#2C3354"], // tech card, lit corner (grey -> navy)
  ["#2D2D31", "#1C2240"], // tech card, base
  ["#1F1F22", "#121730"], // tech card, shaded corner
  ["#007AFF", "#4338CA"], // focus outline on the glass surface
];

// old rgb triplet -> new rgb triplet (alpha and spacing are kept as written)
const RGB = [
  [[224, 43, 32], [67, 56, 202]],    // accent
  [[201, 166, 107], [92, 214, 192]], // second accent
  [[246, 245, 242], [244, 245, 249]],// background
  [[20, 20, 20], [13, 18, 34]],      // ink
  [[250, 249, 246], [251, 251, 253]],// glass tint
  [[40, 30, 20], [13, 18, 34]],      // warm shadow -> cool navy shadow
  // Contact threads ribbon: crimson ramp -> indigo ramp, ending in mint (gold rule above)
  [[176, 34, 52], [67, 56, 202]],
  [[206, 38, 68], [79, 70, 229]],
  [[218, 40, 56], [99, 102, 241]],
  [[226, 84, 40], [46, 170, 210]],
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

function transform(text) {
  let count = 0;
  for (const [from, to] of HEX) {
    const re = new RegExp(esc(from) + "(?![0-9A-Fa-f])", "gi");
    text = text.replace(re, () => (count++, to));
  }
  for (const [[r1, g1, b1], [r2, g2, b2]] of RGB) {
    const re = new RegExp(
      `(rgba?\\(\\s*)${r1}(\\s*,\\s*)${g1}(\\s*,\\s*)${b1}(?=\\s*[,)])`,
      "g"
    );
    text = text.replace(re, (_m, a, b, c) => (count++, `${a}${r2}${b}${g2}${c}${b2}`));
  }
  return { text, count };
}

/* --------------------------------------------------------------------- main */
if (!fs.existsSync(path.join(ROOT, "package.json")) || !fs.existsSync(path.join(ROOT, "app"))) {
  console.error("x Run this from the repo root (the folder with package.json and app/).");
  process.exit(1);
}

console.log(`\nbyCarlo - Nocturne palette ${REVERT ? "(revert)" : DRY ? "(dry run)" : ""}\n`);

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
  const { text, count } = transform(raw.replace(/\r\n/g, "\n"));
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

if (!changedFiles) {
  console.log("  Nothing to do. The Nocturne palette is already applied.\n");
} else if (DRY) {
  console.log(`\nDry run: ${totalEdits} value(s) in ${changedFiles} file(s). Nothing written.\n`);
} else {
  console.log(`\nOK ${totalEdits} value(s) updated in ${changedFiles} file(s). Backups saved as *${BAK}.`);
  console.log("  Next: npm run dev, check the site, then delete the *.bak-nocturne files.");
  console.log("  Undo anytime: node apply-nocturne-palette.mjs --revert\n");
}
