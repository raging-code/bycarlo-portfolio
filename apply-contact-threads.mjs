#!/usr/bin/env node
/**
 * apply-contact-threads.mjs
 *
 * Adds the animated "Threads" ribbon background to the Contact section only.
 * Run from the repo root (bycarlo-portfolio):
 *
 *   node apply-contact-threads.mjs
 *
 * What it does
 *  1. Creates app/ContactThreads.jsx  - canvas ribbon (desktop + zoomed phone layout,
 *     pauses off-screen / in background tabs, respects prefers-reduced-motion).
 *  2. app/page.js    - imports it and rebuilds the <Contact /> section around it
 *     (text sits above the canvas; phone gets a lower, bigger heading).
 *  3. app/globals.css - adds the .contact-h2 heading size (as large as fits on one
 *     line on phones, original clamp() on desktop).
 *
 * Safety
 *  - Works with LF or CRLF files (Windows checkouts); original line endings are kept.
 *  - Everything is validated in memory first. If anything doesn't match, NOTHING is written.
 *  - Originals are copied once to .patch-backups/ before being changed.
 *  - Safe to re-run: steps that are already applied are skipped.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const TAG = 'contact-threads';
const PAGE = resolve('app/page.js');
const CSS = resolve('app/globals.css');
const COMP = resolve('app/ContactThreads.jsx');
const BACKUP_DIR = resolve('.patch-backups');

/* ------------------------------------------------------------------ */
/* New files / blocks                                                  */
/* ------------------------------------------------------------------ */

const COMPONENT = `"use client";

import { useEffect, useRef } from "react";

/* ${TAG}: Contact background.
   One flowing ribbon of fine lines that twists in the middle. Drawn on a canvas,
   pauses when off-screen or in a background tab, respects prefers-reduced-motion. */
export default function ContactThreads() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return undefined;
    const section = wrap.parentElement || wrap;
    const ctx = cv.getContext("2d");
    if (!ctx) return undefined;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0, last: -1e9, has: false };
    let W = 0;
    let H = 0;
    let raf = 0;
    let running = false;
    let visible = true;

    const onMove = (e) => {
      const r = section.getBoundingClientRect();
      ptr.tx = e.clientX - r.left;
      ptr.ty = e.clientY - r.top;
      if (!ptr.has) {
        ptr.x = ptr.tx;
        ptr.y = ptr.ty;
        ptr.has = true;
      }
      ptr.last = performance.now();
    };

    /* idle "ghost cursor" so it keeps moving on touch screens / when the mouse is still */
    const idleTarget = (t) => {
      if (performance.now() - ptr.last > 2500) {
        ptr.tx = W * (0.62 + 0.26 * Math.sin(t * 0.00031));
        ptr.ty = H * ((W < 700 ? 0.72 : 0.55) + 0.14 * Math.sin(t * 0.00047 + 1));
        if (!ptr.has) {
          ptr.x = ptr.tx;
          ptr.y = ptr.ty;
          ptr.has = true;
        }
      }
    };

    const draw = (t) => {
      idleTarget(t);
      const sec = t * 0.00036;
      const small = W < 700; /* phone layout */
      const Z = small ? 1.6 : 1; /* phone: zoom in, the ends run off-screen */
      const n = small ? 36 : 46; /* identical, evenly spaced lines */
      const step = small ? 7 : 8;
      const base = H * (small ? 0.72 : 0.6);
      const A = H * (small ? 0.075 : 0.14) * (1 + 0.1 * Math.sin(sec * 0.8)); /* S-curve height */
      const HW = H * (small ? 0.09 : 0.16); /* half-width of the ribbon */
      const p0 = 0.49 + 0.05 * Math.sin(sec * 0.7); /* where the ribbon twists */
      const ph = 0.85 * Math.sin(sec * 0.6);
      const tilt = (-0.2 + 0.2 * Math.sin(sec * 0.55 + 1)) * (small ? 0.6 : 1); /* swing of the whole ribbon */
      const reach = small ? 120 : 160; /* cursor influence */

      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "rgba(176,34,52,0.75)");
      g.addColorStop(0.38, "rgba(206,38,68,0.8)");
      g.addColorStop(0.52, "rgba(218,40,56,0.85)");
      g.addColorStop(0.78, "rgba(226,84,40,0.8)");
      g.addColorStop(1, "rgba(201,166,107,0.85)");
      ctx.strokeStyle = g;
      ctx.lineWidth = small ? 0.9 : 1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < n; i++) {
        const s = (i / (n - 1)) * 2 - 1; /* -1 .. 1 across the ribbon */
        ctx.beginPath();
        for (let x = -10; x <= W + 10; x += step) {
          const nx = 0.5 + (x / W - 0.5) / Z;
          const c = base - A * Math.sin((2 * Math.PI * (nx + 0.035 * s - 0.3)) / 0.76 + Math.PI / 2 + ph);
          /* the width flips sign at the pinch, so the lines cross over each other there */
          const hw = HW * Math.tanh((nx - p0 - 0.035 * s) * 4.4);
          let y = c + s * hw + (nx - 0.5) * H * tilt;
          y = base + (y - base) * Z;
          const dx = x - ptr.x;
          const dy = y - ptr.y;
          y += (ptr.y - y) * 0.09 * Math.exp(-(dx * dx + dy * dy) / (2 * reach * reach));
          if (x === -10) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (!small) {
        /* desktop: keep the heading area quiet */
        ctx.globalCompositeOperation = "destination-out";
        const m = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, W * 0.3);
        m.addColorStop(0, "rgba(0,0,0,0.85)");
        m.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = m;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }
    };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (t) => {
      ptr.x += (ptr.tx - ptr.x) * 0.08;
      ptr.y += (ptr.ty - ptr.y) * 0.08;
      ctx.clearRect(0, 0, W, H);
      draw(reduce ? 4000 : t);
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const ro = new ResizeObserver(() => {
      size();
      if (!running) frame(performance.now());
    });
    ro.observe(wrap);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 }
    );
    io.observe(wrap);

    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    section.addEventListener("pointermove", onMove, { passive: true });

    size();
    frame(performance.now());
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      section.removeEventListener("pointermove", onMove);
    };
  }, []);

  const fade = "linear-gradient(to bottom, transparent 0, #000 22%, #000 82%, transparent 100%)";

  return (
    <div ref={wrapRef} aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(48% 55% at 50% 58%, rgba(224,43,32,.09), rgba(224,43,32,0) 70%), radial-gradient(34% 40% at 72% 52%, rgba(201,166,107,.15), rgba(201,166,107,0) 72%)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ WebkitMaskImage: fade, maskImage: fade }}
      />
    </div>
  );
}
`;

