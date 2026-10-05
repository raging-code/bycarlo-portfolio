// patch-tech-stack-rubber.mjs
// byCarlo: upgrades the Tech Stack tabs to real RubberSegment-style physics
// (drag, rubber-band overshoot, flick momentum, squash-on-land) using
// framer-motion (already installed) instead of the `motion` package.
// Also swaps the <img> logos for real icon components (react-icons/si),
// so no image files are needed for the logo grid.
//
// Requires patch-tech-stack.mjs to already be applied.
//
// Run from the project root:   node patch-tech-stack-rubber.mjs
// Then:                        npm install   ->   npm run dev
//                               git add . && git commit -m "Rubber tech stack tabs" && git push
// A backup of the changed file goes into .patch-backups/

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app", "page.js");
const pkgPath = path.join(root, "package.json");

for (const p of [pagePath, pkgPath]) {
  if (!fs.existsSync(p)) {
    console.error("Cannot find " + p + "\nRun this script from the bycarlo-portfolio root folder.");
    process.exit(1);
  }
}

const read = (p) => {
  const raw = fs.readFileSync(p, "utf8");
  return { text: raw.replace(/\r\n/g, "\n"), crlf: raw.includes("\r\n") };
};
const save = (p, f) => fs.writeFileSync(p, f.crlf ? f.text.replace(/\n/g, "\r\n") : f.text, "utf8");
const fail = (msg) => { console.error("Patch aborted, nothing was written.\n" + msg); process.exit(1); };

const page = read(pagePath);

if (!page.text.includes("function TechStack(")) {
  fail("Could not find function TechStack( in app/page.js.\nRun patch-tech-stack.mjs first.");
}
if (page.text.includes("RUBBER_SPRING_UI")) {
  console.log("Rubber tech stack tabs are already applied. Nothing to do.");
  process.exit(0);
}

/* helpers ---------------------------------------------------------------- */
const count = (t, s) => t.split(s).length - 1;
const replaceOnce = (t, find, rep, label) => {
  const n = count(t, find);
  if (n !== 1) fail("Expected exactly 1 match for " + label + ", found " + n + ". Did page.js change since this patch was written?");
  return t.split(find).join(rep);
};
const sliceBetween = (t, startMarker, endMarker, label) => {
  const a = t.indexOf(startMarker);
  if (a < 0) fail("Could not find start marker: " + label);
  const b = t.indexOf(endMarker, a + startMarker.length);
  if (b < 0) fail("Could not find end marker: " + label);
  return { before: t.slice(0, a), match: t.slice(a, b + endMarker.length), after: t.slice(b + endMarker.length) };
};

/* ======================================================================= */
/* 1. Add react-icons dependency                                           */
/* ======================================================================= */

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
let pkgChanged = false;
if (!pkg.dependencies) pkg.dependencies = {};
if (!pkg.dependencies["react-icons"]) {
  pkg.dependencies["react-icons"] = "^5.3.0";
  pkgChanged = true;
}

/* ======================================================================= */
/* 2. Icon imports (Simple Icons brand marks, tree-shaken)                 */
/* ======================================================================= */

const ICON_IMPORT_BLOCK = `import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiNodedotjs,
  SiExpress,
  SiGraphql,
  SiPython,
  SiPostman,
  SiPostgresql,
  SiMongodb,
  SiCloudflare,
  SiJsonwebtokens,
  SiAuth0,
  SiVercel,
  SiDocker,
  SiGit,
  SiGithub,
  SiVisualstudiocode,
  SiEslint,
  SiJest,
  SiNpm,
} from "react-icons/si";
`;

/* ======================================================================= */
/* 3. Replace TECH_CATEGORIES data: icon paths -> icon components          */
/* ======================================================================= */

