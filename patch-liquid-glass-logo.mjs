// patch-liquid-glass-logo.mjs
// byCarlo portfolio – GlassNavbar update:
//   1. Switches the navbar glass to the "liquid glass, edge-lit" design
//      (near-clear fill, strong blur + saturation, lit rim, diagonal sheen)
//   2. Replaces the "byCarlo" text with public/webp/logo.webp as a 1:1 circle
//   3. (optional) --lens adds a soft cyan/purple light layer behind the glass,
//      clipped inside the capsule, so the glass has something to refract on flat areas
//
// Run from the project root:
//   node patch-liquid-glass-logo.mjs            (glass + logo)
//   node patch-liquid-glass-logo.mjs --lens     (glass + logo + light layer)
//
// Safe to re-run: steps that are already applied are skipped.
// Originals are saved to .patch-backups/ before anything is written.

import fs from "node:fs";
import path from "node:path";

const withLens = process.argv.includes("--lens");
const root = process.cwd();
const pagePath = path.join(root, "app", "page.js");
const cssPath = path.join(root, "app", "globals.css");
const logoPath = path.join(root, "public", "webp", "logo.webp");

const fail = (msg) => {
  console.error("\nPatch aborted, nothing was written.\n" + msg + "\n");
  process.exit(1);
};

for (const p of [pagePath, cssPath]) {
  if (!fs.existsSync(p)) fail("Cannot find " + p + "\nRun this script from the bycarlo project root.");
}
if (!fs.existsSync(logoPath)) {
  console.warn("! Warning: public/webp/logo.webp not found. The patch will still apply, but the logo will not show until the file exists.");
}

const read = (p) => {
  const raw = fs.readFileSync(p, "utf8");
  return { raw, text: raw.replace(/\r\n/g, "\n"), crlf: raw.includes("\r\n") };
};
const page = read(pagePath);
const css = read(cssPath);
const report = [];

/* ───────────────────────────── app/page.js ───────────────────────────── */
let p = page.text;

const GLASS_VALUES = '["rgba(255,255,255,0.05)", "rgba(255,255,255,0.22)"]';
const LINE_VALUES = '["rgba(255,255,255,0.10)", "rgba(11,11,14,0.08)"]';

if (p.includes(GLASS_VALUES)) {
  report.push("page.js  glass colours   already applied");
} else {
  const re = /(const glass\s*= useTransform\(themeProgress, \[0, 1\], )\[[^\]]*\]\)/;
  if (!re.test(p)) fail("page.js: could not find the `const glass = useTransform(...)` line in GlassNavbar.");
  p = p.replace(re, (_, a) => a + GLASS_VALUES + ")");
  report.push("page.js  glass colours   updated");
}

if (p.includes(LINE_VALUES)) {
  report.push("page.js  border colours  already applied");
} else {
  const re = /(const line\s*= useTransform\(themeProgress, \[0, 1\], )\[[^\]]*\]\)/;
  if (!re.test(p)) fail("page.js: could not find the `const line = useTransform(...)` line in GlassNavbar.");
  p = p.replace(re, (_, a) => a + LINE_VALUES + ")");
  report.push("page.js  border colours  updated");
}

if (p.includes('className="gnav-logo"')) {
  report.push("page.js  logo             already applied");
} else {
  const re = /<a\s+href="#"\s+className="gnav-brand"[\s\S]*?<\/a>/;
  const m = p.match(re);
  if (!m) fail('page.js: could not find the <a className="gnav-brand"> link in GlassNavbar.');
  const textRe = /<span className="gnav-fold">by<\/span>C<span className="gnav-fold">arlo<\/span>/;
  if (!textRe.test(m[0])) fail("page.js: the brand link no longer contains the byCarlo text spans.");
  const block = m[0]
    .replace('className="gnav-brand"', 'className="gnav-brand"\n          aria-label="byCarlo, back to top"')
    .replace(
      textRe,
      '<img src="/webp/logo.webp" alt="" width={40} height={40} className="gnav-logo" draggable={false} />'
    );
  p = p.replace(m[0], () => block);
  report.push("page.js  logo             text replaced with circular logo");
}

if (withLens) {
  if (p.includes('className="gnav-lens"')) {
    report.push("page.js  light layer      already applied");
  } else {
    const re = /^([ \t]*)<span className="gnav-glass" aria-hidden="true" \/>/m;
    if (!re.test(p)) fail('page.js: could not find <span className="gnav-glass" ... /> to place the light layer before.');
    p = p.replace(re, (m, indent) => indent + '<span className="gnav-lens" aria-hidden="true" />\n' + m);
    report.push("page.js  light layer      added");
  }
}

/* ─────────────────────────── app/globals.css ─────────────────────────── */
let c = css.text;

const GLASS_CSS = `/* liquid glass – near-clear fill, lit rim, diagonal sheen */
.gnav-glass {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid var(--gn-line, rgba(255, 255, 255, 0.10));
  background: var(--gn-glass, rgba(255, 255, 255, 0.05));
  -webkit-backdrop-filter: blur(14px) saturate(200%);
  backdrop-filter: blur(14px) saturate(200%);
  box-shadow:
    inset 1.5px 1.5px 2px -0.5px rgba(255, 255, 255, 0.65),
    inset -1.5px -1.5px 2px -0.5px rgba(255, 255, 255, 0.35),
    inset 0 0 14px rgba(255, 255, 255, 0.08),
    0 10px 30px -6px rgba(0, 0, 0, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s;
}
.gnav-glass::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.26),
    transparent 32%,
    transparent 68%,
    rgba(255, 255, 255, 0.12)
  );
}`;

