#!/usr/bin/env node
/**
 * patch-poppins.mjs  —  byCarlo: Poppins body font + premium type polish
 *
 * Titles stay Titillium Web. Poppins takes over body text, sub-text, buttons,
 * tags and small labels.
 *
 * Usage (run from the repo root, the folder that contains /app):
 *   node patch-poppins.mjs              apply (project title style A)
 *   node patch-poppins.mjs --title=B    apply with project title style B or C
 *   node patch-poppins.mjs --dry        show what would change, write nothing
 *   node patch-poppins.mjs --revert     restore every file from its backup
 *
 * Project title styles ("Mirage Events" etc.):
 *   A  Titillium Black    (same weight as hero + section titles)   <- default
 *   B  Titillium Bold     (one step lighter)
 *   C  Poppins SemiBold   (title in the body font)
 *
 * Safe to run more than once. Re-running with a different --title switches style.
 * Backups are written next to each file as <file>.bak-patch-poppins
 */

import fs from "node:fs";
import path from "node:path";

const BAK = ".bak-patch-poppins";
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const REVERT = args.includes("--revert");
const titleArg = (args.find((a) => a.startsWith("--title=")) || "--title=A").split("=")[1].toUpperCase();

if (!["A", "B", "C"].includes(titleArg)) {
  console.error(`✖ Unknown --title=${titleArg}. Use A, B or C.`);
  process.exit(1);
}

const ROOT = process.cwd();
const FILES = {
  css: "app/globals.css",
  page: "app/page.js",
  tw: "tailwind.config.js",
};

const abs = (rel) => path.join(ROOT, rel);
const line = (s = "") => console.log(s);

/* ── sanity: are we in the repo root? ─────────────────────────────────── */
for (const rel of Object.values(FILES)) {
  if (!fs.existsSync(abs(rel))) {
    console.error(`✖ Cannot find ${rel}. Run this script from the repo root (the folder that contains /app).`);
    process.exit(1);
  }
}

/* ── revert mode ──────────────────────────────────────────────────────── */
if (REVERT) {
  let restored = 0;
  for (const rel of Object.values(FILES)) {
    const bak = abs(rel) + BAK;
    if (fs.existsSync(bak)) {
      fs.copyFileSync(bak, abs(rel));
      console.log(`↩ restored ${rel}`);
      restored++;
    } else {
      console.log(`· no backup for ${rel}, skipped`);
    }
  }
  console.log(restored ? `\nDone. ${restored} file(s) restored.` : "\nNothing to restore.");
  process.exit(0);
}

/* ── project title styles ─────────────────────────────────────────────── */
const TITLE_ORIGINAL = "text-2xl md:text-3xl font-display font-semibold mt-1";
const TITLE_STYLES = {
  A: "font-display font-black text-[1.9rem] md:text-[2.15rem] leading-[1.02] tracking-[-0.01em] mt-2",
  B: "font-display font-bold text-[1.85rem] md:text-[2.05rem] leading-[1.06] tracking-[-0.005em] mt-2",
  C: "font-semibold text-[1.45rem] md:text-[1.6rem] leading-[1.2] tracking-[-0.015em] mt-2",
};
const TITLE_KNOWN = [TITLE_ORIGINAL, ...Object.values(TITLE_STYLES)];

/* ── edit definitions ─────────────────────────────────────────────────── *
 * Each edit:
 *   id      short name shown in the output
 *   find    string | RegExp  — text to replace
 *   to      string           — replacement
 *   count   how many matches are expected (default 1)
 *   done    (text) => boolean — true if this edit is already applied
 * ─────────────────────────────────────────────────────────────────────── */
