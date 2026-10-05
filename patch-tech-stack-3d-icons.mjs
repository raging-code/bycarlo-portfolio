// patch-tech-stack-3d-icons.mjs
// byCarlo: turns the Tech Stack icons into 3D icons that rotate horizontally,
// in one place.
//
// Same icons as before (React, Next.js, Node, Docker...), but each one is now
// built from 14 stacked copies spaced along the depth axis, so it has real
// thickness. It faces forward at rest, then does one full horizontal turn
// (around its own center, so it never drifts) about every 5 seconds.
//
//   - Face color  = your site's text color, side/thickness colors = your site's
//                   gray tones. All of them follow the light/dark switch live.
//   - Rotation    = pure rotateY around the icon's center, all icons in sync.
//                   Switching category restarts it, so the new icons spin in.
//   - Reduced motion: the spin is turned off, the icons stay flat and still.
//
// Tune in app/page.js:   ICON3D_DEPTH (layers, more = smoother edge, heavier)
//                        ICON3D_THICKNESS (thickness as a fraction of icon size)
// Tune in app/globals.css: the 5s duration and the 24% (turn takes ~1.2s of 5s)
//                          in @keyframes ts-turn / .ts-icon3d
//
// Requires patch-tech-stack-icons-and-stuck.mjs to already be applied.
//
// Run from the project root:   node patch-tech-stack-3d-icons.mjs
// Then:                        npm run dev
//                               git add . && git commit -m "3D rotating tech stack icons" && git push
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

if (text.includes("function Icon3D(") || styles.includes("ts-icon3d")) {
  console.log("3D icons patch is already applied. Nothing to do.");
  process.exit(0);
}
if (!text.includes("KEEP_BRAND_COLORS") || !text.includes("function TechStack(")) {
  fail("Could not find the Tech Stack icon code. Apply patch-tech-stack-icons-and-stuck.mjs first.");
}

const count = (t, s) => t.split(s).length - 1;
const replaceOnce = (t, find, rep, label) => {
  const n = count(t, find);
  if (n !== 1) fail("Expected exactly 1 match for " + label + ", found " + n + ". Did the file change since this patch was written?");
  return t.split(find).join(rep);
};

/* ======================================================================= */
/* 1. Icon3D component (above TechStack)                                   */
/* ======================================================================= */

text = replaceOnce(
  text,
  "function TechStack({ themeProgress }) {",
  [
    "/* ── 3D icon: stacked copies along the depth axis = a thick, extruded icon ── */",
    "const ICON3D_DEPTH = 14;        // number of layers",
    "const ICON3D_THICKNESS = 0.36;  // total thickness as a fraction of the icon size",
    "",
    "// Colors come from CSS variables set on the icon grid, so they follow the theme live:",
    "//   --ic-face (front), --ic-a (side next to the face) -> --ic-b (back of the icon)",
    "function Icon3D({ Icon, size = 30, face }) {",
    "  const step = (size * ICON3D_THICKNESS) / (ICON3D_DEPTH - 1);",
    "  const half = (ICON3D_DEPTH - 1) / 2; // centers the thickness on z=0 so it spins around its own middle",
    "  const layers = [];",
    "  for (let k = ICON3D_DEPTH - 1; k >= 0; k--) {",
    "    const fromA = Math.round((1 - k / (ICON3D_DEPTH - 1)) * 100);",
    "    layers.push(",
    "      <span",
    "        key={k}",
    '        className="ts-icon3d-layer"',
    "        style={{",
    '          color: k === 0 ? face || "var(--ic-face)" : `color-mix(in srgb, var(--ic-a) ${fromA}%, var(--ic-b))`,',
    "          transform: `translateZ(${((half - k) * step).toFixed(2)}px)`,",
    "        }}",
    "      >",
    "        <Icon size={size} />",
    "      </span>",
    "    );",
    "  }",
    "  return (",
    '    <span className="ts-icon3d-wrap" aria-hidden="true" style={{ width: size, height: size, perspective: size * 15 }}>',
    '      <span className="ts-icon3d">{layers}</span>',
    "    </span>",
    "  );",
    "}",
    "",
    "function TechStack({ themeProgress }) {",
  ].join("\n"),
  "TechStack function start"
);