const NEW_TECH_DATA_BLOCK = `/* ── Tech stack data (edit icons/labels here) ─────── */
const TECH_CATEGORIES = [
  {
    label: "Frontend",
    tools: [
      { name: "React", Icon: SiReact, color: "#61DAFB" },
      { name: "Next.js", Icon: SiNextdotjs, color: "#000000" },
      { name: "TypeScript", Icon: SiTypescript, color: "#3178C6" },
      { name: "Tailwind", Icon: SiTailwindcss, color: "#06B6D4" },
    ],
  },
  {
    label: "Backend",
    tools: [
      { name: "Node.js", Icon: SiNodedotjs, color: "#5FA04E" },
      { name: "Express", Icon: SiExpress, color: "#000000" },
      { name: "GraphQL", Icon: SiGraphql, color: "#E10098" },
      { name: "Python", Icon: SiPython, color: "#3776AB" },
      { name: "Postman", Icon: SiPostman, color: "#FF6C37" },
    ],
  },
  {
    label: "Database",
    tools: [
      { name: "PostgreSQL", Icon: SiPostgresql, color: "#4169E1" },
      { name: "MongoDB", Icon: SiMongodb, color: "#47A248" },
      { name: "Cloudflare D1", Icon: SiCloudflare, color: "#F38020" },
    ],
  },
  {
    label: "Security",
    tools: [
      { name: "JWT", Icon: SiJsonwebtokens, color: "#000000" },
      { name: "OAuth", Icon: SiAuth0, color: "#EB5424" },
    ],
  },
  {
    label: "Deploy",
    tools: [
      { name: "Cloudflare", Icon: SiCloudflare, color: "#F38020" },
      { name: "Vercel", Icon: SiVercel, color: "#000000" },
      { name: "Docker", Icon: SiDocker, color: "#2496ED" },
    ],
  },
  {
    label: "Dev tools",
    tools: [
      { name: "Git", Icon: SiGit, color: "#F05032" },
      { name: "GitHub", Icon: SiGithub, color: "#181717" },
      { name: "VS Code", Icon: SiVisualstudiocode, color: "#007ACC" },
      { name: "ESLint", Icon: SiEslint, color: "#4B32C3" },
      { name: "Jest", Icon: SiJest, color: "#C21325" },
      { name: "npm", Icon: SiNpm, color: "#CB3837" },
    ],
  },
];`;

/* ======================================================================= */
/* 4. The RubberSegment-physics tab bar + icon grid (replaces TechStack)   */
/* ======================================================================= */

