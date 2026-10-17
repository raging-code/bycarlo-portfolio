"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import GlassSurface from "./GlassSurface";
import Threads from "./Threads";
import ContactThreads from "./ContactThreads";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  animate,
  AnimatePresence,
} from "framer-motion";
import ContactMorphSection from "./ContactMorphSection";


const E = [0.25, 1, 0.25, 1];

const LIGHT = {
  bg: "#F6F5F2",
  surface: "#EAE6DF",
  text: "#141414",
  muted: "#6B6762",
  accent: "#E02B20",
  accent2: "#C9A66B",
  border: "rgba(20,20,20,0.14)",
};

function interpolateHex(c1, c2, t) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const r1 = parseInt(c1.slice(1, 3), 16),
    g1 = parseInt(c1.slice(3, 5), 16),
    b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16),
    g2 = parseInt(c2.slice(3, 5), 16),
    b2 = parseInt(c2.slice(5, 7), 16);
  return `rgb(${clamp(r1 + (r2 - r1) * t)},${clamp(g1 + (g2 - g1) * t)},${clamp(
    b1 + (b2 - b1) * t
  )})`;
}

const PROJECTS = [
  {
    id: "01", title: "Helix Protocol", cat: "Web3 Platform",
    desc: "A next-gen DeFi dashboard with real-time data visualisation.",
    tech: ["Solidity", "Next.js", "D3"], live: "#", colorAccent: "#E02B20"
  },
  {
    id: "02", title: "Mirage Events", cat: "Experience Portal",
    desc: "Immersive event microsite blending video and 3D ticketing.",
    tech: ["Three.js", "GSAP", "Firebase"], live: "#", colorAccent: "#E02B20"
  },
  {
    id: "03", title: "Core Studio", cat: "Agency Rebrand",
    desc: "Brutalist portfolio for a creative studio moving into architecture.",
    tech: ["Tailwind", "Framer Motion", "Storyblok"], live: "#", colorAccent: "#E02B20"
  },
  {
    id: "04", title: "Void Commerce", cat: "Headless Store",
    desc: "Product-first shopping with AI search and zero-click checkout.",
    tech: ["Medusa", "Algolia", "Astro"], live: "#", colorAccent: "#E02B20"
  },
];

const TESTIMONIALS = [
  {
    quote: "Working with this team felt like tapping into a future I didn't know existed. The result is still ahead of the market.",
    name: "Nova Chen", role: "Founder, Helix"
  },
  {
    quote: "They don't just build pages - they engineer moments. Three weeks and our conversion increased by 43%.",
    name: "Rafael Ortiz", role: "VP Product, Mirage"
  },
  {
    quote: "Unflinchingly modern. Every pixel has a reason. We've never received compliments like this on a website before.",
    name: "Clara Jensen", role: "Creative Director, Core"
  },
];

