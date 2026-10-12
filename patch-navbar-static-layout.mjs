#!/usr/bin/env node
/**
 * patch-navbar-static-layout.mjs
 *
 * Keeps the floating (scrolled) navbar's glass-capsule DESIGN — pill
 * shape, translucent blur background, border, shadow, color tokens —
 * but removes the LAYOUT overrides that currently make its content
 * look different from the static bar:
 *
 *   - brand/logo forced to 30px (static scrolled size is 24px)
 *   - .gnav-links set to flex:1 + centered with a 2px gap and its own
 *     link padding/font-size (static already has its own scrolled
 *     link sizing via the plain `.gnav-wrap.is-scrolled` rules)
 *   - the theme toggle completely restructured into a 30px round icon
 *     button with `order: -1` (jumps before Contact) — the static bar
 *     keeps it as the normal 44x24px swipe switch, after Contact
 *   - Contact CTA resized/restyled with its own padding, font-size,
 *     and an arrow glyph not present on the static CTA
 *
 * Since `.gnav-wrap.is-scrolled` (without `[data-theme]`) already
 * supplies the "scrolled" sizing for brand/links/CTA, and both rules
 * apply simultaneously (data-theme is always present once mounted),
 * simply removing the `[data-theme].is-scrolled` layout declarations
 * lets everything fall back to the same sizing the static bar already
 * uses once scrolled — while the glass-pill visuals (background,
 * blur, border, radius, shadow, color vars) stay intact.
 *
 * Usage:
 *   node patch-navbar-static-layout.mjs [path-to-repo]
 *
 * Defaults to the current directory. Idempotent — safe to re-run.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const repoRoot = resolve(process.argv[2] || ".");
const cssPath = join(repoRoot, "app", "globals.css");

if (!existsSync(cssPath)) {
  console.error(`✗ Could not find ${cssPath}`);
  console.error(`  Pass the repo path: node patch-navbar-static-layout.mjs /path/to/bycarlo-portfolio`);
  process.exit(1);
}

let css = readFileSync(cssPath, "utf8");
const original = css;

const MARKER = "/* navbar-static-layout-floating-design-patch */";
if (css.includes(MARKER)) {
  console.log("✓ Patch already applied (marker found). Nothing to do.");
  process.exit(0);
}

function replaceOrDie(label, oldStr, newStr) {
  if (!css.includes(oldStr)) {
    console.error(`✗ Could not find the expected CSS for: ${label}`);
    console.error("  The file may differ from what this script expects — aborting without editing.");
    process.exit(1);
  }
  css = css.replace(oldStr, newStr);
}

// ---------------------------------------------------------------------
// 1) Drop the logo-resize override (keep: everything else in .gnav).
// ---------------------------------------------------------------------
replaceOrDie(
  "brand/logo size override",
  `/* logo: 30px circle with a hairline ring */
.gnav-wrap[data-theme].is-scrolled .gnav-brand {
  width: 30px;
  height: 30px;
  margin: 0 6px 0 0;
}
.gnav-wrap[data-theme].is-scrolled .gnav-logo { box-shadow: 0 0 0 1px var(--ng-edge); }`,
  `/* logo: same size as the static bar's scrolled state — only the hairline ring color is themed */
.gnav-wrap[data-theme].is-scrolled .gnav-logo { box-shadow: 0 0 0 1px var(--ng-edge); }`
);

// ---------------------------------------------------------------------
// 2) Drop .gnav-links layout override (flex/justify/gap) — keep none,
//    let the static `.gnav-wrap.is-scrolled .gnav-links { gap: 2px; }`
//    rule (already in the file) apply instead.
// ---------------------------------------------------------------------
replaceOrDie(
  ".gnav-links layout override",
  `/* links */
.gnav-wrap[data-theme].is-scrolled .gnav-links {
  flex: 1;
  justify-content: center;
  gap: 2px;
}
.gnav-wrap[data-theme].is-scrolled .gnav-link {
  padding: 8px 13px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.005em;
  line-height: 1.5;
  color: var(--ng-mu);
  box-shadow: none;
  background: transparent;
  transition: background-color 0.3s, color 0.3s;
}
.gnav-wrap[data-theme].is-scrolled .gnav-link:hover {
  color: var(--ng-tx);
  background: var(--ng-chip);
}
/* active link: soft chip with a highlight on its top edge, no dot */
.gnav-wrap[data-theme].is-scrolled .gnav-link.on {
  color: var(--ng-tx);
  background: var(--ng-chip);
  border-radius: 999px;
  box-shadow: inset 0 1px 0 var(--ng-hi);
}`,
  `/* links: same layout/sizing as the static bar's scrolled state — only colors are themed */
.gnav-wrap[data-theme].is-scrolled .gnav-link {
  color: var(--ng-mu);
}
.gnav-wrap[data-theme].is-scrolled .gnav-link:hover {
  color: var(--ng-tx);
  background: var(--ng-chip);
}
.gnav-wrap[data-theme].is-scrolled .gnav-link.on {
  color: var(--ng-tx);
  background: var(--ng-chip);
}`
);