const NEW_TECH_STACK_COMPONENT = `/* ── Tech Stack (theme-aware, RubberSegment-style tabs) ─ */
const RUBBER_EASE_OUT = [0.23, 1, 0.32, 1];
const RUBBER_SPRING_UI = { type: "spring", duration: 0.3, bounce: 0 };
const RUBBER_SPRING_MOMENTUM = { type: "spring", duration: 0.4, bounce: 0.2 };
const RUBBER_SPRING_RELAX = { type: "spring", duration: 0.16, bounce: 0 };
const RUBBER_DILATE = 0.19;
const RUBBER_HANDOFF = 0.15;
const RUBBER_FLICK = 110;
const RUBBER_MAX_VELOCITY = 2000;
const RUBBER_DEADZONE = 4;
const RUBBER_SLOP = 10;
const RUBBER_STRENGTH = 0.55;
const RUBBER_SQUASH = 3;

const rubberClamp = (v, min, max) => Math.min(max, Math.max(min, v));
const rubberOverscroll = (over, dim) => (over * dim * RUBBER_STRENGTH) / (dim + RUBBER_STRENGTH * Math.abs(over));
const rubberProject = (v, glide) => {
  const d = 1 - 0.1 * Math.pow(0.05, glide / 100);
  return ((v / 1000) * d) / (1 - d);
};
const rubberVelocityOf = (hist, now) => {
  const recent = hist.filter(([t]) => now - t <= 100);
  if (recent.length < 2) return 0;
  const [t0, x0] = recent[0];
  const [t1, x1] = recent[recent.length - 1];
  return t1 - t0 >= 8 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0;
};
const rubberNearestSlot = (slots, x) => {
  let best = 0;
  for (let i = 1; i < slots.length; i++) {
    if (Math.abs((slots[i].l + slots[i].r) / 2 - x) < Math.abs((slots[best].l + slots[best].r) / 2 - x)) best = i;
  }
  return best;
};

function TechStack({ themeProgress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [active, setActive] = useState(0);

  const trackRef = useRef(null);
  const itemRefs = useRef([]);
  const slots = useRef([]);
  const box = useRef(null);
  const committed = useRef(0);
  const handoff = useRef(0);
  const drag = useRef(null);
  const gen = useRef(0);
  const glide = 75;

  const edgeL = useMotionValue(0);
  const edgeR = useMotionValue(0);
  const innerW = useMotionValue(0);

  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);
  const borderColor = useTransform(themeProgress, [0, 1], [DARK.border, LIGHT.border]);
  const trackBg = useTransform(themeProgress, [0, 1], ["rgba(255,255,255,0.06)", "rgba(0,0,0,0.04)"]);
  const thumbBg = useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]);
  const clipPath = useTransform(
    () => \`inset(0 \${Math.max(0, innerW.get() - edgeR.get())}px 0 \${Math.max(0, edgeL.get())}px round 10px)\`
  );

  const jumpTo = useCallback((i) => {
    const s = slots.current[i];
    if (!s) return;
    clearTimeout(handoff.current);
    gen.current += 1;
    edgeL.jump(s.l);
    edgeR.jump(s.r);
  }, [edgeL, edgeR]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    box.current = rect;
    slots.current = TECH_CATEGORIES.map((_, i) => {
      const el = itemRefs.current[i];
      if (!el) return { l: 0, r: 0 };
      const r = el.getBoundingClientRect();
      return { l: r.left - rect.left - 4, r: r.right - rect.left - 4 };
    });
    innerW.set(rect.width - 8);
    jumpTo(committed.current);
  }, [innerW, jumpTo]);

  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  useEffect(() => () => { clearTimeout(handoff.current); edgeL.stop(); edgeR.stop(); }, [edgeL, edgeR]);

  const commit = useCallback((i) => {
    committed.current = i;
    setActive(i);
  }, []);

  const land = useCallback((to, v, flick, withSquash) => {
    const b = slots.current[to];
    if (!b) return;
    const g = ++gen.current;
    const dir = Math.sign((b.l + b.r) / 2 - (edgeL.get() + edgeR.get()) / 2) || 1;
    const [lead, leadTo, trail, trailTo] = dir > 0 ? [edgeR, b.r, edgeL, b.l] : [edgeL, b.l, edgeR, b.r];
    const velocityFor = (mv) => rubberClamp(v === null ? mv.getVelocity() : v, -RUBBER_MAX_VELOCITY, RUBBER_MAX_VELOCITY);
    animate(lead, leadTo, { ...(flick ? RUBBER_SPRING_MOMENTUM : RUBBER_SPRING_UI), velocity: velocityFor(lead) });
    const trailVelocity = velocityFor(trail);
    if (!withSquash || RUBBER_SQUASH <= 0) {
      animate(trail, trailTo, { ...RUBBER_SPRING_UI, velocity: trailVelocity });
      return;
    }
    animate(trail, trailTo + dir * RUBBER_SQUASH, { ...RUBBER_SPRING_UI, velocity: trailVelocity }).then(() => {
      if (gen.current === g) animate(trail, trailTo, RUBBER_SPRING_RELAX);
    });
  }, [edgeL, edgeR]);

  const travel = useCallback((from, to) => {
    const a = slots.current[from];
    const b = slots.current[to];
    if (!a || !b) return;
    clearTimeout(handoff.current);
    gen.current += 1;
    const tween = { duration: RUBBER_DILATE, ease: RUBBER_EASE_OUT };
    animate(edgeL, b.l + (Math.min(a.l, b.l) - b.l), tween);
    animate(edgeR, b.r + (Math.max(a.r, b.r) - b.r), tween);
    handoff.current = setTimeout(() => land(to, null, false, true), RUBBER_HANDOFF * 1000);
  }, [edgeL, edgeR, land]);

  const localX = (e) => e.clientX - (box.current ? box.current.left : 0) - 4;

  const handlePointerDown = (e, i) => {
    if (drag.current || e.button !== 0) return;
    box.current = trackRef.current.getBoundingClientRect();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    const x = localX(e);
    const onThumb = x >= edgeL.get() && x <= edgeR.get();
    drag.current = { id: e.pointerId, x0: x, slot: i, onThumb, live: false, offset: 0, w: 0, hist: [[e.timeStamp, x]] };
    if (onThumb) {
      clearTimeout(handoff.current);
      gen.current += 1;
      edgeL.stop();
      edgeR.stop();
    }
  };

  const handlePointerMove = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id || !d.onThumb) return;
    const x = localX(e);
    d.hist.push([e.timeStamp, x]);
    if (d.hist.length > 8) d.hist.shift();
    if (!d.live) {
      if (Math.abs(x - d.x0) < RUBBER_DEADZONE) return;
      d.live = true;
      d.offset = x - edgeL.get();
      d.w = edgeR.get() - edgeL.get();
    }
    const width = innerW.get();
    const l = x - d.offset;
    const maxL = width - d.w;
    if (l < 0) {
      edgeL.set(0);
      edgeR.set(d.w - rubberOverscroll(-l, d.w));
    } else if (l > maxL) {
      edgeR.set(width);
      edgeL.set(maxL + rubberOverscroll(l - maxL, d.w));
    } else {
      edgeL.set(l);
      edgeR.set(l + d.w);
    }
  };

  const release = () => {
    const d = drag.current;
    drag.current = null;
    return d;
  };

  const handlePointerUp = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    release();
    const x = localX(e);
    if (!d.live) {
      if (Math.abs(x - d.x0) <= RUBBER_SLOP && d.slot !== committed.current) {
        const from = committed.current;
        commit(d.slot);
        travel(from, d.slot);
      }
      return;
    }
    const v = rubberVelocityOf(d.hist, e.timeStamp);
    const flick = Math.abs(v) > RUBBER_FLICK;
    let to = rubberNearestSlot(slots.current, (edgeL.get() + edgeR.get()) / 2 + rubberProject(v, glide));
    if (flick && to === committed.current) to = rubberClamp(to + Math.sign(v), 0, TECH_CATEGORIES.length - 1);
    commit(to);
    land(to, v, flick, flick);
  };

  const handlePointerCancel = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    release();
    if (!d.live) return;
    land(committed.current, null, false, false);
  };

  const handleKeyDown = (e) => {
    const last = TECH_CATEGORIES.length - 1;
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(last, active + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(0, active - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null || next === active) return;
    e.preventDefault();
    commit(next);
    jumpTo(next);
    itemRefs.current[next]?.focus();
  };

  const total = TECH_CATEGORIES.length;
  const current = TECH_CATEGORIES[active];
  const progress = total > 1 ? (active / (total - 1)) * 100 : 100;

  return (
    <motion.section ref={ref} id="stack" className="relative py-28 md:py-44 px-6 md:px-14 theme-section">
      <div className="max-w-xl mx-auto text-center">
        <motion.span
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.4em] uppercase mb-4"
          style={{ color: mutedColor }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          <span className="w-1 h-1 rounded-full" style={{ background: "currentColor" }} />
          Tech stack
        </motion.span>
        <motion.h2
          className="text-[clamp(1.8rem,5vw,3rem)] font-bold tracking-tight leading-[1.1] mb-10"
          style={{ color: textColor, fontFamily: "var(--font-display)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, ease: E }}
        >
          What I build with
        </motion.h2>

        <motion.div
          ref={trackRef}
          role="radiogroup"
          aria-label="Tech stack category"
          className="relative inline-flex flex-wrap justify-center gap-1 p-1 rounded-2xl mb-8 touch-pan-y select-none"
          style={{ background: trackBg }}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, ease: E }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handlePointerCancel}
        >
          <motion.span
            aria-hidden="true"
            className="absolute top-1 bottom-1 rounded-xl"
            style={{ background: thumbBg, clipPath }}
          />
          {TECH_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              ref={(el) => { itemRefs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={i === active}
              tabIndex={i === active ? 0 : -1}
              onPointerDown={(e) => handlePointerDown(e, i)}
              onKeyDown={handleKeyDown}
              className="relative z-10 px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap cursor-pointer"
              style={{ color: i === active ? textColor.get() : mutedColor.get() }}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        <motion.h3
          key={"title-" + active}
          className="text-sm font-semibold mb-1"
          style={{ color: textColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {current.label} &amp; tools
        </motion.h3>
        <p className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: mutedColor.get() }}>
          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <div className="w-7 h-[3px] mx-auto mb-10 rounded-full overflow-hidden" style={{ background: "rgba(128,128,128,0.25)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: accentColor }}
            animate={{ width: progress + "%" }}
            transition={{ duration: 0.3, ease: E }}
          />
        </div>

        <motion.div
          key={"grid-" + active}
          className="grid grid-cols-3 gap-x-4 gap-y-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: E }}
        >
          {current.tools.map((tool) => (
            <div key={tool.name} className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 flex items-center justify-center rounded-2xl border"
                style={{ borderColor: borderColor.get() }}
              >
                <tool.Icon size={22} color={tool.color} style={{ opacity: 0.9 }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: mutedColor.get() }}>{tool.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}`;

