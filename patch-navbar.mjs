#!/usr/bin/env node
/**
 * patch-navbar.mjs
 *
 * Fixes for bycarlo-portfolio's <GlassNavbar>:
 *
 *   1. The navbar currently renders as a floating glass capsule
 *      IMMEDIATELY on load. That's because `.gnav-wrap` always carries
 *      `data-theme={theme}`, and the `navbar-glass-v4` CSS block
 *      (selector `.gnav-wrap[data-theme] .gnav`) applies unconditionally
 *      — it isn't scoped to `.is-scrolled`. This patch rescopes that
 *      entire block to `.gnav-wrap[data-theme].is-scrolled`, so the bar
 *      starts static/flush and only morphs into the floating capsule
 *      once the user scrolls (scrolled state already exists in page.js).
 *
 *   2. Mobile floating navbar height is reduced (tighter padding on the
 *      wrap/pill, smaller toggle, tighter link padding).
 *
 *   3. Desktop floating navbar width is increased (explicit min-width
 *      instead of shrink-to-content `width: auto`).
 *
 * Usage:
 *   node patch-navbar.mjs [path-to-repo]
 *
 * Defaults to the current directory if no path is given. Run from
 * inside (or point it at) your bycarlo-portfolio checkout. Idempotent:
 * safe to re-run — it checks for its own markers before patching.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const repoRoot = resolve(process.argv[2] || ".");
const cssPath = join(repoRoot, "app", "globals.css");

if (!existsSync(cssPath)) {
  console.error(`✗ Could not find ${cssPath}`);
  console.error(`  Pass the repo path: node patch-navbar.mjs /path/to/bycarlo-portfolio`);
  process.exit(1);
}

let css = readFileSync(cssPath, "utf8");
const original = css;

const MARKER = "/* navbar-static-then-float-patch */";
if (css.includes(MARKER)) {
  console.log("✓ Patch already applied (marker found). Nothing to do.");
  process.exit(0);
}

// ---------------------------------------------------------------------
// Step 1: rescope every `.gnav-wrap[data-theme]` selector in the
// "navbar-glass-v4" block to `.gnav-wrap[data-theme].is-scrolled`, so
// the capsule look only kicks in after scrolling starts.
//
// We only touch the block between the known comment markers
// `/* navbar-glass-v4 ... */` and `/* end navbar-glass-v4 */` so we
// don't accidentally rewrite unrelated selectors elsewhere in the file.
// ---------------------------------------------------------------------

const blockStartMarker = "/* navbar-glass-v4";
const blockEndMarker = "/* end navbar-glass-v4 */";

const startIdx = css.indexOf(blockStartMarker);
const endIdx = css.indexOf(blockEndMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error("✗ Could not find the navbar-glass-v4 block markers in globals.css.");
  console.error("  The file may have changed since this script was written — aborting without editing.");
  process.exit(1);
}

const before = css.slice(0, startIdx);
let block = css.slice(startIdx, endIdx + blockEndMarker.length);
const after = css.slice(endIdx + blockEndMarker.length);

