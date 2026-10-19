#!/usr/bin/env node
/**
 * patch-font-sitewide.mjs
 *
 * Makes the whole byCarlo site use the hero font (Archivo, registered in
 * globals.css as "HeroDisplay" by patch-hero-red.mjs) instead of Hewitt Web.
 *
 * Every heading, paragraph, button, the navbar, the contact morph, etc. already
 * read --font-display / --font-body, so only those two variables change.
 * Hewitt Web stays in the stack as a fallback while the new font loads.
 *
 * Usage (from the repo root, after patch-hero-red.mjs):
 *   node patch-font-sitewide.mjs            apply
 *   node patch-font-sitewide.mjs --revert   undo
 *
 * Touches:  app/globals.css      Backup: .patch-backups/font-sitewide/
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CSS = path.join(ROOT, "app/globals.css");
const FONT = path.join(ROOT, "app/fonts/ArchivoVF.woff2");
const BK = path.join(ROOT, ".patch-backups/font-sitewide");
const MARK = "font-sitewide:applied";
const die = (m) => { console.error("\n✖ " + m + "\n"); process.exit(1); };

if (!fs.existsSync(CSS)) die("Missing app/globals.css. Run this from the repo root.");

if (process.argv.includes("--revert")) {
  const b = path.join(BK, "globals.css.bak");
  if (!fs.existsSync(b)) die("No backup found in .patch-backups/font-sitewide/");
  fs.copyFileSync(b, CSS);
  console.log("✔ Reverted app/globals.css");
  process.exit(0);
}

let css = fs.readFileSync(CSS, "utf8");
if (css.includes(MARK)) die("Already applied. Use --revert first to run it again.");
if (!css.includes('font-family: "HeroDisplay"') || !fs.existsSync(FONT))
  die("The hero font isn't installed yet. Run patch-hero-red.mjs first.");

const STACK = `"HeroDisplay", var(--font-cooper), 'Cooper Hewitt', system-ui, sans-serif`;
const dRe = /(--font-display:\s*)var\(--font-cooper\)[^;]*;/;
const bRe = /(--font-body:\s*)var\(--font-cooper\)[^;]*;/;
if (!dRe.test(css) || !bRe.test(css)) die("Could not find the --font-display / --font-body lines in :root of app/globals.css.");

css = css.replace(dRe, (_, a) => `${a}${STACK};`).replace(bRe, (_, a) => `${a}${STACK};`);
css = css.replace(/\s*$/, "\n/* font-sitewide:applied */\n");

fs.mkdirSync(BK, { recursive: true });
fs.copyFileSync(CSS, path.join(BK, "globals.css.bak"));
fs.writeFileSync(CSS, css);

console.log("✔ --font-display and --font-body now use the hero font (Archivo)");
console.log("  Backup: .patch-backups/font-sitewide/   (undo: node patch-font-sitewide.mjs --revert)");
console.log("\nNext: npm run dev");
