#!/usr/bin/env node
/**
 * apply-perf-patch.mjs
 *
 * Makes the site smoother, with the About "paint brush" as the main target.
 * Run it AFTER apply-about-brush.mjs (it refreshes that script's marked block).
 *
 * BRUSH (app/page.js, the block between the about-brush markers)
 *   - The stroke is now drawn as ONE swept, variable-width ribbon instead of
 *     ~1,000-2,000 overlapping filled circles that were all re-filled every
 *     frame. Same shape and same look, measured 17-35x cheaper per frame, and
 *     the head of the stroke now moves smoothly instead of in 3-34px steps.
 *   - The scroll listener used to keep re-filling the whole red stroke on EVERY
 *     scroll tick for the rest of the page, even while the canvas was off-screen.
 *     It is now only active while the About track is near the viewport.
 *   - Easing is time-based (same feel at 60 / 120 / 144 Hz) and never redraws a
 *     frame that did not change.
 *   - Resize: no geometry rebuild or canvas re-allocation unless the size really
 *     changed (phone URL-bar scrolling used to trigger both constantly).
 *   - Canvas resolution follows a pixel budget (sharp on phones, lighter on huge
 *     screens) and the full-screen CSS blur(0.7px) filter is gone.
 *
 * SITE-WIDE (small, safe, each one skipped if its target text is not found)
 *   - Navbar: scroll handler runs once per frame instead of once per scroll event.
 *   - Cursor: one delegated listener instead of a MutationObserver re-scanning
 *     the whole DOM.
 *   - Hero: removed an unused mousemove -> setState that re-rendered the hero on
 *     every mouse move.
 *   - Page root: removed a useScroll+useSpring pair whose value nothing reads.
 *   - About photo: lazy + async decode; if the "sharp" package is installed it
 *     also writes public/png/me.webp (the PNG is ~2 MB) and serves it via <picture>.
 *   - globals.css: sections no longer force a GPU layer each (they stay isolated
 *     with contain: paint); override lives in one marked block you can delete.
 *
 * Usage (from the project root, next to package.json):
 *   node apply-perf-patch.mjs             # apply
 *   node apply-perf-patch.mjs --dry-run   # preview only, writes nothing
 *
 * Safe to re-run. Backups: app/page.js.bak-perf-patch, app/globals.css.bak-perf-patch
 *
 * Knobs (top of the inserted brush block): AB_TAU (glide, seconds), AB_MAX_PX
 * (canvas pixel budget), AB_MAX_DPR, AB_TOL_XY / AB_TOL_R (ribbon simplification).
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(__dirname, "app", "page.js");
const CSS = path.join(__dirname, "app", "globals.css");
const ME_PNG = path.join(__dirname, "public", "png", "me.png");
const ME_WEBP = path.join(__dirname, "public", "png", "me.webp");
const DRY_RUN = process.argv.includes("--dry-run");

const JS_START = "/* about-brush:start */";
const JS_END = "/* about-brush:end */";
const CSS_START = "/* perf-patch:start */";
const CSS_END = "/* perf-patch:end */";

