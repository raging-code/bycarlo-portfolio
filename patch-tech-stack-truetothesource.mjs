// patch-tech-stack-truetothesource.mjs
// byCarlo: rebuilds the Tech Stack tab bar to match RubberSegment's *actual*
// rendering technique, which the previous patches approximated incorrectly.
//
// The real component is NOT "dim labels + a separate colored capsule sliding
// behind them". It is two full stacked layers of the SAME labels:
//   1. a bottom layer, laid out on a CSS grid, drawn at idle opacity/color
//   2. a top layer, same grid, drawn at active color, with a clip-path that
//      reveals only the slice over the currently selected slot
// Dragging/animating only moves the clip-path inset — the "window" tears
// across the two label layers, which is what gives it that specific feel
// and lets the active label be a flatly different color with no cross-fade.
//
// This patch replaces the tab bar JSX (track + thumb + buttons) in the
// TechStack function with that two-layer structure, matching the grid
// layout (grid-auto-flow: column) the original CSS uses so both layers'
// columns stay pixel-aligned.
//
// Requires patch-tech-stack.mjs, patch-tech-stack-rubber.mjs and
// patch-tech-stack-fixes.mjs to already be applied.
//
// Run from the project root:   node patch-tech-stack-truetothesource.mjs
// Then:                        npm run dev
//                               git add . && git commit -m "Rebuild tabs to match RubberSegment structure" && git push
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
if (page.text.includes("rubber-segment__copy-layer")) {
  console.log("True-to-source tab structure is already applied. Nothing to do.");
  process.exit(0);
}
if (!page.text.includes("RUBBER_SPRING_UI")) {
  fail("Could not find rubber-physics tab code. Run patch-tech-stack-rubber.mjs first.");
}

/* helpers ---------------------------------------------------------------- */
const count = (t, s) => t.split(s).length - 1;
const replaceOnce = (t, find, rep, label) => {
  const n = count(t, find);
  if (n !== 1) fail("Expected exactly 1 match for " + label + ", found " + n + ". Did page.js change since this patch was written?");
  return t.split(find).join(rep);
};

let text = page.text;

/* ======================================================================= */
/* 1. Replace the track/thumb color setup: we no longer need idleInk /     */
/*    activeInk as separate motion values for inline style swapping —     */
/*    the two-layer CSS grid handles idle vs active via opacity + a fixed  */
/*    ink color per layer, matching --rs-ink / --rs-ink-active exactly.    */
/* ======================================================================= */

text = replaceOnce(
  text,
  `  // Solid dark-track / light-thumb contrast like the original RubberSegment,
  // swapped per theme: dark mode gets a light track + dark thumb instead.
  const trackBg = useTransform(themeProgress, [0, 1], ["#27272a", "#e4e4e7"]);
  const thumbBg = useTransform(themeProgress, [0, 1], ["#fafafa", "#18181b"]);
  const idleInk = useTransform(themeProgress, [0, 1], ["rgba(250,250,250,0.7)", "rgba(24,24,27,0.6)"]);
  const activeInk = useTransform(themeProgress, [0, 1], ["#18181b", "#fafafa"]);`,
  `  // Matches the original RubberSegment CSS variables 1:1, swapped per theme:
  // light mode = --rs-track:#27272a / --rs-thumb:#fafafa (dark track, light thumb)
  // dark mode  = inverted, so the pill still reads clearly against a dark page.
  const trackBg = useTransform(themeProgress, [0, 1], ["#27272a", "#e4e4e7"]);
  const thumbBg = useTransform(themeProgress, [0, 1], ["#fafafa", "#18181b"]);
  const inkIdle = useTransform(themeProgress, [0, 1], ["#fafafa", "#18181b"]); // --rs-ink, opacity 0.7 in CSS
  const inkActive = useTransform(themeProgress, [0, 1], ["#18181b", "#fafafa"]); // --rs-ink-active, full opacity`,
  "trackBg/thumbBg/ink definitions"
);

/* ======================================================================= */
/* 2. Replace the tab bar JSX with the real two-layer structure.           */
/* ======================================================================= */

const OLD_JSX = `        <motion.div
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
              className="relative z-10 px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap cursor-pointer transition-opacity"
              style={{ color: i === active ? activeInk.get() : idleInk.get() }}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>`;

const NEW_JSX = `        <motion.div
          ref={trackRef}
          role="radiogroup"
          aria-label="Tech stack category"
          className="relative inline-grid p-1 rounded-2xl mb-8 touch-pan-y select-none"
          style={{ background: trackBg, gridAutoFlow: "column", gridAutoColumns: "auto" }}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, ease: E }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handlePointerCancel}
        >
          {/* bottom layer: idle labels at reduced opacity (--rs-ink, opacity 0.7) */}
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
              className="flex items-center justify-center px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap cursor-pointer"
              style={{ color: inkIdle.get(), opacity: i === active ? 0 : 0.7 }}
            >
              {cat.label}
            </button>
          ))}

          {/* top layer: the clipped "thumb" — same grid, same labels, full-opacity
              active ink, revealed only where the clip-path window currently sits */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-1 grid pointer-events-none"
            style={{ gridAutoFlow: "column", gridAutoColumns: "auto", background: thumbBg, clipPath }}
          >
            {TECH_CATEGORIES.map((cat) => (
              <span
                key={cat.label}
                className="flex items-center justify-center px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap"
                style={{ color: inkActive.get() }}
              >
                {cat.label}
              </span>
            ))}
          </motion.div>
        </motion.div>`;

text = replaceOnce(text, OLD_JSX, NEW_JSX, "tab bar JSX block");

/* ======================================================================= */
/* 3. Write out                                                            */
/* ======================================================================= */

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(pagePath, path.join(backupDir, "page.js." + Date.now() + ".bak"));

save(pagePath, { text, crlf: page.crlf });

console.log("Tab bar rebuilt to match RubberSegment's real two-layer clip-path structure.");
console.log("(backup saved in .patch-backups/)");
console.log("");
console.log("Next steps:");
console.log("  1. npm run dev");
console.log('  2. git add . && git commit -m "Rebuild tabs to match RubberSegment structure" && git push');
