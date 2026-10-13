#!/usr/bin/env node
/**
 * apply-about-brush.mjs
 *
 * Adds the scroll "paint brush" effect to the About section (IntroProfile):
 *
 *  - The About section pins in the middle of the screen while you scroll.
 *  - After a short pause, ONE scarlet brush stroke paints the page, one way,
 *    from the top-left corner down to the bottom-right (diagonal, ~32deg).
 *  - The stroke starts thin with empty gaps between the rows and gets thicker
 *    the whole way; as the thickness grows it closes the gaps until the screen
 *    is fully red. Scrolling back up un-paints it the same way.
 *  - When it is fully red, the red slab scrolls away and Projects follows.
 *
 * What it changes (your existing About text/markup is kept as-is):
 *   1. app/page.js     -> adds an <AboutBrush/> component (canvas) and wraps the
 *                         existing IntroProfile section in a pinned scroll track
 *   2. app/globals.css -> adds a marked "about-brush" CSS block
 *
 * Usage (from the project root, next to package.json):
 *   node apply-about-brush.mjs             # apply
 *   node apply-about-brush.mjs --dry-run   # preview only, writes nothing
 *
 * Safe to re-run (it refreshes its own blocks, never duplicates them).
 * Backups are saved once as app/page.js.bak-about-brush and
 * app/globals.css.bak-about-brush
 *
 * Tweak knobs (in the inserted code):  AB_SWELL (how much it thickens at the
 * end), the 430svh track height in the CSS (how long you scroll while pinned),
 * and the 0.08 / 0.84 numbers in readTarget (pause before / spread of the paint).
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(__dirname, "app", "page.js");
const CSS = path.join(__dirname, "app", "globals.css");
const DRY_RUN = process.argv.includes("--dry-run");

const JS_START = "/* about-brush:start */";
const JS_END = "/* about-brush:end */";
const CSS_START = "/* about-brush:start */";
const CSS_END = "/* about-brush:end */";

