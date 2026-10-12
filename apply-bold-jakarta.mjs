#!/usr/bin/env node
// Switches the byCarlo portfolio typography to "D · Bold Jakarta":
//   display / headings : Plus Jakarta Sans  (500 / 600 / 700 / 800)
//   body / labels      : DM Sans            (400 / 500 / 600 / 700)
//
// Usage (run from the project root; commit first so you can review with git diff):
//   node apply-bold-jakarta.mjs --dry-run   (shows what would change, writes nothing)
//   node apply-bold-jakarta.mjs             (applies the patch)
//
// What it does
//   app/layout.js        loads Plus Jakarta Sans + DM Sans through next/font (self-hosted, no layout shift)
//   app/globals.css      removes the Titillium/Poppins @import, points --font-display / --font-body at the new
//                        fonts, and moves the tech-stack tabs to the body font so six tabs still fit on phones
//   tailwind.config.js   updates the font comments
//   app/page.js          headings go to 800 with tighter tracking (-0.055em / -0.045em), the 900 weight
//                        (Jakarta stops at 800) becomes 800, eyebrow labels become bold with 0.18em tracking,
//                        the testimonial is no longer italic, and the Contact heading is scaled down a little
//                        because Jakarta is wider than Titillium Web.
//
// Safe to re-run: steps that are already applied are skipped.

import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry-run");
const ROOT = process.cwd();

const files = {};
const changed = new Set();
let warnings = 0;

function load(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    console.error(`✗ ${rel} not found. Run this from the project root.`);
    process.exit(1);
  }
  files[rel] = fs.readFileSync(p, "utf8");
}

// Replace every occurrence of `from` with `to`. Already applied -> skip quietly. Missing -> warn.
function rep(rel, from, to, label) {
  const src = files[rel];
  const isRe = from instanceof RegExp;
  const found = isRe ? from.test(src) : src.includes(from);
  if (found) {
    files[rel] = isRe ? src.replace(from, to) : src.split(from).join(to);
    changed.add(rel);
    console.log(`  ✓ ${label}`);
  } else if (!isRe && src.includes(to)) {
    console.log(`  - already applied: ${label}`);
  } else {
    console.log(`  ! not found (file differs from what the script expects): ${label}`);
    warnings++;
  }
}

/* ═════════════════════════ app/layout.js ═════════════════════════ */
const LAYOUT = "app/layout.js";
load(LAYOUT);
console.log(`\n${LAYOUT}`);

rep(
  LAYOUT,
  'import { Titillium_Web } from "next/font/google";',
  'import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";',
  "font imports"
);

rep(
  LAYOUT,
  /const titilliumWeb = Titillium_Web\(\{[\s\S]*?\}\);\n\n\/\/ kept as aliases[\s\S]*?const cormorantGaramond = \{ variable: "--font-cormorant" \};\n/,
  `// Display / headings
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// Body / labels
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
`,
  "load Plus Jakarta Sans + DM Sans (replaces Titillium Web and the old aliases)"
);

rep(
  LAYOUT,
  "className={`${titilliumWeb.variable} ${plusJakartaSans.variable} ${syneMono.variable} ${cormorantGaramond.variable}`}",
  "className={`${plusJakarta.variable} ${dmSans.variable}`}",
  "html className"
);

/* ═════════════════════════ app/globals.css ═════════════════════════ */
const CSS = "app/globals.css";
load(CSS);
console.log(`\n${CSS}`);

