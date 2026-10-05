// patch-tech-stack-hover-spin-bigger.mjs
// byCarlo: three Tech Stack changes.
//
//   1. Icons are 1.3x bigger (30px -> 39px). The 3D depth, perspective and
//      spacing all scale with the size automatically.
//
//   2. The 3D rotation now plays ONCE when the cursor points at an icon
//      (desktop) or when it is tapped (phones/tablets), instead of looping
//      every few seconds. It can't be re-triggered while it is turning; once it
//      finishes, pointing at it again turns it again. The pointer target is
//      slightly larger than the icon itself so it is easy to hit on a phone.
//
//   3. Mobile tabs are a little bigger, while still fitting the screen:
//        height:    tab padding 6px -> 9px         (about 26px -> 31px tall)
//        font:      clamp(8.5px, 2.7vw, 13px) -> clamp(9px, 2.95vw, 13px)
//        side pad:  clamp(4px, 1.5vw, 16px)  -> clamp(3px, 1.2vw, 16px)
//      (side padding is trimmed slightly and the bar gets 4px more room on each
//       side so the larger text still fits on a 320px phone.)
//      Desktop (768px and up) is unchanged.
//
// Tune later:
//   page.js     ICON3D_SIZE                      icon size in px
//   globals.css 0.9s in .ts-icon3d.is-spinning   speed of the single turn
//   globals.css --ts-pad-y / the clamp() values  mobile tab height / font
//
// Requires patch-tech-stack-3d-icons.mjs to already be applied.
//
// Run from the project root:   node patch-tech-stack-hover-spin-bigger.mjs
// Then:                        npm run dev
//                               git add . && git commit -m "Bigger icons, spin on hover/tap, bigger mobile tabs" && git push
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

if (text.includes("ICON3D_SIZE")) {
  console.log("This patch is already applied. Nothing to do.");
  process.exit(0);
}
if (!text.includes("function Icon3D(") || !styles.includes(".ts-seg")) {
  fail("Could not find the 3D icons / mobile tab code. Apply patch-tech-stack-3d-icons.mjs and patch-tech-stack-mobile-fit.mjs first.");
}

const count = (t, s) => t.split(s).length - 1;
const replaceOnce = (t, find, rep, label) => {
  const n = count(t, find);
  if (n !== 1) fail("Expected exactly 1 match for " + label + ", found " + n + ". Did the file change since this patch was written?");
  return t.split(find).join(rep);
};

/* ======================================================================= */
/* 1. Size constant                                                        */
/* ======================================================================= */

text = replaceOnce(
  text,
  "const ICON3D_THICKNESS = 0.36;  // total thickness as a fraction of the icon size",
  [
    "const ICON3D_THICKNESS = 0.36;  // total thickness as a fraction of the icon size",
    "const ICON3D_SIZE = 39;         // icon size in px (was 30, now 1.3x bigger)",
  ].join("\n"),
  "ICON3D_THICKNESS constant"
);

text = replaceOnce(text, "                size={30}\n", "                size={ICON3D_SIZE}\n", "Icon3D size prop");

/* ======================================================================= */
/* 2. Spin once on pointer enter / tap                                     */
/* ======================================================================= */

text = replaceOnce(
  text,
  "function Icon3D({ Icon, size = 30, face }) {\n",
  [
    "function Icon3D({ Icon, size = ICON3D_SIZE, face }) {",
    "  // one turn per hover (mouse) or tap (touch); ignored while it is already turning",
    "  const [spinning, setSpinning] = useState(false);",
    "",
  ].join("\n"),
  "Icon3D head"
);

