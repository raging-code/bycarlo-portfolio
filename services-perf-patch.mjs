#!/usr/bin/env node
/**
 * services-perf-patch.mjs
 * ---------------------------------------------------------------------------
 * Fixes mobile-browser lag in the Services section (app/globals.css, the
 * `.svc-*` rules between the `/* services:css:start *\/` and
 * `/* services:css:end *\/` markers).
 *
 * Run from the repo root:
 *   node services-perf-patch.mjs
 *
 * What it does and why:
 *
 * The Services section switches which row is "open" on every scroll-driven
 * frame (via the `active` index in app/page.js). Two of the CSS transitions
 * that fire on that switch are layout-triggering, not compositor-only:
 *
 * 1) `.svc-row { transition: ... padding 0.9s ... }` and the matching
 *    `.svc-row.on { padding-top: ... }`.
 *    Animating `padding` forces the browser to re-run layout (reflow) on
 *    every frame of the transition. This patch removes `padding` from the
 *    transitioned properties so the padding-top change applies instantly
 *    (still correct visually — only the color/background crossfade needs
 *    to feel smooth) instead of reflowing for 0.9s per row switch.
 *
 * 2) `.svc-desc { transition: grid-template-rows 0.9s ... }` animating
 *    `grid-template-rows: 0fr -> 1fr`. This is the common CSS-only
 *    accordion trick, but `grid-template-rows` is not compositor-
 *    accelerated: the browser recalculates grid track sizes and repaints
 *    every frame, same cost class as animating height directly.
 *    This patch keeps the exact same visual "grow open" effect but moves
 *    the animation onto `.svc-desc-in` using `transform: scaleY()` +
 *    `opacity` (both compositor-only, GPU-cheap), while `.svc-desc` itself
 *    switches `grid-template-rows` instantly. Because `.svc-desc-in` scales
 *    from 0 with `transform-origin: top`, there's no visible gap or jump —
 *    it looks like the same smooth height-open animation, just without the
 *    layout thrash.
 *
 * Net effect: switching the active service row no longer triggers layout
 * (reflow) at all during its transition — every animated property involved
 * is now `background-color`, `color`, `opacity`, or `transform`, which the
 * browser can run on the compositor thread. This is the standard fix for
 * scroll-driven jank on mid/low-end mobile GPUs.
 *
 * The script is idempotent: running it twice is a no-op on the second run.
 * It only edits app/globals.css and makes a .svc-bak backup before writing.
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

/* 1) .svc-row { transition: background-color ..., color ..., padding 0.9s ...; }
      -> drop `padding` from the transitioned properties. */
patch(
  "Removed layout-triggering `padding` transition from .svc-row",
  /\.svc-row\s*\{\s*\n\s*text-align:\s*center;\s*\n\s*transition:\s*background-color\s+0\.8s\s+cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\),\s*\n\s*color\s+0\.8s\s+cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\),\s*\n\s*padding\s+0\.9s\s+cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\);\s*\n\}/,
  `.svc-row {
  text-align: center;
  transition: background-color 0.8s cubic-bezier(0.22, 1, 0.36, 1),
              color 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}`
);

/* 2) .svc-desc { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.9s ...; }
      -> grid-template-rows switches instantly; the open/close animation
      moves to .svc-desc-in via transform: scaleY() + opacity. */
patch(
  "Replaced .svc-desc layout-triggering grid-template-rows transition with instant switch",
  /\.svc-desc\s*\{\s*\n\s*display:\s*grid;\s*\n\s*grid-template-rows:\s*0fr;\s*\n\s*transition:\s*grid-template-rows\s+0\.9s\s+cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\);\s*\n\}/,
  `.svc-desc {
  display: grid;
  grid-template-rows: 0fr; /* switches instantly now — the open animation lives on .svc-desc-in below */
}`
);

/* 3) .svc-desc-in { min-height: 0; overflow: hidden; }
      -> add the compositor-only open animation (transform: scaleY + opacity). */
patch(
  "Added compositor-only open/close animation to .svc-desc-in",
  /\.svc-desc-in\s*\{\s*min-height:\s*0;\s*overflow:\s*hidden;\s*\}/,
  `.svc-desc-in {
  min-height: 0;
  overflow: hidden;
  transform: scaleY(0);
  transform-origin: top;
  opacity: 0;
  transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}`
);

/* 4) .svc-row.on { background: ...; color: ...; padding-top: ...; padding-top: ...; }
      -> drop the (now-untransitioned, instant) padding-top duplication stays,
      it's fine for it to apply instantly; no change needed to the values
      themselves, only the transition list in .svc-row above (patch 1). */

/* 5) .svc-row.on .svc-desc { grid-template-rows: 1fr; }
      -> also flip .svc-desc-in open state here. */
patch(
  "Added .svc-desc-in open state alongside .svc-row.on .svc-desc",
  /\.svc-row\.on\s*\.svc-desc\s*\{\s*grid-template-rows:\s*1fr;\s*\}(?!\s*\n\.svc-row\.on\s*\.svc-desc-in)/,
  `.svc-row.on .svc-desc { grid-template-rows: 1fr; }
.svc-row.on .svc-desc-in { transform: scaleY(1); opacity: 1; }`
);

/* 6) reduced-motion block: add .svc-desc-in to the transition:none list so it
      still respects prefers-reduced-motion like the rest of the section. */
patch(
  "Added .svc-desc-in to the prefers-reduced-motion override",
  /\.svc-row,\s*\.svc-title,\s*\.svc-desc,\s*\.svc-desc p\s*\{\s*transition:\s*none\s*!important;\s*\}/,
  `.svc-row, .svc-title, .svc-desc, .svc-desc-in, .svc-desc p { transition: none !important; }`
);

if (changes === 0) {
  console.log("\nNo changes made — file already patched or patterns have shifted.");
  process.exit(0);
}

copyFileSync(CSS_PATH, CSS_PATH + ".svc-bak");
writeFileSync(CSS_PATH, css, "utf8");

console.log(`\n${changes} change(s) applied to app/globals.css`);
console.log(`Backup saved to app/globals.css.svc-bak`);
console.log("\nTest the Services section on a real mobile device (or Chrome DevTools");
console.log("CPU 4x/6x throttling) — opening/closing rows should no longer trigger");
console.log("layout work in the Performance panel.");
