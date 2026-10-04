// patch-navbar-tweaks.mjs
//   - navbar a little taller
//   - "Insights" link removed
//   - logo a little smaller
//   - shorter highlight (hover / active chip) behind the nav links
//
// Run from the project root:   node patch-navbar-tweaks.mjs
// Then:                        npm run dev   ->   git add . && git commit -m "Navbar tweaks" && git push
// Backups go into .patch-backups/

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app", "page.js");
const cssPath = path.join(root, "app", "globals.css");
for (const p of [pagePath, cssPath]) {
  if (!fs.existsSync(p)) { console.error("Cannot find " + p + "\nRun this from the bycarlo-portfolio root folder."); process.exit(1); }
}

const read = (p) => { const raw = fs.readFileSync(p, "utf8"); return { text: raw.replace(/\r\n/g, "\n"), crlf: raw.includes("\r\n") }; };
const save = (p, f) => fs.writeFileSync(p, f.crlf ? f.text.replace(/\n/g, "\r\n") : f.text, "utf8");
const fail = (m) => { console.error("Patch aborted, nothing was written.\n" + m); process.exit(1); };

const page = read(pagePath);
const css = read(cssPath);

if (css.text.includes("/* navbar-tweaks-v2 */")) { console.log("Navbar tweaks already applied. Nothing to do."); process.exit(0); }

const swap = (t, find, rep, label, expected = 1) => {
  const n = t.split(find).length - 1;
  if (n !== expected) fail("Could not find expected code (" + label + "): " + n + " match(es), expected " + expected + ". Did the file change?");
  return t.split(find).join(rep);
};

/* page.js */
let p = page.text;
p = swap(p, '  { id: "manifesto", label: "Insights" },\n', "", "Insights link");
p = swap(p, "width={30} height={30}", "width={26} height={26}", "logo size attrs", 2);
page.text = p;

/* globals.css */
let c = css.text;
// taller bar
c = swap(c, "  padding: 8px 20px;\n  border-radius: 0;", "  padding: 12px 20px;\n  border-radius: 0;", "bar padding");
c = swap(c, "  width: 680px;\n  padding: 5px 6px 5px 8px;", "  width: 680px;\n  padding: 8px 8px 8px 10px;", "scrolled bar padding");
c = swap(c, ".gnav { padding: 6px 10px; gap: 4px; }", ".gnav { padding: 9px 10px; gap: 4px; }", "mobile bar padding");
c = swap(c, ".gnav-wrap.is-scrolled .gnav { width: 100%; padding: 4px 6px; }", ".gnav-wrap.is-scrolled .gnav { width: 100%; padding: 6px 8px 6px 6px; }", "mobile scrolled padding");
// smaller logo
c = swap(c, "  width: 30px;\n  height: 30px;\n  border-radius: 50%;\n  line-height: 0;", "  width: 26px;\n  height: 26px;\n  border-radius: 50%;\n  line-height: 0;", "logo size");
c = swap(c, ".gnav-wrap.is-scrolled .gnav-brand { width: 28px; height: 28px; }", ".gnav-wrap.is-scrolled .gnav-brand { width: 24px; height: 24px; }", "logo size scrolled");
c = swap(c, ".gnav-brand, .gnav-wrap.is-scrolled .gnav-brand { width: 24px; height: 24px; }", ".gnav-brand, .gnav-wrap.is-scrolled .gnav-brand { width: 22px; height: 22px; }", "logo size mobile");
// shorter link highlight
c = swap(c, ".gnav-link {\n  padding: 6px 10px;", ".gnav-link {\n  padding: 4px 10px;", "link highlight height");
c = swap(c, ".gnav-link { padding: 6px 0.45em; }", ".gnav-link { padding: 4px 0.45em; }", "mobile link highlight");
c = swap(c, ".gnav-link { padding: 6px 0.36em; }", ".gnav-link { padding: 4px 0.36em; }", "small-phone link highlight");
c = c.replace(".gnav-link:hover {", "/* navbar-tweaks-v2 */\n.gnav-link:hover {");
css.text = c;

/* backup + write */
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const bdir = path.join(root, ".patch-backups");
fs.mkdirSync(bdir, { recursive: true });
for (const f of [pagePath, cssPath]) fs.copyFileSync(f, path.join(bdir, path.basename(f) + "." + stamp + ".bak"));
save(pagePath, page);
save(cssPath, css);

console.log("Navbar tweaks applied.");
console.log("  taller bar, Insights removed, logo 26px (24px when scrolled, 22px on mobile), link highlight 4px tall");
console.log("\nNext: npm run dev, check it, then git add . && git commit -m \"Navbar tweaks\" && git push");