// Replace `.gnav-wrap[data-theme="dark"]` / `[data-theme="light"]` (the
// color-token blocks) — these can stay unscoped, they just define CSS
// vars and don't affect layout/visibility. We only rescope selectors
// that are NOT the two color-token declarations, i.e. everything that
// actually styles the floating pill.
block = block.replace(
  /\.gnav-wrap\[data-theme\](?!=")/g,
  ".gnav-wrap[data-theme].is-scrolled"
);

css = before + block + after;

// ---------------------------------------------------------------------
// Step 2: give the static (non-scrolled) state sane "flush bar" layout.
// The original first ruleset (`.gnav`, `.gnav-wrap`) already does this
// reasonably, but since the capsule rules were overriding it entirely
// before, double check `.gnav-wrap` padding/transition timing lines up
// with `.is-scrolled` so the morph is smooth. (No change needed here —
// the base rules already handle it — this is just the marker insert.)
// ---------------------------------------------------------------------

css = css.replace(
  "/* Gather navbar – compact, flush at the top, glass capsule after scroll */",
  `/* Gather navbar – compact, flush at the top, glass capsule after scroll */\n${MARKER}`
);

// ---------------------------------------------------------------------
// Step 3: reduce mobile floating-navbar height.
// Tighten the pill's outer padding, the inner `.gnav` padding, and the
// toggle size inside the `@media (max-width: 640px)` rules that now
// live under `.gnav-wrap[data-theme].is-scrolled`.
// ---------------------------------------------------------------------

css = css.replace(
  `.gnav-wrap[data-theme].is-scrolled { padding: 10px 8px 0; }\n  .gnav-wrap[data-theme].is-scrolled .gnav { width: auto; padding: 5px 5px 5px 6px; }\n  .gnav-wrap[data-theme].is-scrolled .gnav-brand { width: 28px; height: 28px; margin-right: 4px; }\n  .gnav-wrap[data-theme].is-scrolled .gnav-links { flex: none; overflow: visible; gap: 1px; }\n  .gnav-wrap[data-theme].is-scrolled .gnav-link {\n    font-size: clamp(10px, 3.1vw, 12.5px);\n    padding: 8px 0.65em;\n  }\n  .gnav-wrap[data-theme].is-scrolled .gnav-cta {\n    font-size: clamp(10px, 3.1vw, 12.5px);\n    padding: 8px 0.9em;\n    gap: 0.3em;\n  }\n  .gnav-wrap[data-theme].is-scrolled .gnav-toggle {\n    --tw: 28px; --th: 28px;\n    width: 28px;\n    height: 28px;\n    margin: 0 2px 0 4px;\n  }\n  .gnav-wrap[data-theme].is-scrolled .gnav-ico { width: 14px; height: 14px; }`,
  `.gnav-wrap[data-theme].is-scrolled { padding: 6px 8px 0; }\n  .gnav-wrap[data-theme].is-scrolled .gnav { width: auto; padding: 3px 3px 3px 5px; }\n  .gnav-wrap[data-theme].is-scrolled .gnav-brand { width: 22px; height: 22px; margin-right: 3px; }\n  .gnav-wrap[data-theme].is-scrolled .gnav-links { flex: none; overflow: visible; gap: 1px; }\n  .gnav-wrap[data-theme].is-scrolled .gnav-link {\n    font-size: clamp(9.5px, 2.9vw, 12px);\n    padding: 5px 0.55em;\n  }\n  .gnav-wrap[data-theme].is-scrolled .gnav-cta {\n    font-size: clamp(9.5px, 2.9vw, 12px);\n    padding: 5px 0.75em;\n    gap: 0.3em;\n  }\n  .gnav-wrap[data-theme].is-scrolled .gnav-toggle {\n    --tw: 24px; --th: 24px;\n    width: 24px;\n    height: 24px;\n    margin: 0 2px 0 3px;\n  }\n  .gnav-wrap[data-theme].is-scrolled .gnav-ico { width: 12px; height: 12px; }`
);

// ---------------------------------------------------------------------
// Step 4: increase desktop floating-navbar width.
// The capsule's `.gnav` is currently `width: auto` (shrink-to-content).
// Give it a min-width so it reads as a wider bar on desktop, same as
// the figure used elsewhere in the file for the old (now superseded)
// scrolled-width rule.
// ---------------------------------------------------------------------

css = css.replace(
  `.gnav-wrap[data-theme].is-scrolled .gnav {\n  width: auto;\n  max-width: 100%;\n  justify-content: flex-start;\n  gap: 2px;\n  padding: 5px 5px 5px 7px;\n  border-radius: 999px;`,
  `.gnav-wrap[data-theme].is-scrolled .gnav {\n  width: auto;\n  min-width: 760px;\n  max-width: 100%;\n  justify-content: flex-start;\n  gap: 2px;\n  padding: 5px 5px 5px 7px;\n  border-radius: 999px;`
);

if (css === original) {
  console.error("✗ No changes were made — one or more expected CSS snippets were not found.");
  console.error("  The file may differ from what this script expects. Aborting without writing.");
  process.exit(1);
}

writeFileSync(cssPath, css, "utf8");

console.log("✓ Patched app/globals.css");
console.log("");
console.log("  1. Floating capsule look (navbar-glass-v4) is now scoped to .is-scrolled —");
console.log("     the navbar starts static/flush and animates into the floating pill on scroll.");
console.log("  2. Mobile floating navbar is shorter (tighter padding, smaller toggle/links).");
console.log("  3. Desktop floating navbar is wider (min-width: 760px — tweak to taste).");
console.log("");
console.log("  Review the diff, then rebuild/restart your dev server to see the change.");