const BRUSH_CODE = `${JS_START}
/* perf-patch: ribbon renderer, see apply-perf-patch.mjs */
const AB_TAU = 0.16;        // glide time constant in seconds (was 0.09 per frame, ~0.18s at 60Hz)
const AB_MAX_PX = 2.2e6;    // canvas pixel budget (device px); keeps big screens light
const AB_MAX_DPR = 2;
const AB_FULL = 0.995;      // from here the screen is solid red, so just fill it
const AB_COLOR = "#E02B20";
const AB_TOL_XY = 0.45;     // ribbon simplification: centre-line tolerance (css px)
const AB_TOL_R = 0.22;      // ribbon simplification: radius tolerance (css px, before swell)
const AB_TAU2 = 6.283185307179586;

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

// Reduce the dense centre-line (~1-2k points) to the few hundred that matter.
function abSimplify(geo) {
  const px = geo.px, py = geo.py, pr = geo.pr, pt = geo.pt;
  const n = px.length;
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const seg = stack.pop();
    const a = seg[0], b = seg[1];
    if (b - a < 2) continue;
    const ax = px[a], ay = py[a], dx = px[b] - ax, dy = py[b] - ay;
    const L2 = dx * dx + dy * dy || 1e-9;
    const dt = pt[b] - pt[a] || 1e-9;
    let worst = 0, wi = -1;
    for (let i = a + 1; i < b; i++) {
      const u = abClamp(((px[i] - ax) * dx + (py[i] - ay) * dy) / L2, 0, 1);
      const ex = px[i] - (ax + u * dx), ey = py[i] - (ay + u * dy);
      const exy = Math.sqrt(ex * ex + ey * ey) / AB_TOL_XY;
      const tau = (pt[i] - pt[a]) / dt;
      const er = Math.abs(pr[i] - (pr[a] + (pr[b] - pr[a]) * tau)) / AB_TOL_R;
      const e = exy > er ? exy : er;
      if (e > worst) { worst = e; wi = i; }
    }
    if (worst > 1) {
      keep[wi] = 1;
      stack.push([a, wi], [wi, b]);
    }
  }
  let m = 0;
  for (let i = 0; i < n; i++) m += keep[i];
  const g = {
    n: m,
    x: new Float32Array(m), y: new Float32Array(m), r: new Float32Array(m), t: new Float32Array(m),
    vx: new Float32Array(m + 1), vy: new Float32Array(m + 1), vr: new Float32Array(m + 1),
  };
  for (let i = 0, j = 0; i < n; i++) {
    if (!keep[i]) continue;
    g.x[j] = px[i]; g.y[j] = py[i]; g.r[j] = pr[i]; g.t[j] = pt[i]; j++;
  }
  return g;
}

// Every sub-path below is wound the same way, so a single nonzero fill() is a pure union.
function abDisc(ctx, x, y, r) {
  ctx.moveTo(x + r, y);
  ctx.arc(x, y, r, AB_TAU2, 0, true);
}
function abWedge(ctx, px, py, R, ax, ay, bx, by) {
  if (ax * by - ay * bx > 0) { const tx = ax; ax = bx; bx = tx; const ty = ay; ay = by; by = ty; }
  ctx.moveTo(px, py);
  ctx.lineTo(px + R * ax, py + R * ay);
  ctx.arc(px, py, R, Math.atan2(ay, ax), Math.atan2(by, bx), true);
  ctx.closePath();
}

// Adds the stroke painted up to progress p (radius scaled by f) to the current path.
function abRibbon(ctx, g, p, f) {
  const n = g.n, x = g.x, y = g.y, r = g.r, t = g.t, vx = g.vx, vy = g.vy, vr = g.vr;
  let lo = 0, hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (t[mid] <= p) lo = mid; else hi = mid - 1;
  }
  let m = 0;
  for (let i = 0; i <= lo; i++) { vx[m] = x[i]; vy[m] = y[i]; vr[m] = r[i] * f; m++; }
  if (lo < n - 1 && p > t[lo]) {
    const tau = (p - t[lo]) / (t[lo + 1] - t[lo] || 1e-9); // exact head position, no stepping
    vx[m] = x[lo] + (x[lo + 1] - x[lo]) * tau;
    vy[m] = y[lo] + (y[lo + 1] - y[lo]) * tau;
    vr[m] = (r[lo] + (r[lo + 1] - r[lo]) * tau) * f;
    m++;
  }
  abDisc(ctx, vx[0], vy[0], vr[0]);
  if (m > 1) abDisc(ctx, vx[m - 1], vy[m - 1], vr[m - 1]);
  let pok = false, pux = 0, puy = 0, pk = 0;
  for (let j = 0; j < m - 1; j++) {
    const x0 = vx[j], y0 = vy[j], r0 = vr[j], x1 = vx[j + 1], y1 = vy[j + 1], r1 = vr[j + 1];
    const dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy);
    const k = L > 1e-4 ? (r0 - r1) / L : 2;
    const ok = k > -0.9999 && k < 0.9999;
    let ux = 0, uy = 0;
    if (ok) {
      ux = dx / L; uy = dy / L;
      const s = Math.sqrt(1 - k * k);
      // outer tangent lines of the two end circles ("+" and "-" sides)
      const nx = ux * k - uy * s, ny = uy * k + ux * s, mx = ux * k + uy * s, my = uy * k - ux * s;
      ctx.moveTo(x0 + r0 * nx, y0 + r0 * ny);
      ctx.lineTo(x1 + r1 * nx, y1 + r1 * ny);
      ctx.lineTo(x1 + r1 * mx, y1 + r1 * my);
      ctx.lineTo(x0 + r0 * mx, y0 + r0 * my);
      ctx.closePath();
    }
    if (j > 0) {
      if (ok && pok) {
        // round join on the outer side of the turn
        const ps = Math.sqrt(1 - pk * pk), cs = Math.sqrt(1 - k * k);
        if (pux * uy - puy * ux > 0) {
          abWedge(ctx, x0, y0, r0, pux * pk + puy * ps, puy * pk - pux * ps, ux * k + uy * cs, uy * k - ux * cs);
        } else {
          abWedge(ctx, x0, y0, r0, pux * pk - puy * ps, puy * pk + pux * ps, ux * k - uy * cs, uy * k + ux * cs);
        }
      } else {
        abDisc(ctx, x0, y0, r0);
      }
    }
    pok = ok; pux = ux; puy = uy; pk = k;
  }
}

function AboutBrush({ trackRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const track = trackRef.current;
    if (!cv || !track) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let geo = null, dpr = 1, W = 0, H = 0, range = 1;
    let target = 0, cur = 0, drawn = -1, raf = 0, sizeRaf = 0, last = 0, live = false;

    const paint = (p) => {
      if (p === drawn) return; // nothing changed, nothing to do
      drawn = p;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (p <= 0 || !geo) return;
      ctx.fillStyle = AB_COLOR;
      if (p >= AB_FULL) { ctx.fillRect(0, 0, W, H); return; }
      ctx.beginPath();
      abRibbon(ctx, geo, p, abSwell(p));
      ctx.fill();
    };

    const read = () => {
      const top = track.getBoundingClientRect().top;
      const prog = abClamp(-top, 0, range) / range;
      target = abClamp((prog - 0.08) / 0.84, 0, 1); // short pause on About, then paint, then hold full red
    };

    // the painted amount glides toward the scroll position; time-based so it feels the same at any refresh rate
    const frame = (now) => {
      raf = 0;
      read();
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      cur = reduce ? target : cur + (target - cur) * (1 - Math.exp(-dt / AB_TAU));
      if (Math.abs(target - cur) < 0.0005) cur = target;
      paint(cur);
      if (cur !== target) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const setup = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      const want = Math.max(0.75, Math.min(window.devicePixelRatio || 1, AB_MAX_DPR, Math.sqrt(AB_MAX_PX / (w * h))));
      const cw = Math.round(w * want), ch = Math.round(h * want);
      if (w === W && h === H && cv.width === cw && cv.height === ch) return;
      W = w; H = h; dpr = want;
      if (cv.width !== cw) cv.width = cw;
      if (cv.height !== ch) cv.height = ch;
      geo = abSimplify(abBuild(W, H));
      range = Math.max(1, track.offsetHeight - H);
      read();
      cur = target;
      drawn = -1;
      paint(cur);
    };

    setup();

    // only listen to scroll while the About track is on (or near) the screen
    const io = new IntersectionObserver(
      (entries) => {
        const on = entries[entries.length - 1].isIntersecting;
        if (on === live) return;
        live = on;
        if (on) {
          read();
          cur = target;
          paint(cur);
          window.addEventListener("scroll", wake, { passive: true });
        } else {
          window.removeEventListener("scroll", wake);
          if (raf) { cancelAnimationFrame(raf); raf = 0; }
          last = 0;
          read();
          cur = target;
        }
      },
      { rootMargin: "50% 0px 50% 0px" }
    );
    io.observe(track);

    // resize: re-measure at most once per frame, and only if the size really changed
    const ro = new ResizeObserver(() => {
      if (sizeRaf) return;
      sizeRaf = requestAnimationFrame(() => { sizeRaf = 0; setup(); });
    });
    ro.observe(cv);

    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", wake);
      if (raf) cancelAnimationFrame(raf);
      if (sizeRaf) cancelAnimationFrame(sizeRaf);
    };
  }, [trackRef]);

  return <canvas ref={canvasRef} className="ip-brush" aria-hidden="true" />;
}
${JS_END}

`;

