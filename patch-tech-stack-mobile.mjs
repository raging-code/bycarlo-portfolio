// patch-tech-stack-mobile.mjs
// byCarlo: makes the Tech Stack rubber tabs and icon grid mobile friendly.
//
// What was wrong on phones (found by reading app/page.js + app/globals.css):
//   - The six tabs (Frontend ... Dev tools) sit in one inline-grid that is
//     ~480px wide. On a 320-390px phone it was wider than the screen and the
//     body's overflow-x:hidden simply chopped it off, so Security / Deploy /
//     Dev tools could not be reached.
//   - globals.css gives every `button` a 0.25s `transition: all`, which fights
//     the per-frame color/opacity animation of the tabs.
//   - touch-action: pan-y on the whole track stopped any horizontal scrolling.
//   - The icon grid was a fixed 3-column grid, so a category with 4 tools left
//     a lone icon stranded on the left.
//
// What this patch does:
//   1. The tab bar now lives in a scroll strip. If it fits (desktop, big
//      phones) nothing changes. If it does not fit, you can swipe the strip,
//      the edges fade out, and the active tab is scrolled to the center
//      whenever it changes.
//   2. Touch gestures: swipe anywhere on the strip to scroll it, tap a tab to
//      switch, or drag the highlighted pill itself for the rubber effect.
//      Page scrolling still works vertically. Double-tap zoom is disabled on
//      the tabs so fast taps are never swallowed.
//   3. Bigger tap targets on mobile (taller tabs, slightly tighter padding).
//   4. Icon grid is a centered flex-wrap (max 3 per row) so a short last row
//      is centered instead of left aligned. Names wrap cleanly.
//   5. Kills the CSS `transition: all` on the tabs.
//
// Requires patch-tech-stack-icons-and-stuck.mjs to already be applied.
//
// Run from the project root:   node patch-tech-stack-mobile.mjs
// Then:                        npm run dev   (test with browser devtools, phone size)
//                               git add . && git commit -m "Mobile responsive tech stack tabs" && git push
// Backups of both changed files go into .patch-backups/

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app", "page.js");
const cssPath = path.join(root, "app", "globals.css");

