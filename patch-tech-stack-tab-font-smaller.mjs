// patch-tech-stack-tab-font-smaller.mjs
// byCarlo: Tech Stack tab button text a little smaller (about 11% down).
//
//   desktop / tablet (768px+):  18px -> 16px
//   phones:  clamp(9px, 3.2vw, 18px) -> clamp(9px, 2.9vw, 16px)   (375px phone: ~12px -> ~10.9px)
//   tab height, padding and everything else stay the same.
//
// Tune later (app/globals.css, .ts-seg): the 2.9vw / 16px values and the 768px+ font-size.
//
// Requires patch-navbar-mobile-and-tab-fonts.mjs to already be applied.
// Safe to run more than once.
// Run from the project root:   node patch-tech-stack-tab-font-smaller.mjs
// Backup goes into .patch-backups/

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cssPath = path.join(root, "app", "globals.css");

if (!fs.existsSync(cssPath)) {
  console.error("Cannot find " + cssPath + "\nRun this script from the bycarlo-portfolio root folder.");
  process.exit(1);
}

const raw = fs.readFileSync(cssPath, "utf8");
const crlf = raw.includes("\r\n");
let css = raw.replace(/\r\n/g, "\n");

const fail = (msg) => {
  console.error("Patch aborted, nothing was written.\n" + msg);
  process.exit(1);
};

if (css.includes("clamp(9px, 2.9vw, 16px)")) {
  console.log("Already applied, nothing to do.");
  process.exit(0);
}

const replaceOnce = (from, to, label) => {
  const first = css.indexOf(from);
  if (first === -1) fail("Could not find: " + label + "\n(this patch needs patch-navbar-mobile-and-tab-fonts.mjs applied first)");
  if (css.indexOf(from, first + 1) !== -1) fail("Found more than once: " + label);
  css = css.replace(from, () => to);
};

replaceOnce(
  "font-size: clamp(9px, 3.2vw, 18px);  /* about 1.4x; scales down so all six tabs fit */",
  "font-size: clamp(9px, 2.9vw, 16px);  /* scales down so all six tabs fit */",
  ".ts-seg base font-size"
);
replaceOnce(
  "  .ts-seg { font-size: 18px; padding: 11px 7px; }",
  "  .ts-seg { font-size: 16px; padding: 11px 7px; }",
  ".ts-seg desktop rule"
);

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, "globals.css." + Date.now() + ".bak"), raw, "utf8");
fs.writeFileSync(cssPath, crlf ? css.replace(/\n/g, "\r\n") : css, "utf8");

console.log("Done. Tech Stack tab fonts are a little smaller.");