text = replaceOnce(
  text,
  [
    "  return (",
    '    <span className="ts-icon3d-wrap" aria-hidden="true" style={{ width: size, height: size, perspective: size * 15 }}>',
    '      <span className="ts-icon3d">{layers}</span>',
    "    </span>",
    "  );",
  ].join("\n"),
  [
    "  return (",
    '    <span className="ts-icon3d-hit" onPointerEnter={() => setSpinning(true)}>',
    '      <span className="ts-icon3d-wrap" aria-hidden="true" style={{ width: size, height: size, perspective: size * 15 }}>',
    "        <span",
    '          className={"ts-icon3d" + (spinning ? " is-spinning" : "")}',
    "          onAnimationEnd={(e) => { if (e.target === e.currentTarget) setSpinning(false); }}",
    "        >",
    "          {layers}",
    "        </span>",
    "      </span>",
    "    </span>",
    "  );",
  ].join("\n"),
  "Icon3D return"
);

/* ======================================================================= */
/* 3. Mobile tab bar gets 4px more room per side                           */
/* ======================================================================= */

text = replaceOnce(text, 'className="flex justify-center -mx-3 md:mx-0 mb-8"', 'className="flex justify-center -mx-4 md:mx-0 mb-8"', "tab bar wrapper");

/* ======================================================================= */
/* 4. CSS                                                                  */
/* ======================================================================= */

styles = replaceOnce(
  styles,
  [
    ".ts-seg {",
    "  --ts-pad-y: 6px;                     /* phone tab height: bigger number = taller tabs */",
    "  font-size: clamp(8.5px, 2.7vw, 13px);",
    "  line-height: 1.2;",
    "  padding: var(--ts-pad-y) clamp(4px, 1.5vw, 16px);",
    "}",
  ].join("\n"),
  [
    ".ts-seg {",
    "  --ts-pad-y: 9px;                     /* phone tab height: bigger number = taller tabs */",
    "  font-size: clamp(9px, 2.95vw, 13px);",
    "  line-height: 1.2;",
    "  padding: var(--ts-pad-y) clamp(3px, 1.2vw, 16px);",
    "}",
  ].join("\n"),
  ".ts-seg block"
);

styles = replaceOnce(
  styles,
  ".ts-icon3d {\n  position: absolute;\n  inset: 0;\n  transform-style: preserve-3d;\n  animation: ts-turn 5s infinite;\n  will-change: transform;\n}",
  [
    "/* slightly larger pointer target than the icon itself (easy to tap on phones) */",
    ".ts-icon3d-hit {",
    "  display: block;",
    "  padding: 8px;",
    "  margin: -8px;",
    "  -webkit-tap-highlight-color: transparent;",
    "}",
    ".ts-icon3d {",
    "  position: absolute;",
    "  inset: 0;",
    "  transform-style: preserve-3d;",
    "  will-change: transform;",
    "}",
    "/* one horizontal turn, started by hover / tap (class is set from JS) */",
    ".ts-icon3d.is-spinning {",
    "  animation: ts-turn-once 0.9s cubic-bezier(0.65, 0, 0.25, 1);",
    "}",
  ].join("\n"),
  ".ts-icon3d block"
);

styles = replaceOnce(
  styles,
  [
    "@keyframes ts-turn {",
    "  0%   { transform: rotateY(0deg);   animation-timing-function: cubic-bezier(0.65, 0, 0.25, 1); }",
    "  24%  { transform: rotateY(360deg); }",
    "  100% { transform: rotateY(360deg); }",
    "}",
  ].join("\n"),
  [
    "@keyframes ts-turn-once {",
    "  from { transform: rotateY(0deg); }",
    "  to   { transform: rotateY(360deg); }",
    "}",
  ].join("\n"),
  "ts-turn keyframes"
);

styles = replaceOnce(
  styles,
  "  .ts-icon3d { animation: none; }",
  "  .ts-icon3d.is-spinning { animation: none; }",
  "reduced motion rule"
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
console.log("  - icons are 1.3x bigger (39px)");
console.log("  - 3D icons turn once on hover / tap instead of looping");
console.log("  - mobile tabs: a little taller and larger text, still fitting the screen");
console.log("(backups saved in .patch-backups/)");
console.log("");
console.log("Next steps:");
console.log("  1. npm run dev");
console.log('  2. git add . && git commit -m "Bigger icons, spin on hover/tap, bigger mobile tabs" && git push');
