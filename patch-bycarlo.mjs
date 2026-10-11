#!/usr/bin/env node
/**
 * patch-bycarlo.mjs
 *
 * Patches raging-code/bycarlo-portfolio to match the v5 design reference:
 *   - Font: Outfit -> Titillium Web (900 Black headlines)
 *   - Palette: teal/purple -> blueprint blue + orange
 *   - Copy: hero, projects heading, manifesto, contact, footer
 *   - Removes the hero eyebrow label and the "Scroll" indicator
 *
 * Usage:
 *   node patch-bycarlo.mjs --dry-run     # show what would change, write nothing
 *   node patch-bycarlo.mjs               # apply (writes .bak-patch-bycarlo backups)
 *   node patch-bycarlo.mjs --restore     # restore every file from its .bak backup
 *
 * Safe to run twice: on a second run, already-patched strings simply won't be
 * found and are reported as "skip (already applied / not found)" rather than
 * silently double-patching or failing.
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Resolve repo root ────────────────────────────────────────────────────
// Run this script from inside the repo, or pass the repo path as the last arg:
//   node patch-bycarlo.mjs /path/to/bycarlo-portfolio
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const RESTORE = args.includes("--restore");
const pathArg = args.find((a) => !a.startsWith("--"));
const REPO = resolve(pathArg || process.cwd());

const BACKUP_SUFFIX = ".bak-patch-bycarlo";

function p(rel) {
  return resolve(REPO, rel);
}

const FILES = {
  globalsCss: p("app/globals.css"),
  layoutJs: p("app/layout.js"),
  pageJs: p("app/page.js"),
};

// ── Sanity check ────────────────────────────────────────────────────────
for (const [key, filePath] of Object.entries(FILES)) {
  if (!existsSync(filePath)) {
    console.error(`✗ Can't find ${key} at ${filePath}`);
    console.error(`  Run this from the repo root, or pass the repo path as an argument.`);
    process.exit(1);
  }
}

// ── Restore mode ────────────────────────────────────────────────────────
if (RESTORE) {
  let restored = 0;
  for (const filePath of Object.values(FILES)) {
    const backup = filePath + BACKUP_SUFFIX;
    if (existsSync(backup)) {
      copyFileSync(backup, filePath);
      console.log(`↺ restored ${filePath}`);
      restored++;
    } else {
      console.log(`  (no backup for ${filePath}, skipped)`);
    }
  }
  console.log(`\nRestored ${restored} file(s).`);
  process.exit(0);
}

// ── Helper: apply an ordered list of exact string replacements ─────────
// Each replacement is {old, new, label}. old must appear in the current
// content exactly; 0 matches = skipped+reported, >1 matches = aborts the
// whole file (ambiguous, needs a human) so we never guess wrong.
function applyReplacements(content, replacements, fileLabel) {
  let result = content;
  const applied = [];
  const skipped = [];

  for (const { old, next, label } of replacements) {
    const count = result.split(old).length - 1;
    if (count === 0) {
      skipped.push(label);
      continue;
    }
    if (count > 1) {
      console.error(`✗ [${fileLabel}] "${label}" matches ${count} times — expected exactly 1. Aborting this file untouched.`);
      process.exit(1);
    }
    result = result.replace(old, next);
    applied.push(label);
  }

  return { result, applied, skipped };
}

function processFile(key, filePath, replacements) {
  const original = readFileSync(filePath, "utf8");
  const { result, applied, skipped } = applyReplacements(original, replacements, key);

  console.log(`\n── ${key} (${filePath}) ──`);
  for (const label of applied) console.log(`  ✓ ${label}`);
  for (const label of skipped) console.log(`  · skip (already applied / not found): ${label}`);

  if (applied.length === 0) {
    console.log(`  (no changes)`);
    return;
  }

  if (DRY_RUN) {
    console.log(`  [dry-run] would write ${applied.length} change(s), no file written.`);
    return;
  }

  const backup = filePath + BACKUP_SUFFIX;
  if (!existsSync(backup)) {
    copyFileSync(filePath, backup);
    console.log(`  (backup saved to ${backup})`);
  }
  writeFileSync(filePath, result, "utf8");
  console.log(`  wrote ${applied.length} change(s).`);
}

// ════════════════════════════════════════════════════════════════════════
// 1. app/globals.css — font import + light/dark CSS variables
// ════════════════════════════════════════════════════════════════════════
const globalsCssReplacements = [
  {
    label: "swap Google Fonts import (Space Grotesk/Inter -> Titillium Web)",
    old: `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap');`,
    next: `@import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300;400;600;700;900&display=swap');`,
  },
  {
    label: "swap --font-display / --font-body to Titillium Web",
    old: `  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;`,
    next: `  --font-display: 'Titillium Web', system-ui, sans-serif;
  --font-body:    'Titillium Web', system-ui, sans-serif;`,
  },
  {
    label: "light theme CSS vars -> blueprint blue/orange",
    old: `  /* light (default) */
  --bg-primary:   #FFFFFF;
  --text-primary: #0B0B0E;
  --text-secondary: #555555;
  --accent:       #00AABB;
  --accent-2:     #8A2BE2;
  --border:       rgba(0,0,0,0.10);
  color-scheme: light;`,
    next: `  /* light (default) */
  --bg-primary:   #F7F8FA;
  --text-primary: #0B1E3D;
  --text-secondary: #5A6B85;
  --accent:       #1A3EE0;
  --accent-2:     #E0631A;
  --border:       rgba(11,30,61,0.10);
  color-scheme: light;`,
  },
  {
    label: "dark theme CSS vars -> blueprint navy/orange",
    old: `/* dark */
