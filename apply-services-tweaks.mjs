#!/usr/bin/env node
/**
 * apply-services-tweaks.mjs
 *
 * Three small changes to the Services section:
 *   1) the heading reads  < SERVICES />   (screen readers still hear "Services")
 *   2) the heading is a little bigger (max 1.9rem -> 2.4rem, scales with the screen)
 *   3) the whole section is pulled up 100px, closer to the Projects above it
 *
 * What it changes (targeted replacements, nothing else is touched)
 *   - app/page.js     the <h2 className="svc-heading"> line inside Services()
 *   - app/globals.css the .svc-track rule (adds --svc-pull + a negative margin-top)
 *                     the .svc-heading rule (font-size + letter-spacing)
 *
 * Usage (from the project root, next to package.json):
 *   node apply-services-tweaks.mjs --dry-run     # preview only, writes nothing
 *   node apply-services-tweaks.mjs               # apply
 *   node apply-services-tweaks.mjs --revert      # put the old heading, size and spacing back
 *
 * Safe to re-run. Nothing is written unless every anchor is found. Backups (made once):
 *   app/page.js.bak-services-tweaks, app/globals.css.bak-services-tweaks
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const F = {
  page: path.join(__dirname, "app", "page.js"),
  css: path.join(__dirname, "app", "globals.css"),
};
const BAK = ".bak-services-tweaks";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const REVERT = args.includes("--revert");

const note = (m) => console.log(m);
const fail = (m) => { console.error("✗ " + m); process.exit(1); };

for (const k of Object.keys(F)) {
  if (!existsSync(F[k])) fail(`${path.relative(__dirname, F[k])} not found. Run this from the project root.`);
}

let page = readFileSync(F.page, "utf8");
let css = readFileSync(F.css, "utf8");

/* ── The exact strings ──────────────────────────────────────────────────── */

// page.js
const H_OLD = '<h2 className="svc-heading">Services</h2>';
const H_NEW = '<h2 className="svc-heading" aria-label="Services">{"< SERVICES />"}</h2>';

// globals.css: .svc-heading
const FS_OLD_VH = "font-size: clamp(1.15rem, min(3.6vw, 3.4vh), 1.9rem);";
const FS_OLD_SVH = "font-size: clamp(1.15rem, min(3.6vw, 3.4svh), 1.9rem);";
const FS_NEW_VH = "font-size: clamp(1.35rem, min(4.6vw, 4.2vh), 2.4rem);";
const FS_NEW_SVH = "font-size: clamp(1.35rem, min(4.6vw, 4.2svh), 2.4rem);";
const LS_OLD = "letter-spacing: -0.03em;";
const LS_NEW = "letter-spacing: 0.02em;"; // capitals read better with a touch of air

// globals.css: the two rules we edit
const TRACK_RE = /\.svc-track\s*\{[^}]*\}/;
const HEAD_RE = /\.svc-heading\s*\{[^}]*\}/;

/* ── Helpers ────────────────────────────────────────────────────────────── */

// Run `fn` on one CSS rule. fn returns the new rule text, or null if its anchors are missing.
function editRule(src, re, name, fn) {
  const m = re.exec(src);
  if (!m) fail(`${name} rule not found in app/globals.css. Is the Services block installed? Nothing was written.`);
  const next = fn(m[0]);
  if (next === null) fail(`${name} rule has unexpected contents (edited by hand?). Nothing was written.`);
  return { src: src.slice(0, m.index) + next + src.slice(m.index + m[0].length), changed: next !== m[0] };
}

function backupOnce(file) {
  const bak = file + BAK;
  if (!existsSync(bak)) {
    if (!DRY) copyFileSync(file, bak);
    note(`  backup   ${path.relative(__dirname, bak)}`);
  }
}

let pageChanged = false;
let cssChanged = false;
const steps = [];

