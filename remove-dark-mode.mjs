#!/usr/bin/env node
// Removes dark mode from the byCarlo portfolio and keeps light mode only.
//
// Usage (run from the project root; commit first so you can review with git diff):
//   node remove-dark-mode.mjs --dry-run   (shows what would change, writes nothing)
//   node remove-dark-mode.mjs             (applies the patch)
//
// What it does
//   app/page.js         removes the DARK palette, THEME_KEY, ThemeToggle, the theme state /
//                       localStorage logic, the dark logo <img>, and the themeProgress prop.
//                       Every useTransform(themeProgress, [0,1], [dark, light]) becomes the
//                       plain light value.
//   app/globals.css     removes :root[data-theme="dark"], the dark navbar variables, the dark
//                       logo / fallback rules and all toggle-switch styles. The light rules
//                       stay and no longer depend on [data-theme].
//   app/GlassSurface.css removes prefers-color-scheme: dark blocks, light-dark() keeps the light value.
//
// Safe to re-run: steps that are already applied are skipped.

import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry-run");
const ROOT = process.cwd();

const files = {};
const changed = new Set();
let warnings = 0;

function load(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    console.error(`✗ ${rel} not found. Run this from the project root.`);
    process.exit(1);
  }
  files[rel] = fs.readFileSync(p, "utf8");
}

function step(rel, label, fn) {
  const before = files[rel];
  const after = fn(before);
  if (after === before) {
    console.log(`  - skipped (nothing to change): ${label}`);
    return;
  }
  files[rel] = after;
  changed.add(rel);
  console.log(`  ✓ ${label}`);
}

// replace a regex/string once; warn if it is not found
function sub(src, pattern, replacement, label) {
  const hit = typeof pattern === "string" ? src.includes(pattern) : pattern.test(src);
  if (!hit) {
    console.log(`    ! not found (already patched or file differs): ${label}`);
    warnings++;
    return src;
  }
  return typeof pattern === "string" ? src.replace(pattern, replacement) : src.replace(pattern, replacement);
}

/* ── helpers to turn useTransform(themeProgress, [0,1], [dark, light]) into `light` ── */
function matchParen(s, openIdx) {
  let depth = 0, q = null;
  for (let i = openIdx; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; }
    if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) { depth--; if (depth === 0) return i; }
  }
  return -1;
}
function splitTop(s) {
  const out = []; let depth = 0, q = null, cur = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { cur += c; if (c === "\\") cur += s[++i]; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; cur += c; continue; }
    if ("([{".includes(c)) depth++;
    if (")]}".includes(c)) depth--;
    if (c === "," && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}
function collapseThemeTransforms(src) {
  const needle = "useTransform(themeProgress";
  let count = 0, idx;
  while ((idx = src.indexOf(needle)) !== -1) {
    const open = idx + "useTransform".length;
    const close = matchParen(src, open);
    const args = splitTop(src.slice(open + 1, close));
    const range = args[2]; // "[dark, light]"
    const pair = splitTop(range.slice(1, -1)).filter(Boolean);
    src = src.slice(0, idx) + pair[1] + src.slice(close + 1);
    count++;
  }
  return { src, count };
}

/* ═════════════════════════ app/page.js ═════════════════════════ */
const PAGE = "app/page.js";
load(PAGE);
console.log(`\n${PAGE}`);

step(PAGE, "remove DARK palette", (s) =>
  sub(s, /const DARK = \{[\s\S]*?\};\n\n/, "", "DARK palette"));

step(PAGE, "remove THEME_KEY", (s) =>
  sub(s, /const THEME_KEY = "bycarlo-theme";\n\n/, "", "THEME_KEY"));

step(PAGE, "remove ThemeToggle component", (s) =>
  sub(s, /\/\* ── ThemeToggle[\s\S]*?(?=\/\* ── GlassNavbar)/, "", "ThemeToggle component"));

step(PAGE, "simplify GlassNavbar (no theme props, no toggle, no dark logo)", (s) => {
  s = sub(s, "function GlassNavbar({ themeProgress, theme, onThemeChange }) {", "function GlassNavbar() {", "GlassNavbar signature");
  s = sub(s, "  // Colors follow the theme through the same eased motion value as the sections\n", "  // Light-mode colors\n", "navbar color comment");
  s = sub(s, ' data-theme={theme}>', ">", "data-theme on navbar wrapper");
  s = sub(
    s,
    /\s*\{\/\* light mode -> bcdlogo\.png[^\n]*\*\/\}\n(\s*<img src="\/png\/bcdlogo\.png"[^\n]*\n)\s*<img src="\/png\/bcwlogo\.png"[^\n]*\n/,
    "\n$1",
    "dark logo <img>"
  );
  s = sub(s, /\n[ \t]*<ThemeToggle theme=\{theme\} onChange=\{onThemeChange\} \/>/, "", "<ThemeToggle /> usage");
  return s;
});

step(PAGE, "replace useTransform(themeProgress, …) with the light value", (s) => {
  const { src, count } = collapseThemeTransforms(s);
  console.log(`    (${count} transforms collapsed)`);
  return src;
});

step(PAGE, "remove themeProgress props", (s) => {
  s = s.replace(/\(\{ themeProgress \}\)/g, "()");
  s = s.replace(/themeProgress, /g, "");
  s = s.replace(/ themeProgress=\{themeProgress\}/g, "");
  return s;
});

step(PAGE, "remove theme state, localStorage and layout effect from Page()", (s) => {
  s = sub(
    s,
    /  \/\/ 1 = light \(default\), 0 = dark\.[\s\S]*?applyTheme\(saved === "dark" \? "dark" : "light", true\);\n  \}, \[applyTheme\]\);\n\n/,
    "",
    "Page theme logic"
  );
  s = sub(s, /<GlassNavbar [^>]*\/>/, "<GlassNavbar />", "<GlassNavbar /> usage");
  return s;
});