const BRUSH_CODE = `${JS_START}
const AB_SWELL = 1.8; // final extra thickness; closes every early gap (measured 0 gaps from 390px phones to 2560px screens)
const abClamp = (v, a, b) => Math.min(b, Math.max(a, v));
const abSwell = (p) => {
  const x = abClamp((p - 0.3) / 0.7, 0, 1);
  return 1 + AB_SWELL * x * x * (3 - 2 * x);
};

// ONE continuous stroke, ONE direction, diagonal (32deg, rising right): top-left -> bottom-right.
// Starts THIN with the rows spaced far apart (gaps), gets thicker the whole way.
function abBuild(W, H) {
  const al = (32 * Math.PI) / 180, sa = Math.sin(al), ca = Math.cos(al);
  const B = abClamp(Math.min(H * 0.34, W * 0.5), 130, 380);
  const vext = (W / 2) * sa + (H / 2) * ca;
  const uext = (W / 2) * ca + (H / 2) * sa + B * 0.8;
  const margin = B * 0.9;
  const wAt = (v) => {
    const f = abClamp((v + vext) / (2 * vext), 0, 1);
    return B * (0.14 + 0.86 * Math.pow(f, 1.15));
  };
  // rows: spacing is ~2.4x the brush width at the start (big gaps), shrinking to ~0.6x at the end
  const rows = [];
  let v = -vext + B * 0.02, guard = 0;
  while (guard++ < 200) {
    const w = wAt(v);
    const fr = abClamp((v + vext) / (2 * vext), 0, 1);
    const dl = (2.4 - 1.8 * Math.pow(fr, 0.8)) * wAt(v + 0.34 * w);
    let ua = 1e9, ub = -1e9;
    const vm = v + dl * 0.125;
    for (let k = -200; k <= 200; k++) {
      const u = (k / 200) * uext * 1.3;
      const x = W / 2 + u * ca + vm * sa, y = H / 2 - u * sa + vm * ca;
      if (x > -margin && x < W + margin && y > -margin && y < H + margin) {
        ua = Math.min(ua, u);
        ub = Math.max(ub, u);
      }
    }
    const dir = rows.length % 2 === 0 ? -1 : 1;
    if (ub >= ua) rows.push({ v, d: dl * 0.25, us: dir < 0 ? ub : ua, ue: dir < 0 ? ua : ub, dir });
    if (v + 0.5 * w >= vext + B * 0.02) break;
    v += dl;
  }
  rows.forEach((r, i) => {
    const dir = i % 2 === 0 ? -1 : 1;
    if (dir !== r.dir) { const t = r.us; r.us = r.ue; r.ue = t; r.dir = dir; }
  });
  const segs = [];
  rows.forEach((r, i) => {
    const du = r.ue - r.us, wob = r.d * 0.15 * (i % 2 ? -1 : 1), ve = r.v + r.d;
    segs.push([[r.us, r.v], [r.us + du * 0.33, r.v + r.d * 0.33 + wob], [r.us + du * 0.66, r.v + r.d * 0.66 - wob], [r.ue, ve]]);
    const nx = rows[i + 1];
    if (nx) {
      const bulge = Math.abs(nx.v - ve) * 0.5 + B * 0.2;
      const out = r.dir < 0 ? Math.min(r.ue, nx.us) - bulge : Math.max(r.ue, nx.us) + bulge;
      segs.push([[r.ue, ve], [out, ve], [out, nx.v], [nx.us, nx.v]]);
    }
  });
  // sample densely, keep points spaced by ~18% of the brush radius
  const dense = [];
  let total = 0, last = null;
  segs.forEach((c) => {
    const approx =
      Math.hypot(c[1][0] - c[0][0], c[1][1] - c[0][1]) +
      Math.hypot(c[2][0] - c[1][0], c[2][1] - c[1][1]) +
      Math.hypot(c[3][0] - c[2][0], c[3][1] - c[2][1]);
    const steps = Math.max(8, Math.ceil(approx / 3));
    for (let q = 0; q <= steps; q++) {
      const t = q / steps, mt = 1 - t;
      const u = mt * mt * mt * c[0][0] + 3 * mt * mt * t * c[1][0] + 3 * mt * t * t * c[2][0] + t * t * t * c[3][0];
      const vv = mt * mt * mt * c[0][1] + 3 * mt * mt * t * c[1][1] + 3 * mt * t * t * c[2][1] + t * t * t * c[3][1];
      if (last) total += Math.hypot(u - last[0], vv - last[1]);
      dense.push([u, vv, total]);
      last = [u, vv];
    }
  });
  const px = [], py = [], pr = [], pt = [];
  let lastKept = -1e9;
  dense.forEach((d, idx) => {
    const r = wAt(d[1]) / 2;
    if (idx === 0 || idx === dense.length - 1 || d[2] - lastKept >= Math.max(2.5, r * 0.18)) {
      px.push(W / 2 + d[0] * ca + d[1] * sa);
      py.push(H / 2 - d[0] * sa + d[1] * ca);
      pr.push(r);
      pt.push(d[2] / total);
      lastKept = d[2];
    }
  });
  return { px, py, pr, pt };
}

function AboutBrush({ trackRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const track = trackRef.current;
    if (!cv || !track) return;
    const ctx = cv.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let geo = null, dpr = 1, W = 0, H = 0, target = 0, cur = 0, raf = 0;

    const draw = (p) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (p <= 0 || !geo) return;
      const f = abSwell(p);
      ctx.fillStyle = "#E02B20";
      ctx.beginPath();
      for (let i = 0; i < geo.pt.length && geo.pt[i] <= p; i++) {
        const r = geo.pr[i] * f;
        ctx.moveTo(geo.px[i] + r, geo.py[i]);
        ctx.arc(geo.px[i], geo.py[i], r, 0, 6.2832);
      }
      ctx.fill();
    };

    const read = () => {
      const top = track.getBoundingClientRect().top;
      const range = Math.max(1, track.offsetHeight - H);
      const prog = abClamp(-top, 0, range) / range;
      target = abClamp((prog - 0.08) / 0.84, 0, 1); // short pause on About, then paint, then hold full red
    };

    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      geo = abBuild(W, H);
      read();
      cur = target;
      draw(cur);
    };

    // the painted amount glides toward the scroll position instead of jumping with each wheel notch
    const loop = () => {
      cur += (target - cur) * (reduce ? 1 : 0.09);
      if (Math.abs(target - cur) < 0.0004) cur = target;
      draw(cur);
      raf = cur !== target ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      read();
      if (!raf) raf = requestAnimationFrame(loop);
    };

    setup();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", setup);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", setup);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [trackRef]);

  return <canvas ref={canvasRef} className="ip-brush" aria-hidden="true" />;
}
${JS_END}

`;

