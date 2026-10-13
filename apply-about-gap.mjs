#!/usr/bin/env node
/**
 * apply-about-gap.mjs
 *
 * Phones only (max-width 767px): moves the About content lower on the pinned screen,
 * so the paragraph ends close to the bottom of the screen instead of floating with a
 * big empty strip under it. That empty strip is what made the About -> Projects
 * distance feel too long.
 *
 * How: the About section is a flex box that centers its content inside the pinned
 * screen. On phones this switches it to bottom-anchored, with a small bottom padding
 * (default 28px). Bottom-anchoring (rather than adding top padding) keeps the result
 * the same on short and tall phones. Desktop and tablet are not touched.
 *
 * What it changes
 *   - app/globals.css  appends one marked block. Nothing in page.js changes.
 *
 * Options
 *   --bottom=28         px of space kept under the paragraph (smaller = content lower)
 *   --projects-top=80   OPTIONAL. Also trims the top padding of "Selected projects"
 *                       on phones (it is 112px now). Off unless you pass it.
 *
 * Usage (from the project root, next to package.json):
 *   node apply-about-gap.mjs --dry-run      # preview only, writes nothing
 *   node apply-about-gap.mjs                # apply
 *   node apply-about-gap.mjs --bottom=40    # re-run with another value, updates in place
 *   node apply-about-gap.mjs --revert       # remove exactly what this script added
 *
 * Backup (made once, before the first change): app/globals.css.bak-about-gap
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS = path.join(__dirname, "app", "globals.css");
const BAK = CSS + ".bak-about-gap";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const REVERT = args.includes("--revert");
const num = (name, fallback) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  if (!a) return fallback;
  const v = Number(a.split("=")[1]);
  if (!Number.isFinite(v) || v < 0 || v > 400) {
    console.error(`✗ --${name} must be a number between 0 and 400`);
    process.exit(1);
  }
  return v;
};

const note = (m) => console.log(m);
if (!existsSync(CSS)) {
  console.error("✗ app/globals.css not found. Run this from the project root.");
  process.exit(1);
}

let css = readFileSync(CSS, "utf8");
const EOL = css.includes("\r\n") ? "\r\n" : "\n"; // keep Windows line endings intact
const nl = (s) => s.replace(/\r?\n/g, EOL);
const BLOCK_RE = /\r?\n*\/\* about-gap:start \*\/[\s\S]*?\/\* about-gap:end \*\/\r?\n?/;

if (REVERT) {
  note("Reverting about gap" + (DRY ? " (dry run)" : "") + "...");
  if (BLOCK_RE.test(css)) {
    if (!DRY) {
      writeFileSync(CSS, css.replace(BLOCK_RE, EOL).replace(/(\r?\n)+$/, EOL));
      if (existsSync(BAK)) unlinkSync(BAK);
    }
    note("  reverted app/globals.css");
  } else note("  nothing to revert");
  note(DRY ? "Dry run only, nothing was written." : "Done.");
  process.exit(0);
}

if (!/\.ip-pin \.ip-section/.test(css)) {
  console.error("✗ The About pin rules (.ip-pin .ip-section) were not found in app/globals.css. Nothing was written.");
  process.exit(1);
}

const bottom = num("bottom", 28);
const projectsTop = num("projects-top", null);

const lines = [
  "/* about-gap:start */",
  "/* Phones: About content sits low on the pinned screen (bottom-anchored), so less empty",
  "   space is left between the paragraph and the Selected projects section. */",
  "@media (max-width: 767px) {",
  "  .ip-pin .ip-section { align-items: flex-end; }",
  `  .ip-pin .ip-about { padding-bottom: ${bottom}px; }`,
];
if (projectsTop !== null) lines.push(`  #work { padding-top: ${projectsTop}px; }`);
lines.push("}", "/* about-gap:end */");
const block = nl(lines.join("\n"));

note(`Applying about gap (bottom ${bottom}px${projectsTop !== null ? `, projects top ${projectsTop}px` : ""})${DRY ? " (dry run)" : ""}...`);

if (BLOCK_RE.test(css)) {
  if (!DRY) writeFileSync(CSS, css.replace(BLOCK_RE, EOL + EOL + block + EOL));
  note("  updated  app/globals.css (block already present)");
} else {
  if (!existsSync(BAK)) {
    if (!DRY) copyFileSync(CSS, BAK);
    note("  backup   app/globals.css.bak-about-gap");
  }
  if (!DRY) writeFileSync(CSS, css.replace(/\s*$/, EOL + EOL) + block + EOL);
  note("  patched  app/globals.css");
}

note(DRY ? "Dry run only, nothing was written." : "Done. Refresh the page and check it in the phone view.");