const NAV_LINKS = [
  { id: "work", label: "Projects" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

/* ── GlassNavbar – compact, flush at the top, glass capsule on scroll ── */
function GlassNavbar() {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // Light-mode colors
  const ink    = "#141414";
  const muted  = "rgba(20,20,20,0.60)";
  const glass  = "rgba(246,245,242,0.72)";
  const line   = "rgba(20,20,20,0.12)";
  const chip   = "rgba(20,20,20,0.08)";
  const ctaFg  = "#F6F5F2";
  const accent = "#E02B20";

  useEffect(() => {
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
  }, []);

  return (
    <div className={"gnav-wrap" + (scrolled ? " is-scrolled" : "")}>
      <motion.nav
        className="gnav"
        aria-label="Primary"
        style={{
          "--gn-ink": ink,
          "--gn-muted": muted,
          "--gn-glass": glass,
          "--gn-line": line,
          "--gn-chip": chip,
          "--gn-cta-fg": ctaFg,
          "--gn-accent": accent,
        }}
      >
        <div className="gnav-glass" aria-hidden="true">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={scrolled ? 999 : 0}
            backgroundOpacity={0.1}
            brightness={50}
            opacity={0.93}
            blur={11}
            displace={0.5}
            distortionScale={-180}
            redOffset={0}
            greenOffset={10}
            blueOffset={20}
          />
        </div>

        <a
          href="#"
          className="gnav-brand"
          aria-label="byCarlo, back to top"
          onClick={(e) => { e.preventDefault(); if (window.__lenis) window.__lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: "smooth" }); }}
        >
          <img src="/png/bcdlogo.png" alt="" width={26} height={26} className="gnav-logo gnav-logo-light" draggable={false} />
        </a>

        <div className="gnav-links">
          {NAV_LINKS.map(({ id, label }) => (
            <a
              key={id || label}
              href={id ? "#" + id : "#"}
              onClick={(e) => { if (!id) e.preventDefault(); }}
              className={"gnav-link" + (id && active === id ? " on" : "")}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="gnav-end">
          <a href="#contact" className="gnav-cta">Contact</a>
        </div>
      </motion.nav>
    </div>
  );
}

/* ── Custom Cursor (desktop only) ────────────────── */
function Cursor() {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const sx = useSpring(mx, { stiffness: 400, damping: 28 });
  const sy = useSpring(my, { stiffness: 400, damping: 28 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const move = (e) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("mousemove", move, { passive: true });
    /* perf-patch: delegated hover, no MutationObserver */
    const onOver = (e) => setHover(!!(e.target && e.target.closest && e.target.closest("a, button, [data-hover]")));
    document.addEventListener("mouseover", onOver, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", onOver);
    };
  }, [mx, my]);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%", mixBlendMode: "difference" }}
    >
      <motion.div
        animate={{
          width: hover ? 48 : 12,
          height: hover ? 48 : 12,
          backgroundColor: hover ? "rgba(255,255,255,0.12)" : "#FFFFFF",
          borderColor: hover ? "#FFFFFF" : "transparent",
          borderWidth: hover ? 1.5 : 0,
        }}
        style={{ borderRadius: "50%", borderStyle: "solid" }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />
    </motion.div>
  );
}

/* ── Device Mockup ───────────────────────────────── */
function DeviceMockup({ accent, isMobile }) {
  const acc = accent || "#E02B20";
  const frameBg = LIGHT.surface;
  const screenBg = LIGHT.bg;
  const barColor = "rgba(0,0,0,0.05)";

  return (
    <div className="mt-6 mb-12">
      <div className="relative mx-auto" style={{ maxWidth: "600px" }}>
        <motion.div
          className="rounded-xl overflow-hidden border-2 w-full aspect-video"
          style={{ borderColor: acc, backgroundColor: frameBg }}
        >
          <div className="flex items-center gap-1.5 px-4 py-2" style={{ backgroundColor: barColor }}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-70" />
          </div>
          <motion.div className="flex-1 p-4 flex flex-col gap-2 h-full" style={{ backgroundColor: screenBg }}>
            <div className="w-2/3 h-3 rounded" style={{ backgroundColor: acc, opacity: 0.3 }} />
            <div className="w-1/2 h-3 rounded" style={{ backgroundColor: acc, opacity: 0.15 }} />
            <div className="w-1/4 h-8 rounded mt-auto" style={{ backgroundColor: acc, opacity: 0.4 }} />
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-[-24px] right-[-12px] w-24 rounded-2xl overflow-hidden border-2 z-10"
          style={{ borderColor: acc, backgroundColor: frameBg }}
        >
          <div className="flex justify-center py-1.5" style={{ backgroundColor: barColor }}>
            <div className="w-3 h-1 rounded-full bg-gray-500 opacity-60" />
          </div>
          <motion.div className="h-32 p-2 flex flex-col gap-1.5" style={{ backgroundColor: screenBg }}>
            <div className="w-full h-2 rounded" style={{ backgroundColor: acc, opacity: 0.3 }} />
            <div className="w-3/4 h-2 rounded" style={{ backgroundColor: acc, opacity: 0.2 }} />
            <div className="w-1/2 h-4 rounded mt-auto" style={{ backgroundColor: acc, opacity: 0.4 }} />
          </motion.div>
          <div className="flex justify-center py-1.5" style={{ backgroundColor: barColor }}>
            <div className="w-2 h-1 rounded-full bg-gray-500 opacity-60" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────── */
function Hero({ globalProgress, isMobile }) {
  const heroVars = {
    "--h-text":    LIGHT.text,
    "--h-muted":   LIGHT.muted,
    "--h-accent":  LIGHT.accent,
    "--h-accent2": LIGHT.accent2,
    "--h-border":  LIGHT.border,
    "--h-on-accent": LIGHT.bg,
  };
  const ref = useRef(null);
  /* perf-patch: removed unused mouse state (it re-rendered the hero on every mouse move) */

  return (
    <motion.section
      ref={ref}
      className="relative min-h-svh flex flex-col justify-center items-center px-6 md:px-20 overflow-hidden pt-20"
      style={heroVars}
    >
      {/* hero-threads:start */}
      <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none" style={{ background: "#FFFFFF" }}>
        <Threads
          color="#E02B20"
          thickness={0.6}
          softness={1}
          waves={1.3}
          split={0.04}
          taper={0.85}
          brightness={1.4}
          parting={0}
          enableMouseInteraction={true}
          fade={0}
          lineCount={94}
          amplitude={0.9}
          distance={0.45}
          speed={0.4}
          fray={0.3}
          angle={11}
          opacity={0.65}
          seed={7}
        />
      </div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 z-[1] pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0), #F6F5F2)" }} />
      {/* hero-threads:end */}
      <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: E }}
          className="text-[clamp(2.6rem,9.5vw,8.5rem)] font-display font-extrabold leading-none tracking-[-0.055em] text-center"
        >
          <span className="block" style={{ color: "var(--h-text)" }}>Building Systems</span>
          <span className="block" style={{ color: "var(--h-text)" }}>That Make Ideas</span>
          <span className="block" style={{ color: "var(--h-text)" }}>Work<span style={{ color: "var(--h-accent)" }}>.</span></span>
        </motion.h1>

      </div>

    </motion.section>
  );
}

/* about-brush:start */
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
/* about-brush:end */

/* ── Intro Profile (about-hero v2) ─── */
function IntroProfile({ isMobile }) {
  const ref = useRef(null);
  const trackRef = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const E = [0.22, 1, 0.36, 1];

  return (
    <div ref={trackRef} className="ip-track">
      <div className="ip-pin">
    <motion.section ref={ref} className="ip-section theme-section">
      <div className="ip-stage">
        <div className="ip-about">
          <motion.div
            className="ip-visual"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.9, ease: E }}
          >
            <div className="ip-outer" aria-hidden="true">
              <span className="ip-ring ip-r3" />
              <span className="ip-ring ip-r2" />
              <span className="ip-ring ip-r1" />
            </div>
            <span className="ip-ring ip-r0" aria-hidden="true" />
            <div className="ip-me">
              {/* perf-patch: about photo */}
              <img src="/png/me.png" alt="Carlo" draggable={false} loading="lazy" decoding="async" width={1086} height={1448} />
            </div>
          </motion.div>

          <div className="ip-text">
            <motion.h2
              className="ip-title"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.15, ease: E }}
            >
              Hi, I&rsquo;m
              <br />
              Carlo<span className="ip-dot">.</span>
            </motion.h2>
            <motion.p
              className="ip-copy"
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease: E }}
            >
              I&rsquo;m a Computer Engineering student and a software developer passionate about building practical, innovative tech solutions. From web and mobile apps to AI, automation, and IoT, I enjoy turning ideas into real-world projects that solve problems and make life easier.
            </motion.p>
          </div>
        </div>
      </div>
    </motion.section>
      <AboutBrush trackRef={trackRef} />
      </div>
    </div>
  );
}