for (const p of [pagePath, cssPath]) {
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
const fail = (msg) => {
  console.error("Patch aborted, nothing was written.\n" + msg);
  process.exit(1);
};

const page = read(pagePath);
const css = read(cssPath);
let text = page.text;

if (text.includes("ts-scroll") || css.text.includes(".ts-scroll")) {
  console.log("Mobile tech stack patch is already applied. Nothing to do.");
  process.exit(0);
}
if (!text.includes("KEEP_BRAND_COLORS") || !text.includes("armWatchdog")) {
  fail("Could not find the previous patch. Run patch-tech-stack-icons-and-stuck.mjs first.");
}

const count = (t, s) => t.split(s).length - 1;
const replaceOnce = (t, find, rep, label) => {
  const n = count(t, find);
  if (n !== 1) fail("Expected exactly 1 match for " + label + ", found " + n + ". Did page.js change since this patch was written?");
  return t.split(find).join(rep);
};

/* ======================================================================= */
/* 1. Constant: edge fade for the scroll strip                             */
/* ======================================================================= */

text = replaceOnce(
  text,
  'const NEAR_BLACK_BRANDS = ["#000000", "#181717"];',
  [
    'const NEAR_BLACK_BRANDS = ["#000000", "#181717"];',
    "",
    "/* Fades the left/right edge of the tab strip when it has to scroll (small phones) */",
    'const TS_MASK = "linear-gradient(to right, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%)";',
  ].join("\n"),
  "NEAR_BLACK_BRANDS constant"
);

/* ======================================================================= */
/* 2. Refs / state                                                         */
/* ======================================================================= */

text = replaceOnce(
  text,
  "  const watchdog = useRef(0);\n  const glide = 75;",
  "  const watchdog = useRef(0);\n  const wrapRef = useRef(null);\n  const [scrolls, setScrolls] = useState(false);\n  const glide = 75;",
  "watchdog ref"
);

/* ======================================================================= */
/* 3. measure(): detect overflow; observe the wrapper too                  */
/* ======================================================================= */

text = replaceOnce(
  text,
  "    innerW.set(rect.width - 8);\n    jumpTo(committed.current);",
  [
    "    innerW.set(rect.width - 8);",
    "    const w = wrapRef.current;",
    "    if (w) setScrolls(w.scrollWidth > w.clientWidth + 1);",
    "    jumpTo(committed.current);",
  ].join("\n"),
  "measure() innerW"
);

text = replaceOnce(
  text,
  "    if (trackRef.current) observer.observe(trackRef.current);",
  "    if (trackRef.current) observer.observe(trackRef.current);\n    if (wrapRef.current) observer.observe(wrapRef.current);",
  "ResizeObserver"
);

/* ======================================================================= */
/* 4. Keep the active tab in view when the strip scrolls                   */
/* ======================================================================= */

text = replaceOnce(
  text,
  "  const total = TECH_CATEGORIES.length;\n  const current = TECH_CATEGORIES[active];",
  [
    "  // when the strip has to scroll (narrow phones), bring the active tab to the middle",
    "  useEffect(() => {",
    "    const w = wrapRef.current;",
    "    const t = trackRef.current;",
    "    const b = itemRefs.current[active];",
    "    if (!w || !t || !b || w.scrollWidth <= w.clientWidth + 1) return;",
    "    const left = t.offsetLeft + b.offsetLeft - (w.clientWidth - b.offsetWidth) / 2;",
    '    w.scrollTo({ left: Math.max(0, left), behavior: "smooth" });',
    "  }, [active]);",
    "",
    "  const total = TECH_CATEGORIES.length;",
    "  const current = TECH_CATEGORIES[active];",
  ].join("\n"),
  "total/current anchor"
);

/* ======================================================================= */
/* 5. JSX: scroll wrapper around the track                                 */
/* ======================================================================= */

text = replaceOnce(
  text,
  "        <motion.div\n          ref={trackRef}",
  [
    "        <motion.div",
    "          ref={wrapRef}",
    '          className="ts-scroll relative flex w-full mb-8 overflow-x-auto overflow-y-hidden"',
    '          style={scrolls ? { padding: "0 14px", WebkitMaskImage: TS_MASK, maskImage: TS_MASK } : undefined}',
    "          initial={{ opacity: 0, y: 16 }}",
    "          animate={inView ? { opacity: 1, y: 0 } : {}}",
    "          transition={{ delay: 0.2, ease: E }}",
    "        >",
    "        <motion.div",
    "          ref={trackRef}",
  ].join("\n"),
  "track opening"
);

text = replaceOnce(
  text,
  [
    '          className="relative inline-grid p-1 rounded-2xl mb-8 touch-pan-y select-none"',
    '          style={{ background: trackBg, gridAutoFlow: "column", gridAutoColumns: "auto" }}',
    "          initial={{ opacity: 0, y: 16 }}",
    "          animate={inView ? { opacity: 1, y: 0 } : {}}",
    "          transition={{ delay: 0.2, ease: E }}",
  ].join("\n"),
  [
    '          className="relative inline-grid shrink-0 mx-auto p-1 rounded-2xl select-none"',
    '          style={{ background: trackBg, gridAutoFlow: "column", gridAutoColumns: "auto" }}',
  ].join("\n"),
  "track className/animation"
);

text = replaceOnce(
  text,
  "          </motion.div>\n        </motion.div>\n\n        <motion.h3",
  "          </motion.div>\n        </motion.div>\n        </motion.div>\n\n        <motion.h3",
  "track closing"
);

/* ======================================================================= */
/* 6. Tab sizing (both layers must stay identical)                         */
/* ======================================================================= */

text = replaceOnce(
  text,
  'className="flex items-center justify-center px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap cursor-pointer"',
  'className="ts-tab flex items-center justify-center px-3.5 py-2.5 md:px-4 md:py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap cursor-pointer"',
  "tab button className"
);

text = replaceOnce(
  text,
  'className="flex items-center justify-center px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap"',
  'className="flex items-center justify-center px-3.5 py-2.5 md:px-4 md:py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap"',
  "thumb label className"
);

/* ======================================================================= */
/* 7. Icon grid: centered flex-wrap                                        */
/* ======================================================================= */

text = replaceOnce(
  text,
  'className="grid grid-cols-3 gap-x-4 gap-y-6"',
  'className="flex flex-wrap justify-center gap-x-[3%] gap-y-7 md:gap-x-6 max-w-[420px] mx-auto"',
  "icon grid className"
);

text = replaceOnce(
  text,
  '<div key={tool.name} className="flex flex-col items-center gap-3">',
  '<div key={tool.name} className="flex flex-col items-center gap-3 w-[30%] max-w-[110px]">',
  "icon item className"
);

text = replaceOnce(
  text,
  '<motion.span className="text-[11px] font-medium" style={{ color: mutedColor }}>{tool.name}</motion.span>',
  '<motion.span className="text-[11px] font-medium text-center leading-tight" style={{ color: mutedColor }}>{tool.name}</motion.span>',
  "tool name span"
);

/* ======================================================================= */
/* 8. CSS                                                                  */
/* ======================================================================= */

const cssAdd = [
  "",
  "/* Tech stack tabs: mobile scroll strip + touch behavior */",
  ".ts-scroll {",
  "  scrollbar-width: none;",
  "  -ms-overflow-style: none;",
  "  -webkit-overflow-scrolling: touch;",
  "  overscroll-behavior-x: contain;",
  "}",
  ".ts-scroll::-webkit-scrollbar { display: none; }",
  "",
  "/* the generic `button { transition: all }` fights the per-frame tab animation */",
  ".ts-tab {",
  "  transition: none !important;",
  "  touch-action: manipulation;          /* swipe scrolls the strip, no double-tap zoom */",
  "  -webkit-tap-highlight-color: transparent;",
  "  -webkit-user-select: none;",
  "  user-select: none;",
  "  -webkit-touch-callout: none;",
  "}",
  '.ts-tab[aria-checked="true"] {',
  "  touch-action: pan-y;                 /* dragging the pill sideways = rubber drag, vertical = page scroll */",
  "}",
  "",
].join("\n");

css.text = css.text.replace(/\n*$/, "\n") + cssAdd;

/* ======================================================================= */
/* 9. Write out                                                            */
/* ======================================================================= */

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
const stamp = Date.now();
fs.copyFileSync(pagePath, path.join(backupDir, "page.js." + stamp + ".bak"));
fs.copyFileSync(cssPath, path.join(backupDir, "globals.css." + stamp + ".bak"));

save(pagePath, { text, crlf: page.crlf });
save(cssPath, css);

console.log("Done:");
console.log("  - tabs scroll/swipe on narrow phones, active tab auto-centers, edges fade");
console.log("  - bigger tap targets, no double-tap-zoom swallowing quick taps");
console.log("  - icon grid centers a short last row");
console.log("(backups saved in .patch-backups/)");
console.log("");
console.log("Next steps:");
console.log("  1. npm run dev  (open devtools, pick a phone size like 360px)");
console.log('  2. git add . && git commit -m "Mobile responsive tech stack tabs" && git push');
