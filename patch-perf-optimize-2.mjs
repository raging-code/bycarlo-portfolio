#!/usr/bin/env node
/**
 * patch-perf-optimize-2.mjs  (round 2: animation + responsiveness audit)
 *
 * Findings from re-auditing the current repo (after patch-perf-optimize.mjs):
 *
 *  1. ContactMorphSection was NOT actually lazy. next/dynamic only splits the
 *     chunk; it still mounts on hydration, so on every page load it (a) fetched
 *     the Google Fonts stylesheet (JP/KR/Thai/Arabic/Devanagari...) and
 *     (b) started a requestAnimationFrame loop that runs forever, even
 *     off-screen or in a background tab. Now it mounts only when the user is
 *     about one screen away, and its loop pauses off-screen / when the tab is
 *     hidden. Fonts for each language load just before that word is shown
 *     (the old "warm-up" passed var(--font-display) to document.fonts.load,
 *     which is invalid there, so it never warmed anything).
 *  2. Hero pin effect animated a CSS blur() + brightness() filter on a full
 *     viewport sticky layer on every scroll frame, with will-change: filter
 *     held permanently. Dimming is now a flat black overlay (pixel-identical to
 *     brightness()), blur moves in half-pixel steps and is skipped on
 *     touch / low-end devices (HERO_LITE_NO_BLUR), the sheet's border-radius
 *     only repaints when it changes by a whole pixel.
 *  3. Hero fit() ran (forced layout x several) on EVERY resize event. Mobile
 *     browsers fire resize while the URL bar collapses during scroll. Now it
 *     only re-fits when the width really changes, debounced. The word carousel
 *     also stops doing work while the hero is covered or the tab is hidden.
 *  4. Navbar scroll handler called getBoundingClientRect() on every section
 *     every frame (forced layout right after other handlers write styles).
 *     Section detection is now throttled to ~10Hz and survives the contact
 *     section mounting late.
 *  5. GlassSurface: the SVG displacement filter (3x feDisplacementMap as a
 *     backdrop-filter) is skipped on touch / low-end devices (uses the existing
 *     frosted fallback, same as iOS Safari already does), and the displacement
 *     map is no longer regenerated on every frame of the navbar's width morph.
 *  6. Framer Motion: switched to LazyMotion + the slim `m` component
 *     (domAnimation). Same API, smaller JS to download/parse/execute.
 *  7. Custom cursor no longer attaches listeners on touch devices.
 *  8. About-brush canvas pixel budget is halved on low-end devices.
 *  9. Hewitt Web is never painted; stop preloading it. Removed the unused
 *     ContactThreads import. Added public/_headers (Cloudflare) so images,
 *     logos and svgs are cached on repeat visits.
 *
 * Needs patch-perf-optimize.mjs applied first (it edits what that patch made).
 * No new dependencies. Handles CRLF (Windows) checkouts.
 *
 * Usage (repo root):
 *   node patch-perf-optimize-2.mjs            apply
 *   node patch-perf-optimize-2.mjs --revert   undo
 *
 * Backup: .patch-backups/perf-optimize-2/
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BK = path.join(ROOT, ".patch-backups/perf-optimize-2");
const MARK = "perf-optimize-2:applied";
const HEADERS_REL = "public/_headers";
const TOUCHED = [
  "app/page.js",
  "app/globals.css",
  "app/layout.js",
  "app/GlassSurface.js",
  "app/ContactMorphSection.js",
  "next.config.mjs",
];

const die = (m) => {
  console.error("\n✖ " + m + "\n");
  process.exit(1);
};
const abs = (rel) => path.join(ROOT, rel);
const bkName = (rel) => rel.replace(/[\\/]/g, "__") + ".bak";

for (const rel of TOUCHED) if (!fs.existsSync(abs(rel))) die(`Missing ${rel}. Run this from the repo root.`);

/* ------------------------------------------------------------ revert ---- */
if (process.argv.includes("--revert")) {
  if (!fs.existsSync(BK)) die("No backup found in .patch-backups/perf-optimize-2/");
  for (const rel of TOUCHED) fs.copyFileSync(path.join(BK, bkName(rel)), abs(rel));
  const hp = abs(HEADERS_REL);
  if (fs.existsSync(path.join(BK, "headers.created")) && fs.existsSync(hp) && fs.readFileSync(hp, "utf8").includes("perf-optimize-2")) {
    fs.unlinkSync(hp);
  }
  console.log("✔ Reverted " + TOUCHED.join(", ") + (fs.existsSync(hp) ? "" : " and removed public/_headers"));
  process.exit(0);
}