/* ── Projects (transparent background) ───────────── */
function Projects({ globalProgress, isMobile }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  /* projects-red:start */
  // red section: cream text, cream accents (the old red accent would vanish on red)
  const textColor = LIGHT.bg;
  const mutedColor = "rgba(246,245,242,0.8)";
  const accentColor = LIGHT.bg;
  const borderColor = "rgba(246,245,242,0.45)";
  /* projects-red:end */

  return (
    <motion.section
      ref={ref}
      id="work"
      className="relative py-28 md:py-44 px-6 md:px-14 theme-section"
    >
      <div className="mb-20">
        <motion.h2
          className="text-[clamp(1.8rem,5vw,3rem)] font-display font-extrabold tracking-[-0.045em] leading-[1.1]"
          style={{ color: textColor }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, ease: E }}
        >
          Selected projects
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
        {PROJECTS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.15 + 0.3, duration: 0.8, ease: E }}
            className="group"
          >
            <DeviceMockup accent={p.colorAccent} isMobile={isMobile} />
            <div>
              <div className="flex items-center justify-between">
                <motion.span className="text-[13px] font-medium" style={{ color: accentColor }}>
                  {p.cat}
                </motion.span>
                <motion.span className="text-xs tracking-widest opacity-50 font-semibold" style={{ color: mutedColor }}>
                  {p.id}
                </motion.span>
              </div>
              <motion.h3 className="font-display font-extrabold text-[1.9rem] md:text-[2.15rem] leading-[1.05] tracking-[-0.045em] mt-2" style={{ color: textColor }}>
                {p.title}
              </motion.h3>
              <motion.p className="text-base leading-relaxed mt-2" style={{ color: mutedColor }}>
                {p.desc}
              </motion.p>
              <div className="flex flex-wrap gap-2 mt-4">
                {p.tech.map((t) => (
                  <motion.span key={t} className="text-[12.5px] px-3 py-1.5 rounded-full border" style={{ borderColor: borderColor, color: mutedColor }}>
                    {t}
                  </motion.span>
                ))}
              </div>
              <motion.a
                href={p.live}
                className="inline-flex items-center gap-2 mt-6 text-sm font-semibold transition-colors"
                style={{ color: accentColor }}
              >
                View project <span className="group-hover:translate-x-1 transition-transform">&#8594;</span>
              </motion.a>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}


