#!/usr/bin/env node
/**
 * apply-services-below-projects.mjs
 *
 * Moves the Services section so it comes directly after Projects.
 *
 *   before:  <Projects />  <TechStack />  <Services />  <Manifesto /> ...
 *   after:   <Projects />  <Services />   <TechStack />  <Manifesto /> ...
 *
 * Only one line in app/page.js moves (the `<Services />` line inside Page()).
 * Nothing else is touched. Requires the Services section to already be in the project
 * (apply-services-pinned.mjs), which it is in your current repo.
 *
 * Usage (from the project root, next to package.json):
 *   node apply-services-below-projects.mjs --dry-run     # preview only, writes nothing
 *   node apply-services-below-projects.mjs               # apply
 *   node apply-services-below-projects.mjs --revert      # put Services back after Tech Stack
 *
 * Safe to re-run. Backup (made once, before the first change): app/page.js.bak-services-below-projects
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(__dirname, "app", "page.js");
const BAK = PAGE + ".bak-services-below-projects";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const REVERT = args.includes("--revert");

const note = (m) => console.log(m);
const fail = (m) => { console.error("✗ " + m); process.exit(1); };

if (!existsSync(PAGE)) fail("app/page.js not found. Run this from the project root.");

let page = readFileSync(PAGE, "utf8");
const EOL = page.includes("\r\n") ? "\r\n" : "\n"; // keep Windows line endings intact

const PROJECTS_RE = /^([ \t]*)<Projects\b[^\r\n]*\/>\r?\n/m;
const TECH_RE = /^([ \t]*)<TechStack \/>\r?\n/m;
const SERVICES_RE = /^[ \t]*<Services \/>\r?\n/m;
const BELOW_PROJECTS_RE = /^[ \t]*<Projects\b[^\r\n]*\/>\r?\n[ \t]*<Services \/>\r?\n/m;

if (!SERVICES_RE.test(page)) {
  fail("<Services /> is not rendered in app/page.js. Run apply-services-pinned.mjs first. Nothing was written.");
}

function save(next, label) {
  if (!existsSync(BAK)) {
    if (!DRY) copyFileSync(PAGE, BAK);
    note(`  backup   ${path.relative(__dirname, BAK)}`);
  }
  if (!DRY) writeFileSync(PAGE, next);
  note(`  patched  app/page.js (${label})`);
}

/* ── Revert ─────────────────────────────────────────────────────────────── */
if (REVERT) {
  note("Reverting: Services back after Tech Stack" + (DRY ? " (dry run)" : "") + "...");
  if (!BELOW_PROJECTS_RE.test(page)) {
    note("  app/page.js: Services is not directly below Projects, nothing to revert");
  } else {
    if (!TECH_RE.test(page)) fail("<TechStack /> not found in app/page.js. Nothing was written.");
    let next = page.replace(SERVICES_RE, "");
    next = next.replace(TECH_RE, (m, indent) => m + indent + "<Services />" + EOL);
    if (!DRY) writeFileSync(PAGE, next);
    note("  moved <Services /> back after <TechStack />");
    if (!DRY && existsSync(BAK)) unlinkSync(BAK);
  }
  note(DRY ? "Dry run only, nothing was written." : "Done.");
  process.exit(0);
}

/* ── Apply ──────────────────────────────────────────────────────────────── */
note("Moving Services below Projects" + (DRY ? " (dry run)" : "") + "...");

if (BELOW_PROJECTS_RE.test(page)) {
  note("  app/page.js: Services is already directly below Projects, skipped");
} else {
  if (!PROJECTS_RE.test(page)) fail("<Projects ... /> not found in app/page.js, so there is nowhere to move Services to. Nothing was written.");
  let next = page.replace(SERVICES_RE, "");
  next = next.replace(PROJECTS_RE, (m, indent) => m + indent + "<Services />" + EOL);
  save(next, "<Services /> now directly after <Projects />");
}

if (DRY) {
  note("Dry run only, nothing was written.");
} else {
  note("");
  note("Done. Next steps:");
  note("  1. Run `npm run dev` (or refresh if it is already running) and open http://localhost:3000");
  note("  2. Scroll past the projects: the red Services panel now pins right below them.");
  note("     Projects and Services are both red, so they read as one continuous red area.");
  note("  3. Happy with it? Commit: git add -A && git commit -m \"Move services below projects\"");
  note("  4. Not happy? Put it back after Tech Stack: node apply-services-below-projects.mjs --revert");
}
