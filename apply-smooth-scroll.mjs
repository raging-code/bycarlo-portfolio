#!/usr/bin/env node
/**
 * apply-smooth-scroll.mjs
 *
 * Adds site-wide smooth, inertia-style scrolling to the byCarlo site.
 *
 * Options (pick one with --option=N, default 1):
 *   1  Soft Glide        Lenis, lerp 0.085. Gentle trail behind the wheel.
 *   2  Cinematic Weight  Lenis, 1.6s expo-out, wheel x0.85, plus a red progress bar.
 *   3  No dependency     Small rAF lerp for desktop mouse wheels. No npm package.
 *
 * What it changes
 *   - app/SmoothScroll.jsx   NEW. The chosen option (rewritten on every run).
 *   - app/layout.js          imports <SmoothScroll /> and renders it in <body>.
 *   - app/globals.css        appends one marked block that turns off CSS
 *                            scroll-behavior: smooth (it fights the JS smoothing).
 *   - app/page.js            the navbar logo "back to top" click uses Lenis when it
 *                            is running, and falls back to native smooth scroll.
 *   - package.json           options 1 and 2 run `npm install lenis`.
 *
 * Optional
 *   --soften-brush   lowers AB_TAU (About brush easing) 0.16 -> 0.08 so the brush
 *                    does not feel laggy on top of the new smoothing.
 *   --no-install     do not run `npm install lenis` (do it yourself).
 *
 * Usage (from the project root, next to package.json):
 *   node apply-smooth-scroll.mjs                      # option 1
 *   node apply-smooth-scroll.mjs --option=2           # option 2
 *   node apply-smooth-scroll.mjs --option=3           # option 3
 *   node apply-smooth-scroll.mjs --dry-run            # preview only, writes nothing
 *   node apply-smooth-scroll.mjs --revert             # undo everything
 *
 * Safe to re-run, and to switch options by re-running with a different --option.
 * Backups: app/layout.js.bak-smooth-scroll, app/page.js.bak-smooth-scroll,
 *          app/globals.css.bak-smooth-scroll (made once, before the first change).
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(__dirname, "app");
const F = {
  layout: path.join(APP, "layout.js"),
  page: path.join(APP, "page.js"),
  css: path.join(APP, "globals.css"),
  comp: path.join(APP, "SmoothScroll.jsx"),
  pkg: path.join(__dirname, "package.json"),
};
const BAK = ".bak-smooth-scroll";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const REVERT = args.includes("--revert");
const NO_INSTALL = args.includes("--no-install");
const SOFTEN_BRUSH = args.includes("--soften-brush");
const optArg = args.find((a) => a.startsWith("--option="));
const OPTION = optArg ? Number(optArg.split("=")[1]) : 1;

const START = "/* smooth-scroll:start */";
const END = "/* smooth-scroll:end */";