/* techstack-deck:start */
/* ── Tech stack: fanned card deck ───────────────────
   One card per category. Drag the front card sideways, click a card behind it,
   or focus the deck and use the arrow keys.
   Edit the tools here: file = /public/logos/<file>.svg */
const TECH_CATEGORIES = [
  {
    label: "Frontend",
    tools: [
      { name: "React", file: "react" },
      { name: "Next.js", file: "nextjs" },
      { name: "TypeScript", file: "typescript" },
      { name: "Tailwind", file: "tailwindcss" },
    ],
  },
  {
    label: "Backend",
    tools: [
      { name: "Node.js", file: "nodejs" },
      { name: "Express", file: "express" },
      { name: "GraphQL", file: "graphql" },
      { name: "Python", file: "python" },
      { name: "Postman", file: "postman" },
    ],
  },
  {
    label: "Database",
    tools: [
      { name: "PostgreSQL", file: "postgresql" },
      { name: "MongoDB", file: "mongodb" },
      { name: "Cloudflare D1", file: "cloudflare" },
    ],
  },
  {
    label: "Security",
    tools: [
      { name: "JWT", file: "jwt" },
      { name: "OAuth", file: "auth0" },
    ],
  },
  {
    label: "Deploy",
    tools: [
      { name: "Cloudflare", file: "cloudflare" },
      { name: "Vercel", file: "vercel" },
      { name: "Docker", file: "docker" },
    ],
  },
  {
    label: "Dev tools",
    tools: [
      { name: "Git", file: "git" },
      { name: "GitHub", file: "github" },
      { name: "VS Code", file: "vscode" },
      { name: "ESLint", file: "eslint" },
      { name: "Jest", file: "jest" },
      { name: "npm", file: "npm" },
    ],
  },
  {
    label: "Mobile",
    tools: [
      { name: "React Native", file: "react" },
      { name: "Expo", file: "expo" },
      { name: "Flutter", file: "flutter" },
    ],
  },
];

