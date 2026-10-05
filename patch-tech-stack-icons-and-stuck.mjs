// patch-tech-stack-icons-and-stuck.mjs
// byCarlo: fixes three things in the Tech Stack section (app/page.js)
//
//   1. Icon + label colors did not follow the light/dark switch.
//      Cause: colors were read once with motionValue.get() (a snapshot taken at
//      render time) and the icons used hard-coded brand hex values, so black
//      icons (Next.js, Express, JWT, Vercel, GitHub) vanished on the dark page.
//      Fix: icons and labels are now bound to the live theme motion values, so
//      they cross-fade together with the rest of the page.
//
//   2. Icons are no longer inside a bordered "widget" box. Just icon + name.
//
//   3. Rubber tabs getting stuck when pressed repeatedly. Causes:
//        - pressing the thumb itself froze it mid-stretch and, because the tab
//          was already "committed", nothing ever finished the animation;
//        - a missed pointerup left a stale drag that swallowed every later press;
//        - quick presses stretched from the *old* tab instead of from where the
//          thumb really was.
//      Fix: tapping the thumb always settles it, stale drags are reset on the
//      next press, the stretch starts from the thumb's live position, and a
//      small watchdog snaps the thumb to the active tab if it ever ends up
//      anywhere else.
//
// By default every icon follows the theme ink (near-white in dark mode,
// near-black in light mode). To keep colorful brand colors for the non-black
// icons, set KEEP_BRAND_COLORS = true in app/page.js after patching.
//
// Run from the project root:   node patch-tech-stack-icons-and-stuck.mjs
// Then:                        npm run dev
//                               git add . && git commit -m "Theme-aware icons, no icon widget, fix stuck tabs" && git push
// A backup of the changed file goes into .patch-backups/

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app", "page.js");

if (!fs.existsSync(pagePath)) {
  console.error("Cannot find " + pagePath + "\nRun this script from the bycarlo-portfolio root folder.");
  process.exit(1);
}

const raw = fs.readFileSync(pagePath, "utf8");
const crlf = raw.includes("\r\n");
let text = raw.replace(/\r\n/g, "\n");

const fail = (msg) => {
  console.error("Patch aborted, nothing was written.\n" + msg);
  process.exit(1);
};

if (text.includes("KEEP_BRAND_COLORS")) {
  console.log("This patch is already applied. Nothing to do.");
  process.exit(0);
}
if (!text.includes("function TechStack(") || !text.includes("RUBBER_SPRING_UI")) {
  fail("Could not find the rubber Tech Stack code in app/page.js.");
}

const count = (t, s) => t.split(s).length - 1;
const replaceOnce = (t, find, rep, label) => {
  const n = count(t, find);
  if (n !== 1) fail("Expected exactly 1 match for " + label + ", found " + n + ". Did page.js change since this patch was written?");
  return t.split(find).join(rep);
};

/* ======================================================================= */
/* 1. Config constants (above the tech data)                               */
/* ======================================================================= */

text = replaceOnce(
  text,
  "/* ── Tech stack data (edit icons/labels here) ─────── */",
  [
    "/* ── Icon coloring ─────────────────────────────────",
    "   false = every icon follows the theme (light text in dark mode, dark text in light mode)",
    "   true  = keep each icon's brand color, but near-black brand icons still follow the theme */",
    "const KEEP_BRAND_COLORS = false;",
    'const NEAR_BLACK_BRANDS = ["#000000", "#181717"];',
    "",
    "/* ── Tech stack data (edit icons/labels here) ─────── */",
  ].join("\n"),
  "tech data header comment"
);

/* ======================================================================= */
/* 2. Refs + watchdog                                                      */
/* ======================================================================= */

text = replaceOnce(
  text,
  "  const gen = useRef(0);\n  const glide = 75;",
  "  const gen = useRef(0);\n  const watchdog = useRef(0);\n  const glide = 75;",
  "gen ref"
);