const CONTACT_FN = `function Contact({ isMobile }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const textColor = LIGHT.text;
  const accentColor = LIGHT.accent;
  const mutedColor = LIGHT.muted;

  return (
    <motion.section
      ref={ref}
      id="contact"
      className="relative min-h-svh flex flex-col justify-between overflow-hidden pt-52 pb-12 md:py-44 px-6 md:px-20 theme-section"
    >
      {/* ${TAG}:start */}
      <ContactThreads />
      {/* ${TAG}:end */}
      <div className="relative z-10 max-w-3xl">
        <motion.h2
          className="contact-h2 font-display font-extrabold leading-none tracking-[-0.055em] mb-8"
          style={{ color: textColor }}
          initial={{ y: 40, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: E }}
        >
          Have a project<br />
          in mind?
        </motion.h2>
        <motion.a
          href="mailto:hello@bycarlo.dev"
          className="inline-flex items-center gap-3 mt-8 text-lg font-semibold transition-all"
          style={{ color: accentColor }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
        >
          hello@bycarlo.dev <span className="text-2xl">&#8594;</span>
        </motion.a>
      </div>
      <motion.footer
        className="relative z-10 mt-12 md:mt-32 flex flex-col md:flex-row justify-between gap-2 text-xs tracking-widest uppercase"
        style={{ color: mutedColor }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
      >
        <span>&#169; 2025 byCarlo</span>
        <span>Based in Manila, working worldwide</span>
      </motion.footer>
    </motion.section>
  );
}

`;

const CSS_BLOCK = `
/* ${TAG}:start */
/* Contact heading: as large as fits on one line on phones, original size on desktop */
.contact-h2 { font-size: min(4.5rem, calc((100vw - 3rem) * 0.154)); }
@media (min-width: 768px) {
  .contact-h2 { font-size: clamp(2.4rem, 9vw, 5.5rem); }
}
/* ${TAG}:end */
`;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fail(msg) {
  console.error('\n✗ ' + msg);
  console.error('  No files were changed.\n');
  process.exit(1);
}

