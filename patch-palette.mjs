// patch-palette.mjs
// Applies the "Graphite & Ember" palette to the byCarlo site.
// Run from the project root:  node patch-palette.mjs
//
// - Idempotent: safe to run more than once (already-applied edits are skipped).
// - Writes a one-time backup next to each changed file: <file>.bak-patch-palette
//
// Files touched: app/page.js, app/globals.css, tailwind.config.js

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TAG = "bak-patch-palette";

// ── Graphite & Ember ─────────────────────────────────────────────────────────
//            light      dark
// bg         #F6F5F2    #121212
// surface    #EAE6DF    #1C1B1A
// text       #141414    #F2EFEA
// muted      #6B6762    #9A958D
// accent     #CC3419    #FF6A4D     (vermilion)
// accent2    #C9A66B    #C9A66B     (brass)
// border     rgba(20,20,20,0.14)   rgba(242,239,234,0.16)

const EDITS = {
  "app/page.js": [
    // Hero: dark-mode values were self-referencing CSS vars; point them at DARK.*
    // and add a theme-aware "text on accent" color for the primary button.
    ['["var(--h-text)", LIGHT.text]', "[DARK.text, LIGHT.text]"],
    ['["var(--h-muted)", LIGHT.muted]', "[DARK.muted, LIGHT.muted]"],
    [
      '["var(--h-border)", LIGHT.border]),',
      '[DARK.border, LIGHT.border]),\n    "--h-on-accent": useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]),',
    ],
    [
      'background: "var(--h-accent)", color: "#F7F8FA"',
      'background: "var(--h-accent)", color: "var(--h-on-accent)"',
    ],

    // Testimonial avatar initials: follow the theme instead of fixed near-black
    ['color: "#0B0B0E" }}>', 'color: "var(--bg-primary)" }}>'],

    // Project accents: one leading accent instead of blue/orange flip-flopping
    ['colorAccent: "#E0631A"', 'colorAccent: "#CC3419"'],

    // DARK / LIGHT theme objects + navbar + device mockup fallback
    ["#0B1930", "#121212"],
    ["#132345", "#1C1B1A"],
    ["#F4F7FC", "#F2EFEA"],
    ["#8FA0BD", "#9A958D"],
    ["#5B82F2", "#FF6A4D"],
    ["#FB923C", "#C9A66B"],
    ["rgba(244,247,252,0.14)", "rgba(242,239,234,0.16)"],

    ["#F7F8FA", "#F6F5F2"],
    ["#EEF1F6", "#EAE6DF"],
    ["#0B1E3D", "#141414"],
    ["#5A6B85", "#6B6762"],
    ["#1A3EE0", "#CC3419"],
    ["#E0631A", "#C9A66B"],
    ["rgba(11,30,61,0.10)", "rgba(20,20,20,0.14)"],

    // Glass navbar
    ['["rgba(244,244,244,0.65)", "rgba(11,11,14,0.55)"]', '["rgba(242,239,234,0.65)", "rgba(20,20,20,0.60)"]'],
    ['["rgba(11,25,48,0.62)", "rgba(247,248,250,0.72)"]', '["rgba(18,18,18,0.62)", "rgba(246,245,242,0.72)"]'],
    ['["rgba(255,255,255,0.16)", "rgba(11,11,14,0.10)"]', '["rgba(242,239,234,0.16)", "rgba(20,20,20,0.12)"]'],
    ['["rgba(255,255,255,0.14)", "rgba(11,11,14,0.08)"]', '["rgba(242,239,234,0.12)", "rgba(20,20,20,0.08)"]'],

    // Tech stack sliding pill: cool zinc greys -> warm graphite
    ['["#27272a", "#e4e4e7"]', '["#2A2826", "#E4DFD6"]'],
    ['["#fafafa", "#18181b"]', '["#F6F5F2", "#141414"]'],
    ['["#18181b", "#fafafa"]', '["#141414", "#F6F5F2"]'],
  ],

  "app/globals.css": [
    // dark
    ["#0B1930", "#121212"],
    ["#F4F7FC", "#F2EFEA"],
    ["#8FA0BD", "#9A958D"],
    ["#5B82F2", "#FF6A4D"],
    ["#FB923C", "#C9A66B"],
    ["rgba(244,247,252,0.14)", "rgba(242,239,234,0.16)"],
    // light (also covers ::selection and .logo-gradient)
    ["#F7F8FA", "#F6F5F2"],
    ["#0B1E3D", "#141414"],
    ["#5A6B85", "#6B6762"],
    ["#1A3EE0", "#CC3419"],
    ["#E0631A", "#C9A66B"],
    ["rgba(11,30,61,0.10)", "rgba(20,20,20,0.14)"],
    // navbar fallbacks
    ["#0B0B0E", "#141414"],
    ["rgba(11, 11, 14, 0.14)", "rgba(20, 20, 20, 0.14)"],
    ["rgba(11, 11, 14, 0.1)", "rgba(20, 20, 20, 0.14)"],
  ],

  // Brings the stale cream/gold/blue Tailwind palette in line with the site.
  "tailwind.config.js": [
    ["#F7F4EE", "#F6F5F2"],
    ["#14110C", "#141414"],
    ["#1A3EE0", "#CC3419"],
    ["#C48A0A", "#C9A66B"],
    ["#EDE8DF", "#EAE6DF"],
    ["#E4DDD2", "#DDD8CF"],
    ["#8E8A84", "#6B6762"],
  ],
};

let changedFiles = 0;
let failed = false;

for (const [rel, edits] of Object.entries(EDITS)) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.error(`✗ ${rel} not found - run this from the project root`);
    failed = true;
    continue;
  }

  const original = fs.readFileSync(file, "utf8");
  let src = original;
  let applied = 0;
  let skipped = 0;

  for (const [from, to] of edits) {
    if (src.includes(from)) {
      src = src.split(from).join(to);
      applied++;
    } else if (src.includes(to)) {
      skipped++;
    } else {
      console.warn(`  ! ${rel}: pattern not found, skipped -> ${from}`);
    }
  }

  if (src === original) {
    console.log(`= ${rel}: already up to date (${skipped} edits already applied)`);
    continue;
  }

  const backup = `${file}.${TAG}`;
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, original);
  fs.writeFileSync(file, src);
  changedFiles++;
  console.log(`✓ ${rel}: ${applied} edits applied, ${skipped} already in place`);
}

if (failed) process.exit(1);
console.log(
  changedFiles
    ? `\nDone. Palette applied to ${changedFiles} file(s). Restart "npm run dev" if it is running.`
    : "\nNothing to do - palette already applied."
);