:root[data-theme="dark"] {
  --bg-primary:   #3B3B3B;
  --text-primary: #F4F4F4;
  --text-secondary: #BDBDBD;
  --accent:       #00F0FF;
  --accent-2:     #B24BF3;
  --border:       rgba(255,255,255,0.14);
  color-scheme: dark;
}`,
    next: `/* dark */
:root[data-theme="dark"] {
  --bg-primary:   #0B1930;
  --text-primary: #F4F7FC;
  --text-secondary: #8FA0BD;
  --accent:       #5B82F2;
  --accent-2:     #FB923C;
  --border:       rgba(244,247,252,0.14);
  color-scheme: dark;
}`,
  },
  {
    label: "::selection background -> blueprint text color",
    old: `::selection {
  background: var(--accent);
  color: #0B0B0E;
}`,
    next: `::selection {
  background: var(--accent);
  color: #F7F8FA;
}`,
  },
  {
    label: "logo-gradient -> blueprint blue/orange",
    old: `.logo-gradient {
  background: linear-gradient(135deg, #00F0FF, #B24BF3);`,
    next: `.logo-gradient {
  background: linear-gradient(135deg, #1A3EE0, #E0631A);`,
  },
];

// ════════════════════════════════════════════════════════════════════════
// 2. app/layout.js — swap next/font/google setup to Titillium Web only
// ════════════════════════════════════════════════════════════════════════
const layoutJsReplacements = [
  {
    label: "swap font imports (Outfit/Plus_Jakarta_Sans/Syne_Mono/Cormorant_Garamond -> Titillium_Web)",
    old: `import {
  Outfit,
  Plus_Jakarta_Sans,
  Syne_Mono,
  Cormorant_Garamond,
} from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const syneMono = Syne_Mono({
  subsets: ["latin"],
  variable: "--font-syne-mono",
  weight: ["400"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});`,
    next: `import { Titillium_Web } from "next/font/google";

const titilliumWeb = Titillium_Web({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

// kept as aliases so --font-sans / --font-syne-mono / --font-cormorant
// (still referenced by tailwind.config.js and a few components) resolve
// to the same family instead of falling back to system-ui.
const plusJakartaSans = { variable: "--font-sans" };
const syneMono = { variable: "--font-syne-mono" };
const cormorantGaramond = { variable: "--font-cormorant" };`,
  },
  {
    label: "swap className variable list on <html> to the new font var",
    old: `      className={\`\${outfit.variable} \${plusJakartaSans.variable} \${syneMono.variable} \${cormorantGaramond.variable}\`}`,
    next: `      className={\`\${titilliumWeb.variable} \${plusJakartaSans.variable} \${syneMono.variable} \${cormorantGaramond.variable}\`}`,
  },
];