/** Read a file, remember its line ending, and hand back LF-normalised text. */
function load(path) {
  const raw = readFileSync(path, 'utf8');
  const crlf = raw.includes('\r\n');
  return { path, crlf, text: raw.replace(/\r\n/g, '\n') };
}
function toDisk(text, crlf) {
  return crlf ? text.replace(/\n/g, '\r\n') : text;
}

for (const p of [PAGE, CSS]) {
  if (!existsSync(p)) {
    fail(`Could not find ${p}\n  Run this script from the root of the bycarlo-portfolio repo.`);
  }
}

/* ------------------------------------------------------------------ */
/* Plan (in memory only)                                               */
/* ------------------------------------------------------------------ */

const plan = []; // { path, content, label, backup }
const notes = [];

/* 1. component file */
{
  const existing = existsSync(COMP) ? load(COMP) : null;
  if (existing && existing.text === COMPONENT) {
    notes.push('• app/ContactThreads.jsx: already up to date, skipping');
  } else {
    plan.push({
      path: COMP,
      content: toDisk(COMPONENT, existing ? existing.crlf : load(PAGE).crlf), /* new file follows page.js line endings */
      label: existing ? 'app/ContactThreads.jsx (updated)' : 'app/ContactThreads.jsx (created)',
      backup: !!existing,
    });
  }
}

/* 2. page.js */
{
  const f = load(PAGE);
  let src = f.text;
  let changed = false;

  const importLine = 'import ContactThreads from "./ContactThreads";';
  if (!src.includes(importLine)) {
    const anchor = 'import Threads from "./Threads";';
    const count = src.split(anchor).length - 1;
    if (count !== 1) fail(`app/page.js: expected exactly one \`${anchor}\` (found ${count}).`);
    src = src.replace(anchor, anchor + '\n' + importLine);
    changed = true;
  }

  const start = src.indexOf('function Contact({ isMobile }) {');
  if (start === -1) fail('app/page.js: could not find `function Contact({ isMobile }) {`.');
  const endMarker = '/* ── Page root';
  const end = src.indexOf(endMarker, start);
  if (end === -1) fail('app/page.js: could not find the `/* ── Page root` comment after Contact().');

  // include the "/* ── Contact ..." heading comment above the function untouched
  const region = src.slice(start, end);
  if (!region.includes('id="contact"')) fail('app/page.js: the Contact() region does not look right (no id="contact").');

  if (region.includes('<ContactThreads')) {
    notes.push('• app/page.js: Contact section already patched, skipping');
  } else {
    src = src.slice(0, start) + CONTACT_FN + src.slice(end);
    changed = true;
  }

  if (changed) {
    plan.push({ path: PAGE, content: toDisk(src, f.crlf), label: 'app/page.js (import + Contact section)', backup: true });
  }
}

/* 3. globals.css */
{
  const f = load(CSS);
  if (f.text.includes(`/* ${TAG}:start */`)) {
    notes.push('• app/globals.css: heading size already added, skipping');
  } else {
    const next = f.text.replace(/\s*$/, '\n') + CSS_BLOCK;
    plan.push({ path: CSS, content: toDisk(next, f.crlf), label: 'app/globals.css (.contact-h2)', backup: true });
  }
}

/* ------------------------------------------------------------------ */
/* Write                                                               */
/* ------------------------------------------------------------------ */

console.log('\nContact -> Threads background\n');
for (const n of notes) console.log('  ' + n);

if (plan.length === 0) {
  console.log('\n✓ Nothing to do, everything is already applied.\n');
  process.exit(0);
}

mkdirSync(BACKUP_DIR, { recursive: true });
for (const item of plan) {
  if (item.backup && existsSync(item.path)) {
    const dest = resolve(BACKUP_DIR, basename(item.path) + '.' + TAG + '.bak');
    if (!existsSync(dest)) {
      copyFileSync(item.path, dest);
      console.log(`  • backup: ${basename(item.path)} -> .patch-backups/${basename(dest)}`);
    }
  }
  writeFileSync(item.path, item.content, 'utf8');
  console.log(`  ✓ ${item.label}`);
}

console.log('\nDone. Next steps:');
console.log('  1. npm run dev  and scroll to the Contact section (try a phone-width window too)');
console.log('  2. git add -A && git commit -m "Contact: animated threads background" && git push');
console.log('  Backups (if you want to undo) are in .patch-backups/\n');
