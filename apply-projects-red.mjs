#!/usr/bin/env node
/**
 * apply-projects-red.mjs
 *
 * Makes the "Selected projects" section background the same red the About brush
 * ends on, so there is no cream flash when the brush finishes and you scroll on.
 *
 * Why the seam showed: the brush paints AB_COLOR (#E02B20) over the pinned About
 * screen, but the Projects section has no background of its own, so the page's
 * cream body (#F6F5F2) showed through as soon as the About track ended.
 *
 * What it changes
 *   - app/globals.css  appends one marked block: `#work { background-color: <red> }`
 *                      plus a cream text selection so highlighted text stays visible.
 *   - app/page.js      inside Projects() only: swaps the dark/red text colors for cream
 *                      ones (the old accent red would be invisible on a red background).
 *                      Other sections are not touched.
 *
 * The red is read from `const AB_COLOR` in app/page.js, so it always matches the brush.
 * Override with --color=#RRGGBB if you want something else.
 *
 * Usage (from the project root, next to package.json):
 *   node apply-projects-red.mjs --dry-run     # preview only, writes nothing
 *   node apply-projects-red.mjs               # apply
 *   node apply-projects-red.mjs --revert      # undo exactly what this script added
 *
 * Safe to re-run. Backups (made once, before the first change):
 *   app/page.js.bak-projects-red, app/globals.css.bak-projects-red
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const F = {
  page: path.join(__dirname, "app", "page.js"),
  css: path.join(__dirname, "app", "globals.css"),
};
const BAK = ".bak-projects-red";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const REVERT = args.includes("--revert");
const colorArg = args.find((a) => a.startsWith("--color="));

const note = (m) => console.log(m);
const fail = (m) => { console.error("✗ " + m); process.exit(1); };

for (const k of Object.keys(F)) {
  if (!existsSync(F[k])) fail(`${path.relative(__dirname, F[k])} not found. Run this from the project root.`);
}

let page = readFileSync(F.page, "utf8");
let css = readFileSync(F.css, "utf8");
const EOL = page.includes("\r\n") ? "\r\n" : "\n"; // keep Windows line endings intact
const nl = (s) => s.replace(/\r?\n/g, EOL);

const ORIGINAL_COLORS = nl(
`  const textColor = LIGHT.text;
  const mutedColor = LIGHT.muted;
  const accentColor = LIGHT.accent;
  const borderColor = LIGHT.border;`);

const NEW_COLORS = nl(
`  /* projects-red:start */
  // red section: cream text, cream accents (the old red accent would vanish on red)
  const textColor = LIGHT.bg;
  const mutedColor = "rgba(246,245,242,0.8)";
  const accentColor = LIGHT.bg;
  const borderColor = "rgba(246,245,242,0.45)";
  /* projects-red:end */`);

const COLORS_RE = /const textColor = LIGHT\.text;\s*const mutedColor = LIGHT\.muted;\s*const accentColor = LIGHT\.accent;\s*const borderColor = LIGHT\.border;/;
const MARK_RE = /[ \t]*\/\* projects-red:start \*\/[\s\S]*?\/\* projects-red:end \*\//;
const CSS_RE = /\r?\n*\/\* projects-red:css:start \*\/[\s\S]*?\/\* projects-red:css:end \*\/\r?\n?/;

// Find Projects() and its end (first "}" at column 0 after it)
function projectsRange(src) {
  const start = src.indexOf("function Projects(");
  if (start === -1) fail("function Projects( not found in app/page.js. Has the file been restructured?");
  const m = /\r?\n\}\r?\n/.exec(src.slice(start));
  if (!m) fail("Could not find the end of Projects().");
  return [start, start + m.index + m[0].length];
}

function backupOnce(file) {
  const bak = file + BAK;
  if (!existsSync(bak)) {
    if (!DRY) copyFileSync(file, bak);
    note(`  backup   ${path.relative(__dirname, bak)}`);
  }
}

/* ── Revert ─────────────────────────────────────────────────────────────── */
if (REVERT) {
  note("Reverting projects red" + (DRY ? " (dry run)" : "") + "...");
  const [s, e] = projectsRange(page);
  let seg = page.slice(s, e);
  if (MARK_RE.test(seg)) {
    seg = seg.replace(MARK_RE, ORIGINAL_COLORS);
    page = page.slice(0, s) + seg + page.slice(e);
    if (!DRY) writeFileSync(F.page, page);
    note("  reverted app/page.js");
  } else note("  app/page.js: nothing to revert");

  if (CSS_RE.test(css)) {
    css = css.replace(CSS_RE, EOL);
    if (!DRY) writeFileSync(F.css, css.replace(/(\r?\n)+$/, EOL));
    note("  reverted app/globals.css");
  } else note("  app/globals.css: nothing to revert");

  if (!DRY) for (const k of Object.keys(F)) if (existsSync(F[k] + BAK)) unlinkSync(F[k] + BAK);
  note(DRY ? "Dry run only, nothing was written." : "Done.");
  process.exit(0);
}

/* ── Apply ──────────────────────────────────────────────────────────────── */
let RED = "#E02B20";
const brush = /const AB_COLOR = "(#[0-9a-fA-F]{6})"/.exec(page);
if (brush) RED = brush[1];
if (colorArg) {
  RED = colorArg.split("=")[1];
  if (!/^#[0-9a-fA-F]{6}$/.test(RED)) fail("--color must look like #RRGGBB");
}

note(`Applying projects red (${RED})${DRY ? " (dry run)" : ""}...`);

// 1) page.js: text colors inside Projects() only
{
  const [s, e] = projectsRange(page);
  let seg = page.slice(s, e);
  if (MARK_RE.test(seg)) {
    note("  app/page.js: already applied, skipped");
  } else if (COLORS_RE.test(seg)) {
    backupOnce(F.page);
    seg = seg.replace(COLORS_RE, NEW_COLORS.replace(/^\s+/, ""));
    page = page.slice(0, s) + seg + page.slice(e);
    if (!DRY) writeFileSync(F.page, page);
    note("  patched  app/page.js (Projects text colors -> cream)");
  } else {
    fail("The four color constants in Projects() were not found as expected. Nothing was written.");
  }
}

// 2) globals.css: the red background (+ visible text selection)
{
  const block = nl(
`/* projects-red:css:start */
/* "Selected projects" continues the red the About brush ends on (same as AB_COLOR) */
#work { background-color: ${RED}; }
#work ::selection { background: #F6F5F2; color: ${RED}; }
/* projects-red:css:end */`);

  if (CSS_RE.test(css)) {
    // re-run with a different color: update in place
    if (!DRY) writeFileSync(F.css, css.replace(CSS_RE, EOL + EOL + block + EOL));
    note("  updated  app/globals.css (block already present)");
  } else {
    backupOnce(F.css);
    if (!DRY) writeFileSync(F.css, css.replace(/\s*$/, EOL + EOL) + block + EOL);
    note("  patched  app/globals.css");
  }
}

note(DRY ? "Dry run only, nothing was written." : "Done. Restart `npm run dev` (or just refresh), then scroll past the brush.");