step(PAGE, "tidy dark-mode comments", (s) => {
  s = s.replace("/* ── Hero (always dark) ──────────────────────────── */", "/* ── Hero ────────────────────────────────────────── */");
  s = s.replace("/* ── Page root – manual light / dark theme ──────── */", "/* ── Page root ───────────────────────────────────── */");
  s = s.replace("/* ── Tech Stack (theme-aware, RubberSegment-style tabs) ─ */", "/* ── Tech Stack (RubberSegment-style tabs) ─ */");
  s = s.replace(/  \/\/ Matches the original RubberSegment CSS variables 1:1, swapped per theme:\n  \/\/ light mode = [^\n]*\n  \/\/ dark mode  = [^\n]*\n/, "  // Matches the original RubberSegment CSS variables (dark track, light thumb)\n");
  s = s.replace("false = every icon follows the theme (light text in dark mode, dark text in light mode)", "false = every icon uses the site text color");
  s = s.replace("near-black brand icons still follow the theme */", "near-black brand icons still use the site text color */");
  s = s.replace("// 3D icon colors (face = site text color, thickness = site gray tones), all theme-live", "// 3D icon colors (face = site text color, thickness = site gray tones)");
  s = s.replace("colors follow the theme live */", "*/");
  s = s.replace("// Colors come from CSS variables set on the icon grid, so they follow the theme live:", "// Colors come from CSS variables set on the icon grid:");
  return s;
});

step(PAGE, "drop unused imports", (s) => {
  for (const name of ["useLayoutEffect", "animate", "useMotionValue"]) {
    const uses = (s.match(new RegExp(`\\b${name}\\b`, "g")) || []).length;
    if (uses === 1) {
      s = s.replace(new RegExp(`\\n  ${name},`), "");            // multi-line import list
      s = s.replace(new RegExp(`, ${name}(?=[ ,}])`), "");     // inline import list
    }
  }
  return s;
});

// sanity check
for (const bad of ["themeProgress", "DARK.", "THEME_KEY", "ThemeToggle", "data-theme", "localStorage"]) {
  if (files[PAGE].includes(bad)) {
    console.log(`    ! "${bad}" is still present in ${PAGE}, check it by hand`);
    warnings++;
  }
}

/* ═════════════════════════ app/globals.css ═════════════════════════ */
const CSS = "app/globals.css";
load(CSS);
console.log(`\n${CSS}`);

step(CSS, "remove :root[data-theme=\"dark\"] variables", (s) => {
  s = sub(s, /\/\* dark \*\/\n:root\[data-theme="dark"\] \{[\s\S]*?\n\}\n\n/, "", "dark :root block");
  s = s.replace("/* light (default) */", "/* light */");
  return s;
});

step(CSS, "fix comment on .theme-section", (s) =>
  s.replace("/* Sections that participate in the dark‑to‑light transition */", "/* Sections: promote to their own layer for smoother scrolling */"));

step(CSS, "glass fallback: keep light only", (s) => {
  s = sub(s, /\.gnav-wrap\[data-theme="dark"\] \.glass-surface--fallback \{[\s\S]*?\n\}\n/, "", "dark glass fallback");
  s = s.replace("/* Safari / Firefox fallback: follow the SITE theme switch, not the OS theme */", "/* Safari / Firefox fallback */");
  s = s.replace('.gnav-wrap[data-theme="light"] .glass-surface--fallback {', ".gnav-wrap .glass-surface--fallback {");
  return s;
});

