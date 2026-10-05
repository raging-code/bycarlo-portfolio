// patch-tech-stack-fixes.mjs
// byCarlo: fixes two problems with the rubber-physics Tech Stack tabs.
//
//   1. Build error: 'SiVisualstudiocode' does not exist in react-icons/si in
//      this version (5.7.x) — Simple Icons has no VS Code brand mark. Swapped
//      to VscVscode from react-icons/vsc (the actual VS Code logo icon set).
//
//   2. Tabs didn't read as "RubberSegment": the track and thumb colors were
//      near-invisible low-opacity tints of the page background, so there was
//      almost no contrast between track / thumb / page. The real component
//      uses a solid dark track with a solid light thumb (or the reverse) —
//      restyled to match that, swapping per your site's light/dark theme,
//      with idle labels at reduced opacity like the original CSS.
//
// Requires patch-tech-stack.mjs and patch-tech-stack-rubber.mjs to already be applied.
//
// Run from the project root:   node patch-tech-stack-fixes.mjs
// Then:                        npm run dev
//                               git add . && git commit -m "Fix tech stack icon + styling" && git push
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
  fail("Could not find function TechStack( in app/page.js.\nRun patch-tech-stack.mjs and patch-tech-stack-rubber.mjs first.");
}
if (page.text.includes("VscVscode")) {
  console.log("Tech stack fixes are already applied. Nothing to do.");
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
/* 1. Fix the broken icon import                                           */
/* ======================================================================= */

text = replaceOnce(
  text,
  "  SiVisualstudiocode,\n  SiEslint,",
  "  SiEslint,",
  "SiVisualstudiocode import line"
);
text = replaceOnce(
  text,
  '} from "react-icons/si";',
  '} from "react-icons/si";\nimport { VscVscode } from "react-icons/vsc";',
  "react-icons/si import block end"
);
text = replaceOnce(
  text,
  '{ name: "VS Code", Icon: SiVisualstudiocode, color: "#007ACC" },',
  '{ name: "VS Code", Icon: VscVscode, color: "#007ACC" },',
  "VS Code tool entry"
);

/* ======================================================================= */
/* 2. Restyle the tab bar for real track/thumb contrast                    */
/* ======================================================================= */

text = replaceOnce(
  text,
  '  const trackBg = useTransform(themeProgress, [0, 1], ["rgba(255,255,255,0.06)", "rgba(0,0,0,0.04)"]);\n  const thumbBg = useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]);',
  [
    '  // Solid dark-track / light-thumb contrast like the original RubberSegment,',
    '  // swapped per theme: dark mode gets a light track + dark thumb instead.',
    '  const trackBg = useTransform(themeProgress, [0, 1], ["#27272a", "#e4e4e7"]);',
    '  const thumbBg = useTransform(themeProgress, [0, 1], ["#fafafa", "#18181b"]);',
    '  const idleInk = useTransform(themeProgress, [0, 1], ["rgba(250,250,250,0.7)", "rgba(24,24,27,0.6)"]);',
    '  const activeInk = useTransform(themeProgress, [0, 1], ["#18181b", "#fafafa"]);',
  ].join("\n"),
  "trackBg/thumbBg definitions"
);

text = replaceOnce(
  text,
  `              className="relative z-10 px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap cursor-pointer"
              style={{ color: i === active ? textColor.get() : mutedColor.get() }}`,
  `              className="relative z-10 px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl whitespace-nowrap cursor-pointer transition-opacity"
              style={{ color: i === active ? activeInk.get() : idleInk.get() }}`,
  "tab button style"
);

/* ======================================================================= */
/* 3. Write out                                                            */
/* ======================================================================= */

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(pagePath, path.join(backupDir, "page.js." + Date.now() + ".bak"));

save(pagePath, { text, crlf: page.crlf });

console.log("Fixed: VS Code icon import, and tab bar now has real track/thumb contrast.");
console.log("(backup saved in .patch-backups/)");
console.log("");
console.log("Next steps:");
console.log("  1. npm run dev");
console.log('  2. git add . && git commit -m "Fix tech stack icon + styling" && git push');
