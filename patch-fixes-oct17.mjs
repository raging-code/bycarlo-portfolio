#!/usr/bin/env node
/**
 * byCarlo - three fixes
 *
 *   1) Tech stack deck ("What I build with.") - remove the square tap/focus
 *      outline that showed up on the front card when tapping it on touch
 *      devices. The ring now only appears after real keyboard (Tab/arrow)
 *      use, and disappears again the moment you tap/click a card.
 *        - app/globals.css: adds a .tsd-stage.tsd-no-ring:focus-visible rule
 *        - app/page.js: adds a noRing state that flips off on pointer/touch
 *          and on when an arrow key is used, and applies it as a class
 *
 *   2) Contact section - "Free consultation" / "No commitment" bigger on
 *      both mobile and desktop.
 *        - app/ContactMorphSection.js: raises the .ct-top font-size clamp
 *          from clamp(1rem,2.9vw,2.4rem) to clamp(1.3rem,3.8vw,3.2rem)
 *
 *   3) About section paint-brush reveal - thin white seam lines inside the
 *      red stroke, caused by anti-aliasing gaps where the many tangent-circle
 *      sub-paths meet (the ribbon is one big nonzero-winding union filled
 *      once). Filling the same path a second time snaps those half-covered
 *      seam pixels to full coverage and removes the hairlines.
 *        - app/page.js: ctx.fill() called twice in the paint() function
 *
 * Usage (run from the project root, or pass the project folder):
 *   node patch-fixes-oct17.mjs
 *   node patch-fixes-oct17.mjs C:\path\to\bycarlo-portfolio
 *   node patch-fixes-oct17.mjs --dry-run   show what would change, write nothing
 *   node patch-fixes-oct17.mjs --revert    restore all files from backup
 *
 * Safe to run twice: each fix detects its own marker and skips if already
 * applied. Originals are copied to .patch-backups/fixes-oct17/ the first
 * time only, before anything is written.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const REVERT = args.includes("--revert");
const ROOT = path.resolve(args.find((a) => !a.startsWith("--")) || process.cwd());

const F_CSS = path.join(ROOT, "app", "globals.css");
const F_CONTACT = path.join(ROOT, "app", "ContactMorphSection.js");
const F_PAGE = path.join(ROOT, "app", "page.js");

const BACKUP_DIR = path.join(ROOT, ".patch-backups", "fixes-oct17");
const B_CSS = path.join(BACKUP_DIR, "globals.css.bak");
const B_CONTACT = path.join(BACKUP_DIR, "ContactMorphSection.js.bak");
const B_PAGE = path.join(BACKUP_DIR, "page.js.bak");

const log = (m) => console.log(m);
const fail = (m) => { console.error("\nERROR: " + m + "\nNothing was changed."); process.exit(1); };
const eolOf = (s) => (s.includes("\r\n") ? "\r\n" : "\n");
const toEol = (s, eol) => s.replace(/\r?\n/g, eol);

for (const [label, f] of [["app/globals.css", F_CSS], ["app/ContactMorphSection.js", F_CONTACT], ["app/page.js", F_PAGE]]) {
  if (!fs.existsSync(f)) fail("Can't find " + label + "\nRun this from the project root, or pass the project folder as an argument.");
}

/* ---------- revert ---------- */

if (REVERT) {
  const pairs = [
    ["app/globals.css", F_CSS, B_CSS],
    ["app/ContactMorphSection.js", F_CONTACT, B_CONTACT],
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

// Take backups of the three files up front, before any write, first run only.
if (!DRY) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(B_CSS)) fs.copyFileSync(F_CSS, B_CSS);
  if (!fs.existsSync(B_CONTACT)) fs.copyFileSync(F_CONTACT, B_CONTACT);
  if (!fs.existsSync(B_PAGE)) fs.copyFileSync(F_PAGE, B_PAGE);
}

let changed = false;

/* 1a) tech stack tap outline - CSS side (app/globals.css) */
{
  const MARK = "tsd-no-tap-outline";
  const src = fs.readFileSync(F_CSS, "utf8");
  const eol = eolOf(src);

  if (src.includes(MARK)) {
    log("skip app/globals.css (tech stack outline fix already applied)");
  } else {
    const anchor = ".tsd-stage:focus-visible { outline: 2px solid var(--tsd-text); outline-offset: -6px; border-radius: 28px; }";
    if (!src.includes(anchor)) fail("Couldn't find the .tsd-stage focus-visible rule in app/globals.css (file may have changed).");

    const addition =
      eol + eol +
      "/* " + MARK + " */" + eol +
      "/* :focus-visible alone isn't reliable on touch: some mobile browsers still" + eol +
      "   treat a tap as \"visible\" focus, which drew a square ring around the front" + eol +
      "   card. .tsd-no-ring is toggled from JS: on while idle / after a tap, off the" + eol +
      "   moment real keyboard (Tab/arrow) navigation happens. */" + eol +
      ".tsd-stage.tsd-no-ring:focus-visible { outline: none; }";

    const next = src.replace(anchor, anchor + addition);
    if (DRY) {
      log("[dry run] would update app/globals.css: suppress tap-triggered outline on .tsd-stage");
    } else {
      fs.writeFileSync(F_CSS, toEol(next, eol), "utf8");
      log("Updated app/globals.css (tech stack tap outline removed)");
    }
    changed = true;
  }
}

