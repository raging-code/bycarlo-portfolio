#!/usr/bin/env node
/**
 * patch-final.mjs  -  last two edits in app/page.js (byCarlo portfolio)
 *
 *   1. <img src="/png/me.png">  ->  <img src="/png/me-900.webp">
 *      (me.png was deleted; the webp <source> still serves every modern browser,
 *       this only fixes the fallback path so nothing points at a missing file)
 *   2. remove the unused  accent2: "#FFA2B6",  line from the LIGHT object
 *
 * Usage (repo root):
 *   node patch-final.mjs --dry-run
 *   node patch-final.mjs
 *   node patch-final.mjs --revert
 *
 * Backup: .final-backup/page.js  (add to .gitignore or delete when done)
 */
import fs from "node:fs";

const FILE = "app/page.js";
const BK = ".final-backup";
const BKFILE = BK + "/page.js";
const args = new Set(process.argv.slice(2));
const die = (m) => { console.error("\n\u2716 " + m + "\n"); process.exit(1); };

if (!fs.existsSync(FILE)) die("Missing app/page.js. Run this from the repo root.");

if (args.has("--revert")) {
  if (!fs.existsSync(BKFILE)) die("No backup found, nothing to revert.");
  fs.copyFileSync(BKFILE, FILE);
  console.log("\n\u2714 Restored app/page.js from " + BK + "/\n");
  process.exit(0);
}

const src = fs.readFileSync(FILE, "utf8");
let out = src;
const done = [];

// 1. photo fallback
const A = 'src="/png/me.png"';
const B = 'src="/png/me-900.webp"';
const countA = out.split(A).length - 1;
if (countA === 1) { out = out.replace(A, B); done.push("photo fallback -> /png/me-900.webp"); }
else if (countA > 1) die('Found src="/png/me.png" ' + countA + " times, expected 1. Not touching anything.");
else if (!out.includes(B)) die('Could not find the <img src="/png/me.png"> line. Not touching anything.');

// 2. unused accent2 (only inside the LIGHT object)
const re = /^[ \t]*accent2:[ \t]*"#FFA2B6",[ \t]*\r?\n/m;
const m = out.match(re);
if (m) {
  const idx = out.indexOf(m[0]);
  const head = out.slice(0, idx);
  const lightStart = head.lastIndexOf("const LIGHT = {");
  const between = lightStart >= 0 ? head.slice(lightStart) : "";
  if (lightStart < 0 || between.includes("};")) die("accent2 line is not inside the LIGHT object. Not touching anything.");
  // make sure nothing reads it
  if (/\.accent2\b|\baccent2\b\s*[,}]/.test(out.replace(m[0], ""))) die("Something reads accent2. Not touching anything.");
  out = out.replace(m[0], "");
  done.push("removed unused accent2 from LIGHT");
}

console.log("\nplanned edits (" + done.length + "):");
done.forEach((d) => console.log("  \u2022 app/page.js: " + d));
if (!done.length) { console.log("  nothing to do, already applied.\n"); process.exit(0); }
if (args.has("--dry-run")) { console.log("\n(dry run, nothing written)\n"); process.exit(0); }

fs.mkdirSync(BK, { recursive: true });
fs.copyFileSync(FILE, BKFILE);
fs.writeFileSync(FILE, out, "utf8");
console.log("\n\u2714 Applied. Next: npm run build   (backup in " + BK + "/, undo with --revert)\n");
