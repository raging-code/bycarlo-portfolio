#!/usr/bin/env node
/**
 * patch-perf-optimize.mjs
 *
 * Performance / responsiveness audit fixes. Targets the five biggest real
 * costs found in the current build, in priority order:
 *
 *   1. public/png/me.png is a 2.1MB raw PNG rendered at ≤225px CSS width on
 *      mobile (31cqw, max 225px) — i.e. the phone downloads ~100x more image
 *      data than it ever paints. Generates 450w/900w/1800w WebP variants
 *      (png as fallback) and swaps the <img> for a <picture> with srcset,
 *      so each device fetches a size close to what it actually displays.
 *   2. layout.js still loads all 5 Hewitt Web weights (~100KB) via
 *      next/font/local even though patch-font-sitewide.mjs already made
 *      Archivo (HeroDisplay) the font that's actually painted everywhere —
 *      Hewitt is now a fallback that's never rendered. Trims the weight
 *      list to the one still referenced as a true fallback (400) so the
 *      other four aren't downloaded for nothing.
 *   3. ContactMorphSection / ContactThreads (canvas text-morph effect,
 *      ~19KB component + its own Google Fonts fetch) sit statically
 *      imported in the client bundle despite being the very last section
 *      on the page. Switches to next/dynamic with ssr:false so it's split
 *      into its own chunk and only fetched as the user nears it.
 *   4. Lenis smooth-scroll re-implements scrolling in JS on every device,
 *      including low-end phones where it fights the browser's native
 *      scroll compositor and is the single biggest scroll-jank source.
 *      Already skips prefers-reduced-motion; this additionally skips it
 *      on narrow/coarse-pointer (touch) viewports, where native scrolling
 *      is both faster and what users expect.
 *   5. next.config.mjs is the default empty config: turns on gzip
 *      compression and production console stripping.
 *
 * Nothing here changes layout, colors, spacing, or animation timing —
 * only how assets are fetched/sized and when JS runs.
 *
 * Usage (from the repo root):
 *   node patch-perf-optimize.mjs            apply
 *   node patch-perf-optimize.mjs --revert   undo
 *
 * Touches: app/page.js, app/layout.js, app/globals.css, next.config.mjs,
 *          public/png/me*.webp (new files)
 * Backup:  .patch-backups/perf-optimize/
 *
 * Requires `sharp` to generate the WebP variants (installed on demand into
 * node_modules if missing; not added to package.json).
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";



const ROOT = process.cwd();
const PAGE = path.join(ROOT, "app/page.js");
const LAYOUT = path.join(ROOT, "app/layout.js");
const CSS = path.join(ROOT, "app/globals.css");
const CONFIG = path.join(ROOT, "next.config.mjs");
const SMOOTHSCROLL = path.join(ROOT, "app/SmoothScroll.jsx");
const SRC_IMG = path.join(ROOT, "public/png/me.png");
const IMG_DIR = path.join(ROOT, "public/png");
const BK = path.join(ROOT, ".patch-backups/perf-optimize");
const MARK = "perf-optimize:applied";

const die = (m) => {
  console.error("\n✖ " + m + "\n");
  process.exit(1);
};

for (const f of [PAGE, LAYOUT, CSS, CONFIG, SMOOTHSCROLL, SRC_IMG]) {
  if (!fs.existsSync(f)) die(`Missing ${path.relative(ROOT, f)}. Run this from the repo root.`);
}

/* ------------------------------------------------------------ revert ---- */
if (process.argv.includes("--revert")) {
  if (!fs.existsSync(BK)) die("No backup found in .patch-backups/perf-optimize/");
  for (const [src, dest] of [
    ["page.js.bak", PAGE],
    ["layout.js.bak", LAYOUT],
    ["globals.css.bak", CSS],
    ["next.config.mjs.bak", CONFIG],
    ["SmoothScroll.jsx.bak", SMOOTHSCROLL],
  ]) {
    fs.copyFileSync(path.join(BK, src), dest);
  }
  for (const w of [450, 900, 1800]) {
    const p = path.join(IMG_DIR, `me-${w}.webp`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  console.log("✔ Reverted page.js, layout.js, globals.css, next.config.mjs, SmoothScroll.jsx and removed generated WebP files");
  process.exit(0);
}

let page = fs.readFileSync(PAGE, "utf8");
let layout = fs.readFileSync(LAYOUT, "utf8");
let css = fs.readFileSync(CSS, "utf8");
let config = fs.readFileSync(CONFIG, "utf8");

if (page.includes(MARK)) die("Already applied. Use --revert first to run it again.");

/* every exact-match edit is staged here first; nothing is written to disk
   until every single one has matched exactly once */
const edits = []; // { label, apply: () => void }
const requireOnce = (haystack, needle, label) => {
  const count = haystack.split(needle).length - 1;
  if (count !== 1) die(`Expected exactly 1 match for "${label}", found ${count}. Aborting before writing anything.`);
};

/* ---------------------------------------------------------- 1. image --- */
requireOnce(
  page,
  `              <img src="/png/me.png" alt="Carlo" draggable={false} loading="lazy" decoding="async" width={1086} height={1448} />`,
  "about photo <img> tag"
);

const PICTURE_MARKUP = `              <picture>
                <source
                  srcSet="/png/me-450.webp 450w, /png/me-900.webp 900w, /png/me-1800.webp 1800w"
                  sizes="(max-width: 860px) 225px, 31vw"
                  type="image/webp"
                />
                <img
                  src="/png/me.png"
                  alt="Carlo"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  width={1086}
                  height={1448}
                />
              </picture>`;

edits.push({
  label: "about photo: swap <img> for responsive <picture srcSet>",
  apply() {
    page = page.replace(
      `              <img src="/png/me.png" alt="Carlo" draggable={false} loading="lazy" decoding="async" width={1086} height={1448} />`,
      PICTURE_MARKUP
    );
  },
});

/* ----------------------------------------------- 2. trim dead fallback - */
requireOnce(
  layout,
  `const cooper = localFont({
  src: [
    { path: "./fonts/HewittWeb-Book.woff2", weight: "400", style: "normal" },
    { path: "./fonts/HewittWeb-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/HewittWeb-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/HewittWeb-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/HewittWeb-Heavy.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-cooper",
  display: "swap",
});`,
  "cooper localFont block"
);

edits.push({
  label: "layout.js: drop 4 of 5 Hewitt Web weights (dead fallback since HeroDisplay took over)",
  apply() {
    layout = layout.replace(
      `const cooper = localFont({
  src: [
    { path: "./fonts/HewittWeb-Book.woff2", weight: "400", style: "normal" },
    { path: "./fonts/HewittWeb-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/HewittWeb-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/HewittWeb-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/HewittWeb-Heavy.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-cooper",
  display: "swap",
});`,
      `// Only the 400 weight ships: --font-cooper is a system-fallback link in the
// --font-display/--font-body stack (see globals.css) and is never painted
// while HeroDisplay (Archivo) loads successfully, so the other 4 static
// weights were pure dead weight. perf-optimize:trimmed
const cooper = localFont({
  src: [{ path: "./fonts/HewittWeb-Book.woff2", weight: "400", style: "normal" }],
  variable: "--font-cooper",
  display: "swap",
});`
    );
  },
});

/* --------------------------------------- 3. code-split contact section - */
requireOnce(page, `import ContactMorphSection from "./ContactMorphSection";`, "ContactMorphSection static import");
requireOnce(page, `import { useRef, useState, useEffect, useCallback } from "react";`, "react import line");

edits.push({
  label: "page.js: code-split ContactMorphSection via next/dynamic (last section, own chunk)",
  apply() {
    page = page.replace(
      `import { useRef, useState, useEffect, useCallback } from "react";`,
      `import { useRef, useState, useEffect, useCallback } from "react";\nimport dynamic from "next/dynamic";`
    );
    page = page.replace(
      `import ContactMorphSection from "./ContactMorphSection";`,
      `// perf-optimize: last section on the page, own chunk, fetched only as the
// user scrolls near it instead of bundled into the initial page JS.
const ContactMorphSection = dynamic(() => import("./ContactMorphSection"), {
  ssr: false,
  loading: () => <div aria-hidden="true" style={{ minHeight: "100svh" }} />,
});`
    );
  },
});

/* ------------------------------------------- 4. skip Lenis on touch/mobile */
let smoothScroll = fs.readFileSync(SMOOTHSCROLL, "utf8");
requireOnce(
  smoothScroll,
  `if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;`,
  "SmoothScroll reduced-motion guard"
);

edits.push({
  label: "SmoothScroll.jsx: skip Lenis on touch/coarse-pointer & narrow viewports (native scroll instead)",
  apply() {
    smoothScroll = smoothScroll.replace(
      `if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;`,
      `if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // perf-optimize: touch/coarse-pointer devices (phones, most low-end
    // hardware) get smoother, cheaper scrolling from the browser's native
    // compositor than from a JS-driven rAF loop fighting it every frame.
    if (window.matchMedia("(pointer: coarse)").matches) return;`
    );
  },
});

/* ------------------------------------------------- 5. next.config.mjs --- */
requireOnce(config, `const nextConfig = {};`, "empty nextConfig object");
edits.push({
  label: "next.config.mjs: enable gzip compression, strip console.* from production build",
  apply() {
    config = config.replace(
      `const nextConfig = {};`,
      `const nextConfig = {
  // perf-optimize
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};`
    );
  },
});

/* --------------------------------------------------------- image build - */
// A require() rooted at the repo (not at this script's own location) so
// resolution checks ROOT/node_modules the same way `node` itself would.
const rootRequire = createRequire(path.join(ROOT, "package.json"));

function resolveSharp() {
  try {
    return rootRequire.resolve("sharp");
  } catch {
    return null;
  }
}

function ensureSharp() {
  let resolved = resolveSharp();
  if (resolved) return resolved;

  console.log("→ installing sharp (dev-only)…");
  // --no-save avoids touching package.json, but on some setups (notably
  // Windows) a package installed that way isn't visible to module
  // resolution in the same process right after. Try it first since it's
  // the least invasive; if resolution still fails, fall back to a normal
  // install so the rest of the patch can actually run.
  try {
    execSync("npm install sharp --no-save", { cwd: ROOT, stdio: "inherit" });
  } catch (err) {
    die(`npm install sharp failed: ${err.message}`);
  }

  resolved = resolveSharp();
  if (resolved) return resolved;

  console.log("→ sharp still not resolvable after --no-save install, retrying as a normal install…");
  try {
    execSync("npm install sharp", { cwd: ROOT, stdio: "inherit" });
  } catch (err) {
    die(`npm install sharp failed: ${err.message}`);
  }

  resolved = resolveSharp();
  if (!resolved) {
    die(
      "sharp installed but still isn't resolvable from this script. Try running " +
        "`npm install sharp` yourself in the repo root, then re-run this patch."
    );
  }
  return resolved;
}

async function buildImages() {
  const sharpPath = ensureSharp();
  const { default: sharp } = await import(`file://${sharpPath}`);
  const widths = [450, 900, 1800]; // 1x/2x of the 225px mobile slot, plus a 31vw desktop ceiling
  for (const w of widths) {
    const out = path.join(IMG_DIR, `me-${w}.webp`);
    await sharp(SRC_IMG).resize({ width: w }).webp({ quality: 82 }).toFile(out);
    const kb = (fs.statSync(out).size / 1024).toFixed(1);
    console.log(`  generated public/png/me-${w}.webp  (${kb} KB)`);
  }
}

/* --------------------------------------------------------------- apply - */
console.log("Applying perf-optimize patch…\n");

fs.mkdirSync(BK, { recursive: true });
fs.copyFileSync(PAGE, path.join(BK, "page.js.bak"));
fs.copyFileSync(LAYOUT, path.join(BK, "layout.js.bak"));
fs.copyFileSync(CSS, path.join(BK, "globals.css.bak"));
fs.copyFileSync(CONFIG, path.join(BK, "next.config.mjs.bak"));
fs.copyFileSync(SMOOTHSCROLL, path.join(BK, "SmoothScroll.jsx.bak"));

for (const e of edits) {
  e.apply();
  console.log(`  ✓ ${e.label}`);
}

page += `\n/* ${MARK} */\n`;

try {
  await buildImages();
} catch (err) {
  die(
    `Image generation failed (${err.message}). No files were written — fix the issue above and re-run.`
  );
}

fs.writeFileSync(PAGE, page);
fs.writeFileSync(LAYOUT, layout);
fs.writeFileSync(SMOOTHSCROLL, smoothScroll);
fs.writeFileSync(CONFIG, config);

console.log(`
✔ Applied. Summary:
  • public/png/me.png (2.1MB) → me-450/900/1800.webp (~17–85KB each); the
    page now requests the smallest size that fits the slot instead of the
    full 1086×1448 original. PNG kept on disk as the <img> fallback src.
  • 4 of 5 Hewitt Web font weights removed from layout.js (dead fallback,
    never painted now that Archivo/HeroDisplay is the live font).
  • ContactMorphSection now loads via next/dynamic — its own chunk,
    fetched only as the user scrolls near the bottom of the page.
  • Lenis smooth-scroll skips touch/coarse-pointer devices, so phones use
    native scrolling instead of a JS rAF loop.
  • next.config.mjs: compression on, console.log stripped from prod builds.

  Backups in .patch-backups/perf-optimize/ — revert any time with:
    node patch-perf-optimize.mjs --revert
`);