/* ── The three SmoothScroll.jsx variants ─────────────────────────────── */
const COMPONENTS = {
  1: `"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { frame, cancelFrame } from "framer-motion";

/* Option 1: Soft Glide
   Gentle inertia. Scrolling follows the wheel with a short, smooth trail. */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.085,          // lower = floatier (0.05 very floaty, 0.15 snappy)
      wheelMultiplier: 1,
      smoothWheel: true,
      anchors: true,        // #work, #contact etc. glide instead of jump
    });
    window.__lenis = lenis;

    // run Lenis on framer-motion's frame loop so both stay in sync
    const update = ({ timestamp }) => lenis.raf(timestamp);
    frame.update(update, true);

    return () => {
      cancelFrame(update);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return null;
}
`,
  2: `"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { motion, frame, cancelFrame, useScroll, useSpring } from "framer-motion";

/* Option 2: Cinematic Weight
   Heavier, slower, with a long ease-out tail, plus a red progress bar
   that trails the scroll on a spring. */
export default function SmoothScroll() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 90, damping: 20, mass: 0.6 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.6,                                        // length of each glide in seconds
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)), // expo out
      wheelMultiplier: 0.85,                                // each wheel notch travels a bit less
      smoothWheel: true,
      anchors: { duration: 1.8 },                           // longer glide for nav links
    });
    window.__lenis = lenis;

    const update = ({ timestamp }) => lenis.raf(timestamp);
    frame.update(update, true);

    return () => {
      cancelFrame(update);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return (
    <motion.div
      aria-hidden="true"
      style={{
        scaleX,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "#E02B20",
        transformOrigin: "0% 50%",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
`,
  3: `"use client";

import { useEffect } from "react";

/* Option 3: Zero dependency
   Small requestAnimationFrame lerp for mouse wheels on desktop.
   Touch, keyboard, scrollbar drag and nav links keep native behavior. */
export default function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduce || !finePointer) return;

    const EASE = 0.09; // lower = floatier, higher = snappier
    let target = window.scrollY;
    let current = window.scrollY;
    let raf = 0;
    let running = false;

    const maxScroll = () =>
      document.documentElement.scrollHeight - window.innerHeight;
    const clamp = (v) => Math.max(0, Math.min(v, maxScroll()));

    const tick = () => {
      current += (target - current) * EASE;
      if (Math.abs(target - current) < 0.4) {
        current = target;
        running = false;
      }
      window.scrollTo(0, current);
      if (running) raf = requestAnimationFrame(tick);
    };

    const onWheel = (e) => {
      if (e.ctrlKey) return;                              // pinch zoom
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // horizontal gestures
      // let nested scrollers (like the mobile nav pill) scroll themselves
      for (let el = e.target; el && el !== document.body; el = el.parentElement) {
        const oy = getComputedStyle(el).overflowY;
        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) return;
      }
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
      target = clamp(target + e.deltaY * unit);
      if (!running) {
        running = true;
        current = window.scrollY;
        raf = requestAnimationFrame(tick);
      }
    };

    // anything else that moves the page (anchors, keyboard, scrollbar drag) resyncs us
    const onScroll = () => {
      if (!running) {
        target = window.scrollY;
        current = window.scrollY;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
`,
};

/* ── helpers ─────────────────────────────────────────────────────────── */
function fail(msg) { console.error("✖ " + msg); process.exit(1); }
function note(msg) { console.log(msg); }
const eolOf = (s) => (s.includes("\r\n") ? "\r\n" : "\n");
const withEol = (s, eol) => s.replace(/\r?\n/g, eol);

function backupOnce(file) {
  const bak = file + BAK;
  if (!existsSync(bak)) {
    if (!DRY_RUN) copyFileSync(file, bak);
    note("  backup  " + path.relative(__dirname, bak));
  }
}
function write(file, text) {
  if (!DRY_RUN) writeFileSync(file, text);
}

if (![1, 2, 3].includes(OPTION)) fail("--option must be 1, 2 or 3.");
for (const k of ["layout", "page", "css", "pkg"])
  if (!existsSync(F[k])) fail("Run this from the project root (missing " + path.relative(__dirname, F[k]) + ").");

/* ── revert ──────────────────────────────────────────────────────────── */
if (REVERT) {
  note("Reverting smooth scroll" + (DRY_RUN ? " (dry run)" : "") + "...");
  for (const k of ["layout", "page", "css"]) {
    const bak = F[k] + BAK;
    if (existsSync(bak)) {
      if (!DRY_RUN) { copyFileSync(bak, F[k]); unlinkSync(bak); }
      note("  restored  " + path.relative(__dirname, F[k]));
    } else note("  skipped   " + path.relative(__dirname, F[k]) + " (no backup)");
  }
  if (existsSync(F.comp)) {
    if (!DRY_RUN) unlinkSync(F.comp);
    note("  removed   app/SmoothScroll.jsx");
  }
  note("Done. (If you installed lenis and want it gone: npm uninstall lenis)");
  process.exit(0);
}

note("Applying smooth scroll, option " + OPTION + (DRY_RUN ? " (dry run)" : "") + "...");

