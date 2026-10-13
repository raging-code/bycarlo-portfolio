#!/usr/bin/env node
/**
 * fix-brush-viewport.mjs
 *
 * Fixes the strip at the bottom of the screen that the About brush leaves
 * unpainted on phones.
 *
 * Why it happened: the pinned About area (.ip-pin) and the brush canvas inside
 * it were sized 100svh, the SMALL viewport (browser URL bar showing). Once you
 * scroll, the mobile browser collapses the URL bar and the visible area grows to
 * the LARGE viewport (lvh), so a strip as tall as the URL bar was left uncovered
 * and showed the page background.
 *
 * The fix (CSS only, one marked block appended to app/globals.css):
 *   - the pin, and so the canvas, is sized to the LARGE viewport (100lvh), so the
 *     brush covers the whole screen whether the URL bar is shown or hidden
 *   - the About content stays centered in the SMALL viewport, so the text and
 *     photo sit exactly where they did before
 *   - the track keeps the same scroll length as before (4.3 x the small viewport)
 *   - browsers without lvh/svh fall back to 100vh (which on phones already means
 *     the large viewport), so older phones are covered too
 *
 * Usage (from the project root, next to package.json):
 *   node fix-brush-viewport.mjs             # apply
 *   node fix-brush-viewport.mjs --dry-run   # preview only, writes nothing
 *
 * Safe to re-run (refreshes its own block). Backup: app/globals.css.bak-brush-viewport
 * To undo: delete the block between the brush-viewport markers in app/globals.css.
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS = path.join(__dirname, "app", "globals.css");
const DRY_RUN = process.argv.includes("--dry-run");

const START = "/* brush-viewport:start */";
const END = "/* brush-viewport:end */";

const BLOCK = `${START}
/* The brush must cover the LARGE viewport (URL bar hidden) so no strip is left at the
   bottom on phones. Content stays centered in the SMALL viewport (URL bar shown). */
:root { --ab-svh: 100vh; --ab-lvh: 100vh; }
@supports (height: 100lvh) {
  :root { --ab-svh: 100svh; --ab-lvh: 100lvh; }
}
/* same scroll length as before: 4.3 x small viewport, plus the extra the taller pin adds */
.ip-track { height: calc(var(--ab-svh) * 4.3 + (var(--ab-lvh) - var(--ab-svh))); }
.ip-pin { height: var(--ab-lvh); }
.ip-pin .ip-section { min-height: var(--ab-svh); }
${END}
`;

function fail(msg) { console.error("✖ " + msg); process.exit(1); }

if (!existsSync(CSS)) fail("Run this from the project root (app/globals.css must exist).");
if (!readFileSync(CSS, "utf8").includes("about-brush:start"))
  fail("The about-brush CSS block was not found. Run apply-about-brush.mjs first.");

let css = readFileSync(CSS, "utf8");
const s = css.indexOf(START), e = css.indexOf(END);
if (s !== -1 && e !== -1 && e > s) {
  css = css.slice(0, s) + BLOCK.trimEnd() + css.slice(e + END.length);
  console.log("✔ globals.css: brush-viewport block refreshed.");
} else {
  css = css.trimEnd() + "\n\n" + BLOCK;
  console.log("✔ globals.css: brush-viewport block added.");
}

if (!DRY_RUN) {
  const bak = CSS + ".bak-brush-viewport";
  if (!existsSync(bak)) copyFileSync(CSS, bak);
  writeFileSync(CSS, css);
}
console.log(DRY_RUN ? "\n(dry run: nothing was written)" : "\nDone. Reload on your phone and scroll through the About section.");
