// patch-tech-stack-spin-on-change.mjs
// byCarlo: Tech Stack icons now do their horizontal turn (the same rotateY 360
// animation as hover / tap) every time the category changes.
//
//   - Hover (desktop) and tap (touch) still work exactly as before.
//   - The page-load render does NOT spin; only real category switches do.
//   - Icons in the new category get a small left-to-right stagger.
//   - prefers-reduced-motion is still respected (existing CSS rule).
//
// Tune later:
//   page.js     ICON3D_STAGGER_MS   delay between icons on category change
//   globals.css 0.9s in .ts-icon3d.is-spinning   speed of the turn (unchanged)
//
// Safe to run more than once (it detects its own changes).
// Run from the project root:   node patch-tech-stack-spin-on-change.mjs
// Then:                        npm run dev
// Backups go into .patch-backups/

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

if (text.includes("ICON3D_STAGGER_MS")) {
  console.log("Already applied, nothing to do.");
  process.exit(0);
}

const replaceOnce = (from, to, label) => {
  const first = text.indexOf(from);
  if (first === -1) fail("Could not find: " + label);
  if (text.indexOf(from, first + 1) !== -1) fail("Found more than once: " + label);
  text = text.replace(from, () => to);
};

// 1. stagger constant
replaceOnce(
  "const ICON3D_SIZE = 39;",
  "const ICON3D_STAGGER_MS = 70;   // delay between icons when the category changes\nconst ICON3D_SIZE = 39;",
  "ICON3D_SIZE constant"
);

// 2. Icon3D accepts autoSpin + index, starts spinning on mount when asked
replaceOnce(
  "function Icon3D({ Icon, size = ICON3D_SIZE, face }) {",
  "function Icon3D({ Icon, size = ICON3D_SIZE, face, autoSpin = false, index = 0 }) {",
  "Icon3D signature"
);
replaceOnce(
  "const [spinning, setSpinning] = useState(false);\n  const step =",
  "// autoSpin: the icon mounts already turning (used when the category changes)\n  const [spinning, setSpinning] = useState(autoSpin);\n  const [autoDelay, setAutoDelay] = useState(autoSpin ? index * ICON3D_STAGGER_MS : 0);\n  const step =",
  "Icon3D spinning state"
);
replaceOnce(
  "onPointerEnter={() => setSpinning(true)}>",
  "onPointerEnter={() => { setAutoDelay(0); setSpinning(true); }}>",
  "Icon3D hover handler"
);
replaceOnce(
  'className={"ts-icon3d" + (spinning ? " is-spinning" : "")}\n          onAnimationEnd={(e) => { if (e.target === e.currentTarget) setSpinning(false); }}',
  'className={"ts-icon3d" + (spinning ? " is-spinning" : "")}\n          style={autoDelay ? { animationDelay: autoDelay + "ms" } : undefined}\n          onAnimationEnd={(e) => { if (e.target === e.currentTarget) { setSpinning(false); setAutoDelay(0); } }}',
  "Icon3D wrapper element"
);

// 3. TechStack: remember whether the category has ever changed
replaceOnce(
  "function TechStack({ themeProgress }) {\n  const ref = useRef(null);\n  const inView = useInView(ref, { once: true, margin: \"-10%\" });\n  const [active, setActive] = useState(0);\n",
  "function TechStack({ themeProgress }) {\n  const ref = useRef(null);\n  const inView = useInView(ref, { once: true, margin: \"-10%\" });\n  const [active, setActive] = useState(0);\n  // icons spin on mount only after the category has actually changed (not on page load)\n  const initialActive = useRef(active);\n  const switched = useRef(false);\n  if (active !== initialActive.current) switched.current = true;\n",
  "TechStack active state"
);

// 4. pass autoSpin + index to each icon
replaceOnce(
  "{current.tools.map((tool) => (",
  "{current.tools.map((tool, toolIndex) => (",
  "tools map"
);
replaceOnce(
  "                size={ICON3D_SIZE}\n                face=",
  "                size={ICON3D_SIZE}\n                autoSpin={switched.current}\n                index={toolIndex}\n                face=",
  "Icon3D usage"
);

// backup + write
const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, "page.js." + Date.now() + ".bak"), raw, "utf8");
fs.writeFileSync(pagePath, crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");

console.log("Done. Tech Stack icons now turn when the category changes (hover/tap unchanged).");
console.log("Next: npm run dev");
