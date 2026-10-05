// patch-tech-stack-mobile-height.mjs
// byCarlo: reduces the height of the Tech Stack tab buttons on mobile.
//
// Why they were tall: app/globals.css has a global mobile rule
//     @media (max-width: 767px) { a, button { min-height: 44px; } }
// so every tab was forced to 44px, no matter how small the padding was.
// On top of that the tabs had 10px top/bottom padding.
//
// What this does (CSS only, app/globals.css):
//   - .ts-tab gets min-height: 0 so the 44px rule no longer applies to the tabs
//   - phone padding goes from 10px to var(--ts-pad-y) = 6px  -> tabs are ~26px tall
//   - desktop (768px and up) is untouched
// The sliding pill follows automatically because it stretches to the tab height.
//
// To change the height later, edit --ts-pad-y in app/globals.css
// (4px = even slimmer, 8px = a bit taller).
//
// Requires patch-tech-stack-mobile-fit.mjs to already be applied.
//
// Run from the project root:   node patch-tech-stack-mobile-height.mjs
// Then:                        npm run dev   (devtools, phone size)
//                               git add . && git commit -m "Shorter tech stack tabs on mobile" && git push
// A backup of globals.css goes into .patch-backups/

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

if (css.includes("--ts-pad-y")) {
  console.log("Mobile height patch is already applied. Nothing to do.");
  process.exit(0);
}
if (!css.includes(".ts-seg")) {
  fail("Could not find .ts-seg in app/globals.css. Apply patch-tech-stack-mobile-fit.mjs first.");
}

const count = (t, s) => t.split(s).length - 1;
const replaceOnce = (t, find, rep, label) => {
  const n = count(t, find);
  if (n !== 1) fail("Expected exactly 1 match for " + label + ", found " + n + ". Did globals.css change since this patch was written?");
  return t.split(find).join(rep);
};

css = replaceOnce(
  css,
  [
    ".ts-seg {",
    "  font-size: clamp(8.5px, 2.7vw, 13px);",
    "  line-height: 1.2;",
    "  padding: 10px clamp(4px, 1.5vw, 16px);",
    "}",
  ].join("\n"),
  [
    ".ts-seg {",
    "  --ts-pad-y: 6px;                     /* phone tab height: bigger number = taller tabs */",
    "  font-size: clamp(8.5px, 2.7vw, 13px);",
    "  line-height: 1.2;",
    "  padding: var(--ts-pad-y) clamp(4px, 1.5vw, 16px);",
    "}",
  ].join("\n"),
  ".ts-seg block"
);

css = replaceOnce(
  css,
  ".ts-tab {\n  transition: none !important;",
  [
    ".ts-tab {",
    "  min-height: 0;                       /* beats the global mobile `button { min-height: 44px }` */",
    "  transition: none !important;",
  ].join("\n"),
  ".ts-tab block"
);

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(cssPath, path.join(backupDir, "globals.css." + Date.now() + ".bak"));

fs.writeFileSync(cssPath, crlf ? css.replace(/\n/g, "\r\n") : css, "utf8");

console.log("Done: tech stack tabs are shorter on mobile (about 26px instead of 44px).");
console.log("(backup saved in .patch-backups/)");
console.log("");
console.log("Next steps:");
console.log("  1. npm run dev  (devtools, phone size)");
console.log('  2. git add . && git commit -m "Shorter tech stack tabs on mobile" && git push');
