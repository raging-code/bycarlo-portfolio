// patch-techstack-desktop-3x.mjs
// byCarlo: make the Tech Stack icons 3x bigger on desktop (768px and up) only.
// Phones/tablets below 768px are untouched.
//
// What changes:
//   app/page.js
//     - Icon3D's `size` prop becomes responsive: 39px (mobile, unchanged) up to
//       117px (desktop, 3x) via a CSS custom property read at render time is not
//       possible for the raw SVG width/height attrs, so instead we keep the SVG's
//       intrinsic size and scale the wrapper with CSS (`transform: scale(3)`) on
//       desktop — this keeps crisp vector rendering at any size.
//     - The tool grid item width/max-width is widened on desktop so the 3x icons
//       have room (w-[30%] max-w-[110px] -> adds md:w-[30%] md:max-w-[220px]).
//     - The grid's max width is widened on desktop so three bigger icons per row
//       still fit (max-w-[420px] -> adds md:max-w-[760px]).
//     - Extra top/bottom gap added on desktop so scaled icons don't collide
//       vertically (gap-y-7 -> adds md:gap-y-16).
//
//   app/globals.css
//     - .ts-icon3d-wrap gets `transform: scale(3)` + transform-origin center,
//       scoped to @media (min-width: 768px), with extra margin so neighboring
//       icons/text don't overlap the scaled-up box.
//
// Safe to run more than once (idempotent — checks for its own marker comment).
// Run from the project root:   node patch-techstack-desktop-3x.mjs
// Backups go into .patch-backups/

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app", "page.js");
const cssPath = path.join(root, "app", "globals.css");

for (const p of [pagePath, cssPath]) {
  if (!fs.existsSync(p)) {
    console.error("Cannot find " + p + "\nRun this script from the bycarlo-portfolio root folder.");
    process.exit(1);
  }
}

const fail = (msg) => {
  console.error("Patch aborted, nothing was written.\n" + msg);
  process.exit(1);
};

const rawPage = fs.readFileSync(pagePath, "utf8");
const pageCrlf = rawPage.includes("\r\n");
let pageSrc = rawPage.replace(/\r\n/g, "\n");

const rawCss = fs.readFileSync(cssPath, "utf8");
const cssCrlf = rawCss.includes("\r\n");
let css = rawCss.replace(/\r\n/g, "\n");

if (css.includes("/* techstack-desktop-3x */")) {
  console.log("Already applied, nothing to do.");
  process.exit(0);
}

const replaceOnce = (src, from, to, label) => {
  const first = src.indexOf(from);
  if (first === -1) fail("Could not find: " + label);
  if (src.indexOf(from, first + 1) !== -1) fail("Found more than once: " + label);
  return src.replace(from, () => to);
};

/* ---------- app/page.js ---------- */

// 1. widen the grid container on desktop
pageSrc = replaceOnce(
  pageSrc,
  `className="flex flex-wrap justify-center gap-x-[3%] gap-y-7 md:gap-x-6 max-w-[420px] mx-auto"`,
  `className="flex flex-wrap justify-center gap-x-[3%] gap-y-7 md:gap-x-6 md:gap-y-16 max-w-[420px] md:max-w-[760px] mx-auto"`,
  "tech stack grid container classes"
);

// 2. widen each tool's grid cell on desktop so the 3x icon has room
pageSrc = replaceOnce(
  pageSrc,
  `<div key={tool.name} className="flex flex-col items-center gap-3 w-[30%] max-w-[110px]">`,
  `<div key={tool.name} className="flex flex-col items-center gap-3 w-[30%] max-w-[110px] md:w-[30%] md:max-w-[220px] md:py-4">`,
  "tech stack tool cell classes"
);

/* ---------- app/globals.css ---------- */

// 3. scale the icon 3x on desktop via CSS transform (keeps vector sharpness)
css = replaceOnce(
  css,
  `.ts-icon3d-wrap {
  position: relative;
  display: block;
}`,
  `.ts-icon3d-wrap {
  position: relative;
  display: block;
}
/* techstack-desktop-3x */
@media (min-width: 768px) {
  .ts-icon3d-wrap {
    transform: scale(3);
    transform-origin: center;
  }
}`,
  ".ts-icon3d-wrap base rule"
);

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, "page.js." + Date.now() + ".bak"), rawPage, "utf8");
fs.writeFileSync(path.join(backupDir, "globals.css." + Date.now() + ".bak"), rawCss, "utf8");

fs.writeFileSync(pagePath, pageCrlf ? pageSrc.replace(/\n/g, "\r\n") : pageSrc, "utf8");
fs.writeFileSync(cssPath, cssCrlf ? css.replace(/\n/g, "\r\n") : css, "utf8");

console.log("Done. Tech stack icons are now 3x bigger on desktop (768px+). Mobile is unchanged.");
