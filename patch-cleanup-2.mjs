#!/usr/bin/env node
/**
 * patch-cleanup-2.mjs  -  leftovers after patch-cleanup.mjs (byCarlo portfolio)
 *
 * Audit result: no unused JS, imports, components, CSS classes, keyframes,
 * variables, logos or dependencies remain. What is left is clutter that never
 * reaches the browser:
 *
 *   1. .patch-backup/ and .patch-backups/   (50 files, ~1.6 MB of old .bak copies;
 *      the patch scripts that used them are gone and git history has everything)
 *   2. stale "xxx:applied / :start / :end" marker comments in page.js, layout.js,
 *      ContactMorphSection.js, globals.css (only the comment lines are removed;
 *      the code between :start and :end stays)
 *   3. README.md re-saved as UTF-8 (it is UTF-16 right now, which GitHub and many
 *      tools show as garbage)
 *
 * Opt-in flags (off by default):
 *   --lean-photo         <img src> fallback -> /png/me-900.webp, delete me.png (2.1 MB).
 *                        The webp <source> already serves every modern browser.
 *   --drop-brand-assets  delete bcdlogo.png, bcwlogo.png, carlo-wordmark.svg
 *                        (nothing references them; may be your source artwork)
 *   --drop-guide         delete GUIDE.md (outdated setup guide)
 *
 * Usage (repo root):
 *   node patch-cleanup-2.mjs --dry-run
 *   node patch-cleanup-2.mjs
 *   node patch-cleanup-2.mjs --revert
 *
 * Backup goes to .cleanup-backup-2/ (added to .gitignore).
 */
import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");
const LEAN = args.has("--lean-photo");
const BRAND = args.has("--drop-brand-assets");
const GUIDE = args.has("--drop-guide");
const BK = ".cleanup-backup-2";

const die = (m) => { console.error("\n\u2716 " + m + "\n"); process.exit(1); };
const exists = (p) => fs.existsSync(p);
const rd = (p) => fs.readFileSync(p);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

if (!exists("app/page.js") || !exists("app/globals.css") || !exists("package.json"))
  die("Missing app/page.js, app/globals.css or package.json. Run this from the repo root.");

/* ------------------------------------------------------------- revert --- */
if (REVERT) {
  if (!exists(BK)) die(`No ${BK}/ folder, nothing to revert.`);
  const manifest = JSON.parse(fs.readFileSync(path.join(BK, "manifest.json"), "utf8"));
  for (const rel of manifest.files) {
    fs.mkdirSync(path.dirname(rel), { recursive: true });
    fs.copyFileSync(path.join(BK, "files", rel), rel);
  }
  console.log(`\n\u2714 Restored ${manifest.files.length} file(s) from ${BK}/. (Delete that folder when done.)\n`);
  process.exit(0);
}

if (exists(BK) && !DRY) die(`${BK}/ already exists. Run --revert first, or delete it if you are happy with the last run.`);

/* ------------------------------------------------------------- plan ---- */
const edits = []; // {file, label, text}
const deletions = []; // {path, label}

// 2. marker comments --------------------------------------------------------
const MARKER_CSS = /^[ \t]*\/\*\s*[\w-]+(?::[\w-]+)*:(?:applied|start|end)\s*\*\/[ \t]*\r?\n/gm;
const MARKER_JS = /^[ \t]*\/\/\s*[\w-]+(?::[\w-]+)*:(?:applied|start|end)[ \t]*\r?\n?/gm;

function stripMarkers(file, re) {
  if (!exists(file)) return;
  const src = rd(file).toString("utf8");
  const crlf = src.includes("\r\n");
  let out = src.replace(re, "");
  // tidy: no more than one blank line in a row where we removed things, no leading blank at EOF
  const nl = crlf ? "\r\n" : "\n";
  out = out.replace(new RegExp(`(?:${nl}){3,}`, "g"), nl + nl);
  out = out.replace(/(?:\r?\n)+$/, nl);
  if (out !== src) {
    const n = (src.match(re) || []).length;
    edits.push({ file, label: `remove ${n} stale marker comment(s)`, text: out });
  }
}
stripMarkers("app/page.js", MARKER_CSS);
stripMarkers("app/ContactMorphSection.js", MARKER_CSS);
stripMarkers("app/globals.css", MARKER_CSS);
stripMarkers("app/layout.js", MARKER_JS);