/* ======================================================================= */
/* 2. Theme-driven side colors                                             */
/* ======================================================================= */

text = replaceOnce(
  text,
  "  const clipPath = useTransform(",
  [
    "  // 3D icon colors (face = site text color, thickness = site gray tones), all theme-live",
    '  const iconSideA = useTransform(themeProgress, [0, 1], ["rgb(189,189,189)", "rgb(85,85,85)"]);',
    '  const iconSideB = useTransform(themeProgress, [0, 1], ["rgb(96,96,96)", "rgb(170,170,170)"]);',
    "  const clipPath = useTransform(",
  ].join("\n"),
  "clipPath definition"
);

/* ======================================================================= */
/* 3. Grid: set the color variables, render Icon3D                         */
/* ======================================================================= */

text = replaceOnce(
  text,
  '          className="flex flex-wrap justify-center gap-x-[3%] gap-y-7 md:gap-x-6 max-w-[420px] mx-auto"\n',
  [
    '          className="flex flex-wrap justify-center gap-x-[3%] gap-y-7 md:gap-x-6 max-w-[420px] mx-auto"',
    '          style={{ "--ic-face": textColor, "--ic-a": iconSideA, "--ic-b": iconSideB }}',
    "",
  ].join("\n"),
  "icon grid className"
);

text = replaceOnce(
  text,
  [
    "              {/* no box around the icon; it inherits `color`, which tracks the theme live */}",
    "              <motion.span",
    '                className="flex items-center justify-center"',
    "                style={{",
    "                  color: KEEP_BRAND_COLORS && !NEAR_BLACK_BRANDS.includes(tool.color) ? tool.color : textColor,",
    "                }}",
    "              >",
    "                <tool.Icon size={30} />",
    "              </motion.span>",
  ].join("\n"),
  [
    "              {/* 3D icon, no box around it; colors follow the theme live */}",
    "              <Icon3D",
    "                Icon={tool.Icon}",
    "                size={30}",
    "                face={KEEP_BRAND_COLORS && !NEAR_BLACK_BRANDS.includes(tool.color) ? tool.color : undefined}",
    "              />",
  ].join("\n"),
  "icon block"
);

/* ======================================================================= */
/* 4. CSS                                                                  */
/* ======================================================================= */

styles =
  styles.replace(/\n*$/, "\n") +
  [
    "",
    "/* Tech stack 3D icons: face forward, one horizontal turn in place every few seconds */",
    ".ts-icon3d-wrap {",
    "  position: relative;",
    "  display: block;",
    "}",
    ".ts-icon3d {",
    "  position: absolute;",
    "  inset: 0;",
    "  transform-style: preserve-3d;",
    "  animation: ts-turn 5s infinite;",
    "  will-change: transform;",
    "}",
    ".ts-icon3d-layer {",
    "  position: absolute;",
    "  inset: 0;",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "}",
    "@keyframes ts-turn {",
    "  0%   { transform: rotateY(0deg);   animation-timing-function: cubic-bezier(0.65, 0, 0.25, 1); }",
    "  24%  { transform: rotateY(360deg); }",
    "  100% { transform: rotateY(360deg); }",
    "}",
    "@media (prefers-reduced-motion: reduce) {",
    "  .ts-icon3d { animation: none; }",
    "}",
    "",
  ].join("\n");

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
console.log("  - tech stack icons are now 3D (14 stacked layers), same icons");
console.log("  - they face forward and rotate horizontally in place, in sync");
console.log("  - colors follow the light/dark theme live");
console.log("(backups saved in .patch-backups/)");
console.log("");
console.log("Next steps:");
console.log("  1. npm run dev");
console.log('  2. git add . && git commit -m "3D rotating tech stack icons" && git push');