text = replaceOnce(
  text,
  "  const measure = useCallback(() => {",
  [
    "  // Safety net: some time after the last interaction, if the thumb is not sitting",
    "  // on the active tab (interrupted spring, lost pointer event...), put it there.",
    "  const armWatchdog = useCallback(() => {",
    "    clearTimeout(watchdog.current);",
    "    watchdog.current = setTimeout(() => {",
    "      if (drag.current) return;",
    "      const s = slots.current[committed.current];",
    "      if (!s) return;",
    "      if (Math.abs(edgeL.get() - s.l) > 0.5 || Math.abs(edgeR.get() - s.r) > 0.5) jumpTo(committed.current);",
    "    }, 800);",
    "  }, [edgeL, edgeR, jumpTo]);",
    "",
    "  const measure = useCallback(() => {",
  ].join("\n"),
  "measure() start"
);

text = replaceOnce(
  text,
  "  useEffect(() => () => { clearTimeout(handoff.current); edgeL.stop(); edgeR.stop(); }, [edgeL, edgeR]);",
  "  useEffect(() => () => { clearTimeout(handoff.current); clearTimeout(watchdog.current); edgeL.stop(); edgeR.stop(); }, [edgeL, edgeR]);",
  "unmount cleanup"
);

/* ======================================================================= */
/* 3. travel(): stretch from the thumb's live position                     */
/* ======================================================================= */

text = replaceOnce(
  text,
  [
    "  const travel = useCallback((from, to) => {",
    "    const a = slots.current[from];",
    "    const b = slots.current[to];",
    "    if (!a || !b) return;",
    "    clearTimeout(handoff.current);",
    "    gen.current += 1;",
    "    const tween = { duration: RUBBER_DILATE, ease: RUBBER_EASE_OUT };",
    "    animate(edgeL, b.l + (Math.min(a.l, b.l) - b.l), tween);",
    "    animate(edgeR, b.r + (Math.max(a.r, b.r) - b.r), tween);",
    "    handoff.current = setTimeout(() => land(to, null, false, true), RUBBER_HANDOFF * 1000);",
    "  }, [edgeL, edgeR, land]);",
  ].join("\n"),
  [
    "  const travel = useCallback((from, to) => {",
    "    const b = slots.current[to];",
    "    if (!b) return;",
    "    clearTimeout(handoff.current);",
    "    gen.current += 1;",
    "    // stretch from where the thumb actually is right now, not from where the",
    "    // previous tab was, so rapid presses never snap or get left behind",
    "    const l0 = edgeL.get();",
    "    const r0 = edgeR.get();",
    "    const tween = { duration: RUBBER_DILATE, ease: RUBBER_EASE_OUT };",
    "    animate(edgeL, Math.min(l0, b.l), tween);",
    "    animate(edgeR, Math.max(r0, b.r), tween);",
    "    handoff.current = setTimeout(() => land(to, null, false, true), RUBBER_HANDOFF * 1000);",
    "    armWatchdog();",
    "  }, [edgeL, edgeR, land, armWatchdog]);",
  ].join("\n"),
  "travel()"
);

/* ======================================================================= */
/* 4. Pointer handling                                                     */
/* ======================================================================= */

text = replaceOnce(
  text,
  "    if (drag.current || e.button !== 0) return;",
  "    if (e.button !== 0) return;\n    drag.current = null; // a stale drag must never swallow a new press",
  "pointerdown guard"
);

text = replaceOnce(
  text,
  [
    "    if (!d.live) {",
    "      if (Math.abs(x - d.x0) <= RUBBER_SLOP && d.slot !== committed.current) {",
    "        const from = committed.current;",
    "        commit(d.slot);",
    "        travel(from, d.slot);",
    "      }",
    "      return;",
    "    }",
  ].join("\n"),
  [
    "    if (!d.live) {",
    "      if (Math.abs(x - d.x0) <= RUBBER_SLOP && d.slot !== committed.current) {",
    "        const from = committed.current;",
    "        commit(d.slot);",
    "        travel(from, d.slot);",
    "      } else if (d.onThumb) {",
    "        // the press froze the thumb; always let it finish on the active tab",
    "        land(committed.current, null, false, false);",
    "      }",
    "      armWatchdog();",
    "      return;",
    "    }",
  ].join("\n"),
  "pointerup tap branch"
);

