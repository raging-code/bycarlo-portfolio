#!/usr/bin/env node
/**
 * perf-patch.mjs
 * ---------------------------------------------------------------------------
 * Targeted FPS / jank fixes for bycarlo-portfolio (app/globals.css).
 *
 * Run from the repo root:
 *   node perf-patch.mjs
 *
 * What it does and why:
 *
 * 1) Removes `will-change: background-color` left permanently on <html>
 *    and <body>. `will-change` tells the browser to keep a dedicated
 *    compositor layer alive for that element forever. Left on the two
 *    root elements, it never turns off, so the browser carries that
 *    memory/compositing overhead for the entire session even though a
 *    background-color transition on html/body happens rarely (just on
 *    theme change). Static will-change on elements that aren't actively
 *    animating is a well-documented anti-pattern.
 *
 * 2) Removes the static `will-change: background-color, transform` from
 *    `.theme-section`, which is applied to 7 full-height sections in
 *    app/page.js. That's 7 permanent extra GPU layers covering nearly
 *    the whole page at all times — expensive on layer memory and
 *    compositing cost, and the usual cause of scroll/animation jank on
 *    mid/low-end GPUs. The existing `transform: translateZ(0)` already
 *    promotes each section to its own layer for smooth scrolling, so
 *    dropping `will-change` keeps the layer-promotion benefit while
 *    removing the "always-on" memory cost. `contain: paint` is kept.
 *
 * 3) Replaces `button, a { transition: all 0.25s ... }` with an explicit
 *    property list (color, background-color, border-color, box-shadow,
 *    transform, opacity). `transition: all` forces the browser to watch
 *    every animatable CSS property — including layout-triggering ones
 *    like width/height/padding — for changes on every button/link in
 *    the page. Scoping it to the properties actually used keeps the same
 *    visual transitions while cutting that per-element watch cost.
 *
 * The script is idempotent: running it twice is a no-op on the second run.
 * It only edits app/globals.css and makes a .bak backup before writing.
 * ---------------------------------------------------------------------------
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const CSS_PATH = resolve(process.cwd(), "app/globals.css");

if (!existsSync(CSS_PATH)) {
  console.error(`✗ Could not find ${CSS_PATH}`);
  console.error("  Run this script from the root of the bycarlo-portfolio repo.");
  process.exit(1);
}

let css = readFileSync(CSS_PATH, "utf8");
const original = css;
let changes = 0;

/** Apply a single find/replace, warn if the pattern isn't found (already patched or file changed). */
function patch(label, pattern, replacement) {
  if (!pattern.test(css)) {
    console.log(`• ${label}: pattern not found — already patched or file has changed, skipping.`);
    return;
  }
  css = css.replace(pattern, replacement);
  changes++;
  console.log(`✓ ${label}`);
}

/* 1) html { ... will-change: background-color; ... } */
patch(
  "Removed static will-change from <html>",
  /(html\s*\{[^}]*?)\n\s*will-change:\s*background-color;\n/,
  "$1\n"
);

/* 2) body { ... will-change: background-color; ... } */
patch(
  "Removed static will-change from <body>",
  /(body\s*\{[^}]*?)\n\s*will-change:\s*background-color;\n/,
  "$1\n"
);

/* 3) button, a { transition: all ... } -> explicit property list */
patch(
  "Scoped button/a transition to explicit properties (was `transition: all`)",
  /button,\s*a\s*\{\s*\n\s*transition:\s*all\s+0\.25s\s+cubic-bezier\(0\.4,\s*0,\s*0\.2,\s*1\);\s*\n\}/,
  `button, a {
  transition: color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}`
);

/* 4) .theme-section { will-change: background-color, transform; ... } -> drop will-change line */
patch(
  "Removed static will-change from .theme-section (7 sections, each a permanent GPU layer)",
  /(\.theme-section\s*\{\s*\n)\s*will-change:\s*background-color,\s*transform;\n/,
  "$1"
);

if (changes === 0) {
  console.log("\nNo changes applied — file already patched.");
  process.exit(0);
}

const backupPath = CSS_PATH + ".bak";
if (!existsSync(backupPath)) {
  copyFileSync(CSS_PATH, backupPath);
  console.log(`\nBackup written to ${backupPath}`);
}

writeFileSync(CSS_PATH, css, "utf8");
console.log(`\n${changes} change(s) applied to app/globals.css.`);
console.log("Done. Restart `next dev` (or rebuild) to see the effect.");
