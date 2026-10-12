#!/usr/bin/env node
/**
 * patch-navbar-responsive.mjs
 *
 * Fixes the floating (scrolled) navbar capsule not being responsive.
 *
 * Root cause: `.gnav-wrap[data-theme].is-scrolled .gnav` sets a flat,
 * unconditional `min-width: 760px`. That rule lives in the desktop
 * block and is never reset inside the `@media (max-width: 640px)`
 * block below it — so on any viewport narrower than ~784px the pill
 * is still forced to be at least 760px wide. `min-width` always wins
 * over `max-width: 100%` in CSS, so instead of shrinking to fit the
 * screen, the capsule overflows horizontally / gets clipped.
 *
 * Fix:
 *   1. Replace the flat `min-width: 760px` with a responsive value —
 *      `min(760px, calc(100vw - 24px))` — so it never exceeds the
 *      viewport, with the wrap's own side padding accounted for.
 *   2. Belt-and-suspenders: explicitly reset `min-width: 0` inside the
 *      `@media (max-width: 640px)` phone block, so phones are never
 *      affected by the desktop min-width at all, regardless of any
 *      future edits to the desktop value.
 *
 * Usage:
 *   node patch-navbar-responsive.mjs [path-to-repo]
 *
 * Defaults to the current directory. Idempotent — safe to re-run.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const repoRoot = resolve(process.argv[2] || ".");
const cssPath = join(repoRoot, "app", "globals.css");

if (!existsSync(cssPath)) {
  console.error(`✗ Could not find ${cssPath}`);
  console.error(`  Pass the repo path: node patch-navbar-responsive.mjs /path/to/bycarlo-portfolio`);
  process.exit(1);
}

let css = readFileSync(cssPath, "utf8");
const original = css;

const MARKER = "/* navbar-responsive-minwidth-patch */";
if (css.includes(MARKER)) {
  console.log("✓ Patch already applied (marker found). Nothing to do.");
  process.exit(0);
}

// ---------------------------------------------------------------------
// Step 1: make the desktop min-width responsive instead of flat.
// ---------------------------------------------------------------------

const desktopBlock = `.gnav-wrap[data-theme].is-scrolled .gnav {
  width: auto;
  min-width: 760px;
  max-width: 100%;`;

const desktopReplacement = `${MARKER}
.gnav-wrap[data-theme].is-scrolled .gnav {
  width: auto;
  min-width: min(760px, calc(100vw - 24px));
  max-width: 100%;`;

if (!css.includes(desktopBlock)) {
  console.error("✗ Could not find the expected desktop `.gnav` min-width rule.");
  console.error("  The file may differ from what this script expects — aborting without editing.");
  process.exit(1);
}

css = css.replace(desktopBlock, desktopReplacement);

// ---------------------------------------------------------------------
// Step 2: explicitly reset min-width inside the phone media query, so
// phones never inherit any desktop min-width regardless of its value.
// ---------------------------------------------------------------------

const phoneRule = `  .gnav-wrap[data-theme].is-scrolled .gnav { width: auto; padding: 3px 3px 3px 5px; }`;
const phoneReplacement = `  .gnav-wrap[data-theme].is-scrolled .gnav { width: auto; min-width: 0; padding: 3px 3px 3px 5px; }`;

if (!css.includes(phoneRule)) {
  console.error("✗ Could not find the expected phone-breakpoint `.gnav` rule.");
  console.error("  The file may differ from what this script expects — aborting without editing.");
  process.exit(1);
}

css = css.replace(phoneRule, phoneReplacement);

// ---------------------------------------------------------------------
// Step 3: also guard the mid-range gap (641px–~900px tablets/small
// laptops), where the 640px breakpoint hasn't kicked in yet but
// min(760px, 100vw - 24px) already protects against overflow — so no
// extra breakpoint is strictly needed. This step just leaves a comment
// so future edits know the range is covered intentionally.
// ---------------------------------------------------------------------

if (css === original) {
  console.error("✗ No changes were made — expected CSS snippets were not found.");
  process.exit(1);
}

writeFileSync(cssPath, css, "utf8");

console.log("✓ Patched app/globals.css");
console.log("");
console.log("  1. Desktop scrolled-capsule min-width is now responsive:");
console.log("     min(760px, calc(100vw - 24px)) instead of a flat 760px.");
console.log("  2. Phone breakpoint (<=640px) explicitly resets min-width: 0,");
console.log("     so it can never inherit a desktop min-width again.");
console.log("");
console.log("  Review the diff, then rebuild/restart your dev server to see the change.");