text = replaceOnce(
  text,
  "    commit(to);\n    land(to, v, flick, flick);\n  };",
  "    commit(to);\n    land(to, v, flick, flick);\n    armWatchdog();\n  };",
  "pointerup drag end"
);

text = replaceOnce(
  text,
  "    release();\n    if (!d.live) return;\n    land(committed.current, null, false, false);\n  };",
  [
    "    release();",
    "    if (d.live || d.onThumb) land(committed.current, null, false, false);",
    "    armWatchdog();",
    "  };",
  ].join("\n"),
  "pointercancel"
);

/* ======================================================================= */
/* 5. Live theme colors on tab labels                                      */
/* ======================================================================= */

text = replaceOnce(text, "            <button\n              key={cat.label}", "            <motion.button\n              key={cat.label}", "tab button open");
text = replaceOnce(
  text,
  "              style={{ color: inkIdle.get(), opacity: i === active ? 0 : 0.7 }}\n            >\n              {cat.label}\n            </button>",
  "              style={{ color: inkIdle, opacity: i === active ? 0 : 0.7 }}\n            >\n              {cat.label}\n            </motion.button>",
  "tab button style/close"
);

text = replaceOnce(
  text,
  [
    "              <span",
    "                key={cat.label}",
    '                className="flex items-center justify-center px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap"',
    "                style={{ color: inkActive.get() }}",
    "              >",
    "                {cat.label}",
    "              </span>",
  ].join("\n"),
  [
    "              <motion.span",
    "                key={cat.label}",
    '                className="flex items-center justify-center px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap"',
    "                style={{ color: inkActive }}",
    "              >",
    "                {cat.label}",
    "              </motion.span>",
  ].join("\n"),
  "thumb label"
);

/* ======================================================================= */
/* 6. Counter + icon grid: live colors, no widget box                      */
/* ======================================================================= */

text = replaceOnce(
  text,
  [
    '        <p className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: mutedColor.get() }}>',
    '          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}',
    "        </p>",
  ].join("\n"),
  [
    '        <motion.p className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: mutedColor }}>',
    '          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}',
    "        </motion.p>",
  ].join("\n"),
  "counter"
);

text = replaceOnce(
  text,
  [
    '            <div key={tool.name} className="flex flex-col items-center gap-2">',
    "              <div",
    '                className="w-12 h-12 flex items-center justify-center rounded-2xl border"',
    "                style={{ borderColor: borderColor.get() }}",
    "              >",
    '                <tool.Icon size={22} color={tool.color} style={{ opacity: 0.9 }} />',
    "              </div>",
    '              <span className="text-[11px] font-medium" style={{ color: mutedColor.get() }}>{tool.name}</span>',
    "            </div>",
  ].join("\n"),
  [
    '            <div key={tool.name} className="flex flex-col items-center gap-3">',
    "              {/* no box around the icon; it inherits `color`, which tracks the theme live */}",
    "              <motion.span",
    '                className="flex items-center justify-center"',
    "                style={{",
    "                  color: KEEP_BRAND_COLORS && !NEAR_BLACK_BRANDS.includes(tool.color) ? tool.color : textColor,",
    "                }}",
    "              >",
    "                <tool.Icon size={30} />",
    "              </motion.span>",
    '              <motion.span className="text-[11px] font-medium" style={{ color: mutedColor }}>{tool.name}</motion.span>',
    "            </div>",
  ].join("\n"),
  "icon grid item"
);

/* ======================================================================= */
/* 7. Write out                                                            */
/* ======================================================================= */

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(pagePath, path.join(backupDir, "page.js." + Date.now() + ".bak"));

fs.writeFileSync(pagePath, crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");

console.log("Done:");
console.log("  - icons + labels now follow the light/dark theme live");
console.log("  - icon boxes removed");
console.log("  - rubber tabs no longer get stuck on repeated presses");
console.log("(backup saved in .patch-backups/)");
console.log("");
console.log("Next steps:");
console.log("  1. npm run dev");
console.log('  2. git add . && git commit -m "Theme-aware icons, no icon widget, fix stuck tabs" && git push');
