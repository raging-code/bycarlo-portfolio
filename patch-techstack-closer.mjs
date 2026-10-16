#!/usr/bin/env node
/**
 * byCarlo - Tech stack: move the card deck closer to "What I build with."
 *
 * Right now the red band under the heading is padded by (half the stage height + 30px),
 * which leaves about 90-105px of empty red between the heading and the top of the front card.
 * This patch makes that distance a single, explicit setting (--tsd-gap) and tightens it.
 *
 *   - app/globals.css   .tsd-top bottom padding now = half the card height + --tsd-gap
 *                       (the seam still runs through the middle of the front card, so the
 *                       cards keep straddling the red band and the cream below)
 *                       adds --tsd-card-h (per breakpoint) and --tsd-gap to .tsd-sec
 *
 * app/page.js is not touched.
 *
 * Usage (run from the project root, or pass the project folder):
 *   node patch-techstack-closer.mjs
 *   node patch-techstack-closer.mjs C:\path\to\bycarlo-portfolio
 *   node patch-techstack-closer.mjs --gap=24px   pick your own heading -> card distance
 *   node patch-techstack-closer.mjs --dry-run    show what would change, write nothing
 *   node patch-techstack-closer.mjs --revert     restore the backup
 *
 * Safe to run twice: it detects its own marker and skips. The original globals.css is copied to
 * .patch-backups/techstack-closer/ the first time only. To change the distance later, edit
 * --tsd-gap in app/globals.css (smaller = closer), or --revert and re-run with --gap=...
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const REVERT = args.includes("--revert");
const GAP = (args.find((a) => a.startsWith("--gap=")) || "").slice(6) || "clamp(20px, 3vw, 40px)";
const ROOT = path.resolve(args.find((a) => !a.startsWith("--")) || process.cwd());

const CSS = path.join(ROOT, "app", "globals.css");
const BACKUP_DIR = path.join(ROOT, ".patch-backups", "techstack-closer");
const BACKUP = path.join(BACKUP_DIR, "globals.css.bak");

const MARK = "techstack-closer";

const log = (m) => console.log(m);
const fail = (m) => { console.error("\nERROR: " + m + "\nNothing was changed."); process.exit(1); };
const eolOf = (s) => (s.includes("\r\n") ? "\r\n" : "\n");
const toEol = (s, eol) => s.replace(/\r?\n/g, eol);

if (!/^[\w\s.,%()+*/-]+$/.test(GAP)) fail('--gap has to be a plain CSS length, e.g. --gap=24px (got "' + GAP + '")');
if (!fs.existsSync(CSS)) fail("Can't find " + CSS + "\nRun this from the project root, or pass the project folder as an argument.");

/* ---------- revert ---------- */

if (REVERT) {
  if (!fs.existsSync(BACKUP)) fail("No backup found at " + BACKUP + ". Was the patch ever applied?");
  if (DRY) {
    log("[dry run] would restore app/globals.css from " + path.relative(ROOT, BACKUP));
  } else {
    fs.copyFileSync(BACKUP, CSS);
    log("Restored app/globals.css from " + path.relative(ROOT, BACKUP));
  }
  process.exit(0);
}

/* ---------- apply ---------- */

const raw = fs.readFileSync(CSS, "utf8");
const eol = eolOf(raw);
let css = raw.replace(/\r\n/g, "\n");

if (css.includes(MARK)) {
  log("Already applied (found the " + MARK + " marker in app/globals.css). Nothing to do.");
  process.exit(0);
}

if (!css.includes("/* techstack-deck:css:start */")) {
  fail("The tech stack CSS block (techstack-deck:css:start) isn't in app/globals.css. Run patch-techstack-deck.mjs first.");
}

// each edit: exact text to find (must appear exactly once) -> replacement
const EDITS = [
  {
    name: "add --tsd-card-h / --tsd-gap to .tsd-sec",
    from: "  --tsd-stage-h: 460px;\n",
    to:
      "  --tsd-stage-h: 460px;\n" +
      "  --tsd-card-h: 340px; /* " + MARK + ": same as the .tsd-card height at this breakpoint */\n" +
      "  --tsd-gap: " + GAP + "; /* " + MARK + ": space between the heading and the top of the front card (smaller = closer) */\n",
  },
  {
    name: "phones: card height 300px",
    from: "  .tsd-sec { --tsd-stage-h: 420px; }\n",
    to: "  .tsd-sec { --tsd-stage-h: 420px; --tsd-card-h: 300px; }\n",
  },
  {
    name: "tablet/desktop: card height follows --tsd-s",
    from: "  .tsd-sec { --tsd-s: 1.1; --tsd-stage-h: calc(460px * var(--tsd-s)); }\n",
    to: "  .tsd-sec { --tsd-s: 1.1; --tsd-stage-h: calc(460px * var(--tsd-s)); --tsd-card-h: calc(340px * var(--tsd-s)); }\n",
  },
  {
    name: "heading band: bottom padding = half a card + gap",
    from: "  padding: var(--tsd-top-pad) var(--tsd-pad) calc(var(--tsd-stage-h) * 0.5 + 30px);\n",
    to: "  padding: var(--tsd-top-pad) var(--tsd-pad) calc(var(--tsd-card-h) * 0.5 + var(--tsd-gap)); /* " + MARK + " */\n",
  },
];

for (const e of EDITS) {
  const count = css.split(e.from).length - 1;
  if (count !== 1) {
    fail('Expected to find "' + e.name + '" exactly once in app/globals.css but found it ' + count + " times.\n" +
         "The file was probably edited by hand since the deck patch. Looking for:\n" + e.from);
  }
}

for (const e of EDITS) {
  css = css.replace(e.from, () => e.to);
  log("  ok  " + e.name);
}

if (DRY) {
  log("\n[dry run] 4 edits would be made to app/globals.css (gap = " + GAP + "). Nothing written.");
  process.exit(0);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
if (!fs.existsSync(BACKUP)) fs.copyFileSync(CSS, BACKUP);
fs.writeFileSync(CSS, toEol(css, eol));

log("\nDone. app/globals.css updated (heading -> card gap = " + GAP + ").");
log("Backup: " + path.relative(ROOT, BACKUP));
log("Reload the dev server page and check the Tech stack section. Undo with: node patch-techstack-closer.mjs --revert");