const edits = {
  css: [
    {
      id: "Load Poppins (400/500/600/700) in the Google Fonts import",
      find: "family=Titillium+Web:wght@300;400;600;700;900&display=swap",
      to: "family=Titillium+Web:wght@300;400;600;700;900&family=Poppins:wght@400;500;600;700&display=swap",
      done: (t) => /family=Poppins:wght@/.test(t),
    },
    {
      id: "Body font variable → Poppins",
      find: /--font-body:\s*'Titillium Web', system-ui, sans-serif;/,
      to: "--font-body:    'Poppins', system-ui, sans-serif;",
      done: (t) => /--font-body:\s*'Poppins'/.test(t),
    },
    {
      id: "Body text: weight 500→400, size 18px→16.5px, line-height 1.6→1.7",
      find: /(font-family: var\(--font-body\);\s*\n\s*)font-weight: 500;(\s*\n\s*)font-size: 18px;(\s*\n\s*)line-height: 1\.6;/,
      to: "$1font-weight: 400;$2font-size: 16.5px;$3line-height: 1.7;",
      done: (t) => /font-family: var\(--font-body\);\s*\n\s*font-weight: 400;\s*\n\s*font-size: 16\.5px;/.test(t),
    },
    {
      id: "Navbar font → Poppins (was falling back to system-ui)",
      find: "font-family: var(--font-sans), system-ui, sans-serif;",
      to: "font-family: var(--font-body), system-ui, sans-serif;",
      done: (t) => !t.includes("font-family: var(--font-sans), system-ui, sans-serif;"),
    },
    {
      id: "Phone navbar: slightly smaller scale so wider Poppins still fits",
      find: ".gnav-link, .gnav-cta { font-size: clamp(10px, 3.1vw, 14px); }",
      to: ".gnav-link, .gnav-cta { font-size: clamp(9.5px, 2.8vw, 14px); }",
      done: (t) => t.includes("clamp(9.5px, 2.8vw, 14px)"),
    },
    {
      id: "Tech stack tabs: keep titles font so all six tabs fit on phones",
      find: "  font-size: clamp(9px, 2.9vw, 16px);  /* scales down so all six tabs fit */",
      to:
        "  font-family: var(--font-display); /* Titillium is narrower: keeps six tabs readable on phones */\n" +
        "  font-size: clamp(9px, 2.9vw, 16px);  /* scales down so all six tabs fit */",
      done: (t) => /\.ts-seg \{[^}]*font-family: var\(--font-display\)/.test(t),
    },
  ],

  page: [
    {
      id: `Project title style ${titleArg} (Mirage Events etc.)`,
      custom: "title",
    },
    {
      id: "Project category label: readable sentence case (was 10px uppercase)",
      find: 'className="text-[10px] tracking-[0.25em] uppercase" style={{ color: accentColor }}',
      to: 'className="text-[13px] font-medium" style={{ color: accentColor }}',
      done: (t) => t.includes('className="text-[13px] font-medium" style={{ color: accentColor }}'),
    },
    {
      id: "Project number: 10px → 12px",
      find: 'className="text-[10px] tracking-widest opacity-50 font-mono"',
      to: 'className="text-xs tracking-widest opacity-50 font-mono"',
      done: (t) => t.includes('className="text-xs tracking-widest opacity-50 font-mono"'),
    },
    {
      id: "Tech chips on project cards: 10px → 12.5px, no wide tracking",
      find: 'className="text-[10px] tracking-wider px-3 py-1.5 rounded-full border"',
      to: 'className="text-[12.5px] px-3 py-1.5 rounded-full border"',
      done: (t) => t.includes('className="text-[12.5px] px-3 py-1.5 rounded-full border"'),
    },
    {
      id: "Tech stack tool names: 11px → 12.5px",
      find: 'className="text-[11px] font-medium text-center leading-tight"',
      to: 'className="text-[12.5px] font-medium text-center leading-tight"',
      done: (t) => t.includes('className="text-[12.5px] font-medium text-center leading-tight"'),
    },
    {
      id: "Tech stack counter (01 / 06): 10px → 12px",
      find: 'className="text-[10px] font-semibold tracking-wider mb-2"',
      to: 'className="text-xs font-semibold tracking-wider mb-2"',
      done: (t) => t.includes('className="text-xs font-semibold tracking-wider mb-2"'),
    },
    {
      id: "Section eyebrows (Manifesto / About / etc.): 10px → 12px, calmer tracking",
      find: 'text-[10px] tracking-[0.4em] uppercase',
      to: 'text-xs tracking-[0.3em] uppercase',
      count: 3,
      done: (t) => !t.includes("text-[10px] tracking-[0.4em] uppercase"),
    },
    {
      id: "Tech stack eyebrow: 11px → 12px, calmer tracking",
      find: 'text-[11px] tracking-[0.4em] uppercase mb-4',
      to: 'text-xs tracking-[0.3em] uppercase mb-4',
      done: (t) => !t.includes("text-[11px] tracking-[0.4em] uppercase mb-4"),
    },
    {
      id: "Hero sub-text: a touch larger and airier for Poppins",
      find: 'className="max-w-xl text-[clamp(1rem,2.5vw,1.3rem)] leading-relaxed"',
      to: 'className="max-w-xl text-[clamp(1.05rem,2.6vw,1.375rem)] leading-[1.5]"',
      done: (t) => t.includes('className="max-w-xl text-[clamp(1.05rem,2.6vw,1.375rem)] leading-[1.5]"'),
    },
  ],

  tw: [
    {
      id: "Tailwind font-sans → Poppins (was pointing at an undefined variable)",
      find: /sans:\s*\["var\(--font-sans\)", "system-ui", "sans-serif"\],\s*\/\/ Plus Jakarta Sans/,
      to: 'sans:      ["var(--font-body)", "system-ui", "sans-serif"],    // Poppins (body)',
      done: (t) => t.includes('sans:      ["var(--font-body)"'),
    },
    {
      id: "Tailwind font-display comment: Outfit → Titillium Web",
      find: /(display:\s*\["var\(--font-display\)", "system-ui", "sans-serif"\],\s*)\/\/ Outfit/,
      to: "$1// Titillium Web",
      done: (t) => !/\/\/ Outfit/.test(t),
    },
  ],
};

