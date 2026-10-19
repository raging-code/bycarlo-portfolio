#!/usr/bin/env node
/**
 * patch-hero-no-services.mjs   (run AFTER patch-hero-pin.mjs)
 *
 * Removes the rotating services list from the hero (Website Development,
 * IoT Solutions, Custom Full-Stack Development) together with the code that
 * animated it. The headline, word carousel and pinned-scroll effect stay.
 *
 * Usage (repo root):
 *   node patch-hero-no-services.mjs            apply
 *   node patch-hero-no-services.mjs --revert   undo
 *
 * Touches: app/page.js, app/globals.css      Backup: .patch-backups/hero-no-services/
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PAGE = path.join(ROOT, "app/page.js");
const CSS = path.join(ROOT, "app/globals.css");
const BK = path.join(ROOT, ".patch-backups/hero-no-services");
const MARK = "hero-no-services:applied";
const die = (m) => { console.error("\n✖ " + m + "\n"); process.exit(1); };

for (const f of [PAGE, CSS]) if (!fs.existsSync(f)) die(`Missing ${path.relative(ROOT, f)}. Run this from the repo root.`);

if (process.argv.includes("--revert")) {
  if (!fs.existsSync(BK)) die("No backup found in .patch-backups/hero-no-services/");
  fs.copyFileSync(path.join(BK, "page.js.bak"), PAGE);
  fs.copyFileSync(path.join(BK, "globals.css.bak"), CSS);
  console.log("✔ Reverted page.js and globals.css");
  process.exit(0);
}

let page = fs.readFileSync(PAGE, "utf8");
let css = fs.readFileSync(CSS, "utf8");
if (page.includes(MARK)) die("Already applied. Use --revert first to run it again.");
if (!page.includes("hero-pin:applied")) die("Run patch-hero-pin.mjs first (this patch edits the hero it installs).");

/* every edit must match exactly once, otherwise stop before writing anything */
const cut = (label, re, to = "") => {
  const m = page.match(re);
  if (!m) die(`Could not find: ${label}. The hero code was changed by hand, so I stopped without editing anything.`);
  page = page.replace(re, () => to);
};

cut("services list data", /const HERO_SERVICES = \[[\s\S]*?\];\n/);
cut("listRef", /\n  const listRef = useRef\(null\);/);
cut("services markup", /\n\s*<div className="hf-rot"[\s\S]*?<\/ul>\s*<\/div>/);

cut("effect guard", /const ht = titleRef\.current, col = colRef\.current, ul = listRef\.current, wd = wordsRef\.current;\n    if \(!ht \|\| !col \|\| !ul \|\| !wd\) return;/,
  "const ht = titleRef.current, col = colRef.current, wd = wordsRef.current;\n    if (!ht || !col || !wd) return;");
cut("rotator setup", /\n    const lis = Array\.from\(ul\.children\);/);
cut("rotator count", /\n    const N = HERO_SERVICES\.length;/);
cut("timer vars", /let idx = 0, wi = 0, interval = 0, reset = 0, start = 0,/, "let wi = 0, start = 0,");
cut("rotator logic", /\n    \/\/ services rotator[\s\S]*?\n    \/\/ word carousel/, "\n    // word carousel");
cut("resize handler", /const onResize = \(\) => \{ fit\(\); step\(\); \};/, "const onResize = () => { fit(); };");
cut("start step", /\n      fit\(\);\n      step\(\);/, "\n      fit();");
cut("rotator interval", /\n      interval = setInterval\(tick, 2300\);/);
cut("cleanup", /\n      clearInterval\(interval\);/);
cut("cleanup reset", /\n      clearTimeout\(reset\);/);

page = page.replace(/\s*$/, "\n/* hero-no-services:applied */\n");

/* the bottom padding was reserving room for the list, so re-balance the hero */
css = css.replace(/\s*$/, "\n") + `
/* hero-no-services:start */
.hf-hero { padding-bottom: 88px; }
/* hero-no-services:end */
/* hero-no-services:applied */
`;

fs.mkdirSync(BK, { recursive: true });
fs.copyFileSync(PAGE, path.join(BK, "page.js.bak"));
fs.copyFileSync(CSS, path.join(BK, "globals.css.bak"));
fs.writeFileSync(PAGE, page);
fs.writeFileSync(CSS, css);

console.log("✔ Removed the services list from the hero (markup, data and rotator code)");
console.log("✔ Re-balanced hero padding so the headline stays centered");
console.log("  Backups: .patch-backups/hero-no-services/   (undo: node patch-hero-no-services.mjs --revert)");
console.log("\nNext: npm run dev");