// ---------------------------------------------------------------------
// 3) Drop the toggle restructuring (size/order/shape) — keep only the
//    color so the swipe-switch styling matches the static bar's.
// ---------------------------------------------------------------------
replaceOrDie(
  "theme toggle restructure",
  `/* right side: icon button first, then Contact */
.gnav-wrap[data-theme].is-scrolled .gnav-end { gap: 0; }

.gnav-wrap[data-theme].is-scrolled .gnav-toggle {
  order: -1;
  --tw: 30px; --th: 30px;
  width: 30px;
  height: 30px;
  margin: 0 4px 0 6px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--ng-tx);
  transition: background-color 0.3s;
}
.gnav-wrap[data-theme].is-scrolled .gnav-toggle:hover { background: var(--ng-chip); }
.gnav-wrap[data-theme].is-scrolled .gnav-toggle-thumb {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  background: transparent;
  color: var(--ng-tx);
  transform: none !important;
}
.gnav-wrap[data-theme].is-scrolled .gnav-ico { width: 15px; height: 15px; }
.gnav-wrap[data-theme].is-scrolled .gnav-ico-sun { stroke-width: 1.7; }
.gnav-wrap[data-theme].is-scrolled .gnav-ico-moon {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linejoin: round;
}`,
  `/* theme toggle: same swipe-switch layout as the static bar — only recolored */
.gnav-wrap[data-theme].is-scrolled .gnav-toggle {
  border-color: var(--ng-edge);
  background: var(--ng-chip);
}
.gnav-wrap[data-theme].is-scrolled .gnav-toggle-thumb {
  background: var(--ng-tx);
  color: var(--ng-bg);
}`
);

// ---------------------------------------------------------------------
// 4) Drop the CTA resize/arrow-glyph override — keep only recoloring.
// ---------------------------------------------------------------------
replaceOrDie(
  "CTA resize/arrow override",
  `.gnav-wrap[data-theme].is-scrolled .gnav-cta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border: 0;
  border-radius: 999px;
  background: var(--ng-tx);
  color: var(--ng-bg);
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.5;
  transition: background-color 0.4s, color 0.4s, opacity 0.25s;
}
.gnav-wrap[data-theme].is-scrolled .gnav-cta::after { content: "\\2197"; }
.gnav-wrap[data-theme].is-scrolled .gnav-cta:hover { opacity: 0.88; }`,
  `/* Contact CTA: same layout/sizing as the static bar's scrolled state — only recolored */
.gnav-wrap[data-theme].is-scrolled .gnav-cta {
  background: var(--ng-tx);
  color: var(--ng-bg);
}
.gnav-wrap[data-theme].is-scrolled .gnav-cta:hover { opacity: 0.88; }`
);

// ---------------------------------------------------------------------
// 5) Phone breakpoint: drop the matching layout overrides there too,
//    so mobile also falls back to the static bar's own mobile sizing
//    (the `@media (max-width: 640px) { .gnav ... }` rules earlier in
//    the file already cover phones for the un-themed state).
// ---------------------------------------------------------------------
replaceOrDie(
  "phone-breakpoint layout overrides",
  `/* phones: same capsule, sized to the screen so everything still fits (320px and up) */
@media (max-width: 640px) {
  .gnav-wrap[data-theme].is-scrolled { padding: 6px 8px 0; }
  .gnav-wrap[data-theme].is-scrolled .gnav { width: auto; min-width: 0; padding: 3px 3px 3px 5px; }
  .gnav-wrap[data-theme].is-scrolled .gnav-brand { width: 22px; height: 22px; margin-right: 3px; }
  .gnav-wrap[data-theme].is-scrolled .gnav-links { flex: none; overflow: visible; gap: 1px; }
  .gnav-wrap[data-theme].is-scrolled .gnav-link {
    font-size: clamp(9.5px, 2.9vw, 12px);
    padding: 5px 0.55em;
  }
  .gnav-wrap[data-theme].is-scrolled .gnav-cta {
    font-size: clamp(9.5px, 2.9vw, 12px);
    padding: 5px 0.75em;
    gap: 0.3em;
  }
  .gnav-wrap[data-theme].is-scrolled .gnav-toggle {
    --tw: 24px; --th: 24px;
    width: 24px;
    height: 24px;
    margin: 0 2px 0 3px;
  }
  .gnav-wrap[data-theme].is-scrolled .gnav-ico { width: 12px; height: 12px; }
}
@media (max-width: 359px) {
  .gnav-wrap[data-theme].is-scrolled .gnav-cta::after { display: none; }
}
/* end navbar-glass-v4 */`,
  `/* phones: same capsule design, but same layout/sizing as the static bar's own
   mobile rules (see the un-themed @media (max-width: 640px) block above) */
@media (max-width: 640px) {
  .gnav-wrap[data-theme].is-scrolled { padding: 6px 8px 0; }
  .gnav-wrap[data-theme].is-scrolled .gnav { width: 100%; min-width: 0; }
}
/* end navbar-glass-v4 */
${MARKER}`
);

if (css === original) {
  console.error("✗ No changes were made — expected CSS snippets were not found.");
  process.exit(1);
}

writeFileSync(cssPath, css, "utf8");

console.log("✓ Patched app/globals.css");
console.log("");
console.log("  The floating (scrolled) navbar keeps its glass-capsule DESIGN —");
console.log("  pill shape, blur, border, shadow, color tokens — but its LAYOUT");
console.log("  (logo size, link spacing/sizing, toggle shape/position, CTA size)");
console.log("  now matches the static navbar's own scrolled sizing instead of");
console.log("  using its own separate, smaller dimensions.");
console.log("");
console.log("  Review the diff, then rebuild/restart your dev server to see the change.");
