#!/usr/bin/env node
/**
 * patch-navbar-center-links.mjs
 *
 * Fixes the floating (scrolled) navbar's desktop layout: everything
 * currently hugs the left edge (logo, then links, then the
 * toggle/Contact chip) with a big dead gap on the right, instead of
 * logo-left / links-centered / Contact-right.
 *
 * Root cause: the floating-capsule override block sets
 *   .gnav-wrap[data-theme].is-scrolled .gnav { justify-content: flex-start; }
 *   .gnav-wrap[data-theme].is-scrolled .gnav-links { flex: none; }
 * so the links sit immediately after the logo instead of growing to
 * fill the middle of the (now wider) capsule, and `.gnav-end` just
 * trails right after them instead of being pinned to the far right.
 *
 * Fix:
 *   1. `.gnav` → `justify-content: space-between` (matches the
 *      static/unscrolled navbar's own layout), so brand and `.gnav-end`
 *      sit at the two ends.
 *   2. `.gnav-links` → `flex: 1; justify-content: center;` so the link
 *      group grows to fill the middle and its items are centered
 *      within that space, instead of staying shrink-to-content.
 *
 * Usage:
 *   node patch-navbar-center-links.mjs [path-to-repo]
 *
 * Defaults to the current directory. Idempotent — safe to re-run.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const repoRoot = resolve(process.argv[2] || ".");
const cssPath = join(repoRoot, "app", "globals.css");

if (!existsSync(cssPath)) {
  console.error(`✗ Could not find ${cssPath}`);
  console.error(`  Pass the repo path: node patch-navbar-center-links.mjs /path/to/bycarlo-portfolio`);
  process.exit(1);
}

let css = readFileSync(cssPath, "utf8");
const original = css;

const MARKER = "/* navbar-center-links-patch */";
if (css.includes(MARKER)) {
  console.log("✓ Patch already applied (marker found). Nothing to do.");
  process.exit(0);
}

// ---------------------------------------------------------------------
// Step 1: .gnav justify-content: flex-start -> space-between, scoped
// to the floating/scrolled capsule block only.
// ---------------------------------------------------------------------

const navBlockOld = `.gnav-wrap[data-theme].is-scrolled .gnav {
  width: auto;
  min-width: min(760px, calc(100vw - 24px));
  max-width: 100%;
  justify-content: flex-start;
  gap: 2px;`;

const navBlockNew = `${MARKER}
.gnav-wrap[data-theme].is-scrolled .gnav {
  width: auto;
  min-width: min(760px, calc(100vw - 24px));
  max-width: 100%;
  justify-content: space-between;
  gap: 2px;`;

if (!css.includes(navBlockOld)) {
  console.error("✗ Could not find the expected `.gnav` floating-capsule rule.");
  console.error("  The file may differ from what this script expects — aborting without editing.");
  process.exit(1);
}

css = css.replace(navBlockOld, navBlockNew);

// ---------------------------------------------------------------------
// Step 2: .gnav-links flex: none -> flex: 1 + center its contents, so
// the link group fills the space between the logo and the end group.
// ---------------------------------------------------------------------

const linksBlockOld = `.gnav-wrap[data-theme].is-scrolled .gnav-links {
  flex: none;
  gap: 2px;
}`;

const linksBlockNew = `.gnav-wrap[data-theme].is-scrolled .gnav-links {
  flex: 1;
  justify-content: center;
  gap: 2px;
}`;

if (!css.includes(linksBlockOld)) {
  console.error("✗ Could not find the expected `.gnav-links` floating-capsule rule.");
  console.error("  The file may differ from what this script expects — aborting without editing.");
  process.exit(1);
}

css = css.replace(linksBlockOld, linksBlockNew);

if (css === original) {
  console.error("✗ No changes were made — expected CSS snippets were not found.");
  process.exit(1);
}

writeFileSync(cssPath, css, "utf8");

console.log("✓ Patched app/globals.css");
console.log("");
console.log("  1. Floating-capsule `.gnav` now uses justify-content: space-between,");
console.log("     pinning the logo to the left and the toggle/Contact group to the right.");
console.log("  2. `.gnav-links` now grows (flex: 1) and centers its items, so the nav");
console.log("     links sit centered in the middle of the capsule.");
console.log("");
console.log("  Review the diff, then rebuild/restart your dev server to see the change.");
