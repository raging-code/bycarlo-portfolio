// patch-navbar-mobile-and-tab-fonts.mjs
// byCarlo: two changes, CSS only (app/globals.css).
//
//   1. MOBILE NAVBAR (640px and below): taller bar and bigger text.
//        bar padding   9px -> 15px (top/bottom), scrolled capsule 6px -> 10px
//        link font     clamp(9px, 2.85vw, 12px) -> clamp(10px, 3.1vw, 14px)
//        link / Contact vertical padding bumped so the buttons are taller too
//        logo 22px -> 27px, light/dark switch 36x20 -> 40x22
//      Everything still fits on one row down to 320px wide.
//
//   2. TECH STACK TAB BUTTONS: font about 1.4x.
//        desktop / tablet (768px+):  13px -> 18px   (13 x 1.4 = 18.2)
//        phones: scales with the screen, capped at 18px
//          font     clamp(9px, 2.95vw, 13px) -> clamp(9px, 3.2vw, 18px)
//          height   tab padding 9px -> 11px (desktop 8px -> 11px)
//      NOTE: on phones all six tabs must fit on ONE row (no scrolling), so a
//      full 1.4x is only possible from about 560px wide and up. On a 375px
//      phone the font goes from about 11px to 12px, which is the most that fits.
//
// Tune later (app/globals.css):
//   .ts-seg font-size clamp(...)      tab text size
//   .ts-seg --ts-pad-y                tab height
//   @media (max-width: 640px) .gnav   navbar height (padding) and the clamp() font
//
// Safe to run more than once.
// Run from the project root:   node patch-navbar-mobile-and-tab-fonts.mjs
// Then:                        npm run dev   (devtools, phone size 320 / 375 / 390)
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

if (css.includes("/* navbar-mobile-bigger */")) {
  console.log("Already applied, nothing to do.");
  process.exit(0);
}

const replaceOnce = (from, to, label) => {
  const first = css.indexOf(from);
  if (first === -1) fail("Could not find: " + label);
  if (css.indexOf(from, first + 1) !== -1) fail("Found more than once: " + label);
  css = css.replace(from, () => to);
};

/* ── 1. mobile navbar ── */
replaceOnce(
  "  .gnav { padding: 9px 10px; gap: 4px; }",
  "  /* navbar-mobile-bigger */\n  .gnav { padding: 15px 10px; gap: 4px; }",
  "mobile .gnav padding"
);
replaceOnce(
  "  .gnav-wrap.is-scrolled .gnav { width: 100%; padding: 6px 8px 6px 6px; }",
  "  .gnav-wrap.is-scrolled .gnav { width: 100%; padding: 10px 10px 10px 8px; }",
  "mobile scrolled .gnav padding"
);
replaceOnce(
  "  .gnav-brand, .gnav-wrap.is-scrolled .gnav-brand { width: 22px; height: 22px; }",
  "  .gnav-brand, .gnav-wrap.is-scrolled .gnav-brand { width: 27px; height: 27px; }",
  "mobile logo size"
);
replaceOnce(
  "  .gnav-link, .gnav-cta { font-size: clamp(9px, 2.85vw, 12px); }\n  .gnav-link { padding: 4px 0.45em; }\n  .gnav-cta  { padding: 6px 0.55em; }",
  "  .gnav-link, .gnav-cta { font-size: clamp(10px, 3.1vw, 14px); }\n  .gnav-link { padding: 7px 0.45em; }\n  .gnav-cta  { padding: 9px 0.55em; }",
  "mobile link / CTA font and padding"
);
replaceOnce(
  "  .gnav-toggle { --tw: 36px; --th: 20px; --tk: 14px; --pad: 3px; }\n  .gnav-ico { width: 9px; height: 9px; }",
  "  .gnav-toggle { --tw: 40px; --th: 22px; --tk: 16px; --pad: 3px; }\n  .gnav-ico { width: 10px; height: 10px; }",
  "mobile toggle size"
);
replaceOnce(
  "  .gnav-link { padding: 4px 0.36em; }\n  .gnav-cta  { padding: 6px 0.45em; }",
  "  .gnav-link { padding: 7px 0.36em; }\n  .gnav-cta  { padding: 9px 0.45em; }",
  "narrow-phone link / CTA padding"
);

/* ── 2. tech stack tab fonts (~1.4x) ── */
replaceOnce(
  "  --ts-pad-y: 9px;                     /* phone tab height: bigger number = taller tabs */\n  font-size: clamp(9px, 2.95vw, 13px);\n  line-height: 1.2;\n  padding: var(--ts-pad-y) clamp(3px, 1.2vw, 16px);",
  "  --ts-pad-y: 11px;                    /* tab height: bigger number = taller tabs */\n  font-size: clamp(9px, 3.2vw, 18px);  /* about 1.4x; scales down so all six tabs fit */\n  line-height: 1.2;\n  padding: var(--ts-pad-y) clamp(2px, 0.7vw, 7px);",
  ".ts-seg base rule"
);
replaceOnce(
  "  .ts-seg { font-size: 13px; padding: 8px 16px; }",
  "  .ts-seg { font-size: 18px; padding: 11px 7px; }",
  ".ts-seg desktop rule"
);

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, "globals.css." + Date.now() + ".bak"), raw, "utf8");
fs.writeFileSync(cssPath, crlf ? css.replace(/\n/g, "\r\n") : css, "utf8");

console.log("Done. Mobile navbar is taller with bigger text; tech stack tab fonts are about 1.4x.");
console.log("Next: npm run dev");