/* ── Revert ─────────────────────────────────────────────────────────────── */
if (REVERT) {
  note("Reverting services tweaks" + (DRY ? " (dry run)" : "") + "...");

  if (page.includes(H_NEW)) { page = page.replace(H_NEW, () => H_OLD); pageChanged = true; steps.push("  restored heading text"); }
  else steps.push("  app/page.js: nothing to revert");

  // remove the two lines the pull-up added
  let r = editRule(css, TRACK_RE, ".svc-track", (rule) =>
    rule
      .replace(/\r?\n[ \t]*--svc-pull: [^\r\n]*/, "")
      .replace(/\r?\n[ \t]*margin-top: calc\(var\(--svc-pull\) \* -1\);/, ""));
  if (r.changed) { css = r.src; cssChanged = true; steps.push("  removed the 100px pull-up"); }

  r = editRule(css, HEAD_RE, ".svc-heading", (rule) =>
    rule.includes(FS_NEW_SVH)
      ? rule.replace(FS_NEW_VH, () => FS_OLD_VH).replace(FS_NEW_SVH, () => FS_OLD_SVH).replace(LS_NEW, () => LS_OLD)
      : rule);
  if (r.changed) { css = r.src; cssChanged = true; steps.push("  restored heading size"); }

  steps.forEach(note);
  if (!DRY) {
    if (pageChanged) writeFileSync(F.page, page);
    if (cssChanged) writeFileSync(F.css, css);
    for (const k of Object.keys(F)) if (existsSync(F[k] + BAK)) unlinkSync(F[k] + BAK);
  }
  note(DRY ? "Dry run only, nothing was written." : "Done.");
  process.exit(0);
}

/* ── Apply ──────────────────────────────────────────────────────────────── */
note("Applying services tweaks" + (DRY ? " (dry run)" : "") + "...");

// 1) heading text
if (page.includes(H_NEW)) {
  steps.push("  app/page.js: heading already reads < SERVICES />, skipped");
} else if (page.includes(H_OLD)) {
  page = page.replace(H_OLD, () => H_NEW);
  pageChanged = true;
  steps.push('  patched  app/page.js (heading -> < SERVICES />)');
} else {
  fail('The <h2 className="svc-heading">Services</h2> line was not found in app/page.js. Is the Services section installed? Nothing was written.');
}

// 2) pull the section up toward Projects
{
  const r = editRule(css, TRACK_RE, ".svc-track", (rule) => {
    if (rule.includes("--svc-pull")) return rule;
    if (!/(\r?\n[ \t]*)position: relative;/.test(rule)) return null;
    return rule.replace(
      /(\r?\n[ \t]*)position: relative;/,
      (m, ws) =>
        `${ws}--svc-pull: 100px; /* pulls Services up toward Projects: bigger = closer */` +
        `${ws}position: relative;` +
        `${ws}margin-top: calc(var(--svc-pull) * -1);`
    );
  });
  if (r.changed) { css = r.src; cssChanged = true; steps.push("  patched  app/globals.css (.svc-track pulled up 100px)"); }
  else steps.push("  app/globals.css: pull-up already applied, skipped");
}

// 3) bigger heading
{
  const r = editRule(css, HEAD_RE, ".svc-heading", (rule) => {
    if (rule.includes(FS_NEW_SVH)) return rule;
    if (!rule.includes(FS_OLD_VH) || !rule.includes(FS_OLD_SVH) || !rule.includes(LS_OLD)) return null;
    return rule
      .replace(FS_OLD_VH, () => FS_NEW_VH)
      .replace(FS_OLD_SVH, () => FS_NEW_SVH)
      .replace(LS_OLD, () => LS_NEW);
  });
  if (r.changed) { css = r.src; cssChanged = true; steps.push("  patched  app/globals.css (.svc-heading bigger)"); }
  else steps.push("  app/globals.css: heading size already applied, skipped");
}

if (pageChanged) backupOnce(F.page);
if (cssChanged) backupOnce(F.css);
steps.forEach(note);

if (!DRY) {
  if (pageChanged) writeFileSync(F.page, page);
  if (cssChanged) writeFileSync(F.css, css);
}

if (DRY) {
  note("Dry run only, nothing was written.");
} else {
  note("");
  note("Done. Next steps:");
  note("  1. Run `npm run dev` (or refresh if it is already running) and open http://localhost:3000");
  note("  2. Scroll down from the projects: Services now starts 100px closer, and the heading reads < SERVICES />.");
  note("  3. Distance to Projects: change --svc-pull in app/globals.css (.svc-track). 100px = 100px closer; try 140px for closer still.");
  note("  4. Heading size: the two font-size lines in .svc-heading (the 2.4rem is the maximum size).");
  note("  5. Happy with it? Commit: git add -A && git commit -m \"Tweak services heading and spacing\"");
  note("  6. Not happy? Undo these three changes: node apply-services-tweaks.mjs --revert");
}
