// patch-mobile-tabs-wider-nav-shorter.mjs
// byCarlo: three small CSS tweaks (app/globals.css only).
//
//   1. Tech Stack tab buttons WIDER on phones (under 768px):
//        side padding  clamp(2px, 0.7vw, 7px) -> clamp(3px, 1.4vw, 7px)
//        (375px phone: ~3px -> ~5px per side, so each button gets about 5px wider;
//         the six tabs still fit on one row from 320px up.)
//      Desktop / tablet (768px+) is unchanged.
//
//   2. Navbar a little SHORTER on phones only (640px and below):
//        bar padding        15px -> 12px top/bottom
//        scrolled capsule   10px -> 8px top/bottom
//      Desktop navbar is unchanged.
//
//   3. Logo nudged 5px to the RIGHT (all screen sizes).
//
// Tune later (app/globals.css):
//   .ts-seg padding clamp(3px, 1.4vw, 7px)   tab width on phones
//   @media (max-width: 640px) .gnav padding  navbar height on phones
//   .gnav-brand margin-left: 5px             logo offset
//
// Safe to run more than once.
// Run from the project root:   node patch-mobile-tabs-wider-nav-shorter.mjs
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

if (css.includes("/* logo-nudge-right */")) {
  console.log("Already applied, nothing to do.");
  process.exit(0);
}

const replaceOnce = (from, to, label) => {
  const first = css.indexOf(from);
  if (first === -1) fail("Could not find: " + label);
  if (css.indexOf(from, first + 1) !== -1) fail("Found more than once: " + label);
  css = css.replace(from, () => to);
};

// 1. wider tab buttons on phones
replaceOnce(
  "padding: var(--ts-pad-y) clamp(2px, 0.7vw, 7px);",
  "padding: var(--ts-pad-y) clamp(3px, 1.4vw, 7px);",
  ".ts-seg phone side padding"
);

// 2. shorter navbar on phones
replaceOnce(
  "  .gnav { padding: 15px 10px; gap: 4px; }",
  "  .gnav { padding: 12px 10px; gap: 4px; }",
  "mobile .gnav padding"
);
replaceOnce(
  "  .gnav-wrap.is-scrolled .gnav { width: 100%; padding: 10px 10px 10px 8px; }",
  "  .gnav-wrap.is-scrolled .gnav { width: 100%; padding: 8px 10px 8px 8px; }",
  "mobile scrolled .gnav padding"
);

// 3. logo a little to the right
replaceOnce(
  ".gnav-brand:hover { transform: scale(1.06); }",
  ".gnav-brand:hover { transform: scale(1.06); }\n/* logo-nudge-right */\n.gnav-brand { margin-left: 5px; }",
  ".gnav-brand hover rule"
);

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, "globals.css." + Date.now() + ".bak"), raw, "utf8");
fs.writeFileSync(cssPath, crlf ? css.replace(/\n/g, "\r\n") : css, "utf8");

console.log("Done. Wider phone tabs, shorter phone navbar, logo nudged right.");
