#!/usr/bin/env node
/**
 * patch-cleanup.mjs  (dead-code / unused-asset cleanup, no visual change)
 *
 * Every item below was checked three ways before being removed: ESLint
 * (no-unused-vars), a reference search across app/ + public/ + configs, and a
 * before/after pixel comparison of the built site (desktop 1440px and phone
 * 390px, 19 scroll positions each) plus a diff of the pre-rendered HTML.
 *
 * WHAT IT REMOVES
 *
 *  A. A component that never shows: GlassSurface (app/GlassSurface.js + .css).
 *     globals.css hides its wrapper (`.gnav-wrap.is-scrolled .gnav-glass
 *     { display:none }`, and it is opacity:0 before that), so the SVG filter,
 *     its ResizeObserver and 3 effects ran for nothing. The visible glass
 *     capsule is plain CSS (backdrop-filter on .gnav) and is untouched.
 *     Skip this part with --keep-glass.
 *  B. Orphan files nothing imports: app/Threads.jsx, app/Threads.css,
 *     app/ContactThreads.jsx.
 *  C. page.js: unused import `animate`; unused function `interpolateHex`;
 *     the `useIsMobile` hook and the isMobile / globalProgress / manifestoRef
 *     / containerRef props that no component reads (on phones the hook also
 *     caused a full-page re-render right after load); dead locals in
 *     Contact(); and `motion.*` wrappers that have no animation props at all
 *     (they are now plain elements, identical HTML, less JS per element).
 *  D. globals.css: classes nothing uses (.blur-3xl, .glow-orb, .logo-gradient,
 *     .glow-bar-track, .nav-links-scroll, .contact-h2, .hf-rot + its
 *     @keyframes hf-in), unused variables (--accent-2, --border), the
 *     glass-layer rules, a `scroll-behavior: smooth` that a later rule
 *     overrides, and the .theme-section GPU-layer declarations that a later
 *     rule cancels again (net result was only `contain: paint`, kept).
 *  E. ContactMorphSection.js: dead `.ct-dot` rules, CSS comments shipped to
 *     the browser inside the style string, one unused callback arg.
 *  F. layout.js: the hand-written <meta viewport> duplicated the one Next.js
 *     already emits from the `viewport` export (the page had it twice).
 *  G. Dependencies: `react-icons` (never imported) from package.json and
 *     package-lock.json, plus a stale `three` entry that only existed in the
 *     lockfile; removed from next.config.mjs optimizePackageImports too.
 *     Unused tailwind.config.js entries (mono, cormorant, colors).
 *  H. Dead files: 4 Hewitt Web weights nothing loads (only Book is used), 20
 *     public/logos/*.bak-* backup SVGs that were being deployed, and the
 *     byte-identical duplicate `patch-perf-optimize (1).mjs`.
 *
 * OPT-IN
 *   --drop-brand-assets   also delete public/png/bcdlogo.png, bcwlogo.png and
 *                         public/svg/carlo-wordmark.svg (nothing references them,
 *                         but they may be your source artwork, so not default)
 *   --prune-history       also delete .patch-backup/, .patch-backups/ and the old
 *                         patch-*.mjs scripts (git history keeps them)
 *   --keep-glass          do not touch GlassSurface (skips part A)
 *   --dry-run             print the plan, write nothing
 *
 * NOT TOUCHED ON PURPOSE: the *:applied marker comments (older patch scripts
 * use them to detect what is applied), me.png (img fallback), GUIDE.md.
 *
 * Needs patch-perf-optimize-2.mjs applied first. Handles CRLF checkouts.
 *
 * Usage (repo root):
 *   node patch-cleanup.mjs [flags]
 *   node patch-cleanup.mjs --revert
 *   then: npm install   (refreshes node_modules after the dependency removal)
 *
 * Backup: .cleanup-backup/  (added to .gitignore; delete it once you are happy)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const BK = path.join(ROOT, ".cleanup-backup");
const MARK = "cleanup:applied";
const ARGS = new Set(process.argv.slice(2));
const KEEP_GLASS = ARGS.has("--keep-glass");
const DROP_BRAND = ARGS.has("--drop-brand-assets");
const PRUNE = ARGS.has("--prune-history");
const DRY = ARGS.has("--dry-run");
const THIS = path.basename(process.argv[1] || "patch-cleanup.mjs");

for (const a of ARGS) {
  if (!["--keep-glass", "--drop-brand-assets", "--prune-history", "--dry-run", "--revert"].includes(a)) {
    console.error(`\n✖ Unknown flag ${a}\n`);
    process.exit(1);
  }
}

const die = (m) => {
  console.error("\n✖ " + m + "\n");
  process.exit(1);
};
const abs = (rel) => path.join(ROOT, rel);
const exists = (rel) => fs.existsSync(abs(rel));
const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");

/* ------------------------------------------------------------ revert ---- */
if (ARGS.has("--revert")) {
  const mf = path.join(BK, "manifest.json");
  if (!fs.existsSync(mf)) die("No backup found in .cleanup-backup/ (nothing to revert).");
  const m = JSON.parse(fs.readFileSync(mf, "utf8"));
  for (const rel of m.paths) {
    const from = path.join(BK, "files", rel);
    if (!fs.existsSync(from)) die(`Backup is incomplete: missing ${rel}`);
  }
  for (const rel of m.paths) {
    const to = abs(rel);
    fs.rmSync(to, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.cpSync(path.join(BK, "files", rel), to, { recursive: true });
  }
  console.log(`✔ Reverted ${m.paths.length} path(s). Run \`npm install\` to restore node_modules.`);
  process.exit(0);
}

/* ------------------------------------------------------------- stage ---- */
const files = new Map(); // rel -> { text, crlf, orig }
const load = (rel) => {
  if (!files.has(rel)) {
    if (!exists(rel)) die(`Missing ${rel}. Run this from the repo root.`);
    const raw = fs.readFileSync(abs(rel), "utf8");
    const crlf = raw.includes("\r\n");
    files.set(rel, { text: crlf ? raw.replace(/\r\n/g, "\n") : raw, crlf, orig: raw });
  }
  return files.get(rel);
};
const log = [];
const edit = (rel, label, find, repl) => {
  const f = load(rel);
  const n = f.text.split(find).length - 1;
  if (n !== 1) die(`[${rel}] expected exactly 1 match for "${label}", found ${n}. Nothing was written.`);
  f.text = f.text.replace(find, () => repl);
  log.push(`${rel}: ${label}`);
};
/* remove (or replace) everything from `start` through the first `end` after it */
const cut = (rel, label, start, end, repl = "", expectLines) => {
  const f = load(rel);
  const n = f.text.split(start).length - 1;
  if (n !== 1) die(`[${rel}] expected exactly 1 start match for "${label}", found ${n}. Nothing was written.`);
  const a = f.text.indexOf(start);
  const b = f.text.indexOf(end, a);
  if (b < 0) die(`[${rel}] end marker for "${label}" not found. Nothing was written.`);
  const removed = f.text.slice(a, b + end.length);
  const lines = removed.split("\n").length - 1;
  if (expectLines != null && lines !== expectLines) {
    die(`[${rel}] "${label}": expected to remove ${expectLines} lines but the block is ${lines} lines. The file differs from the audited one. Nothing was written.`);
  }
  f.text = f.text.slice(0, a) + repl + f.text.slice(b + end.length);
  log.push(`${rel}: ${label} (${lines} lines)`);
};

/* preconditions */
const page0 = load("app/page.js").text;
if (page0.includes(MARK)) die("Already applied. Use --revert first to run it again.");
if (!page0.includes("perf-optimize-2:applied")) die("Run patch-perf-optimize-2.mjs first (this cleanup was audited on top of it).");
if (exists(".cleanup-backup")) fs.rmSync(BK, { recursive: true, force: true }); // stale backup from an earlier, reverted run

/* =========================================================== page.js ===== */
const P = "app/page.js";

if (!KEEP_GLASS) {
  edit(P, "A. drop GlassSurface import", `import GlassSurface from "./GlassSurface";\n`, ``);
  cut(P, "A. drop the hidden .gnav-glass layer from the navbar",
    `        <div className="gnav-glass" aria-hidden="true">\n`,
    `          />\n        </div>\n\n`, "", 17);
}

edit(P, "C. unused import `animate`", `  useSpring,\n  animate,\n  AnimatePresence,`, `  useSpring,\n  AnimatePresence,`);

cut(P, "C. unused function interpolateHex",
  `function interpolateHex(c1, c2, t) {\n`,
  "  )})`;\n}\n\n", "", 13);

cut(P, "C. useIsMobile hook (nothing reads it any more)",
  `function useIsMobile() {\n`,
  `  return isMobile;\n}\n\n`, "", 12);

edit(P, "C. DeviceMockup: unused isMobile param", `function DeviceMockup({ accent, isMobile }) {`, `function DeviceMockup({ accent }) {`);
edit(P, "C. DeviceMockup call site", `<DeviceMockup accent={p.colorAccent} isMobile={isMobile} />`, `<DeviceMockup accent={p.colorAccent} />`);
edit(P, "C. IntroProfile: unused isMobile prop", `function IntroProfile({ isMobile }) {`, `function IntroProfile() {`);
edit(P, "C. Projects: unused props", `function Projects({ globalProgress, isMobile }) {`, `function Projects() {`);
edit(P, "C. Manifesto owns its ref; unused props",
  `function Manifesto({ globalProgress, manifestoRef, isMobile }) {\n  const inView = useInView(manifestoRef,`,
  `function Manifesto() {\n  const manifestoRef = useRef(null);\n  const inView = useInView(manifestoRef,`);
edit(P, "C. Contact: dead locals (ref/inView/colours) and prop",
  `function Contact({ isMobile }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const textColor = LIGHT.text;
  const accentColor = LIGHT.accent;
  const mutedColor = LIGHT.muted;

  const holder = useRef(null);`,
  `function Contact() {
  const holder = useRef(null);`);

cut(P, "C. Page(): drop useIsMobile / globalProgress / containerRef plumbing",
  `export default function Page() {\n`,
  `    </LazyMotion>\n  );\n}\n`,
  `export default function Page() {
  return (
    <LazyMotion features={domAnimation}>
      <Cursor />
      <GlassNavbar />
      <main style={{ position: "relative", zIndex: 10 }}>
        <Hero />
        <div className="after-hero">
        <IntroProfile />
        <Projects />
        <Services />
        <TechStack />
        <Manifesto />
        <Story />
        <Testimonials />
        <Contact />
        </div>
      </main>
    </LazyMotion>
  );
}
`, 29);

edit(P, "marker", `/* perf-optimize-2:applied */\n`, `/* perf-optimize-2:applied */\n/* ${MARK} */\n`);

/* --- unwrap motion.* elements that carry no animation props at all ------- */
const ANIM_PROP = /\b(initial|animate|exit|transition|variants|layout|layoutId|layoutScroll|drag|dragConstraints|dragElastic|whileHover|whileTap|whileFocus|whileDrag|whileInView|viewport|custom|inherit|onAnimationStart|onAnimationComplete|onUpdate|onViewportEnter|onViewportLeave|onHover\w*|onTap\w*|onPan\w*|onDrag\w*)\s*=/;
const MOTION_STYLE_KEY = /\b(x|y|z|scale|scaleX|scaleY|rotate|rotateX|rotateY|rotateZ|skew|skewX|skewY|originX|originY|originZ|translateX|translateY|translateZ|perspective|pathLength|pathOffset|pathSpacing)\s*:/;

function tagEnd(src, from) {
  // end index (of the closing ">") of a JSX opening tag, brace/string aware
  let depth = 0, str = null;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (str) {
      if (c === "\\") i++;
      else if (c === str) str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { str = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return i;
  }
  return -1;
}
function unwrapMotion(src) {
  const re = /<(\/?)motion\.([A-Za-z0-9]+)/g;
  const stack = [], pairs = [];
  let m, kept = 0;
  while ((m = re.exec(src))) {
    if (m[1] === "/") {
      const top = stack.pop();
      if (!top || top.tag !== m[2]) die(`motion unwrap: unbalanced </motion.${m[2]}> near char ${m.index}`);
      top.close = m.index;
      continue;
    }
    const end = tagEnd(src, m.index + m[0].length);
    if (end < 0) die(`motion unwrap: unterminated <motion.${m[2]} near char ${m.index}`);
    const attrs = src.slice(m.index + m[0].length, end);
    const selfClosing = /\/\s*$/.test(attrs);
    const animated = ANIM_PROP.test(attrs) || MOTION_STYLE_KEY.test(attrs);
    const node = { tag: m[2], open: m.index, convert: !animated, close: -1, selfClosing };
    if (animated) kept++;
    pairs.push(node);
    if (!selfClosing) stack.push(node);
  }
  if (stack.length) die("motion unwrap: unclosed motion element(s)");
  const edits = [];
  const converted = [];
  for (const p of pairs) {
    if (!p.convert) continue;
    edits.push({ at: p.open, len: "<motion.".length, to: "<" });
    if (!p.selfClosing) edits.push({ at: p.close, len: "</motion.".length, to: "</" });
    converted.push({ line: src.slice(0, p.open).split("\n").length, tag: p.tag });
  }
  edits.sort((a, b) => b.at - a.at);
  let out = src;
  for (const e of edits) out = out.slice(0, e.at) + e.to + out.slice(e.at + e.len);
  return { out, converted, kept };
}
{
  const f = load(P);
  const { out, converted, kept } = unwrapMotion(f.text);
  const EXPECT_CONVERTED = 23;
  if (converted.length !== EXPECT_CONVERTED) {
    die(`motion unwrap: expected ${EXPECT_CONVERTED} plain wrappers but found ${converted.length}. page.js differs from the audited file. Nothing was written.`);
  }
  f.text = out;
  log.push(`${P}: C. ${converted.length} motion.* wrappers without animation props are now plain elements (${kept} animated ones kept)`);
}

/* ========================================================= globals.css === */
const G = "app/globals.css";

edit(G, "D. unused variables --accent-2 / --border",
  `  --accent-2:     #FFA2B6;\n  --border:       rgba(42,14,7,0.14);\n`, ``);

edit(G, "D. dead `scroll-behavior: smooth` (a later rule sets auto)",
  `html {\n  scroll-behavior: smooth;\n`, `html {\n`);

edit(G, "D. .theme-section: keep only contain: paint (the rest was cancelled later)",
  `/* Sections: promote to their own layer for smoother scrolling */
.theme-section {
  contain: paint;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}`,
  `/* Sections: isolate paint per section (no forced GPU layer per section) */
.theme-section {
  contain: paint;
}`);
cut(G, "D. cancelled .theme-section overrides + no-op will-change",
  `/* Sections used to force a GPU layer each`,
  `html, body { will-change: auto; }\n`, "", 11);

edit(G, "D. unused .blur-3xl and .glow-orb",
  `@media (max-width: 767px) {
  .blur-3xl {
    --tw-blur: blur(32px) !important;
    filter: blur(32px) !important;
  }

  .glow-orb {
    will-change: transform;
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }

  a, button {`,
  `@media (max-width: 767px) {
  a, button {`);

if (!KEEP_GLASS) {
  edit(G, "A. .gnav direct children rule no longer needs the glass exception",
    `.gnav > *:not(.gnav-glass) { position: relative; z-index: 1; }`,
    `.gnav > * { position: relative; z-index: 1; }`);
  cut(G, "A. glass-layer rules (.gnav-glass, .glass-surface overrides)",
    `/* gnav-glass-surface */\n`,
    `.gnav-wrap.is-scrolled .gnav-glass { opacity: 1; }\n\n`, "", 25);
  edit(G, "A. rule that hid the glass layer",
    `/* the capsule is plain CSS glass now, so the SVG liquid-glass layer is not needed */\n.gnav-wrap.is-scrolled .gnav-glass { display: none; }\n\n`, ``);
  edit(G, "A. reduced-motion selector list", `.gnav-wrap, .gnav, .gnav-glass, .gnav-links,`, `.gnav-wrap, .gnav, .gnav-links,`);
}

cut(G, "D. unused .logo-gradient / .glow-bar-track / .nav-links-scroll",
  `.logo-gradient {\n`,
  `.nav-links-scroll::-webkit-scrollbar {\n  display: none;\n}\n\n`, "", 16);

cut(G, "D. unused .contact-h2",
  `/* contact-threads:start */\n`,
  `/* contact-threads:end */\n\n`, "", 8);

cut(G, "D. unused .hf-rot (services rotator was removed from the hero)",
  `/* services rotator: one dark row, the others light */\n`,
  `.hf-rot li.on { color: #2A0E07; }\n\n`, "", 22);
edit(G, "D. unused @keyframes hf-in (only .hf-rot used it)", `@keyframes hf-in { to { opacity: 1; transform: none; } }\n`, ``);
edit(G, "D. hero media queries: drop .hf-rot and rules equal to the base",
  `@media (max-width: 760px) {
  .hf-hero { align-items: center; padding-top: 88px; }
  .hf-rot { font-size: clamp(.8rem, 3.6vw, 1.2rem); }
}
@media (prefers-reduced-motion: reduce) {
  .hf-l > span { animation: none !important; transform: none; }
  .hf-rot { animation: none !important; opacity: 1; transform: none; }
  .hf-rot ul { transition: none; }
}`,
  `@media (prefers-reduced-motion: reduce) {
  .hf-l > span { animation: none !important; transform: none; }
}`);
edit(G, "D. hero bottom padding: fold the later override into the base rule (88px)",
  `  padding: 88px clamp(20px, 4.4vw, 64px) 120px;`, `  padding: 88px clamp(20px, 4.4vw, 64px) 88px;`);
edit(G, "D. hero bottom padding override now redundant",
  `/* hero-no-services:start */\n.hf-hero { padding-bottom: 88px; }\n/* hero-no-services:end */\n`, ``);

/* ================================================ ContactMorphSection ==== */
const C = "app/ContactMorphSection.js";
edit(C, "E. dead .ct-dot rule", `  ".ct-root .ct-dot{color:var(--ct-accent)}",\n`, ``);
edit(C, "E. dead .ct-dot override", `  ".ct-root .ct-dot{color:inherit}",\n`, ``);
for (const c of ["/* ct-tweak-v2 */", "/* /ct-tweak-v2 */", "/* ct-one-line */", "/* /ct-one-line */", "/* cooper-hewitt */"]) {
  edit(C, `E. CSS comment string "${c}" (was shipped to the browser)`, `  "${c}",\n`, ``);
}
edit(C, "E. unused callback arg", `cs.forEach(function (c, k) {`, `cs.forEach(function (c) {`);
edit(C, "E. stale comment", `/* warm up every script so the first morph never swaps fonts mid-flight */`, `/* re-measure the droplet scale once the web fonts have loaded */`);

/* ============================================================ layout.js === */
cut("app/layout.js", "F. duplicate <meta viewport> (Next already emits it from `export const viewport`)",
  `      {/*\n        Explicit meta is a belt-and-suspenders fallback`,
  `      </head>\n`, "", 7);

/* ====================================================== config & deps ===== */
edit("next.config.mjs", "G. react-icons out of optimizePackageImports",
  `optimizePackageImports: ["framer-motion", "react-icons"]`, `optimizePackageImports: ["framer-motion"]`);

edit("tailwind.config.js", "G. unused tailwind theme entries (mono, cormorant, colors)",
  `        mono:      ["var(--font-syne-mono)", "monospace"],
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      colors: {
        bg:       "#EBE9E1",
        fg:       "#2A0E07",
        accent:   "#D23412",
        gold:     "#FFA2B6", // signal (pink)
        surface:  "#DFDCD0",
        surface2: "#D3CFC2",
        muted:    "#665549",
        on:       "#FFF4EA", // text on accent bands
      },
    },`,
  `      },
    },`);

const jsonEdit = (rel, label, fn) => {
  const f = load(rel);
  const obj = JSON.parse(f.text);
  if (JSON.stringify(obj, null, 2) + "\n" !== f.text) die(`${rel} is not in canonical npm formatting; run \`npm uninstall react-icons\` by hand instead. Nothing was written.`);
  fn(obj);
  f.text = JSON.stringify(obj, null, 2) + "\n";
  log.push(`${rel}: ${label}`);
};
jsonEdit("package.json", "G. remove unused dependency react-icons", (o) => {
  if (!o.dependencies || !o.dependencies["react-icons"]) die("package.json: react-icons not found in dependencies.");
  delete o.dependencies["react-icons"];
});
jsonEdit("package-lock.json", "G. remove react-icons and stale `three` from the lockfile", (o) => {
  if (o.lockfileVersion !== 3 || !o.packages) die("package-lock.json: expected lockfileVersion 3.");
  for (const name of ["react-icons", "three"]) {
    for (const [k, v] of Object.entries(o.packages)) {
      if (k === "") continue;
      for (const sec of ["dependencies", "peerDependencies", "optionalDependencies"]) {
        if (v[sec] && v[sec][name]) die(`package-lock.json: ${k} depends on ${name}; not removing.`);
      }
    }
    delete o.packages[""].dependencies[name];
    delete o.packages["node_modules/" + name];
  }
});
{
  const f = load(".gitignore");
  if (!f.text.includes(".cleanup-backup")) {
    f.text = f.text.replace(/\n*$/, "\n") + "\n# cleanup patch backup (safe to delete once you are happy)\n/.cleanup-backup/\n";
    log.push(".gitignore: ignore .cleanup-backup/");
  }
}

/* ============================================================ deletions === */
const dels = []; // { rel, why }
const del = (rel, why) => { if (exists(rel)) dels.push({ rel, why }); };

if (!KEEP_GLASS) {
  del("app/GlassSurface.js", "A. component that is always hidden");
  del("app/GlassSurface.css", "A. its styles");
}
for (const r of ["app/Threads.jsx", "app/Threads.css", "app/ContactThreads.jsx"]) del(r, "B. not imported anywhere");
for (const w of ["Bold", "Heavy", "Medium", "Semibold"]) del(`app/fonts/HewittWeb-${w}.woff2`, "H. font weight nothing loads (layout.js only loads Book)");
if (exists("public/logos")) {
  for (const n of fs.readdirSync(abs("public/logos")).sort()) {
    if (/\.bak-/.test(n)) del(`public/logos/${n}`, "H. backup copy that was being deployed");
  }
}
if (exists("patch-perf-optimize (1).mjs") && exists("patch-perf-optimize.mjs")) {
  const a = fs.readFileSync(abs("patch-perf-optimize (1).mjs"));
  const b = fs.readFileSync(abs("patch-perf-optimize.mjs"));
  if (sha1(a) === sha1(b)) del("patch-perf-optimize (1).mjs", "H. byte-identical duplicate of patch-perf-optimize.mjs");
}
if (DROP_BRAND) for (const r of ["public/png/bcdlogo.png", "public/png/bcwlogo.png", "public/svg/carlo-wordmark.svg"]) del(r, "opt-in: not referenced anywhere");
if (PRUNE) {
  del(".patch-backup", "opt-in: old patch backups (git history keeps them)");
  del(".patch-backups", "opt-in: old patch backups (git history keeps them)");
  for (const n of fs.readdirSync(ROOT).sort()) if (/^patch-.*\.mjs$/.test(n) && n !== THIS) del(n, "opt-in: already-applied patch script");
}

/* ====================================================== reference guard === */
// last line of defence: refuse to delete anything a remaining source file still points at
{
  const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const delSet = new Set(dels.map((d) => d.rel));
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const srcs = [];
  for (const n of fs.readdirSync(abs("app"))) {
    const rel = "app/" + n;
    if (!/\.(js|jsx|css)$/.test(n) || delSet.has(rel)) continue;
    srcs.push(strip(files.has(rel) ? files.get(rel).text : fs.readFileSync(abs(rel), "utf8")));
  }
  for (const rel of ["next.config.mjs", "tailwind.config.js", "postcss.config.js"]) srcs.push(strip(files.has(rel) ? files.get(rel).text : fs.readFileSync(abs(rel), "utf8")));
  const hay = srcs.join("\n");
  for (const d of dels) {
    const base = path.basename(d.rel);
    const stem = base.replace(/\.[^.]+$/, "");
    const isModule = /^app\/[^/]+\.(jsx?|css)$/.test(d.rel);
    const hit = isModule ? new RegExp(`["']\\./${esc(stem)}(\\.\\w+)?["']`).test(hay) : hay.includes(base);
    if (hit) die(`Refusing to delete ${d.rel}: a remaining source file still references it. Nothing was written.`);
  }
}

/* =============================================================== plan ===== */
console.log(`\nplanned edits (${log.length}):`);
for (const l of log) console.log("  • " + l);
console.log(`\nplanned deletions (${dels.length}):`);
for (const d of dels) console.log(`  • ${d.rel}   [${d.why}]`);
if (DRY) {
  console.log("\n(dry run, nothing written)");
  process.exit(0);
}

/* ============================================================== write ===== */
const touched = [...files.entries()].filter(([, f]) => (f.crlf ? f.text.replace(/\n/g, "\r\n") : f.text) !== f.orig).map(([r]) => r);
const backupPaths = [...new Set([...touched, ...dels.map((d) => d.rel)])];
fs.mkdirSync(path.join(BK, "files"), { recursive: true });
for (const rel of backupPaths) {
  const to = path.join(BK, "files", rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(abs(rel), to, { recursive: true });
}
fs.writeFileSync(path.join(BK, "manifest.json"), JSON.stringify({ when: new Date().toISOString(), flags: [...ARGS], paths: backupPaths }, null, 2));
for (const rel of touched) {
  const f = files.get(rel);
  fs.writeFileSync(abs(rel), f.crlf ? f.text.replace(/\n/g, "\r\n") : f.text);
}
for (const d of dels) fs.rmSync(abs(d.rel), { recursive: true, force: true });

console.log(`\n✔ Cleanup applied: ${touched.length} file(s) edited, ${dels.length} path(s) deleted.`);
console.log("  Next: npm install && npm run build   (backup in .cleanup-backup/, undo with --revert)");
