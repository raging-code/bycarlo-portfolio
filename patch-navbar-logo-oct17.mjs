#!/usr/bin/env node
/**
 * byCarlo - navbar logo swap
 *
 *   Replace the round bcdlogo.png in the navbar brand mark with the new
 *   Carlo "C" SVG (public/svg/carlo-C.svg), with no background/circle crop.
 *
 *   The existing .gnav-brand / .gnav-logo styling was built for a square
 *   510x510 raster shown as a 1:1 circle (border-radius: 50%, object-fit:
 *   cover, plus a hairline ring box-shadow). The Carlo "C" mark is a wide
 *   (241x260) transparent-background SVG, so cover-cropping it into a
 *   circle would clip the glyph and the ring would float over the empty
 *   corners of the image. This patch:
 *
 *     - app/page.js: swaps the <img src> from /png/bcdlogo.png to
 *       /svg/carlo-C.svg, drops the dead "gnav-logo-light" class, and
 *       sizes it as a non-square box so the mark isn't squeezed into a
 *       circle.
 *     - app/globals.css: adds a .gnav-logo--mark rule that turns off the
 *       circular crop/ring (border-radius, object-fit, box-shadow) for
 *       just this logo, in both the static and is-scrolled states, and
 *       switches object-fit to "contain" so the whole glyph stays
 *       visible as the bar's width/height change.
 *
 * Usage (run from the project root, or pass the project folder):
 *   node patch-navbar-logo-oct17.mjs
 *   node patch-navbar-logo-oct17.mjs C:\path\to\bycarlo-portfolio
 *   node patch-navbar-logo-oct17.mjs --dry-run   show what would change, write nothing
 *   node patch-navbar-logo-oct17.mjs --revert    restore all files from backup
 *
 * Safe to run twice: each fix detects its own marker and skips if already
 * applied. Originals are copied to .patch-backups/navbar-logo-oct17/ the
 * first time only, before anything is written.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const REVERT = args.includes("--revert");
const ROOT = path.resolve(args.find((a) => !a.startsWith("--")) || process.cwd());

const F_CSS = path.join(ROOT, "app", "globals.css");
const F_PAGE = path.join(ROOT, "app", "page.js");
const F_SVG = path.join(ROOT, "public", "svg", "carlo-C.svg");

const BACKUP_DIR = path.join(ROOT, ".patch-backups", "navbar-logo-oct17");
const B_CSS = path.join(BACKUP_DIR, "globals.css.bak");
const B_PAGE = path.join(BACKUP_DIR, "page.js.bak");

const log = (m) => console.log(m);
const fail = (m) => { console.error("\nERROR: " + m + "\nNothing was changed."); process.exit(1); };
const eolOf = (s) => (s.includes("\r\n") ? "\r\n" : "\n");
const toEol = (s, eol) => s.replace(/\r?\n/g, eol);

for (const [label, f] of [["app/globals.css", F_CSS], ["app/page.js", F_PAGE]]) {
  if (!fs.existsSync(f)) fail("Can't find " + label + "\nRun this from the project root, or pass the project folder as an argument.");
}
if (!fs.existsSync(F_SVG)) {
  fail("Can't find public/svg/carlo-C.svg\nMake sure the Carlo C SVG is in public/svg/ before running this patch.");
}

/* ---------- revert ---------- */

if (REVERT) {
  const pairs = [
    ["app/globals.css", F_CSS, B_CSS],
    ["app/page.js", F_PAGE, B_PAGE],
  ];
  let any = false;
  for (const [label, file, backup] of pairs) {
    if (!fs.existsSync(backup)) { log("skip " + label + " (no backup found, patch was never applied)"); continue; }
    any = true;
    if (DRY) { log("[dry run] would restore " + label + " from " + path.relative(ROOT, backup)); continue; }
    fs.copyFileSync(backup, file);
    log("Restored " + label + " from " + path.relative(ROOT, backup));
  }
  if (!any) log("Nothing to revert.");
  process.exit(0);
}

/* ---------- apply ---------- */

// Take backups of the two files up front, before any write, first run only.
if (!DRY) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(B_CSS)) fs.copyFileSync(F_CSS, B_CSS);
  if (!fs.existsSync(B_PAGE)) fs.copyFileSync(F_PAGE, B_PAGE);
}

