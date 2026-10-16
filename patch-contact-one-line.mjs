#!/usr/bin/env node
/**
 * byCarlo - Contact: "Free consultation" + "No commitment" on ONE line (desktop / PC)
 *
 * In the Contact section these two phrases are stacked (the wrapper is a CSS grid, one span per row).
 * This patch puts them side by side on screens 768px and wider. Phones keep the stacked layout.
 *
 *   - app/ContactMorphSection.js   adds one CSS rule (inside the CSS array, after ct-tweak-v2):
 *                                  @media (min-width: 768px) { .ct-top -> flex row, centered }
 *
 * Nothing else is touched (the markup, the colors and the font sizes stay as they are).
 *
 * Usage (run from the project root, or pass the project folder):
 *   node patch-contact-one-line.mjs
 *   node patch-contact-one-line.mjs C:\path\to\bycarlo-portfolio
 *   node patch-contact-one-line.mjs --gap=1em   space between the two phrases (default .6em)
 *   node patch-contact-one-line.mjs --dry-run   show what would change, write nothing
 *   node patch-contact-one-line.mjs --revert    restore the backup
 *
 * Safe to run twice: it detects its own marker and skips. The original file is copied to
 * .patch-backups/contact-one-line/ the first time only.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const REVERT = args.includes("--revert");
const GAP = (args.find((a) => a.startsWith("--gap=")) || "").slice(6) || ".6em";
const ROOT = path.resolve(args.find((a) => !a.startsWith("--")) || process.cwd());

const FILE = path.join(ROOT, "app", "ContactMorphSection.js");
const BACKUP_DIR = path.join(ROOT, ".patch-backups", "contact-one-line");
const BACKUP = path.join(BACKUP_DIR, "ContactMorphSection.js.bak");

const MARK = "ct-one-line";

const log = (m) => console.log(m);
const fail = (m) => { console.error("\nERROR: " + m + "\nNothing was changed."); process.exit(1); };
const eolOf = (s) => (s.includes("\r\n") ? "\r\n" : "\n");
const toEol = (s, eol) => s.replace(/\r?\n/g, eol);

if (!/^[\w.%()+*/-]+$/.test(GAP)) fail('--gap has to be a plain CSS length, e.g. --gap=1em (got "' + GAP + '")');
if (!fs.existsSync(FILE)) fail("Can't find " + FILE + "\nRun this from the project root, or pass the project folder as an argument.");

/* ---------- revert ---------- */

if (REVERT) {
  if (!fs.existsSync(BACKUP)) fail("No backup found at " + BACKUP + ". Was the patch ever applied?");
  if (DRY) {
    log("[dry run] would restore app/ContactMorphSection.js from " + path.relative(ROOT, BACKUP));
  } else {
    fs.copyFileSync(BACKUP, FILE);
    log("Restored app/ContactMorphSection.js from " + path.relative(ROOT, BACKUP));
  }
  process.exit(0);
}

/* ---------- apply ---------- */

const raw = fs.readFileSync(FILE, "utf8");
const eol = eolOf(raw);
let src = raw.replace(/\r\n/g, "\n");

if (src.includes(MARK)) {
  log("Already applied (found the " + MARK + " marker in app/ContactMorphSection.js). Nothing to do.");
  process.exit(0);
}

// the last entry of the CSS array; the new rule goes right after it
const ANCHOR = '"/* /ct-tweak-v2 */"';
const count = src.split(ANCHOR).length - 1;
if (count !== 1) {
  fail("Expected to find " + ANCHOR + " exactly once in app/ContactMorphSection.js but found it " + count + " times.\n" +
       "The file was probably edited by hand since the contact tweak.");
}
if (!src.includes('<p className="ct-top">')) {
  fail('Can\'t find <p className="ct-top"> in app/ContactMorphSection.js, so there is nothing to put on one line.');
}

const RULE =
  ANCHOR + ",\n" +
  '  "/* ' + MARK + ' */",\n' +
  '  "@media (min-width:768px){.ct-root .ct-top{display:flex;flex-wrap:nowrap;justify-content:center;align-items:baseline;gap:0 ' + GAP + ';white-space:nowrap}}",\n' +
  '  "/* /' + MARK + ' */"';

src = src.replace(ANCHOR, () => RULE);
log("  ok  desktop rule added: .ct-top is a centered flex row at 768px and up (gap " + GAP + ")");

if (DRY) {
  log("\n[dry run] 1 edit would be made to app/ContactMorphSection.js. Nothing written.");
  process.exit(0);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
if (!fs.existsSync(BACKUP)) fs.copyFileSync(FILE, BACKUP);
fs.writeFileSync(FILE, toEol(src, eol));

log("\nDone. app/ContactMorphSection.js updated.");
log("Backup: " + path.relative(ROOT, BACKUP));
log("Reload the page and check the Contact section on a wide screen. Undo with: node patch-contact-one-line.mjs --revert");