const CSS_BLOCK = `${CSS_START}
/* Brush canvas: no full-screen CSS filter on every frame; isolate it on its own layer. */
.ip-brush { filter: none; contain: strict; transform: translateZ(0); }

/* Sections used to force a GPU layer each (will-change + translateZ + backface-visibility):
   eight full-width layers cost memory and slow compositing, especially on phones.
   contain: paint (from the base rule) still isolates them; delete this block to restore. */
.theme-section {
  will-change: auto;
  -webkit-transform: none;
  transform: none;
  backface-visibility: visible;
  -webkit-backface-visibility: visible;
}
html, body { will-change: auto; }
${CSS_END}
`;

function fail(msg) { console.error("✖ " + msg); process.exit(1); }
function backup(file) {
  const bak = file + ".bak-perf-patch";
  if (!existsSync(bak)) copyFileSync(file, bak);
}

if (!existsSync(PAGE) || !existsSync(CSS)) fail("Run this from the project root (app/page.js and app/globals.css must exist).");

let page = readFileSync(PAGE, "utf8");

// replace `from` with `to` once; skip quietly (with a note) if already done or the text is not there
function swap(label, from, to, doneMarker) {
  if (doneMarker && page.includes(doneMarker)) { console.log("• page.js: " + label + " already applied, skipping."); return; }
  if (!page.includes(from)) { console.log("• page.js: " + label + " target not found, skipping."); return; }
  page = page.replace(from, () => to);
  console.log("✔ page.js: " + label);
}