/* ------------------------------------------------------------- stage ---- */
const files = new Map(); // rel -> { text, crlf }
const load = (rel) => {
  if (!files.has(rel)) {
    const raw = fs.readFileSync(abs(rel), "utf8");
    const crlf = raw.includes("\r\n");
    files.set(rel, { text: crlf ? raw.replace(/\r\n/g, "\n") : raw, crlf });
  }
  return files.get(rel);
};

if (load("app/page.js").text.includes(MARK)) die("Already applied. Use --revert first to run it again.");
if (!load("app/page.js").text.includes("perf-optimize:applied")) {
  die("Run patch-perf-optimize.mjs first (this patch builds on it).");
}

const log = [];
const edit = (rel, label, find, repl) => {
  const f = load(rel);
  const n = f.text.split(find).length - 1;
  if (n !== 1) die(`[${rel}] expected exactly 1 match for "${label}", found ${n}. Nothing was written.`);
  f.text = f.text.replace(find, () => repl);
  log.push(`${rel}: ${label}`);
};

/* shared low-end test, inlined where needed */
const LOW_END = `(navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4`;

/* =========================================================== page.js ===== */
const P = "app/page.js";

edit(P, "drop unused ContactThreads import",
  `import ContactThreads from "./ContactThreads";\n`, ``);

edit(P, "framer-motion: LazyMotion + slim m component",
  `import {\n  motion,\n  useScroll,`,
  `import {\n  m as motion,\n  LazyMotion,\n  domAnimation,\n  useScroll,`);

edit(P, "wrap page in LazyMotion (open)",
  `    <>\n      <Cursor />`,
  `    <LazyMotion features={domAnimation}>\n      <Cursor />`);
edit(P, "wrap page in LazyMotion (close)",
  `      </main>\n    </>\n  );`,
  `      </main>\n    </LazyMotion>\n  );`);

edit(P, "contact placeholder keeps id=\"contact\" while chunk loads",
  `  loading: () => <div aria-hidden="true" style={{ minHeight: "100svh" }} />,`,
  `  loading: () => <section id="contact" aria-label="Contact" style={{ minHeight: "100svh" }} />,`);

edit(P, "contact mounts only when ~1 screen away",
  `  return (\n    <ContactMorphSection />\n  );`,
  `  const holder = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = holder.current;
    if (near || !el) return undefined;
    if (typeof IntersectionObserver === "undefined") { setNear(true); return undefined; }
    const io = new IntersectionObserver(
      (es) => { if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } },
      { rootMargin: "100% 0px 100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  if (near) return <ContactMorphSection />;
  return <section id="contact" ref={holder} aria-label="Contact" style={{ minHeight: "100svh" }} />;`);

/* navbar */
edit(P, "navbar: throttle section detection (state)",
  `    let raf = 0, secs = [];`,
  `    let raf = 0, secs = [], lastSec = -1e9, tail = 0;`);
edit(P, "navbar: throttle section detection (loop)",
  `      if (!secs.length) secs = Array.from(document.querySelectorAll("section[id]"));
      const mid = window.innerHeight / 2;`,
  `      if (!secs.length || secs.some((s) => !s.isConnected)) secs = Array.from(document.querySelectorAll("section[id]"));
      const nowT = performance.now();
      if (nowT - lastSec < 100) { clearTimeout(tail); tail = setTimeout(onScroll, 110); return; }
      lastSec = nowT;
      const mid = window.innerHeight / 2;`);
edit(P, "navbar: clear trailing timer",
  `    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };`,
  `    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(tail); if (raf) cancelAnimationFrame(raf); };`);

/* cursor */
edit(P, "cursor: no listeners on touch devices",
  `  useEffect(() => {
    const move = (e) => {
      mx.set(e.clientX);`,
  `  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return undefined;
    const move = (e) => {
      mx.set(e.clientX);`);

/* hero */
edit(P, "hero: pause word carousel while covered / tab hidden",
  `    const nextWord = () => {\n      const p = ws[wi];`,
  `    const nextWord = () => {
      if (document.hidden || (frameRef.current && frameRef.current.style.visibility === "hidden")) return;
      const p = ws[wi];`);
edit(P, "hero: fit() only on real width change, debounced",
  `    const onResize = () => { fit(); };`,
  `    let lastW = window.innerWidth, rt = 0;
    const onResize = () => {
      if (window.innerWidth === lastW) return; // mobile URL-bar resizes: width unchanged
      lastW = window.innerWidth;
      clearTimeout(rt);
      rt = setTimeout(fit, 120);
    };`);
edit(P, "hero: clear resize debounce on unmount",
  `      clearTimeout(wStart);\n`,
  `      clearTimeout(wStart);\n      clearTimeout(rt);\n`);