/* 1) component */
{
  const next = withEol(COMPONENTS[OPTION], "\n");
  const prev = existsSync(F.comp) ? readFileSync(F.comp, "utf8") : null;
  if (prev === next) note("  ok       app/SmoothScroll.jsx already option " + OPTION);
  else {
    write(F.comp, next);
    note("  " + (prev === null ? "created " : "updated ") + " app/SmoothScroll.jsx (option " + OPTION + ")");
  }
}

/* 2) layout.js */
{
  let src = readFileSync(F.layout, "utf8");
  const eol = eolOf(src);
  let out = src;
  let changed = false;

  if (!out.includes('from "./SmoothScroll"')) {
    const re = /(import IntroAnimation from "\.\/IntroAnimation";\r?\n)/;
    if (!re.test(out)) fail("Could not find the IntroAnimation import in app/layout.js.");
    out = out.replace(re, `$1import SmoothScroll from "./SmoothScroll";${eol}`);
    changed = true;
  }
  if (!out.includes("<SmoothScroll />")) {
    if (!out.includes("<IntroAnimation />")) fail("Could not find <IntroAnimation /> in app/layout.js.");
    out = out.replace("<IntroAnimation />", `<SmoothScroll />${eol}        <IntroAnimation />`);
    changed = true;
  }
  if (changed) { backupOnce(F.layout); write(F.layout, out); note("  patched  app/layout.js"); }
  else note("  ok       app/layout.js already patched");
}

/* 3) globals.css */
{
  let src = readFileSync(F.css, "utf8");
  const eol = eolOf(src);
  const block =
    START + eol +
    "/* JS smoothing replaces CSS smooth scrolling (the two fight each other) */" + eol +
    "html { scroll-behavior: auto; }" + eol +
    END + eol;
  if (src.includes(START)) note("  ok       app/globals.css already patched");
  else {
    backupOnce(F.css);
    write(F.css, src.replace(/\s*$/, "") + eol + eol + block);
    note("  patched  app/globals.css");
  }
}

/* 4) page.js: logo "back to top" */
{
  let src = readFileSync(F.page, "utf8");
  const OLD = 'onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}';
  const NEW =
    'onClick={(e) => { e.preventDefault(); if (window.__lenis) window.__lenis.scrollTo(0); ' +
    'else window.scrollTo({ top: 0, behavior: "smooth" }); }}';
  if (src.includes("window.__lenis")) note("  ok       app/page.js already patched");
  else if (!src.includes(OLD)) note("  skipped  app/page.js (logo click handler not found, left untouched)");
  else {
    backupOnce(F.page);
    write(F.page, src.replace(OLD, NEW));
    note("  patched  app/page.js (logo back-to-top)");
  }
}

/* 5) optional: soften the About brush easing */
if (SOFTEN_BRUSH) {
  const src = readFileSync(F.page, "utf8");
  const re = /const AB_TAU = 0\.16;/;
  if (re.test(src)) {
    backupOnce(F.page);
    write(F.page, src.replace(re, "const AB_TAU = 0.08;"));
    note("  patched  app/page.js (AB_TAU 0.16 -> 0.08)");
  } else note("  skipped  AB_TAU not found at 0.16 (already changed?)");
}

/* 6) dependency (options 1 and 2) */
if (OPTION === 3) note("  ok       option 3 needs no package");
else {
  const pkg = JSON.parse(readFileSync(F.pkg, "utf8"));
  if (pkg.dependencies && pkg.dependencies.lenis) note("  ok       lenis already in package.json");
  else if (DRY_RUN) note("  would run: npm install lenis");
  else if (NO_INSTALL) note("  skipped  npm install (run `npm install lenis` yourself)");
  else {
    note("  running  npm install lenis ...");
    const r = spawnSync("npm", ["install", "lenis"], { cwd: __dirname, stdio: "inherit", shell: true });
    if (r.status !== 0) fail("npm install lenis failed. Run it manually, then re-run this script.");
  }
}

note("");
note(DRY_RUN ? "Dry run only, nothing was written." : "Done. Restart `npm run dev` and scroll with a mouse wheel or trackpad.");
note("To switch feel: re-run with --option=1|2|3.  To undo: node apply-smooth-scroll.mjs --revert");