if (c.includes("liquid glass")) {
  report.push("globals  glass layer      already applied");
} else {
  const re = /^\.gnav-glass\s*\{[^}]*\}/m;
  if (!re.test(c)) fail("globals.css: could not find the `.gnav-glass { ... }` rule.");
  c = c.replace(re, () => GLASS_CSS);
  report.push("globals  glass layer      replaced");
}

// the old drop shadow on the capsule would double up with the glass shadow
const reShadow = /(\.gnav-wrap\.is-scrolled \.gnav \{[^}]*?)\n[ \t]*box-shadow:[^;]*;/;
if (reShadow.test(c)) {
  c = c.replace(reShadow, (_, a) => a);
  report.push("globals  capsule shadow    removed (glass layer owns it now)");
} else {
  report.push("globals  capsule shadow    already removed");
}

// the logo sits flush in the capsule, so the left padding matches the others
if (c.includes("padding: 8px 8px 8px 20px;")) {
  c = c.replace("padding: 8px 8px 8px 20px;", "padding: 8px;");
  report.push("globals  capsule padding   updated");
}
if (c.includes("padding: 6px 10px 6px 14px;")) {
  c = c.replace("padding: 6px 10px 6px 14px;", "padding: 6px 10px 6px 6px;");
  report.push("globals  mobile padding    updated");
}

const LOGO_CSS = `/* logo – 1:1 circle */
.gnav-brand {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  line-height: 0;
}
.gnav-logo {
  display: block;
  width: 40px;
  height: 40px;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  user-select: none;
  box-shadow: 0 0 0 1px var(--gn-line, rgba(255, 255, 255, 0.14)), 0 2px 8px rgba(0, 0, 0, 0.25);
  transition:
    width 0.7s cubic-bezier(0.65, 0, 0.2, 1),
    height 0.7s cubic-bezier(0.65, 0, 0.2, 1),
    transform 0.3s;
}
.gnav-wrap.is-scrolled .gnav-logo { width: 36px; height: 36px; }
.gnav-brand:hover .gnav-logo { transform: scale(1.06); }
@media (max-width: 640px) {
  .gnav-logo,
  .gnav-wrap.is-scrolled .gnav-logo { width: 32px; height: 32px; }
}

`;

if (c.includes(".gnav-logo {")) {
  report.push("globals  logo styles       already applied");
} else {
  const marker = "@media (max-width: 640px) {\n  .gnav { padding: 12px 16px; }";
  if (!c.includes(marker)) fail("globals.css: could not find the navbar mobile @media block to place the logo styles before.");
  c = c.replace(marker, () => LOGO_CSS + marker);
  report.push("globals  logo styles       added");
}

const RM_OLD = ".gnav-link, .gnav-cta { transition: none; }";
if (c.includes(RM_OLD) && !c.includes(".gnav-cta, .gnav-logo { transition: none; }")) {
  c = c.replace(RM_OLD, ".gnav-link, .gnav-cta, .gnav-logo { transition: none; }");
  report.push("globals  reduced motion    logo included");
}

if (withLens) {
  const LENS_CSS = `
/* backdrop light layer – clipped inside the capsule, sits under the glass */
.gnav-lens {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.5s;
}
.gnav-wrap.is-scrolled .gnav-lens { opacity: 1; }
.gnav-lens::before,
.gnav-lens::after {
  content: "";
  position: absolute;
  width: 55%;
  height: 220%;
  top: -60%;
}
.gnav-lens::before {
  left: -8%;
  background: radial-gradient(closest-side, rgba(0, 240, 255, 0.45), transparent);
  animation: lens-a 14s ease-in-out infinite alternate;
}
.gnav-lens::after {
  right: -8%;
  background: radial-gradient(closest-side, rgba(178, 75, 243, 0.45), transparent);
  animation: lens-b 18s ease-in-out infinite alternate;
}
@keyframes lens-a { to { transform: translateX(40%); } }
@keyframes lens-b { to { transform: translateX(-40%); } }
@media (prefers-reduced-motion: reduce) {
  .gnav-lens::before, .gnav-lens::after { animation: none; }
}`;

  if (c.includes(".gnav-lens {")) {
    report.push("globals  light layer      already applied");
  } else {
    const childOld = ".gnav > *:not(.gnav-glass) {";
    const anchor = ".gnav-wrap.is-scrolled .gnav-glass { opacity: 1; }";
    if (!c.includes(childOld)) fail("globals.css: could not find the `.gnav > *:not(.gnav-glass)` rule.");
    if (!c.includes(anchor)) fail("globals.css: could not find `.gnav-wrap.is-scrolled .gnav-glass { opacity: 1; }`.");
    c = c.replace(childOld, ".gnav > *:not(.gnav-glass):not(.gnav-lens) {");
    c = c.replace(anchor, () => anchor + "\n" + LENS_CSS);
    report.push("globals  light layer      added");
  }
}

/* ───────────────────────────── write files ───────────────────────────── */
const toWrite = [];
if (p !== page.text) toWrite.push([pagePath, p, page]);
if (c !== css.text) toWrite.push([cssPath, c, css]);

if (toWrite.length === 0) {
  console.log("\nNothing to do, everything is already applied.\n");
  report.forEach((r) => console.log("  " + r));
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });

for (const [file, text, orig] of toWrite) {
  fs.writeFileSync(path.join(backupDir, path.basename(file) + "." + stamp + ".bak"), orig.raw, "utf8");
  fs.writeFileSync(file, orig.crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");
}

console.log("\nPatch applied.\n");
report.forEach((r) => console.log("  " + r));
console.log("\nBackups: .patch-backups/ (delete the folder, or add it to .gitignore, before committing)");
console.log("Next:    npm run dev  ->  scroll past the top to see the glass capsule");
if (!withLens) console.log("Tip:     re-run with --lens to add the backdrop light layer behind the glass");
console.log("");