step(CSS, "logo: remove dark logo rules", (s) => {
  s = sub(
    s,
    /\.gnav-logo-dark \{ opacity: 0; \}\n\.gnav-wrap\[data-theme="dark"\] \.gnav-logo-light \{ opacity: 0; \}\n\.gnav-wrap\[data-theme="dark"\] \.gnav-logo-dark \{ opacity: 1; \}\n/,
    "",
    "dark logo rules"
  );
  s = s.replace("/* logo – 1:1 circle, light / dark files cross-fade */", "/* logo – 1:1 circle */");
  return s;
});

step(CSS, "remove theme toggle switch styles", (s) => {
  s = sub(s, /\/\* light \/ dark swipe switch \*\/\n\.gnav-toggle \{[\s\S]*?\.gnav-toggle\[data-theme="dark"\] \.gnav-ico-moon \{[^\n]*\}\n\n/, "", "toggle block");
  s = sub(s, /  \.gnav-toggle \{ --tw: 40px;[^\n]*\n  \.gnav-ico \{ width: 10px; height: 10px; \}\n/, "", "mobile toggle sizes");
  s = sub(s, /\n\/\* theme toggle: same swipe-switch layout[\s\S]*?\.gnav-wrap\[data-theme\]\.is-scrolled \.gnav-toggle-thumb \{[\s\S]*?\n\}\n/, "", "scrolled toggle colors");
  s = sub(s, "  .gnav-brand, .gnav-toggle-thumb, .gnav-ico, body { transition: none; }", "  .gnav-brand, body { transition: none; }", "reduced-motion list");
  return s;
});

step(CSS, "navbar capsule variables: light only, no [data-theme]", (s) => {
  s = sub(s, /\.gnav-wrap\[data-theme="dark"\] \{[\s\S]*?\n\}\n/, "", "dark --ng-* variables");
  s = s.replace('.gnav-wrap[data-theme="light"] {', ".gnav-wrap {");
  s = s.replace(/\.gnav-wrap\[data-theme\]/g, ".gnav-wrap");
  return s;
});

if (/data-theme|gnav-toggle|gnav-ico/.test(files[CSS])) {
  console.log(`    ! leftover theme/toggle selectors in ${CSS}, check by hand`);
  warnings++;
}

/* ═════════════════════════ app/GlassSurface.css ═════════════════════════ */
const GCSS = "app/GlassSurface.css";
load(GCSS);
console.log(`\n${GCSS}`);

step(GCSS, "light-dark() → light value", (s) => {
  const pairs = [
    ["light-dark(hsl(0 0% 100% / var(--glass-frost, 0)), hsl(0 0% 0% / var(--glass-frost, 0)))", "hsl(0 0% 100% / var(--glass-frost, 0))"],
    ["light-dark(color-mix(in oklch, black, transparent 85%), color-mix(in oklch, white, transparent 65%))", "color-mix(in oklch, black, transparent 85%)"],
    ["light-dark(color-mix(in oklch, black, transparent 90%), color-mix(in oklch, white, transparent 85%))", "color-mix(in oklch, black, transparent 90%)"],
    ["light-dark(#007aff, #0a84ff)", "#007aff"],
  ];
  for (const [from, to] of pairs) s = sub(s, from, to, from.slice(0, 40) + "…");
  return s;
});

step(GCSS, "remove prefers-color-scheme: dark blocks", (s) => {
  s = sub(s, /\n@media \(prefers-color-scheme: dark\) \{\n  \.glass-surface--fallback \{[\s\S]*?\n  \}\n\}\n/, "", "dark media block");
  s = sub(s, /\n@supports not \(backdrop-filter: blur\(10px\)\) \{\n  @media \(prefers-color-scheme: dark\) \{[\s\S]*?\n  \}\n\}\n/, "", "dark @supports block");
  return s;
});

/* ═════════════════════════ write ═════════════════════════ */
console.log("");
if (DRY) {
  console.log(`Dry run: ${changed.size} file(s) would change: ${[...changed].join(", ") || "none"}`);
} else {
  for (const rel of changed) fs.writeFileSync(path.join(ROOT, rel), files[rel]);
  console.log(`Done: ${changed.size} file(s) updated: ${[...changed].join(", ") || "none"}`);
}
if (warnings) console.log(`${warnings} warning(s) above. Review with git diff.`);
console.log("Optional: public/png/bcwlogo.png (white logo) is no longer used and can be deleted.");
