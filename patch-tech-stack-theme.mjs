// patch-tech-stack-theme.mjs
// byCarlo: makes the Tech Stack section fully light / dark responsive.
//
// WHAT WAS WRONG (found by reproducing it in a real browser)
//
//   1. STALE COLORS. TechStack read theme colors with `motionValue.get()` while
//      rendering (tab text, "01 / 06", tile borders, tile labels). `.get()` is a
//      one-time snapshot. When you flip the theme, React re-renders immediately,
//      but the 0.45s theme animation has only just started, so `.get()` returns
//      the OLD theme's color and nothing ever updates it. Result: every toggle
//      leaves the text one theme behind (dark text on the dark track, etc).
//
//   2. THE TAB "THUMB" HAD ZERO WIDTH. The highlight span was
//      `absolute top-1 bottom-1` with no left / right, so it shrink-wrapped an
//      empty span (measured width: 0px) and never rendered. The active label
//      is drawn in the "on thumb" color, so with no thumb it was light-on-light
//      (light mode) or dark-on-dark (dark mode) = invisible.
//
//   3. LABEL COLOR WAS DISCRETE, THE THUMB IS CONTINUOUS. The active label
//      color only switched when `active` committed, so while you drag the thumb
//      (or while it springs across) the label under it had the wrong color.
//
//   4. ICON COLORS WERE HARD-CODED BRAND COLORS. Next.js, Express, JWT, Vercel
//      (#000) and GitHub (#181717) vanish on the dark background; 11 of 22 icons
//      are below WCAG's 3:1 non-text contrast on dark, and React / Tailwind /
//      Postman / Cloudflare are too faint on white.
//
//   5. MOBILE. The six tabs wrapped onto two rows on phones, but the thumb is a
//      single full-height bar, so the highlight could not line up with the
//      wrapped labels.
//
// WHAT THIS PATCH DOES
//
//   - Every themed color in TechStack is now a motion value on a motion.*
//     element, so it follows the theme frame-by-frame with no re-render needed.
//   - The thumb is rebuilt the way the original RubberSegment does it: ONE
//     clipped overlay that carries its own background AND its own copy of the
//     labels in the "active" color. The label under the thumb is always readable,
//     whether it is resting, springing, or being dragged.
//   - New <TechIcon> + TECH_COLORS: each brand has a light-mode and a dark-mode
//     color (all >= 3:1 on their background) that cross-fade with the theme.
//     Black / near-black logos become near-white in dark mode.
//   - The tab bar is a single row. If it is wider than the screen it scrolls
//     horizontally (scrollbar hidden) and keeps the active tab in view; touch
//     panning is enabled only when it actually overflows.
//
// Only app/page.js is changed.
//
// Requires the earlier tech-stack patches to be applied (they already are in the repo).
//
// Run from the project root:   node patch-tech-stack-theme.mjs
// Then:                        npm run dev
//                               git add . && git commit -m "Tech stack: theme-reactive icons + tabs" && git push
// A backup of the changed file goes into .patch-backups/

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app", "page.js");

if (!fs.existsSync(pagePath)) {
  console.error("Cannot find " + pagePath + "\nRun this script from the bycarlo-portfolio root folder.");
  process.exit(1);
}

const read = (p) => {
  const raw = fs.readFileSync(p, "utf8");
  return { text: raw.replace(/\r\n/g, "\n"), crlf: raw.includes("\r\n") };
};
const save = (p, f) => fs.writeFileSync(p, f.crlf ? f.text.replace(/\n/g, "\r\n") : f.text, "utf8");
const fail = (msg) => { console.error("Patch aborted, nothing was written.\n" + msg); process.exit(1); };

const page = read(pagePath);

if (!page.text.includes("function TechStack(")) {
  fail("Could not find function TechStack( in app/page.js.\nRun the earlier tech-stack patches first.");
}
if (!page.text.includes("RUBBER_SPRING_UI")) {
  fail("Could not find the rubber-physics tab code. Run patch-tech-stack-rubber.mjs first.");
}
if (page.text.includes("const TECH_COLORS")) {
  console.log("Tech stack theme patch is already applied. Nothing to do.");
  process.exit(0);
}

/* helpers ---------------------------------------------------------------- */
const count = (t, s) => t.split(s).length - 1;
const replaceOnce = (t, find, rep, label) => {
  const n = count(t, find);
  if (n !== 1) fail("Expected exactly 1 match for " + label + ", found " + n + ". Did page.js change since this patch was written?");
  return t.split(find).join(rep);
};
// Replace everything from `startMarker` up to and including `endMarker`.
const replaceRegion = (t, startMarker, endMarker, rep, label) => {
  const ns = count(t, startMarker);
  if (ns !== 1) fail("Expected exactly 1 start marker for " + label + ", found " + ns + ". Did page.js change since this patch was written?");
  const s = t.indexOf(startMarker);
  const e = t.indexOf(endMarker, s);
  if (e === -1) fail("Could not find the end marker for " + label + ".");
  return t.slice(0, s) + rep + t.slice(e + endMarker.length);
};