edit(P, "hero pin: lite flag + radius cache",
  `    let raf = 0, last = -1;`,
  `    const HERO_LITE_NO_BLUR = true; // false = keep the blur on touch / low-end devices too
    const lite = HERO_LITE_NO_BLUR && (window.matchMedia("(pointer: coarse)").matches || ${LOW_END});
    let raf = 0, last = -1, lastR = -1;`);
edit(P, "hero pin: overlay dim, stepped blur, quantised radius",
  `      if (!reduce) {
        const f = [];
        if (HERO_PIN.blur) f.push("blur(" + (e * HERO_PIN.blur).toFixed(2) + "px)");
        if (HERO_PIN.dim) f.push("brightness(" + (1 - HERO_PIN.dim * e).toFixed(3) + ")");
        frame.style.filter = e > 0 ? f.join(" ") : "";
        frame.style.transform = e > 0 && HERO_PIN.scale < 1 ? "scale(" + (1 - (1 - HERO_PIN.scale) * e).toFixed(4) + ")" : "";
      }
      if (sheet && HERO_PIN.radius) {
        const r = (HERO_PIN.radius * (1 - e)).toFixed(1);
        sheet.style.borderRadius = r + "px " + r + "px 0 0";
      }`,
  `      if (!reduce) {
        // dim = black overlay at the same alpha: identical to brightness(), no filter pass
        if (HERO_PIN.dim) frame.style.setProperty("--hf-dim", (HERO_PIN.dim * e).toFixed(3));
        const bl = !HERO_PIN.blur || lite ? 0 : Math.round(e * HERO_PIN.blur * 2) / 2; // half-px steps
        frame.style.filter = bl > 0 ? "blur(" + bl + "px)" : "";
        frame.style.transform = e > 0 && HERO_PIN.scale < 1 ? "scale(" + (1 - (1 - HERO_PIN.scale) * e).toFixed(4) + ")" : "";
      }
      if (sheet && HERO_PIN.radius) {
        const r = Math.round(HERO_PIN.radius * (1 - e)); // whole px: far fewer big-layer repaints
        if (r !== lastR) {
          lastR = r;
          sheet.style.borderRadius = r + "px " + r + "px 0 0";
        }
      }`);

/* about brush */
edit(P, "about brush: halve pixel budget on low-end",
  `const AB_MAX_PX = 2.2e6;`,
  `const AB_MAX_PX = typeof navigator !== "undefined" && (${LOW_END}) ? 1.1e6 : 2.2e6;`);

edit(P, "marker", `/* perf-optimize:applied */`, `/* perf-optimize:applied */\n/* ${MARK} */`);

/* ======================================================= globals.css ===== */
const C = "app/globals.css";
edit(C, "hero frame: will-change transform only",
  `  will-change: filter, transform;`, `  will-change: transform;`);
{
  const f = load(C);
  f.text = f.text.replace(/\s*$/, "\n") + `
/* perf-optimize-2:start */
/* hero dim as an overlay (same look as filter: brightness()) */
.hf-frame::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  background: #000;
  opacity: var(--hf-dim, 0);
}
/* touch: lighter backdrop blur on the scrolled navbar */
@media (pointer: coarse) {
  .gnav-wrap.is-scrolled .gnav {
    -webkit-backdrop-filter: blur(14px) saturate(1.3);
    backdrop-filter: blur(14px) saturate(1.3);
  }
}
/* perf-optimize-2:end */
`;
  log.push(`${C}: hero dim overlay + lighter touch navbar blur`);
}

/* ========================================================= layout.js ===== */
edit("app/layout.js", "do not preload the never-painted Hewitt font",
  `  variable: "--font-cooper",\n  display: "swap",\n});`,
  `  variable: "--font-cooper",\n  display: "swap",\n  preload: false, // perf-optimize-2: fallback only, never painted\n});`);

/* ==================================================== GlassSurface.js ==== */
const G = "app/GlassSurface.js";
edit(G, "skip SVG displacement filter on touch / low-end",
  `    const isWebkit = /Safari/.test(navigator.userAgent)`,
  `    if (window.matchMedia('(pointer: coarse)').matches || ${LOW_END}) return false;

    const isWebkit = /Safari/.test(navigator.userAgent)`);
edit(G, "debounce displacement-map rebuild",
  `    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateDisplacementMap, 0);
    });`,
  `    let t = 0;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(updateDisplacementMap, 90);
    });`);
edit(G, "clear debounce on unmount",
  `      resizeObserver.disconnect();`,
  `      clearTimeout(t);\n      resizeObserver.disconnect();`);