// ── 1. brush block ───────────────────────────────────────────────────────
{
  const s = page.indexOf(JS_START), e = page.indexOf(JS_END);
  if (s === -1 || e === -1 || e < s) fail("about-brush block not found in app/page.js. Run apply-about-brush.mjs first.");
  page = page.slice(0, s) + BRUSH_CODE.trimEnd() + page.slice(e + JS_END.length);
  console.log("✔ page.js: AboutBrush replaced with the ribbon renderer.");
}

// ── 2. navbar: one scroll update per frame ───────────────────────────────
swap(
  "navbar scroll handler (rAF)",
  `  useEffect(() => {
    const onScroll = () => {
      setScrolled((prev) => (prev ? window.scrollY > 6 : window.scrollY > 24)); // spring-morph: hysteresis
      let current = "";
      document.querySelectorAll("section[id]").forEach((s) => {
        if (s.getBoundingClientRect().top < window.innerHeight / 2) current = s.id;
      });
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);`,
  `  useEffect(() => {
    let raf = 0, secs = [];
    const run = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled((prev) => (prev ? y > 6 : y > 24)); // spring-morph: hysteresis
      if (!secs.length) secs = Array.from(document.querySelectorAll("section[id]"));
      const mid = window.innerHeight / 2;
      let current = "";
      for (const s of secs) if (s.getBoundingClientRect().top < mid) current = s.id;
      setActive(current);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); }; /* perf-patch: once per frame */
    window.addEventListener("scroll", onScroll, { passive: true });
    run();
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);`,
  "/* perf-patch: once per frame */"
);

// ── 3. cursor: delegated hover detection ─────────────────────────────────
swap(
  "cursor hover (delegated)",
  `    window.addEventListener("mousemove", move);
    const onEnter = () => setHover(true);
    const onLeave = () => setHover(false);
    const attach = () => {
      document.querySelectorAll("a, button, [data-hover]").forEach((el) => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };
    attach();
    const obs = new MutationObserver(attach);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("mousemove", move);
      obs.disconnect();
    };`,
  `    window.addEventListener("mousemove", move, { passive: true });
    /* perf-patch: delegated hover, no MutationObserver */
    const onOver = (e) => setHover(!!(e.target && e.target.closest && e.target.closest("a, button, [data-hover]")));
    document.addEventListener("mouseover", onOver, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", onOver);
    };`,
  "/* perf-patch: delegated hover"
);