/* 1b) tech stack tap outline - JS side (app/page.js) */
{
  const MARK = "tsd-no-tap-outline";
  const src = fs.readFileSync(F_PAGE, "utf8");
  const eol = eolOf(src);

  if (src.includes("tsd-no-ring")) {
    log("skip app/page.js (tech stack outline JS already applied)");
  } else {
    const anchorClass = 'className={"tsd-stage" + (revealed ? "" : " collapsed")}';
    if (!src.includes(anchorClass)) fail("Couldn't find the .tsd-stage className in app/page.js (file may have changed).");
    const nextClass = 'className={"tsd-stage" + (revealed ? "" : " collapsed") + (noRing ? " tsd-no-ring" : "")}';

    const anchorState = "const [dragDx, setDragDx] = useState(0);";
    if (!src.includes(anchorState)) fail("Couldn't find the tech stack drag state in app/page.js (file may have changed).");
    const stateAddition = eol + "  const [noRing, setNoRing] = useState(true); // " + MARK + ": true until a real Tab/arrow key is used";

    const anchorPointerDown = "const handlePointerDown = (e, i) => {";
    if (!src.includes(anchorPointerDown)) fail("Couldn't find handlePointerDown in app/page.js (file may have changed).");
    const pointerDownAddition = anchorPointerDown + "\n    setNoRing(true); // " + MARK + ": a tap/click always hides the ring again";

    const anchorKeyBody =
      'const handleKeyDown = (e) => {\n' +
      '    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }\n' +
      '    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }';
    if (!src.includes(anchorKeyBody)) fail("Couldn't find handleKeyDown in app/page.js (file may have changed).");
    const keyAddition =
      'const handleKeyDown = (e) => {\n' +
      '    if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "Tab") setNoRing(false); // ' + MARK + '\n' +
      '    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }\n' +
      '    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }';

    let next = src.replace(anchorClass, nextClass);
    next = next.replace(anchorState, anchorState + stateAddition);
    next = next.replace(anchorPointerDown, pointerDownAddition);
    next = next.replace(anchorKeyBody, keyAddition);

    if (DRY) {
      log("[dry run] would update app/page.js: wire tsd-no-ring state so the outline only shows for real keyboard nav");
    } else {
      fs.writeFileSync(F_PAGE, toEol(next, eol), "utf8");
      log("Updated app/page.js (tech stack outline state wired up)");
    }
    changed = true;
  }
}

/* 2) Free consultation / No commitment - bigger text (app/ContactMorphSection.js) */
{
  const MARK = "ct-top-bigger";
  const src = fs.readFileSync(F_CONTACT, "utf8");
  const eol = eolOf(src);

  if (src.includes(MARK)) {
    log("skip app/ContactMorphSection.js (ct-top text already enlarged)");
  } else {
    const oldRule =
      "\".ct-root .ct-top{margin:0 0 clamp(.4rem,2.6vw,2.2rem);display:grid;gap:0;font-family:'DM Sans',system-ui,sans-serif;font-weight:400;font-size:clamp(1rem,2.9vw,2.4rem);line-height:1.7;letter-spacing:0;color:var(--ct-fg)}\",";
    if (!src.includes(oldRule)) fail("Couldn't find the .ct-top CSS rule in app/ContactMorphSection.js (file may have changed).");

    // was clamp(1rem, 2.9vw, 2.4rem) -> now clamp(1.3rem, 3.8vw, 3.2rem): bigger on phones AND on desktop
    const newRule =
      "/* " + MARK + " */ \".ct-root .ct-top{margin:0 0 clamp(.4rem,2.6vw,2.2rem);display:grid;gap:0;font-family:'DM Sans',system-ui,sans-serif;font-weight:400;font-size:clamp(1.3rem,3.8vw,3.2rem);line-height:1.6;letter-spacing:0;color:var(--ct-fg)}\",";

    const next = src.replace(oldRule, newRule);
    if (DRY) {
      log("[dry run] would update app/ContactMorphSection.js: .ct-top font-size clamp(1rem,2.9vw,2.4rem) -> clamp(1.3rem,3.8vw,3.2rem)");
    } else {
      fs.writeFileSync(F_CONTACT, toEol(next, eol), "utf8");
      log("Updated app/ContactMorphSection.js (Free consultation / No commitment enlarged)");
    }
    changed = true;
  }
}

/* 3) paint-brush white seam lines (app/page.js) */
{
  const MARK = "ab-seam-fix";
  // re-read: step 1b may already have rewritten this file
  const src = fs.readFileSync(F_PAGE, "utf8");
  const eol = eolOf(src);

  if (src.includes(MARK)) {
    log("skip app/page.js (paint-brush seam fix already applied)");
  } else {
    const anchor =
      "      ctx.beginPath();\n" +
      "      abRibbon(ctx, geo, p, abSwell(p));\n" +
      "      ctx.fill();";
    if (!src.includes(anchor)) fail("Couldn't find the ribbon paint() call in app/page.js (file may have changed).");

    const replacement =
      "      // " + MARK + ": the ribbon is one big nonzero-winding union of many\n" +
      "      // overlapping tangent-circle sub-paths, filled once. Anti-aliasing leaves\n" +
      "      // thin, half-covered seam pixels where sub-paths only just overlap, which\n" +
      "      // show up as hairline streaks against the dark fill. A second fill over the\n" +
      "      // same path pushes those seam pixels to full coverage and removes them.\n" +
      "      ctx.beginPath();\n" +
      "      abRibbon(ctx, geo, p, abSwell(p));\n" +
      "      ctx.fill();\n" +
      "      ctx.fill();";

    const next = src.replace(anchor, replacement);
    if (DRY) {
      log("[dry run] would update app/page.js: fill the About ribbon path twice to remove anti-aliasing seams");
    } else {
      fs.writeFileSync(F_PAGE, toEol(next, eol), "utf8");
      log("Updated app/page.js (paint-brush white seam lines fixed)");
    }
    changed = true;
  }
}

log(changed ? "\nDone." : "\nNothing to do - all three fixes are already applied.");