const CSS_BLOCK = `${CSS_START}
/* About section is pinned while the brush paints */
.ip-track { position: relative; height: 430vh; height: 430svh; }
.ip-pin { position: sticky; top: 0; height: 100vh; height: 100svh; overflow: hidden; }
.ip-pin .ip-section { min-height: 100%; display: flex; align-items: center; }
.ip-pin .ip-stage { width: 100%; }
.ip-brush {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 5; filter: blur(0.7px);
}
${CSS_END}
`;

function fail(msg) { console.error("✖ " + msg); process.exit(1); }
function backup(file) {
  const bak = file + ".bak-about-brush";
  if (!existsSync(bak)) copyFileSync(file, bak);
}

if (!existsSync(PAGE) || !existsSync(CSS)) fail("Run this from the project root (app/page.js and app/globals.css must exist).");

// ── 1. page.js ───────────────────────────────────────────────────────────
let page = readFileSync(PAGE, "utf8");

// 1a. IntroProfile: wrap the existing section in the pinned track (keeps your text/markup)
const fnStart = page.indexOf("function IntroProfile");
const fnEnd = page.indexOf("Projects (transparent");
if (fnStart === -1 || fnEnd === -1 || fnEnd < fnStart) fail("Could not find IntroProfile / Projects in app/page.js.");
let fn = page.slice(fnStart, fnEnd);

if (fn.includes("ip-track")) {
  console.log("• page.js: IntroProfile already wrapped, skipping.");
} else {
  const openTag = '<motion.section ref={ref} className="ip-section theme-section">';
  const refLine = "const ref = useRef(null);";
  if (!fn.includes(openTag) || !fn.includes(refLine) || !fn.includes("</motion.section>"))
    fail("IntroProfile does not look like the expected 'about-hero' version. Run apply-about-hero.mjs first.");
  fn = fn.replace(refLine, refLine + "\n  const trackRef = useRef(null);");
  fn = fn.replace(
    openTag,
    '<div ref={trackRef} className="ip-track">\n      <div className="ip-pin">\n    ' + openTag
  );
  const closeIdx = fn.lastIndexOf("</motion.section>");
  fn =
    fn.slice(0, closeIdx) +
    "</motion.section>\n      <AboutBrush trackRef={trackRef} />\n      </div>\n    </div>" +
    fn.slice(closeIdx + "</motion.section>".length);
  page = page.slice(0, fnStart) + fn + page.slice(fnEnd);
  console.log("✔ page.js: IntroProfile wrapped in pinned track.");
}

// 1b. AboutBrush component (inserted just above the IntroProfile comment)
const s = page.indexOf(JS_START);
const e = page.indexOf(JS_END);
if (s !== -1 && e !== -1) {
  page = page.slice(0, s) + BRUSH_CODE.trimEnd() + page.slice(e + JS_END.length);
  console.log("✔ page.js: AboutBrush refreshed.");
} else {
  const marker = page.indexOf("Intro Profile (");
  if (marker === -1) fail("Could not find the Intro Profile comment marker.");
  const lineStart = page.lastIndexOf("\n", marker) + 1;
  page = page.slice(0, lineStart) + BRUSH_CODE + page.slice(lineStart);
  console.log("✔ page.js: AboutBrush added.");
}
if (!DRY_RUN) { backup(PAGE); writeFileSync(PAGE, page); }

// ── 2. globals.css ───────────────────────────────────────────────────────
let css = readFileSync(CSS, "utf8");
const cs = css.indexOf(CSS_START);
const ce = css.indexOf(CSS_END);
if (cs !== -1 && ce !== -1) {
  css = css.slice(0, cs) + CSS_BLOCK.trimEnd() + css.slice(ce + CSS_END.length);
  console.log("✔ globals.css: about-brush block refreshed.");
} else {
  css = css.trimEnd() + "\n\n" + CSS_BLOCK;
  console.log("✔ globals.css: about-brush block added.");
}
if (!DRY_RUN) { backup(CSS); writeFileSync(CSS, css); }

console.log(DRY_RUN ? "\n(dry run: nothing was written)" : "\nDone. Run `npm run dev` and scroll through the About section.");
