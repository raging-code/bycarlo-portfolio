#!/usr/bin/env node
/**
 * byCarlo - hero background: white -> stone (the Vermilion Pop base, #EBE9E1)
 *
 * Run from the repo root (next to package.json):
 *   node patch-hero-stone.mjs            apply
 *   node patch-hero-stone.mjs --dry      show what would change, write nothing
 *   node patch-hero-stone.mjs --revert   restore the .bak-herostone backup
 *
 * Only the hero block in app/page.js (between {/* hero-threads:start *\/} and
 * {/* hero-threads:end *\/}) is touched:
 *   - the white layer behind the threads        #FFFFFF            -> LIGHT.bg (#EBE9E1)
 *   - the start of the existing bottom fade     rgba(255,255,255,0) -> rgba(235,233,225,0)
 * The fade is the gradient that is already there; nothing new is added.
 * Every other white in the repo (button hover, intro curtain, glass highlights) is left alone.
 * Safe to run twice. Backup is written once and never overwritten.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry");
const REVERT = process.argv.includes("--revert");
const FILE = path.join("app", "page.js");
const BAK = ".bak-herostone";
const abs = path.join(ROOT, FILE);

if (!fs.existsSync(path.join(ROOT, "package.json")) || !fs.existsSync(abs)) {
  console.error("x Run this from the repo root (the folder with package.json and app/).");
  process.exit(1);
}
console.log(`\nbyCarlo - hero stone ${REVERT ? "(revert)" : DRY ? "(dry run)" : ""}\n`);

if (REVERT) {
  if (!fs.existsSync(abs + BAK)) { console.log("Nothing to restore.\n"); process.exit(0); }
  fs.copyFileSync(abs + BAK, abs);
  fs.unlinkSync(abs + BAK);
  console.log(`  restored  ${FILE}\n`);
  process.exit(0);
}

const raw = fs.readFileSync(abs, "utf8");
const eol = raw.includes("\r\n") ? "\r\n" : "\n";
const src = raw.replace(/\r\n/g, "\n");

const BLOCK = /\{\/\* hero-threads:start \*\/\}[\s\S]*?\{\/\* hero-threads:end \*\/\}/;
const m = src.match(BLOCK);
if (!m) {
  console.error("x Could not find the hero-threads block in app/page.js. Nothing changed.\n");
  process.exit(1);
}

let count = 0;
const block = m[0]
  .replace(/background:\s*"#FFFFFF"/gi, () => (count++, "background: LIGHT.bg"))
  .replace(/rgba\(255,\s*255,\s*255,\s*0\)/g, () => (count++, "rgba(235,233,225,0)"));

if (!count) {
  console.log("  Nothing to do. The hero is already on the stone background.\n");
  process.exit(0);
}

if (DRY) {
  console.log(`  would change  ${FILE}  ${count} value(s)\n\nDry run. Nothing written.\n`);
  process.exit(0);
}

if (!fs.existsSync(abs + BAK)) fs.writeFileSync(abs + BAK, raw);
const out = src.replace(BLOCK, () => block);
fs.writeFileSync(abs, eol === "\r\n" ? out.replace(/\n/g, "\r\n") : out);
console.log(`  patched  ${FILE}  ${count} value(s). Backup: ${FILE}${BAK}`);
console.log("  Undo anytime: node patch-hero-stone.mjs --revert\n");