/* ── engine ───────────────────────────────────────────────────────────── */
const countMatches = (text, find) => {
  if (typeof find === "string") return text.split(find).length - 1;
  const g = new RegExp(find.source, find.flags.includes("g") ? find.flags : find.flags + "g");
  return (text.match(g) || []).length;
};
const replaceAll = (text, find, to) =>
  typeof find === "string" ? text.split(find).join(to) : text.replace(new RegExp(find.source, find.flags.includes("g") ? find.flags : find.flags + "g"), to);

let failed = false;
let totalApplied = 0;
const pending = []; // { rel, original, eol, next }

for (const [key, list] of Object.entries(edits)) {
  const rel = FILES[key];
  const original = fs.readFileSync(abs(rel), "utf8");
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  let text = original.replace(/\r\n/g, "\n"); // normalise so matching is stable on Windows
  const before = text;

  line(`\n${rel}  (${eol === "\r\n" ? "CRLF" : "LF"})`);

  for (const e of list) {
    /* project title: special case so --title can switch styles on re-runs */
    if (e.custom === "title") {
      const wanted = TITLE_STYLES[titleArg];
      const marker = (cls) => `className="text-2xl md:text-3xl font-display font-semibold mt-1"`.replace(TITLE_ORIGINAL, cls);
      if (text.includes(marker(wanted))) {
        line(`  ↷ already applied: ${e.id}`);
        continue;
      }
      const present = TITLE_KNOWN.find((cls) => text.includes(marker(cls)));
      if (!present) {
        line(`  ✖ NOT FOUND: ${e.id}`);
        line(`      expected: ${marker(TITLE_ORIGINAL)}`);
        failed = true;
        continue;
      }
      text = text.split(marker(present)).join(marker(wanted));
      line(`  ✔ ${e.id}`);
      totalApplied++;
      continue;
    }

    if (e.done(text)) {
      line(`  ↷ already applied: ${e.id}`);
      continue;
    }
    const n = countMatches(text, e.find);
    const want = e.count ?? 1;
    if (n !== want) {
      line(`  ✖ ${e.id}`);
      line(`      expected ${want} match(es), found ${n}. The file may have changed since this patch was written.`);
      failed = true;
      continue;
    }
    text = replaceAll(text, e.find, e.to);
    line(`  ✔ ${e.id}`);
    totalApplied++;
  }

  if (text !== before) {
    pending.push({ rel, original, eol, next: text.replace(/\n/g, eol) });
  }
}

/* ── write (all-or-nothing: if any edit failed, touch nothing) ─────────── */
line("");
if (failed) {
  console.error("✖ One or more edits could not be matched. No files were changed.");
  console.error("  Send me the latest repo (or the lines named above) and I will adjust the patch.");
  process.exit(1);
}

if (!pending.length) {
  console.log("✔ Nothing to do. Everything is already applied.");
  process.exit(0);
}

if (DRY) {
  console.log(`Dry run: ${totalApplied} edit(s) in ${pending.length} file(s) would be applied. Nothing written.`);
  process.exit(0);
}

for (const p of pending) {
  const bak = abs(p.rel) + BAK;
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, p.original); // keep the FIRST original only
  fs.writeFileSync(abs(p.rel), p.next);
}

console.log(`✔ Done. ${totalApplied} edit(s) applied in ${pending.length} file(s).`);
console.log(`  Backups: <file>${BAK}   (undo everything with: node patch-poppins.mjs --revert)`);
console.log("");
console.log("Next: npm run dev, then check the hero, project cards, tech stack tabs and the navbar on a phone width.");
