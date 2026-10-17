#!/usr/bin/env node
/**
 * byCarlo - Ion Ember palette (the board "F - Ion Ember"), applied to the CURRENT repo state
 *
 * Run from the repo root (next to package.json):
 *   node apply-ion-ember.mjs            apply
 *   node apply-ion-ember.mjs --dry      show what would change, write nothing
 *   node apply-ion-ember.mjs --revert   restore the .bak-ionember backups
 *
 * Your repo currently carries a hand-tuned "amber" palette: ink Work / Services / tech-stack
 * bands, accent #D8552B, signal #F08A5D, graphite deck. That is NOT Ion Ember. This patch
 * moves it onto the exact Ion Ember palette from the preview board:
 *
 *   Base      #F5F4F7 -> #F8F6F5      Ink       #0D1018 -> #1A0D08     Muted   #5E5F68 -> #6B5D57
 *   Accent    #D8552B -> #A32A0B      Signal    #F08A5D -> #FFC24B
 *   Surface   #E7E3E4 -> #EEE9E6      Surface 2 #DAD6D8 -> #E0D8D3
 *   Deck      #2F313E/#1B1D27/#11131B -> #3E1D12/#2A1209/#190A05
 *   Ribbon    ramp moves to vermilion -> amber
 *   Bands     Work, Services and the tech-stack band go from ink back to vermilion #A32A0B
 *             (the preview board shows them as vermilion bands with light text)
 *
 * Colour values only. Layout, copy, animation, logic, third-party brand logo colours and the
 * carlo-C logo are untouched. Also accepts a repo that had v2 --aa-accent (#BA3C17) applied.
 * Safe to run twice. Backups: <file>.bak-ionember, written once, never overwritten.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry");
const REVERT = process.argv.includes("--revert");
const BAK = ".bak-ionember";

/* ------------------------------------------------------------------ palette */
const HEX = [
  [["#F5F4F7"], "#F8F6F5"],               // base
  [["#0D1018"], "#1A0D08"],               // ink
  [["#5E5F68"], "#6B5D57"],               // muted
  [["#D8552B", "#BA3C17"], "#A32A0B"],    // accent
  [["#F08A5D"], "#FFC24B"],               // signal
  [["#E7E3E4"], "#EEE9E6"],               // surface
  [["#DAD6D8"], "#E0D8D3"],               // surface 2
  [["#F3F0F2"], "#F3EFEC"],               // intro portrait ring
  [["#EFEBEC"], "#EDE6E2"],               // intro portrait ring
  [["#2F313E"], "#3E1D12"],               // deck, lit corner
  [["#1B1D27"], "#2A1209"],               // deck, base
  [["#11131B"], "#190A05"],               // deck, shaded corner
];
const RGB = [
  [[[13, 16, 24], [17, 17, 26], [31, 38, 135]], [26, 13, 8]],  // ink tint (+ old glass shadow/glow)
  [[[245, 244, 247]], [248, 246, 245]],                         // base
  [[[240, 138, 93]], [255, 194, 75]],                           // signal
  [[[216, 85, 43], [186, 60, 23]], [163, 42, 11]],              // accent
  [[[251, 250, 252]], [252, 251, 250]],                         // glass tint
  [[[232, 102, 56]], [199, 62, 18]],                            // ribbon stop
  [[[244, 130, 84]], [232, 96, 31]],                            // ribbon stop
];

// Context rules, applied BEFORE the maps above. They handle the spots where the repo uses ink
// but Ion Ember wants the accent (the bands), and one ribbon stop that shares a value with signal.
const RULES = {
  [path.join("app", "globals.css")]: [
    [/(--tsd-accent:\s*)#0D1018/g, "$1#A32A0B"],
    [/(#work\s*\{\s*background-color:\s*)#0D1018/g, "$1#A32A0B"],
    [/(#work ::selection\s*\{[^}]*color:\s*)#0D1018/g, "$1#A32A0B"],
    [/(margin-top:\s*calc\(var\(--svc-pull\)\s*\*\s*-1\);\s*background:\s*)#0D1018/g, "$1#A32A0B"],
    [/(\.svc-section ::selection\s*\{[^}]*color:\s*)#0D1018/g, "$1#A32A0B"],
    [/(background:\s*#F5F4F7;\n\s*color:\s*)#0D1018(;)/g, "$1#A32A0B$2"],
  ],
  [path.join("app", "ContactThreads.jsx")]: [
    [/(addColorStop\(0\.78,\s*"rgba\()240,138,93/g, "$1245,154,46"],
  ],
  [path.join("app", "page.js")]: [
    [/(const AB_COLOR = ")#0D1018/g, "$1#A32A0B"], // About brush ends on the Work band colour
    [/const dotIdle = "rgba\(0,0,0,0\.14\)";/g, 'const dotIdle = "rgba(26,13,8,0.14)";'],
  ],
};

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
  for (const [re, to] of RULES[file] || []) {
    text = text.replace(re, (...m) => {
      count++;
      return to.replace(/\$(\d)/g, (_x, n) => m[Number(n)] ?? "");
    });
  }
  for (const [olds, to] of HEX) {
    for (const from of olds) text = text.replace(hexRe(from), () => (count++, to));
  }
  for (const [olds, [r2, g2, b2]] of RGB) {
    for (const from of olds) {
      text = text.replace(rgbRe(from), (_m, a, b, c) => (count++, `${a}${r2}${b}${g2}${c}${b2}`));
    }
  }
  return { text, count };
}

/* --------------------------------------------------------------------- main */
if (!fs.existsSync(path.join(ROOT, "package.json")) || !fs.existsSync(path.join(ROOT, "app"))) {
  console.error("x Run this from the repo root (the folder with package.json and app/).");
  process.exit(1);
}

console.log(`\nbyCarlo - Ion Ember ${REVERT ? "(revert)" : DRY ? "(dry run)" : ""}\n`);

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
  console.log("  Nothing to do. Ion Ember is already applied.\n");
} else if (DRY) {
  console.log(`\nDry run: ${totalEdits} value(s) in ${changedFiles} file(s). Nothing written.\n`);
} else {
  console.log(`\nOK ${totalEdits} value(s) updated in ${changedFiles} file(s). Backups saved as *${BAK}.`);
  console.log("  Next: npm run dev, check the site, then delete the *.bak-ionember files.");
  console.log("  Undo anytime: node apply-ion-ember.mjs --revert\n");
}
