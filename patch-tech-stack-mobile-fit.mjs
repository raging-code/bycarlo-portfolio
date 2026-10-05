// patch-tech-stack-mobile-fit.mjs
// byCarlo: replaces the swipe-to-scroll tab strip from patch-tech-stack-mobile.mjs
// with what you actually asked for: on phones the tabs just get smaller so
// ALL six (Frontend, Backend, Database, Security, Deploy, Dev tools) fit on
// the screen at once. No scrolling, no edge fade.
//
// How it fits:
//   - tab font size and side padding scale with the screen width
//       font:    clamp(8.5px, 2.7vw, 13px)
//       padding: clamp(4px, 1.5vw, 16px) left/right
//     so 320px, 360px, 390px, 430px phones all fit, and from ~450px up it is
//     the normal desktop size (13px / 16px).
//   - the tab bar uses the full phone width (it pulls 12px into the page gutter).
//   - the sliding pill, labels and drag still work: both layers share the same
//     class, so they always stay pixel-identical.
//
// It also removes everything the scroll version added (scroll wrapper, edge
// mask, auto-centering, overflow detection).
//
// Requires patch-tech-stack-mobile.mjs to already be applied (your repo has it).
//
// Run from the project root:   node patch-tech-stack-mobile-fit.mjs
// Then:                        npm run dev   (devtools, phone size 320 / 360 / 390)
//                               git add . && git commit -m "Tech stack tabs fit on mobile" && git push
// To make tabs even smaller/bigger on phones, edit the two clamp() lines in app/globals.css (.ts-seg).
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
let styles = css.text;

if (styles.includes(".ts-seg")) {
  console.log("Fit-to-screen patch is already applied. Nothing to do.");
  process.exit(0);
}
if (!text.includes("TS_MASK") || !styles.includes(".ts-scroll")) {
  fail("Could not find the scroll version from patch-tech-stack-mobile.mjs. Apply that one first.");
}

const count = (t, s) => t.split(s).length - 1;
const replaceOnce = (t, find, rep, label) => {
  const n = count(t, find);
  if (n !== 1) fail("Expected exactly 1 match for " + label + ", found " + n + ". Did the file change since this patch was written?");
  return t.split(find).join(rep);
};

/* ======================================================================= */
/* 1. Remove the scroll machinery from page.js                             */
/* ======================================================================= */

text = replaceOnce(
  text,
  [
    "/* Fades the left/right edge of the tab strip when it has to scroll (small phones) */",
    'const TS_MASK = "linear-gradient(to right, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%)";',
    "",
    "",
  ].join("\n"),
  "",
  "TS_MASK constant"
);

text = replaceOnce(
  text,
  "  const wrapRef = useRef(null);\n  const [scrolls, setScrolls] = useState(false);\n",
  "",
  "wrapRef/scrolls state"
);

text = replaceOnce(
  text,
  "    const w = wrapRef.current;\n    if (w) setScrolls(w.scrollWidth > w.clientWidth + 1);\n",
  "",
  "overflow detection in measure()"
);

text = replaceOnce(
  text,
  "    if (wrapRef.current) observer.observe(wrapRef.current);\n",
  "",
  "wrapper ResizeObserver line"
);

text = replaceOnce(
  text,
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
    "",
  ].join("\n"),
  "",
  "auto-center effect"
);

/* ======================================================================= */
/* 2. Wrapper + track: full width, no scrolling                            */
/* ======================================================================= */

text = replaceOnce(
  text,
  [
    "        <motion.div",
    "          ref={wrapRef}",
    '          className="ts-scroll relative flex w-full mb-8 overflow-x-auto overflow-y-hidden"',
    '          style={scrolls ? { padding: "0 14px", WebkitMaskImage: TS_MASK, maskImage: TS_MASK } : undefined}',
  ].join("\n"),
  [
    "        <motion.div",
    '          className="flex justify-center -mx-3 md:mx-0 mb-8"',
  ].join("\n"),
  "scroll wrapper opening"
);

text = replaceOnce(
  text,
  'className="relative inline-grid shrink-0 mx-auto p-1 rounded-2xl select-none"',
  'className="relative inline-grid max-w-full p-1 rounded-2xl select-none"',
  "track className"
);

/* ======================================================================= */
/* 3. Tab sizing: one shared class that scales with the screen             */
/* ======================================================================= */

text = replaceOnce(
  text,
  'className="ts-tab flex items-center justify-center px-3.5 py-2.5 md:px-4 md:py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap cursor-pointer"',
  'className="ts-tab ts-seg flex items-center justify-center font-medium rounded-xl whitespace-nowrap cursor-pointer"',
  "tab button className"
);

text = replaceOnce(
  text,
  'className="flex items-center justify-center px-3.5 py-2.5 md:px-4 md:py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap"',
  'className="ts-seg flex items-center justify-center font-medium rounded-xl whitespace-nowrap"',
  "thumb label className"
);

/* ======================================================================= */
/* 4. CSS: drop the scroll rules, add the fit rules                        */
/* ======================================================================= */

styles = replaceOnce(
  styles,
  [
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
  ].join("\n"),
  [
    "/* Tech stack tabs: always fit the screen (scale down on phones) */",
    "/* shared by the tab buttons and the sliding-pill labels so both layers stay identical */",
    ".ts-seg {",
    "  font-size: clamp(8.5px, 2.7vw, 13px);",
    "  line-height: 1.2;",
    "  padding: 10px clamp(4px, 1.5vw, 16px);",
    "}",
    "@media (min-width: 768px) {",
    "  .ts-seg { font-size: 13px; padding: 8px 16px; }",
    "}",
    "",
    "/* the generic `button { transition: all }` fights the per-frame tab animation */",
    ".ts-tab {",
    "  transition: none !important;",
    "  touch-action: pan-y;                 /* sideways drag on the pill = rubber drag, vertical = page scroll, no double-tap zoom */",
    "  -webkit-tap-highlight-color: transparent;",
    "  -webkit-user-select: none;",
    "  user-select: none;",
    "  -webkit-touch-callout: none;",
    "}",
  ].join("\n"),
  "scroll CSS block"
);

/* ======================================================================= */
/* 5. Write out                                                            */
/* ======================================================================= */

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
const stamp = Date.now();
fs.copyFileSync(pagePath, path.join(backupDir, "page.js." + stamp + ".bak"));
fs.copyFileSync(cssPath, path.join(backupDir, "globals.css." + stamp + ".bak"));

save(pagePath, { text, crlf: page.crlf });
save(cssPath, { text: styles, crlf: css.crlf });

console.log("Done:");
console.log("  - all 6 tabs now fit on the phone screen (they shrink instead of scrolling)");
console.log("  - scroll strip, edge fade and auto-centering removed");
console.log("(backups saved in .patch-backups/)");
console.log("");
console.log("Next steps:");
console.log("  1. npm run dev  (devtools, try 320 / 360 / 390 / 430 wide)");
console.log('  2. git add . && git commit -m "Tech stack tabs fit on mobile" && git push');