let text = page.text;

/* ======================================================================= */
/* 1. Per-theme icon colors + <TechIcon>                                   */
/* ======================================================================= */

const ICON_BLOCK = String.raw`/* ── Tech icon colors per theme ───────────────────────
   light = color on the white page, dark = color on the #3B3B3B page.
   Every pair is >= 3:1 contrast on its background (WCAG 1.4.11).
   Black / near-black logos flip to near-white in dark mode.
   A tool that is not listed here falls back to its \`color\` above.        */
const TECH_COLORS = {
  "React":         { light: "#087EA4", dark: "#61DAFB" },
  "Next.js":       { light: "#000000", dark: "#F4F4F4" },
  "TypeScript":    { light: "#3178C6", dark: "#5AA0F0" },
  "Tailwind":      { light: "#0891B2", dark: "#22C9E8" },
  "Node.js":       { light: "#4B8A3C", dark: "#6FBF5C" },
  "Express":       { light: "#000000", dark: "#F4F4F4" },
  "GraphQL":       { light: "#E10098", dark: "#FF4FBE" },
  "Python":        { light: "#3776AB", dark: "#69AEEA" },
  "Postman":       { light: "#E8501A", dark: "#FF7A4A" },
  "PostgreSQL":    { light: "#4169E1", dark: "#7F9CFF" },
  "MongoDB":       { light: "#3E8E41", dark: "#5FC463" },
  "Cloudflare D1": { light: "#D9690C", dark: "#F38020" },
  "JWT":           { light: "#000000", dark: "#F4F4F4" },
  "OAuth":         { light: "#EB5424", dark: "#FF7A4D" },
  "Cloudflare":    { light: "#D9690C", dark: "#F38020" },
  "Vercel":        { light: "#000000", dark: "#F4F4F4" },
  "Docker":        { light: "#1D7FD1", dark: "#3CA5F5" },
  "Git":           { light: "#E04426", dark: "#FF6A4D" },
  "GitHub":        { light: "#181717", dark: "#F4F4F4" },
  "VS Code":       { light: "#007ACC", dark: "#35A8F5" },
  "ESLint":        { light: "#4B32C3", dark: "#9188FF" },
  "Jest":          { light: "#C21325", dark: "#F2596B" },
  "npm":           { light: "#CB3837", dark: "#F2625F" },
};

/* Icon whose color cross-fades with the theme (same motion value as the page). */
function TechIcon({ tool, themeProgress }) {
  const pal = TECH_COLORS[tool.name] || {};
  const color = useTransform(themeProgress, [0, 1], [pal.dark || tool.color, pal.light || tool.color]);
  return (
    <motion.span className="inline-flex" style={{ color }} aria-hidden="true">
      <tool.Icon size={22} />
    </motion.span>
  );
}

`.replace(/\\`/g, "`");

text = replaceOnce(
  text,
  "/* ── Tech Stack (theme-aware, RubberSegment-style tabs) ─ */",
  ICON_BLOCK + "/* ── Tech Stack (theme-aware, RubberSegment-style tabs) ─ */",
  "Tech Stack section comment"
);

/* idle tab text in LIGHT mode was 4.27:1 on the track (WCAG wants 4.5:1) */
text = replaceOnce(
  text,
  '[\"rgba(250,250,250,0.7)\", \"rgba(24,24,27,0.6)\"]',
  '[\"rgba(250,250,250,0.7)\", \"rgba(24,24,27,0.72)\"]',
  "idleInk definition"
);

/* ======================================================================= */
/* 2. TechStack state / effects for the scrollable tab bar                 */
/* ======================================================================= */

text = replaceOnce(
  text,
  "  const trackRef = useRef(null);\n  const itemRefs = useRef([]);",
  "  const scrollRef = useRef(null);\n  const trackRef = useRef(null);\n  const itemRefs = useRef([]);\n  const [scrollable, setScrollable] = useState(false);",
  "trackRef / itemRefs declarations"
);

text = replaceOnce(
  text,
  "    innerW.set(rect.width - 8);\n    jumpTo(committed.current);\n  }, [innerW, jumpTo]);",
  [
    "    innerW.set(rect.width - 8);",
    "    const outer = scrollRef.current;",
    "    if (outer) setScrollable(outer.scrollWidth > outer.clientWidth + 1);",
    "    jumpTo(committed.current);",
    "  }, [innerW, jumpTo]);",
  ].join("\n"),
  "measure() tail"
);

text = replaceOnce(
  text,
  "    if (trackRef.current) observer.observe(trackRef.current);",
  "    if (trackRef.current) observer.observe(trackRef.current);\n    if (scrollRef.current) observer.observe(scrollRef.current);",
  "ResizeObserver observe line"
);

text = replaceOnce(
  text,
  "  const commit = useCallback((i) => {",
  [
    "  // keep the active tab in view when the bar scrolls (narrow phones)",
    "  useEffect(() => {",
    "    const outer = scrollRef.current;",
    "    const el = itemRefs.current[active];",
    "    if (!outer || !el || outer.scrollWidth <= outer.clientWidth) return;",
    "    const reduce = window.matchMedia(\"(prefers-reduced-motion: reduce)\").matches;",
    "    outer.scrollTo({ left: Math.max(0, el.offsetLeft - (outer.clientWidth - el.offsetWidth) / 2), behavior: reduce ? \"auto\" : \"smooth\" });",
    "  }, [active]);",
    "",
    "  const commit = useCallback((i) => {",
  ].join("\n"),
  "commit() declaration"
);

/* ======================================================================= */
/* 3. Tab bar: single row, clipped overlay carries thumb + active labels   */
/* ======================================================================= */

const TABS_NEW = `        <motion.div
          ref={scrollRef}
          className="relative mx-auto mb-8 w-fit max-w-full overflow-x-auto rounded-2xl nav-links-scroll"
          style={{ background: trackBg }}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, ease: E }}
        >
          <div
            ref={trackRef}
            role="radiogroup"
            aria-label="Tech stack category"
            className={"relative flex w-max gap-1 p-1 select-none " + (scrollable ? "touch-auto" : "touch-pan-y")}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handlePointerCancel}
          >
            {/* base layer: idle labels (color follows the theme) */}
            {TECH_CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.label}
                ref={(el) => { itemRefs.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={i === active}
                tabIndex={i === active ? 0 : -1}
                onPointerDown={(e) => handlePointerDown(e, i)}
                onKeyDown={handleKeyDown}
                className="relative z-10 shrink-0 px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap cursor-pointer transition-none"
                style={{ color: idleInk }}
              >
                {cat.label}
              </motion.button>
            ))}

            {/* top layer: the thumb. Its own background + its own copy of the labels
                in the active color, clipped to the thumb shape, so whatever label sits
                under the thumb is always readable (resting, springing or dragging). */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-1 z-20 flex gap-1"
              style={{ background: thumbBg, color: activeInk, clipPath }}
            >
              {TECH_CATEGORIES.map((cat) => (
                <span
                  key={cat.label}
                  className="flex shrink-0 items-center justify-center px-4 py-2 text-[12px] md:text-[13px] font-medium whitespace-nowrap"
                >
                  {cat.label}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>`;

text = replaceRegion(
  text,
  '        <motion.div\n          ref={trackRef}\n          role="radiogroup"',
  '          ))}\n        </motion.div>\n\n        <motion.h3',
  TABS_NEW + "\n\n        <motion.h3",
  "tab bar JSX"
);

/* ======================================================================= */
/* 4. Replace the four stale .get() reads with live motion values          */
/* ======================================================================= */

text = replaceOnce(
  text,
  `        <p className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: mutedColor.get() }}>
          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>`,
  `        <motion.p className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: mutedColor }}>
          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </motion.p>`,
  "01 / 06 counter"
);

text = replaceOnce(
  text,
  `            <div key={tool.name} className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 flex items-center justify-center rounded-2xl border"
                style={{ borderColor: borderColor.get() }}
              >
                <tool.Icon size={22} color={tool.color} style={{ opacity: 0.9 }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: mutedColor.get() }}>{tool.name}</span>
            </div>`,
  `            <div key={tool.name} className="flex flex-col items-center gap-2">
              <motion.div
                className="w-12 h-12 flex items-center justify-center rounded-2xl border"
                style={{ borderColor }}
              >
                <TechIcon tool={tool} themeProgress={themeProgress} />
              </motion.div>
              <motion.span className="text-[11px] font-medium" style={{ color: mutedColor }}>{tool.name}</motion.span>
            </div>`,
  "tool tile"
);

/* safety net: no theme-color .get() reads may remain in TechStack */
if (/(idleInk|activeInk|mutedColor|borderColor|textColor|accentColor)\.get\(\)/.test(text)) {
  fail("A stale theme .get() read is still present after patching. Please send me page.js.");
}

/* ======================================================================= */
/* 5. Write out                                                            */
/* ======================================================================= */

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(pagePath, path.join(backupDir, "page.js." + Date.now() + ".bak"));

save(pagePath, { text, crlf: page.crlf });

console.log("Done. Tech Stack is now light / dark responsive:");
console.log("  - tab text + highlight stay readable in both themes (and while dragging)");
console.log("  - every icon has a light-mode and a dark-mode color (cross-fades on toggle)");
console.log("  - tab bar is one row and scrolls on narrow phones");
console.log("(backup saved in .patch-backups/)");
console.log("");
console.log("Next steps:");
console.log("  1. npm run dev");
console.log('  2. git add . && git commit -m "Tech stack: theme-reactive icons + tabs" && git push');