// layout.js: dangling tag at the end of a sentence
if (exists("app/layout.js")) {
  const cur = edits.find((e) => e.file === "app/layout.js")?.text ?? rd("app/layout.js").toString("utf8");
  if (cur.includes(" perf-optimize:trimmed")) {
    const out = cur.replace(" perf-optimize:trimmed", "");
    const e = edits.find((x) => x.file === "app/layout.js");
    if (e) e.text = out; else edits.push({ file: "app/layout.js", label: "drop dangling tag in comment", text: out });
  }
}

// 3. README UTF-16 -> UTF-8 -------------------------------------------------
if (exists("README.md")) {
  const b = rd("README.md");
  if (b[0] === 0xff && b[1] === 0xfe) {
    edits.push({ file: "README.md", label: "re-save as UTF-8 (was UTF-16)", text: b.subarray(2).toString("utf16le") });
  }
}

// 4. .gitignore -------------------------------------------------------------
if (exists(".gitignore") && !rd(".gitignore").toString("utf8").includes(BK)) {
  const g = rd(".gitignore").toString("utf8");
  const nl = g.includes("\r\n") ? "\r\n" : "\n";
  edits.push({ file: ".gitignore", label: `ignore ${BK}/`, text: g.replace(/\s*$/, nl) + `${nl}# cleanup-2 backup (safe to delete once you are happy)${nl}/${BK}/${nl}` });
}

// 1. old backup folders -----------------------------------------------------
for (const d of [".patch-backup", ".patch-backups"])
  if (exists(d)) deletions.push({ path: d, label: "old patch backups (git history keeps them)" });

// opt-ins -------------------------------------------------------------------
if (LEAN) {
  const P = "app/page.js";
  const cur = edits.find((e) => e.file === P)?.text ?? rd(P).toString("utf8");
  if (!cur.includes('src="/png/me.png"')) die('--lean-photo: could not find src="/png/me.png" in app/page.js (already applied?).');
  if (!exists("public/png/me-900.webp")) die("--lean-photo: public/png/me-900.webp is missing.");
  const out = cur.replace('src="/png/me.png"', 'src="/png/me-900.webp"');
  const e = edits.find((x) => x.file === P);
  if (e) { e.text = out; e.label += " + photo fallback -> me-900.webp"; } else edits.push({ file: P, label: "photo fallback -> me-900.webp", text: out });
  deletions.push({ path: "public/png/me.png", label: "opt-in: 2.1 MB fallback no browser requests" });
}
if (BRAND) for (const r of ["public/png/bcdlogo.png", "public/png/bcwlogo.png", "public/svg/carlo-wordmark.svg"])
  if (exists(r)) deletions.push({ path: r, label: "opt-in: not referenced anywhere" });
if (GUIDE && exists("GUIDE.md")) deletions.push({ path: "GUIDE.md", label: "opt-in: outdated setup guide" });

/* ------------------------------------------------------------ report --- */
const fileCount = deletions.reduce((n, d) => n + (fs.statSync(d.path).isDirectory() ? walk(d.path).length : 1), 0);
console.log(`\nplanned edits (${edits.length}):`);
for (const e of edits) console.log(`  \u2022 ${e.file}: ${e.label}`);
console.log(`\nplanned deletions (${deletions.length} path(s), ${fileCount} file(s)):`);
for (const d of deletions) console.log(`  \u2022 ${d.path}   [${d.label}]`);
if (!edits.length && !deletions.length) { console.log("\nNothing to do. Already clean.\n"); process.exit(0); }
if (DRY) { console.log("\n(dry run, nothing written)\n"); process.exit(0); }

/* ------------------------------------------------------------- apply --- */
const saved = [];
const backup = (rel) => {
  const dest = path.join(BK, "files", rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(rel, dest);
  saved.push(rel);
};
for (const e of edits) { backup(e.file); }
for (const d of deletions) {
  if (fs.statSync(d.path).isDirectory()) walk(d.path).forEach(backup); else backup(d.path);
}
fs.writeFileSync(path.join(BK, "manifest.json"), JSON.stringify({ files: saved }, null, 2));
for (const e of edits) fs.writeFileSync(e.file, e.text, typeof e.text === "string" ? "utf8" : undefined);
for (const d of deletions) fs.rmSync(d.path, { recursive: true, force: true });

console.log(`\n\u2714 Applied: ${edits.length} file(s) edited, ${fileCount} file(s) deleted.`);
console.log(`  Next: npm run build   (backup in ${BK}/, undo with --revert)\n`);
