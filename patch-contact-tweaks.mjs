#!/usr/bin/env node
/**
 * patch-contact-tweaks.mjs
 * Follow-up to patch-contact.mjs. Edits the existing ContactMorphSection component:
 *
 *  1. Removes the dot after the morphing CONTACT word.
 *  2. Mobile (<768px): moves all the contact text higher.
 *  3. Desktop (>=768px): "Got a project in mind? Let's Talk!" slightly smaller,
 *     and closer to "Free consultation / No commitment"
 *     (those two lines keep their size).
 *
 * Run from the repo root:
 *   node patch-contact-tweaks.mjs --dry     preview
 *   node patch-contact-tweaks.mjs           apply
 *   node patch-contact-tweaks.mjs --target path/to/ContactMorphSection.jsx
 *
 * Safe to re-run: it replaces its own CSS block, so you can tweak the numbers
 * below and run it again.
 */
import fs from "node:fs";
import path from "node:path";

/* ------------ tweak these numbers if you want more / less ------------ */
const MOBILE_LIFT_VH = 15;                      // was 6 -> text sits this many vh above center on mobile
const DESKTOP_LEAD_SIZE = "clamp(2rem,6.6vw,5.8rem)"; // was clamp(2.2rem,7.4vw,6.5rem)
const DESKTOP_LEAD_GAP = "0";                   // was clamp(.9rem,2.4vw,2rem) (space under the heading)
const DESKTOP_TOP_PULL = "-.2em";               // negative = pulls "Free consultation" up toward the heading
/* --------------------------------------------------------------------- */

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const ti = argv.indexOf("--target");
const TARGET_ARG = ti >= 0 ? argv[ti + 1] : null;
const ROOT = process.cwd();
const START = "ct-tweak-v2";
const END = "/ct-tweak-v2";

const log = (...a) => console.log(...a);
const die = (m) => {
  console.error("\n✖ " + m + "\n");
  process.exit(1);
};
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

if (!fs.existsSync(path.join(ROOT, "package.json"))) die("Run this from the repo root (no package.json here).");

const SKIP = new Set(["node_modules", ".next", ".git", "out", "dist", "build", ".patch-backup", ".vercel", ".turbo"]);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx|tsx|js)$/.test(e.name)) out.push(p);
  }
  return out;
}

/* ---- locate the component ---- */
let file;
if (TARGET_ARG) {
  file = path.resolve(ROOT, TARGET_ARG);
  if (!fs.existsSync(file)) die("--target not found: " + TARGET_ARG);
} else {
  const all = walk(ROOT);
  const byMark = all.filter((f) => fs.readFileSync(f, "utf8").includes("contact-morph-patch:component"));
  const byName = all.filter((f) => /^ContactMorphSection\.(jsx|tsx|js)$/.test(path.basename(f)));
  const list = byMark.length ? byMark : byName;
  if (list.length === 0) die("Could not find ContactMorphSection. Run patch-contact.mjs first, or pass --target <file>.");
  if (list.length > 1) die("Several candidates:\n  " + list.map(rel).join("\n  ") + "\n\nRe-run with --target <file>.");
  file = list[0];
}

let src = fs.readFileSync(file, "utf8");
const report = [];

/* ---- 1) remove the dot (JS) ---- */
const concatRe = /\.concat\(\s*["']\.["']\s*\)/;
const ternaryRe = /k\s*===\s*cs\.length\s*-\s*1\s*\?\s*"ct-u ct-dot"\s*:\s*"ct-u"/;
const hasConcat = concatRe.test(src);
const hasTernary = ternaryRe.test(src);
if (hasConcat && hasTernary) {
  src = src.replace(concatRe, "").replace(ternaryRe, '"ct-u"');
  report.push("dot removed from the morphing word");
} else if (!hasConcat && !hasTernary) {
  report.push("dot already removed (nothing to change)");
} else {
  report.push("! dot code looks hand-edited, only partly matched; the CSS safety rule below still keeps the last letter un-coloured");
}

/* ---- 2) CSS block (stored as JSON strings inside the CSS array) ---- */
const block = [
  "/* " + START + " */",
  ".ct-root .ct-dot{color:inherit}",
  "@media (max-width:767px){.ct-root .ct-wrap{top:-" + MOBILE_LIFT_VH + "vh}}",
  "@media (min-width:768px){" +
    ".ct-root .ct-lead{font-size:" + DESKTOP_LEAD_SIZE + ";margin-bottom:" + DESKTOP_LEAD_GAP + "}" +
    ".ct-root .ct-top{margin-top:" + DESKTOP_TOP_PULL + "}" +
    "}",
  "/* " + END + " */",
];

const arrRe = /const CSS = \[\r?\n([\s\S]*?)\r?\n\]\.join\(\s*"\\n"\s*\);/;
const m = arrRe.exec(src);
if (!m) die("Could not find the CSS array in " + rel(file) + ". The file may have been restructured; use --target or edit by hand.");

let lines;
try {
  lines = JSON.parse("[" + m[1] + "]");
} catch (e) {
  die("The CSS array in " + rel(file) + " is not plain JSON strings (hand-edited?), so I won't touch it.");
}
const had = lines.some((l) => l.includes(START));
if (had) {
  const s = lines.findIndex((l) => l.includes(START));
  const e = lines.findIndex((l, i) => i >= s && l.includes(END));
  lines.splice(s, (e >= 0 ? e : lines.length - 1) - s + 1);
}
lines.push(...block);
const newArr = "const CSS = [\n" + lines.map((l) => "  " + JSON.stringify(l)).join(",\n") + '\n].join("\\n");';
src = src.slice(0, m.index) + newArr + src.slice(m.index + m[0].length);
report.push((had ? "refreshed" : "added") + " the mobile/desktop spacing CSS");

/* ---- write ---- */
log("\nContact tweaks" + (DRY ? "  [dry run]" : ""));
log("  file: " + rel(file));
report.forEach((r) => log("  - " + r));

if (DRY) {
  log("\n(nothing written)\n");
} else {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(ROOT, ".patch-backup", "contact-tweak-" + stamp, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
  fs.writeFileSync(file, src);
  log("\n  backup: " + rel(dest));
  log("\nDone. Check #contact on mobile and desktop (npm run dev).\n");
}