rep(CSS, /@import url\('https:\/\/fonts\.googleapis\.com[^\n]*\n\n/, "", "remove Titillium / Poppins @import");

rep(
  CSS,
  "  --font-display: 'Titillium Web', system-ui, sans-serif;\n  --font-body:    'Poppins', system-ui, sans-serif;",
  "  --font-display: var(--font-jakarta), 'Plus Jakarta Sans', system-ui, sans-serif;\n  --font-body:    var(--font-dmsans), 'DM Sans', system-ui, sans-serif;",
  "font variables"
);

rep(
  CSS,
  "  font-family: var(--font-display); /* Titillium is narrower: keeps six tabs readable on phones */",
  "  font-family: var(--font-body); /* DM Sans is narrower than Jakarta: keeps six tabs readable on phones */",
  "tech-stack tabs use the body font"
);

/* ═════════════════════════ tailwind.config.js ═════════════════════════ */
const TW = "tailwind.config.js";
load(TW);
console.log(`\n${TW}`);

rep(TW, "// Titillium Web", "// Plus Jakarta Sans (headings)", "display comment");
rep(TW, "// Poppins (body)", "// DM Sans (body)", "sans comment");

/* ═════════════════════════ app/page.js ═════════════════════════ */
const PAGE = "app/page.js";
load(PAGE);
console.log(`\n${PAGE}`);

rep(PAGE,
  "text-[clamp(2.4rem,8vw,5.5rem)] font-display font-black leading-[0.95] tracking-tight",
  "text-[clamp(2.4rem,8vw,5.5rem)] font-display font-extrabold leading-none tracking-[-0.055em]",
  "hero heading");

rep(PAGE,
  "font-display font-black tracking-tight leading-[1.1]",
  "font-display font-extrabold tracking-[-0.045em] leading-[1.1]",
  "Projects heading");

rep(PAGE,
  "font-display font-black text-[1.9rem] md:text-[2.15rem] leading-[1.02] tracking-[-0.01em]",
  "font-display font-extrabold text-[1.9rem] md:text-[2.15rem] leading-[1.05] tracking-[-0.045em]",
  "project titles");

rep(PAGE,
  "font-bold tracking-tight leading-[1.1] mb-10",
  "font-extrabold tracking-[-0.045em] leading-[1.1] mb-10",
  "Tech stack heading");

rep(PAGE,
  "font-display font-black leading-[1.05]",
  "font-display font-extrabold leading-[1.05]",
  "Manifesto lines (900 -> 800)");

rep(PAGE, 'letterSpacing: "-0.02em",', 'letterSpacing: "-0.045em",', "Manifesto letter-spacing");

rep(PAGE,
  "font-display font-semibold leading-[1.3] tracking-tight",
  "font-display font-semibold leading-[1.3] tracking-[-0.035em]",
  "Story text tracking");

rep(PAGE,
  "font-display font-medium leading-[1.5] italic relative z-10",
  "font-display font-medium leading-[1.5] tracking-[-0.03em] relative z-10",
  "testimonial quote (no italic)");

rep(PAGE,
  "text-[clamp(3rem,10vw,7rem)] font-display font-bold leading-[0.95] tracking-tight mb-8",
  "text-[clamp(2.4rem,9vw,5.5rem)] font-display font-extrabold leading-none tracking-[-0.055em] mb-8",
  "Contact heading (scaled for the wider font)");

rep(PAGE,
  "text-xs tracking-[0.3em] uppercase",
  "text-xs font-bold tracking-[0.18em] uppercase",
  "eyebrow labels");

rep(PAGE,
  "font-semibold text-sm tracking-wide",
  "font-bold text-sm",
  "hero buttons");

rep(PAGE, " opacity-50 font-mono", " opacity-50 font-semibold", "project number (no mono)");

if (files[PAGE].includes("font-black")) {
  console.log('    ! "font-black" (900) is still present in app/page.js. Jakarta tops out at 800, check it by hand.');
  warnings++;
}

/* ═════════════════════════ write ═════════════════════════ */
console.log("");
if (DRY) {
  console.log(`Dry run: ${changed.size} file(s) would change: ${[...changed].join(", ") || "none"}`);
} else {
  for (const rel of changed) fs.writeFileSync(path.join(ROOT, rel), files[rel]);
  console.log(`Done: ${changed.size} file(s) updated: ${[...changed].join(", ") || "none"}`);
}
if (warnings) console.log(`${warnings} warning(s) above. Review with git diff.`);