// ════════════════════════════════════════════════════════════════════════
// 3. app/page.js — DARK/LIGHT palette objects, copy, and layout tweaks
// ════════════════════════════════════════════════════════════════════════
const pageJsReplacements = [
  // ── Palette objects ──
  {
    label: "DARK palette object -> blueprint navy/orange",
    old: `const DARK = {
  bg: "#3B3B3B",
  surface: "#474747",
  text: "#F4F4F4",
  muted: "#BDBDBD",
  accent: "#00F0FF",
  accent2: "#B24BF3",
  border: "rgba(255,255,255,0.14)",
};`,
    next: `const DARK = {
  bg: "#0B1930",
  surface: "#132345",
  text: "#F4F7FC",
  muted: "#8FA0BD",
  accent: "#5B82F2",
  accent2: "#FB923C",
  border: "rgba(244,247,252,0.14)",
};`,
  },
  {
    label: "LIGHT palette object -> blueprint blue/orange",
    old: `const LIGHT = {
  bg: "#FFFFFF",
  surface: "#F5F5F5",
  text: "#0B0B0E",
  muted: "#555555",
  accent: "#00AABB",
  accent2: "#8A2BE2",
  border: "rgba(0,0,0,0.10)",
};`,
    next: `const LIGHT = {
  bg: "#F7F8FA",
  surface: "#EEF1F6",
  text: "#0B1E3D",
  muted: "#5A6B85",
  accent: "#1A3EE0",
  accent2: "#E0631A",
  border: "rgba(11,30,61,0.10)",
};`,
  },
  // ── Project accent colors (alternate between the two new accents) ──
  {
    label: "Helix Protocol / Core Studio colorAccent -> blue",
    old: `tech: ["Solidity", "Next.js", "D3"], live: "#", colorAccent: "#00F0FF"`,
    next: `tech: ["Solidity", "Next.js", "D3"], live: "#", colorAccent: "#1A3EE0"`,
  },
  {
    label: "Mirage Events colorAccent -> orange",
    old: `tech: ["Three.js", "GSAP", "Firebase"], live: "#", colorAccent: "#B24BF3"`,
    next: `tech: ["Three.js", "GSAP", "Firebase"], live: "#", colorAccent: "#E0631A"`,
  },
  {
    label: "Core Studio colorAccent -> blue",
    old: `tech: ["Tailwind", "Framer Motion", "Storyblok"], live: "#", colorAccent: "#00F0FF"`,
    next: `tech: ["Tailwind", "Framer Motion", "Storyblok"], live: "#", colorAccent: "#1A3EE0"`,
  },
  {
    label: "Void Commerce colorAccent -> orange",
    old: `tech: ["Medusa", "Algolia", "Astro"], live: "#", colorAccent: "#B24BF3"`,
    next: `tech: ["Medusa", "Algolia", "Astro"], live: "#", colorAccent: "#E0631A"`,
  },
  // ── Navbar accent transform (hardcoded hex in GlassNavbar) ──
  {
    label: "GlassNavbar accent transform -> blueprint colors",
    old: `  const accent = useTransform(themeProgress, [0, 1], ["#00F0FF", "#00AABB"]);`,
    next: `  const accent = useTransform(themeProgress, [0, 1], ["#5B82F2", "#1A3EE0"]);`,
  },
  {
    label: "GlassNavbar ink transform -> blueprint neutrals",
    old: `  const ink    = useTransform(themeProgress, [0, 1], ["#F4F4F4", "#0B0B0E"]);`,
    next: `  const ink    = useTransform(themeProgress, [0, 1], ["#F4F7FC", "#0B1E3D"]);`,
  },
  {
    label: "GlassNavbar glass backdrop -> blueprint navy",
    old: `  const glass  = useTransform(themeProgress, [0, 1], ["rgba(59,59,59,0.62)", "rgba(255,255,255,0.72)"]);`,
    next: `  const glass  = useTransform(themeProgress, [0, 1], ["rgba(11,25,48,0.62)", "rgba(247,248,250,0.72)"]);`,
  },
  {
    label: "GlassNavbar ctaFg transform -> blueprint neutrals",
    old: `  const ctaFg  = useTransform(themeProgress, [0, 1], ["#3B3B3B", "#FFFFFF"]);`,
    next: `  const ctaFg  = useTransform(themeProgress, [0, 1], ["#0B1930", "#F7F8FA"]);`,
  },
  // ── Hero: remove eyebrow label, swap headline + subcopy, swap CTA copy ──
  {
    label: "remove hero eyebrow ('Studio · Est. 2025' pulse dot + label)",
    old: `        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: E }}
          className="flex items-center gap-3"
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--h-accent)" }} />
          <span className="text-[11px] tracking-[0.35em] uppercase font-medium" style={{ color: "var(--h-muted)" }}>
            Studio &middot; Est. 2025
          </span>
        </motion.div>

        <motion.h1`,
    next: `        <motion.h1`,
  },
  {
    label: "hero headline -> 'Websites, apps and connected devices.'",
    old: `          className="text-[clamp(2.8rem,10vw,7rem)] font-display font-bold leading-[0.9] tracking-tight"
        >
          <span className="block" style={{ color: "var(--h-text)" }}>Crafting</span>
          <span className="block">
            <span style={{ color: "var(--h-accent)" }}>Digital</span><br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, var(--h-accent), var(--h-accent2))" }}>
              Realities
            </span>
            <span style={{ color: "var(--h-accent)" }}>.</span>
          </span>
        </motion.h1>`,
    next: `          className="text-[clamp(2.4rem,8vw,5.5rem)] font-display font-black leading-[0.95] tracking-tight"
        >
          <span className="block" style={{ color: "var(--h-text)" }}>Websites, apps</span>
          <span className="block" style={{ color: "var(--h-text)" }}>and connected</span>
          <span className="block" style={{ color: "var(--h-text)" }}>devices<span style={{ color: "var(--h-accent)" }}>.</span></span>
        </motion.h1>`,
  },
  {
    label: "hero subcopy -> 'I design and build landing pages...'",
    old: `          We build immersive, high-performing websites that merge design with code &#8211; before you even know you need them.`,
    next: `          I design and build landing pages, full-stack web apps and IoT dashboards, and see each one through to launch.`,
  },
  {
    label: "hero CTAs -> 'See projects' / 'Get in touch'",
    old: `          <a href="#work" className="px-7 py-3 rounded-full font-semibold text-sm tracking-wide" style={{ background: "var(--h-accent)", color: "#0B0B0E" }}>
            See work &#8594;
          </a>`,
    next: `          <a href="#work" className="px-7 py-3 rounded-full font-semibold text-sm tracking-wide" style={{ background: "var(--h-accent)", color: "#F7F8FA" }}>
            See projects
          </a>`,
  },
  {
    label: "remove 'Scroll' indicator at bottom of hero",
    old: `      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "var(--h-muted)" }}>Scroll</span>
        <motion.div className="w-4 h-8 rounded-full border flex justify-center p-1" style={{ borderColor: "var(--h-border)" }}>
          <motion.div
            className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--h-accent)" }}
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

/* ── Projects (transparent background) ───────────── */`,
    next: `    </motion.section>
  );
}

/* ── Projects (transparent background) ───────────── */`,
  },
  // ── Projects: remove "Selected Work" eyebrow + swap heading ──
  {
    label: "remove 'Selected Work' eyebrow above Projects heading",
    old: `        <motion.span
          className="text-[11px] tracking-[0.4em] uppercase block mb-4"
          style={{ color: mutedColor }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          Selected Work
        </motion.span>
        <motion.h2
          className="text-[clamp(2.2rem,6vw,4.5rem)] font-bold tracking-tight leading-[1.1]"
          style={{ color: textColor, fontFamily: "var(--font-display)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, ease: E }}
        >
          Projects that define<br />
          the <motion.span style={{ color: accentColor }}>future</motion.span><motion.span style={{ color: accentColor }}>.</motion.span>
        </motion.h2>`,
    next: `        <motion.h2
          className="text-[clamp(1.8rem,5vw,3rem)] font-display font-black tracking-tight leading-[1.1]"
          style={{ color: textColor }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, ease: E }}
        >
          Selected projects
        </motion.h2>`,
  },
  // ── Manifesto: swap the ship-in-weeks lines for the new "one developer" copy ──
  {
    label: "manifesto lines -> 'One developer, from first sketch to deployed product...'",
    old: `  const lines = [
    "We ship in weeks,",
    "not years.",
    "We design for the",
    "borderless age.",
    "No templates.",
    "No bullshit.",
    "Just clarity.",
  ];`,
    next: `  const lines = [
    "One developer,",
    "from first sketch",
    "to deployed product.",
    "Fewer handoffs.",
    "Fewer surprises.",
  ];`,
  },
  {
    label: "manifesto font-weight -> font-black to match reference",
    old: `              className="font-display font-bold leading-[1.05]"
              style={{
                fontSize: "clamp(2.4rem, 8vw, 6.5rem)",`,
    next: `              className="font-display font-black leading-[1.05]"
              style={{
                fontSize: "clamp(1.8rem, 6vw, 4rem)",`,
  },
  // ── Story/About: swap intro copy to match reference stats-under-intro layout ──
  {
    label: "about intro copy -> 'I build websites, web apps and connected devices...'",
    old: `          We are a remote collective of designers and engineers obsessed with the <motion.span style={{ color: accentColor }}>edge</motion.span> of web performance and aesthetics.`,
    next: `          I build websites, web apps and connected devices for people who need the whole thing working, not just the front page.`,
  },
  {
    label: "about subcopy -> 'Landing pages that load fast...'",
    old: `          Started in 2025 with a single belief &#8211; that a website should feel like a part of your brand&apos;s nervous system, not a static brochure.`,
    next: `          Landing pages that load fast, full-stack products with a real back end, and IoT dashboards that read from actual hardware.`,
  },
  // ── Contact: swap heading copy and footer credit ──
  {
    label: "contact heading -> 'Have a project in mind?'",
    old: `          Let&apos;s make<br />
          <motion.span style={{ color: accentColor, whiteSpace: isMobile ? "normal" : "nowrap" }}>
            something{isMobile && <br />} cool.
            <motion.span
              style={{
                display: "inline-block",
                width: "0.18em",
                height: "0.75em",
                backgroundColor: accentColor,
                marginLeft: "0.08em",
                verticalAlign: "baseline",
              }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            />
          </motion.span>`,
    next: `          Have a project<br />
          in mind?`,
  },
  {
    label: "footer credit -> '© 2025 byCarlo' / 'Based in Manila, working worldwide'",
    old: `        <span>&#169; 2025 ByCarlo Studio</span>
        <span>Manila &middot; Remote &middot; Worldwide</span>`,
    next: `        <span>&#169; 2025 byCarlo</span>
        <span>Based in Manila, working worldwide</span>`,
  },
];

// ════════════════════════════════════════════════════════════════════════
// Run
// ════════════════════════════════════════════════════════════════════════
console.log(`bycarlo-portfolio patch ${DRY_RUN ? "(dry run)" : ""}`);
console.log(`repo: ${REPO}`);

processFile("globals.css", FILES.globalsCss, globalsCssReplacements);
processFile("layout.js", FILES.layoutJs, layoutJsReplacements);
processFile("page.js", FILES.pageJs, pageJsReplacements);

console.log(`\nDone.${DRY_RUN ? " (dry run — nothing written)" : " Run with --restore to undo."}`);