/* ============================================ ContactMorphSection.js ===== */
const M = "app/ContactMorphSection.js";
edit(M, "state for pause + font warm cache",
  `  var raf = 0, alive = true;`,
  `  var raf = 0, alive = true, paused = false, pausedAt = 0, warmed = {};`);
edit(M, "plain crossfade (no goo filter) on low-end",
  `  if (reduce) morph.classList.add("ct-plain");`,
  `  if (reduce || ${LOW_END}) morph.classList.add("ct-plain");`);
edit(M, "load each language font just before its word",
  `  var last = performance.now();\n  function frame(now) {`,
  `  function warm(i) {
    var e = warmed[i];
    if (e) return e;
    e = warmed[i] = { done: false };
    var fin = function () { e.done = true; };
    if (WORDS[i].font === SANS || !document.fonts || !document.fonts.load) { fin(); return e; }
    var fam = WORDS[i].font.replace(/var\\([^)]*\\),?/g, "");
    fontsReady.then(function () { return document.fonts.load("800 80px " + fam, WORDS[i].t); }).then(fin, fin);
    return e;
  }
  var last = performance.now();
  function frame(now) {`);
edit(M, "hold waits (max 2.5s) for the next font",
  `      holdLeft -= dt;
      if (holdLeft <= 0) start((cur + 1) % N);`,
  `      holdLeft -= dt;
      var nx = (cur + 1) % N;
      var wm = warm(nx);
      if (holdLeft <= 0 && (wm.done || holdLeft < -2500)) start(nx);`);
edit(M, "remove eager warm-up of every script",
  `\n      WORDS.forEach(function (w) {\n        document.fonts.load("800 80px " + w.font, w.t).catch(function () {});\n      });`,
  ``);
edit(M, "pause loop off-screen / hidden tab",
  `  window.addEventListener("resize", measureK);\n  if (document.fonts) {`,
  `  window.addEventListener("resize", measureK);
  var onScreen = true;
  function pause() {
    if (paused || !alive) return;
    paused = true;
    pausedAt = performance.now();
    cancelAnimationFrame(raf);
    raf = 0;
  }
  function resume() {
    if (!paused || !alive) return;
    paused = false;
    raf = requestAnimationFrame(function (t) {
      t0 += t - pausedAt; // do not let a morph "finish" while it was off-screen
      last = t;
      raf = requestAnimationFrame(frame);
    });
  }
  var sync = function () { if (onScreen && !document.hidden) resume(); else pause(); };
  var io = typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver(function (es) { onScreen = es[es.length - 1].isIntersecting; sync(); }, { rootMargin: "20% 0px" })
    : null;
  if (io) io.observe(root);
  document.addEventListener("visibilitychange", sync);
  if (document.fonts) {`);
edit(M, "cleanup observers",
  `    alive = false;\n    cancelAnimationFrame(raf);`,
  `    alive = false;\n    cancelAnimationFrame(raf);\n    if (io) io.disconnect();\n    document.removeEventListener("visibilitychange", sync);`);

/* ====================================================== next.config ====== */
edit("next.config.mjs", "poweredByHeader off + optimizePackageImports",
  `  compress: true,`,
  `  compress: true,\n  poweredByHeader: false,\n  experimental: { optimizePackageImports: ["framer-motion", "react-icons"] }, // perf-optimize-2`);

/* ------------------------------------------------------------- write ---- */
fs.mkdirSync(BK, { recursive: true });
for (const rel of TOUCHED) fs.copyFileSync(abs(rel), path.join(BK, bkName(rel)));
for (const [rel, f] of files) {
  fs.writeFileSync(abs(rel), f.crlf ? f.text.replace(/\n/g, "\r\n") : f.text);
}

const hp = abs(HEADERS_REL);
if (!fs.existsSync(hp)) {
  const rule = (p) => `${p}\n  Cache-Control: public, max-age=604800, stale-while-revalidate=86400\n`;
  fs.writeFileSync(
    hp,
    `# perf-optimize-2: Cloudflare Pages cache rules for non-hashed static assets (1 week)\n${rule("/png/*")}${rule("/logos/*")}${rule("/svg/*")}`
  );
  fs.writeFileSync(path.join(BK, "headers.created"), "1");
  log.push("public/_headers: created (Cloudflare cache rules)");
} else {
  log.push("public/_headers: already exists, left untouched");
}

console.log("\nperf-optimize-2 applied:\n");
for (const l of log) console.log("  ✓ " + l);
console.log("\nBackup: .patch-backups/perf-optimize-2/   Undo: node patch-perf-optimize-2.mjs --revert\n");