let changed = false;

/* 1) navbar brand mark - JS side (app/page.js) */
{
  const MARK = "gnav-logo--mark";
  const src = fs.readFileSync(F_PAGE, "utf8");
  const eol = eolOf(src);

  if (src.includes(MARK)) {
    log("skip app/page.js (navbar logo already swapped)");
  } else {
    const anchor =
      '<img src="/png/bcdlogo.png" alt="" width={26} height={26} className="gnav-logo gnav-logo-light" draggable={false} />';
    if (!src.includes(anchor)) fail("Couldn't find the gnav-brand <img> in app/page.js (file may have changed).");

    // Carlo "C" is 241x260 (wide), not square, so width/height are switched
    // from the old 26x26 to intrinsic-ratio-ish box via CSS (handled by the
    // gnav-logo--mark rule below) rather than fixed equal px here.
    const replacement =
      '<img src="/svg/carlo-C.svg" alt="" width={26} height={28} className="gnav-logo ' + MARK + '" draggable={false} />';

    const next = src.replace(anchor, replacement);
    if (DRY) {
      log("[dry run] would update app/page.js: navbar logo -> /svg/carlo-C.svg (no circle crop)");
    } else {
      fs.writeFileSync(F_PAGE, toEol(next, eol), "utf8");
      log("Updated app/page.js (navbar logo now carlo-C.svg)");
    }
    changed = true;
  }
}

/* 2) navbar brand mark - CSS side (app/globals.css) */
{
  const MARK = "gnav-logo--mark";
  const src = fs.readFileSync(F_CSS, "utf8");
  const eol = eolOf(src);

  if (src.includes(MARK)) {
    log("skip app/globals.css (navbar logo CSS already applied)");
  } else {
    const anchor1 =
      ".gnav-logo {\n" +
      "  position: absolute;\n" +
      "  inset: 0;\n" +
      "  display: block;\n" +
      "  width: 100%;\n" +
      "  height: 100%;\n" +
      "  border-radius: 50%;\n" +
      "  object-fit: cover;\n" +
      "  user-select: none;\n" +
      "  box-shadow: 0 0 0 1px var(--gn-line, rgba(20, 20, 20, 0.14));\n" +
      "  transition: opacity 0.45s ease-in-out;\n" +
      "}";
    if (!src.includes(anchor1)) fail("Couldn't find the .gnav-logo rule in app/globals.css (file may have changed).");

    const addition1 =
      eol + eol +
      "/* " + MARK + ": the Carlo \"C\" is a wide (241x260), transparent-background SVG," + eol +
      "   not a square photo, so it skips the circular crop/ring built for bcdlogo.png -" + eol +
      "   no border-radius, no cover-crop, no hairline box-shadow ring. object-fit:" + eol +
      "   contain keeps the whole glyph visible as the brand box resizes on scroll. */" + eol +
      "." + MARK + " {" + eol +
      "  border-radius: 0;" + eol +
      "  object-fit: contain;" + eol +
      "  box-shadow: none;" + eol +
      "}";

    const anchor2 = ".gnav-wrap.is-scrolled .gnav-logo { box-shadow: 0 0 0 1px var(--ng-edge); }";
    if (!src.includes(anchor2)) fail("Couldn't find the is-scrolled .gnav-logo box-shadow rule in app/globals.css (file may have changed).");

    const addition2 =
      eol + eol +
      "/* " + MARK + ": no ring in the scrolled/themed state either - see note above */" + eol +
      ".gnav-wrap.is-scrolled ." + MARK + " { box-shadow: none; }";

    let next = src.replace(anchor1, anchor1 + addition1);
    next = next.replace(anchor2, anchor2 + addition2);

    if (DRY) {
      log("[dry run] would update app/globals.css: add ." + MARK + " rule (no circle crop/ring, object-fit: contain)");
    } else {
      fs.writeFileSync(F_CSS, toEol(next, eol), "utf8");
      log("Updated app/globals.css (navbar logo circle crop/ring disabled for the Carlo C mark)");
    }
    changed = true;
  }
}

log(changed ? "\nDone." : "\nNothing to do - the navbar logo swap is already applied.");