const TSD_DRAG_THRESHOLD = 70; // px a card has to travel to count as a swipe
const TSD_STAGGER = 0.09; // seconds between each ring of cards when the deck fans out
// how far each ring of cards sits from the front card (index = distance from the front card)
const TSD_FAN_X = [0, 64, 112, 150];
const TSD_FAN_Y = [0, 14, 26, 38];
const TSD_FAN_ROTATE = [0, 6, 11, 15];
const TSD_FAN_SCALE = [1, 0.93, 0.87, 0.81];
const TSD_FAN_SHADE = [0, 0.12, 0.22, 0.31];

function tsdReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// shortest signed distance from the front card, so the deck wraps around
function tsdRelative(i, active, total) {
  let rel = i - active;
  if (rel > total / 2) rel -= total;
  if (rel < -total / 2) rel += total;
  return rel;
}

function TechStack() {
  const total = TECH_CATEGORIES.length;
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.12 });
  const deckInView = useInView(stageRef, { once: true, amount: 0.6 });

  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [staggering, setStaggering] = useState(false);
  const [scale, setScale] = useState(1); // follows --tsd-s so the fan spreads with the card size
  const [dragging, setDragging] = useState(false);
  const [dragDx, setDragDx] = useState(0);
  const drag = useRef(null);
  const revealedRef = useRef(false);
  const timers = useRef([]);

  const reveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    if (!tsdReducedMotion()) {
      setStaggering(true);
      timers.current.push(setTimeout(() => setStaggering(false), 1400));
    }
  }, []);

  // only the front card at first; the rest fan out once the deck is mostly on screen
  useEffect(() => {
    if (!deckInView) return;
    timers.current.push(setTimeout(reveal, tsdReducedMotion() ? 0 : 250));
  }, [deckInView, reveal]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    const read = () => {
      if (!sectionRef.current) return;
      const s = parseFloat(getComputedStyle(sectionRef.current).getPropertyValue("--tsd-s"));
      setScale(Number.isFinite(s) && s > 0 ? s : 1);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const goTo = useCallback(
    (i) => {
      reveal();
      setActive(((i % total) + total) % total);
    },
    [reveal, total]
  );

  // relative moves use the latest state, so quick repeated key presses never lose a step
  const step = useCallback(
    (delta) => {
      reveal();
      setActive((a) => (((a + delta) % total) + total) % total);
    },
    [reveal, total]
  );

  const handlePointerDown = (e, i) => {
    if (tsdRelative(i, active, total) !== 0) {
      goTo(i);
      return;
    }
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { id: e.pointerId, x0: e.clientX, t0: performance.now(), dx: 0 };
    setDragDx(0);
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const handlePointerMove = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    d.dx = e.clientX - d.x0;
    setDragDx(d.dx);
  };

  const handlePointerUp = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    setDragging(false);
    setDragDx(0);
    const velocity = d.dx / Math.max(performance.now() - d.t0, 1);
    if (d.dx < -TSD_DRAG_THRESHOLD || velocity < -0.5) step(1);
    else if (d.dx > TSD_DRAG_THRESHOLD || velocity > 0.5) step(-1);
  };

  // the browser took the gesture over (e.g. a vertical page scroll): just put the card back
  const handlePointerCancel = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    setDragging(false);
    setDragDx(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  };

  const cardStyle = (i) => {
    const rel = tsdRelative(i, active, total);
    const abs = Math.abs(rel);
    const dir = Math.sign(rel);
    const style = { zIndex: 50 - abs, "--shade": String(TSD_FAN_SHADE[Math.min(abs, 3)]) };
    if (staggering) style.transitionDelay = Math.max(abs - 1, 0) * TSD_STAGGER + "s";
    if (abs > 3) {
      style.visibility = "hidden";
      style.pointerEvents = "none";
      style.transform = "translateX(" + (dir > 0 ? 260 : -260) + "px) scale(0.6)";
    } else if (!revealed && rel !== 0) {
      // collapsed: tuck every other card behind the front one
      style.pointerEvents = "none";
      style.transform = "translateX(0) translateY(0) rotate(0deg) scale(0.9)";
    } else if (rel === 0 && dragging) {
      style.transform = "translateX(" + dragDx + "px) rotate(" + dragDx / 18 + "deg) scale(1)";
    } else {
      style.transform =
        "translateX(" + dir * TSD_FAN_X[abs] * scale + "px) translateY(" + TSD_FAN_Y[abs] * scale +
        "px) rotate(" + dir * TSD_FAN_ROTATE[abs] + "deg) scale(" + TSD_FAN_SCALE[abs] + ")";
    }
    return style;
  };

  return (
    <section ref={sectionRef} id="stack" className="tsd-sec" aria-labelledby="stack-heading">
      <div className="tsd-top">
        <motion.h2
          id="stack-heading"
          className="tsd-title"
          initial={{ opacity: 0, y: 26 }}
          animate={sectionInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: E }}
        >
          What I build with<span className="ink">.</span>
        </motion.h2>
      </div>

      <div className="tsd-deck">
        <div
          ref={stageRef}
          className={"tsd-stage" + (revealed ? "" : " collapsed")}
          role="group"
          aria-roledescription="carousel"
          aria-label="Tech stack categories"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {TECH_CATEGORIES.map((cat, i) => {
            const isFront = tsdRelative(i, active, total) === 0;
            return (
              <div
                key={cat.label}
                className={"tsd-card " + (isFront ? "front" : "side") + (isFront && dragging ? " dragging" : "")}
                style={cardStyle(i)}
                role="group"
                aria-roledescription="slide"
                aria-label={i + 1 + " of " + total + ": " + cat.label}
                aria-current={isFront ? "true" : undefined}
                onPointerDown={(e) => handlePointerDown(e, i)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              >
                <div className="tsd-card-rule" />
                <div className="tsd-card-title">{cat.label}</div>
                {/* 4 tools sit as a tidy 2x2 instead of 3 + 1 */}
                <div className={"tsd-icons" + (cat.tools.length === 4 ? " two-col" : "")}>
                  {cat.tools.slice(0, 6).map((tool) => (
                    <div className="tsd-tool" key={tool.name}>
                      <div className="tsd-tool-icon">
                        <img src={"/logos/" + tool.file + ".svg"} alt="" width="34" height="34" loading="lazy" decoding="async" draggable={false} />
                      </div>
                      <div className="tsd-tool-name">{tool.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
/* techstack-deck:end */

/* ── Manifesto (transparent background) ──────────── */
function Manifesto({ globalProgress, manifestoRef, isMobile }) {
  const inView = useInView(manifestoRef, { once: true, margin: "-5%" });
  const textColor = LIGHT.text;
  const accentColor = LIGHT.accent;
  const mutedColor = LIGHT.muted;

  const lines = [
    "One developer,",
    "from first sketch",
    "to deployed product.",
    "Fewer handoffs.",
    "Fewer surprises.",
  ];

  return (
    <motion.section
      ref={manifestoRef}
      id="manifesto"
      className="relative py-28 md:py-44 px-6 md:px-20 overflow-hidden theme-section"
    >
      <motion.span
        className="text-xs font-bold tracking-[0.18em] uppercase mb-16 relative z-10 block"
        style={{ color: mutedColor }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
      >
        Manifesto
      </motion.span>

      <div className="relative z-10 max-w-5xl">
        {lines.map((line, i) => (
          <div key={i} className="overflow-hidden">
            <motion.p
              className="font-display font-extrabold leading-[1.05]"
              style={{
                fontSize: "clamp(1.8rem, 6vw, 4rem)",
                color: i % 2 === 0 ? textColor : accentColor,
                letterSpacing: "-0.045em",
              }}
              initial={{ y: "120%", opacity: 0 }}
              animate={inView ? { y: "0%", opacity: 1 } : {}}
              transition={{ duration: 1, delay: i * 0.06, ease: E }}
            >
              {line}
            </motion.p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* ── Story / About (transparent) ───────────────────── */
function Story() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const textColor = LIGHT.text;
  const mutedColor = LIGHT.muted;
  const accentColor = LIGHT.accent;

  return (
    <motion.section ref={ref} id="about" className="py-28 md:py-44 px-6 md:px-20 theme-section">
      <motion.span className="text-xs font-bold tracking-[0.18em] uppercase block mb-10" style={{ color: mutedColor }} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}>
        About
      </motion.span>
      <div className="max-w-4xl">
        <motion.p
          className="text-[clamp(1.5rem,4vw,2.8rem)] font-display font-semibold leading-[1.3] tracking-[-0.035em]"
          style={{ color: textColor }}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.9, ease: E }}
        >
          I build websites, web apps and connected devices for people who need the whole thing working, not just the front page.
        </motion.p>
        <motion.p
          className="mt-8 text-lg leading-relaxed max-w-2xl"
          style={{ color: mutedColor }}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          Landing pages that load fast, full-stack products with a real back end, and IoT dashboards that read from actual hardware.
        </motion.p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
        {[
          { n: "14", label: "Projects" },
          { n: "8", label: "Clients" },
          { n: "100%", label: "Custom" },
          { n: "3+", label: "Countries" },
        ].map((s) => (
          <motion.div
            key={s.label}
            className="text-center p-4 rounded-xl"
            style={{
              border: "1px solid",
              borderColor: LIGHT.border,
              backgroundColor: LIGHT.bg,
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <motion.p className="text-3xl md:text-4xl font-display font-bold" style={{ color: accentColor }}>{s.n}</motion.p>
            <motion.p className="text-xs tracking-wider uppercase mt-2" style={{ color: mutedColor }}>{s.label}</motion.p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ── Testimonials (transparent background) ────────── */
function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [active, setActive] = useState(0);
  const t = TESTIMONIALS[active];
  const dotIdle = "rgba(0,0,0,0.14)";
  const textColor = LIGHT.text;
  const mutedColor = LIGHT.muted;
  const accentColor = LIGHT.accent;

  const { scrollYProgress: tScroll } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const quoteY = useTransform(tScroll, [0, 1], [40, -40]);

  return (
    <motion.section ref={ref} className="py-28 md:py-44 px-6 md:px-20 theme-section">
      <motion.span className="text-xs font-bold tracking-[0.18em] uppercase block mb-16" style={{ color: mutedColor }} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}>
        Testimonials
      </motion.span>
      <div className="max-w-3xl relative">
        <motion.span className="absolute top-0 left-0 text-[10rem] font-display opacity-10 select-none" style={{ y: quoteY, color: accentColor }}>
          &quot;
        </motion.span>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: E }}
          >
            <motion.p className="text-[clamp(1.3rem,4vw,2.2rem)] font-display font-medium leading-[1.5] tracking-[-0.03em] relative z-10" style={{ color: textColor }}>
              &quot;{t.quote}&quot;
            </motion.p>
            <div className="mt-8 flex items-center gap-4">
              <motion.div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: accentColor, color: "var(--bg-primary)" }}>
                {t.name.split(" ").map((n) => n[0]).join("")}
              </motion.div>
              <div>
                <motion.p className="font-semibold" style={{ color: textColor }}>{t.name}</motion.p>
                <motion.p className="text-xs tracking-wider" style={{ color: mutedColor }}>{t.role}</motion.p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-4 mt-12">
          {TESTIMONIALS.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setActive(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === active ? 32 : 12,
                background: i === active ? accentColor : dotIdle,
                border: "none",
                cursor: "pointer",
              }}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ── Contact (transparent background) ────────────── */
function Contact({ isMobile }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const textColor = LIGHT.text;
  const accentColor = LIGHT.accent;
  const mutedColor = LIGHT.muted;

  return (
    <ContactMorphSection />
  );
}

/* ── Page root ───────────────────────────────────── */
/* services:start */
/* ── Services (accordion on red: premium, clean, mobile-first) ─────────────── */
const SERVICES = [
  {
    title: "Website Development",
    text: "Modern, responsive websites designed to showcase your brand, engage visitors, and deliver a seamless experience across all devices.",
  },
  {
    title: "Mobile & Web Apps",
    text: "Custom mobile and web applications built to solve problems, simplify tasks, and provide accessible, user-friendly digital experiences.",
  },
  {
    title: "Business Systems",
    text: "Smart digital solutions that streamline business operations, manage data, automate workflows, and improve overall efficiency.",
  },
  {
    title: "AI Automation & Integration",
    text: "AI-powered solutions that automate repetitive tasks, enhance decision-making, and integrate intelligent features into existing systems.",
  },
  {
    title: "IoT Solutions",
    text: "Connected devices and smart systems that use sensors, microcontrollers, and real-time data to monitor, control, and automate processes.",
  },
  {
    title: "Custom Full-Stack Development",
    text: "End-to-end development of tailored digital solutions, combining intuitive frontends, powerful backends, databases, and APIs into one integrated system.",
  },
];

function Services() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section id="services" className="svc-section" aria-labelledby="services-heading">
      <div className="svc-wrap">
        <h2 id="services-heading" className="svc-heading">SERVICES</h2>
        <ul className="svc-list">
          {SERVICES.map((s, i) => {
            const isOpen = openIndex === i;
            return (
              <li key={s.title} className={isOpen ? "svc-row is-open" : "svc-row"}>
                <h3 className="svc-head">
                  <button
                    type="button"
                    id={"svc-btn-" + i}
                    className="svc-trigger"
                    aria-expanded={isOpen}
                    aria-controls={"svc-panel-" + i}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    <span className="svc-title">{s.title}</span>
                    <span className="svc-icon" aria-hidden="true" />
                  </button>
                </h3>
                <div
                  id={"svc-panel-" + i}
                  role="region"
                  aria-labelledby={"svc-btn-" + i}
                  className="svc-panel"
                >
                  <div className="svc-panel-inner">
                    <p className="svc-text">{s.text}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
/* services:end */

export default function Page() {
  const manifestoRef = useRef(null);
  const containerRef = useRef(null);
  const isMobile = useIsMobile();

  // perf-patch: no section reads globalProgress, and the useScroll + useSpring pair that fed it
  // ran a spring on every scroll tick. Kept as a prop so the section signatures stay the same.
  const globalProgress = null;

  return (
    <>
      <Cursor />
      <GlassNavbar />
      <main ref={containerRef} style={{ position: "relative", zIndex: 10 }}>
        <Hero globalProgress={globalProgress} isMobile={isMobile} />
        <IntroProfile isMobile={isMobile} />
        <Projects globalProgress={globalProgress} isMobile={isMobile} />
        <Services />
        <TechStack />
        <Manifesto globalProgress={globalProgress} manifestoRef={manifestoRef} isMobile={isMobile} />
        <Story />
        <Testimonials />
        <Contact isMobile={isMobile} />
      </main>
    </>
  );
}
