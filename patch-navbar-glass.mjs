// patch-navbar-glass.mjs
// Floating navbar -> refined "Glass" capsule (the scrolled state of the navbar).
// Run from the project root:  node patch-navbar-glass.mjs
//
// - CSS only: appends one clearly marked override block to app/globals.css.
//   No changes to page.js, GlassSurface, or the theme switch.
// - Idempotent: safe to run more than once (skips if the marker is already there).
// - Writes a one-time backup: app/globals.css.bak-patch-navbar-glass
//
// What changes (floating capsule only, the flat bar at the very top is untouched):
//   - hairline edge + soft top highlight + layered shadow around the glass
//   - slimmer, more compact capsule, floats a little lower from the top
//   - roomier links, medium weight, active link = soft chip with a top highlight (no dot)
//   - Contact pill gets a small arrow
//   - Safari / Firefox fallback glass tuned to match
//
// To remove: delete the block between "navbar-glass-v3" and "end navbar-glass-v3"
// in app/globals.css (or restore the .bak file).

import fs from "node:fs";
import path from "node:path";

const MARKER = "navbar-glass-v3";
const file = path.join(process.cwd(), "app/globals.css");

if (!fs.existsSync(file)) {
  console.error("✗ app/globals.css not found - run this from the project root");
  process.exit(1);
}

const original = fs.readFileSync(file, "utf8");

if (original.includes(MARKER)) {
  console.log("= app/globals.css: navbar glass already applied, nothing to do");
  process.exit(0);
}

if (!original.includes(".gnav-wrap")) {
  console.error("✗ .gnav-wrap styles not found in app/globals.css - is this the right project?");
  process.exit(1);
}

const BLOCK = `

/* ${MARKER}: refined floating glass capsule (scrolled state) ─────────────── */

/* edge / highlight / shadow tokens, follow the site theme switch */
.gnav-wrap[data-theme="dark"] {
  --gn-edge: rgba(242, 239, 234, 0.11);
  --gn-hi: rgba(255, 255, 255, 0.08);
  --gn-shadow: rgba(0, 0, 0, 0.5);
}
.gnav-wrap[data-theme="light"] {
  --gn-edge: rgba(20, 20, 20, 0.1);
  --gn-hi: rgba(255, 255, 255, 0.9);
  --gn-shadow: rgba(40, 30, 20, 0.14);
}

/* hairline edge, top highlight and soft layered shadow, drawn above the glass */
.gnav-wrap.is-scrolled .gnav-glass::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid var(--gn-edge);
  box-shadow:
    inset 0 1px 0 var(--gn-hi),
    0 14px 40px var(--gn-shadow);
  pointer-events: none;
}

/* Safari / Firefox fallback glass: same tint as the capsule, edge comes from ::after */
.gnav-wrap[data-theme="dark"] .glass-surface--fallback {
  background: rgba(30, 29, 28, 0.55);
  border: 0;
  box-shadow: none;
}
.gnav-wrap[data-theme="light"] .glass-surface--fallback {
  background: rgba(250, 249, 246, 0.6);
  border: 0;
  box-shadow: none;
}

/* desktop / tablet only, phones keep their own sizing */
@media (min-width: 641px) {
  .gnav-wrap.is-scrolled { padding: 14px 10px 0; }

  .gnav-wrap.is-scrolled .gnav {
    width: 560px;
    padding: 5px 5px 5px 7px;
  }

  .gnav-wrap.is-scrolled .gnav-links { gap: 2px; }

  .gnav-wrap.is-scrolled .gnav-link {
    padding: 9px 14px;
    font-weight: 500;
    letter-spacing: 0.005em;
  }

  /* active link: soft chip with a highlight on its top edge, no dot */
  .gnav-wrap.is-scrolled .gnav-link.on {
    background: var(--gn-chip);
    box-shadow: inset 0 1px 0 var(--gn-hi);
  }

  .gnav-wrap.is-scrolled .gnav-cta {
    padding: 9px 15px;
    font-weight: 500;
  }
  .gnav-wrap.is-scrolled .gnav-cta::after {
    content: "\\2197";
    margin-left: 5px;
    font-size: 0.95em;
  }
}
/* end ${MARKER} */
`;

const backup = `${file}.bak-patch-navbar-glass`;
if (!fs.existsSync(backup)) fs.writeFileSync(backup, original);

const sep = original.endsWith("\n") ? "" : "\n";
fs.writeFileSync(file, original + sep + BLOCK);

console.log("✓ app/globals.css: navbar glass block appended");
console.log('\nDone. Restart "npm run dev" if it is running, then scroll past the top to see the capsule.');