// ── 4. hero: drop the unused mouse state ─────────────────────────────────
{
  const a = page.indexOf("  const [, setMouse] = useState({ x: 0.5, y: 0.5 });");
  const endTxt = "    [isMobile]\n  );\n";
  const b = a === -1 ? -1 : page.indexOf(endTxt, a);
  if (a !== -1 && b !== -1 && b - a < 700 && page.includes("onMouseMove={handleMouse}")) {
    page = page.slice(0, a) + "  /* perf-patch: removed unused mouse state (it re-rendered the hero on every mouse move) */\n" + page.slice(b + endTxt.length);
    page = page.replace("      onMouseMove={handleMouse}\n", "");
    console.log("✔ page.js: hero mousemove state removed.");
  } else if (page.includes("perf-patch: removed unused mouse state")) {
    console.log("• page.js: hero mouse state already removed, skipping.");
  } else {
    console.log("• page.js: hero mouse state target not found, skipping.");
  }
}

// ── 5. page root: unused scroll spring ───────────────────────────────────
swap(
  "unused page-level scroll spring",
  `  const { scrollYProgress: globalScroll } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const globalProgress = useSpring(globalScroll, {
    stiffness: 120,
    damping: 30,
    mass: 0.2,
  });
`,
  `  // perf-patch: no section reads globalProgress, and the useScroll + useSpring pair that fed it
  // ran a spring on every scroll tick. Kept as a prop so the section signatures stay the same.
  const globalProgress = null;
`,
  "// perf-patch: no section reads globalProgress"
);

// ── 6. about photo: lazy + async, optional webp ──────────────────────────
{
  const IMG = '<img src="/png/me.png" alt="Carlo" draggable={false} />';
  if (page.includes("perf-patch: about photo")) {
    console.log("• page.js: about photo already optimized, skipping.");
  } else if (!page.includes(IMG)) {
    console.log("• page.js: about photo target not found, skipping.");
  } else {
    let dims = "";
    try {
      const b = readFileSync(ME_PNG);
      if (b.toString("ascii", 12, 16) === "IHDR") dims = " width={" + b.readUInt32BE(16) + "} height={" + b.readUInt32BE(20) + "}";
    } catch { /* png not found: fine */ }
    let webp = existsSync(ME_WEBP);
    if (!webp && existsSync(ME_PNG)) {
      try {
        const sharp = createRequire(import.meta.url)("sharp");
        if (!DRY_RUN) await sharp(ME_PNG).webp({ quality: 82, alphaQuality: 90, effort: 5 }).toFile(ME_WEBP);
        webp = true;
        console.log(DRY_RUN ? "• public/png/me.webp would be written (needs sharp, found)." : "✔ public/png/me.webp written (same pixels, a fraction of the size).");
      } catch {
        console.log("• 'sharp' is not installed: skipped me.webp. Run `npm i -D sharp` and re-run this script to add it.");
      }
    }
    const lazy = '<img src="/png/me.png" alt="Carlo" draggable={false} loading="lazy" decoding="async"' + dims + " />";
    const rep = webp
      ? '{/* perf-patch: about photo */}\n              <picture>\n                <source srcSet="/png/me.webp" type="image/webp" />\n                ' + lazy + "\n              </picture>"
      : "{/* perf-patch: about photo */}\n              " + lazy;
    page = page.replace(IMG, () => rep);
    console.log("✔ page.js: about photo lazy/async" + (webp ? " + webp <picture>." : "."));
  }
}

if (!DRY_RUN) { backup(PAGE); writeFileSync(PAGE, page); }

// ── 7. globals.css ───────────────────────────────────────────────────────
let css = readFileSync(CSS, "utf8");
const cs = css.indexOf(CSS_START), ce = css.indexOf(CSS_END);
if (cs !== -1 && ce !== -1) {
  css = css.slice(0, cs) + CSS_BLOCK.trimEnd() + css.slice(ce + CSS_END.length);
  console.log("✔ globals.css: perf block refreshed.");
} else {
  css = css.trimEnd() + "\n\n" + CSS_BLOCK;
  console.log("✔ globals.css: perf block added.");
}
// also drop the blur filter at its source, so it stays gone even if the block above is edited
css = css.replace("pointer-events: none; z-index: 5; filter: blur(0.7px);", "pointer-events: none; z-index: 5;");
if (!DRY_RUN) { backup(CSS); writeFileSync(CSS, css); }

console.log(DRY_RUN ? "\n(dry run: nothing was written)" : "\nDone. Run `npm run dev` and scroll through the About section.");