/* ======================================================================= */
/* 5. Apply                                                                 */
/* ======================================================================= */

let text = page.text;

// 5a. Insert icon imports right after the framer-motion import block.
const FRAMER_IMPORT_END = '} from "framer-motion";';
text = replaceOnce(text, FRAMER_IMPORT_END, FRAMER_IMPORT_END + "\n" + ICON_IMPORT_BLOCK, "framer-motion import block");

// 5b. Replace the TECH_CATEGORIES data block (icon paths -> icon components).
const OLD_DATA_START = "/* ── Tech stack data (edit logos/labels here) ─────── */";
const OLD_DATA_END = "];";
const dataSlice = sliceBetween(text, OLD_DATA_START, OLD_DATA_END, "TECH_CATEGORIES data block");
if (!dataSlice.match.includes("TECH_CATEGORIES")) fail("TECH_CATEGORIES data block did not match as expected.");
text = dataSlice.before + NEW_TECH_DATA_BLOCK + dataSlice.after;

// 5c. Replace the whole TechStack function (old click-only version -> rubber-physics version).
// The old function reliably ends right before the Manifesto section's comment marker,
// which patch-tech-stack.mjs always inserts immediately after it — use that as the
// end boundary instead of brace-counting (safer: no risk of stopping at a brace
// inside a string, JSX expression, or object literal).
const OLD_FN_START = "/* ── Tech Stack (theme-aware, transparent background) ─ */";
const MANIFESTO_MARKER = "/* ── Manifesto (transparent background) ──────────── */";
const fnStart = text.indexOf(OLD_FN_START);
if (fnStart < 0) fail("Could not find TechStack function start marker.");
const fnEnd = text.indexOf(MANIFESTO_MARKER, fnStart);
if (fnEnd < 0) fail("Could not find Manifesto marker after TechStack (expected immediately after it).");
const between = text.slice(fnStart, fnEnd);
if (count(between, "function TechStack(") !== 1) {
  fail("Expected exactly one 'function TechStack(' between its marker and the Manifesto marker, found " + count(between, "function TechStack(") + ".");
}
text = text.slice(0, fnStart) + NEW_TECH_STACK_COMPONENT + "\n\n" + text.slice(fnEnd);

/* ======================================================================= */
/* 6. Write out                                                            */
/* ======================================================================= */

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(pagePath, path.join(backupDir, "page.js." + Date.now() + ".bak"));
if (pkgChanged) fs.copyFileSync(pkgPath, path.join(backupDir, "package.json." + Date.now() + ".bak"));

save(pagePath, { text, crlf: page.crlf });
if (pkgChanged) fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("Tech stack tabs upgraded to RubberSegment-style physics, icons swapped to react-icons.");
console.log("(backup saved in .patch-backups/)");
console.log("");
console.log("Next steps:");
console.log("  1. npm install          (adds react-icons)");
console.log("  2. npm run dev          and try dragging/flicking the tabs");
console.log('  3. git add . && git commit -m "Rubber-physics tech stack tabs + icons" && git push');
