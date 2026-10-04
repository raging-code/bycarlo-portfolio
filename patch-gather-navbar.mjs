// patch-gather-navbar.mjs
// Replaces the fixed GlassNavbar in bycarlo-portfolio with the "Gather" navbar:
//   - flush, full width and transparent at the top of the page
//   - on scroll it gathers into a floating glass capsule
//   - its colors follow your dark -> light page transition (themeProgress)
//
// Run from the project root:   node patch-gather-navbar.mjs
// Then:                        npm run dev   (check it)   ->   git add . && git commit && git push

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
const fail = (msg) => { console.error("Patch aborted, nothing was written.\n" + msg); process.exit(1); };

/* ─────────────────────────  new component  ───────────────────────── */
const NEW_NAV = `/* ── GlassNavbar – flush at the top, gathers into a glass capsule on scroll ── */
function GlassNavbar({ themeProgress }) {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // Colors follow the page theme (dark -> light) through the same spring as the sections
  const ink    = useTransform(themeProgress, [0, 1], ["#EBEBF5", "#0B0B0E"]);
  const muted  = useTransform(themeProgress, [0, 1], ["rgba(235,235,245,0.6)", "rgba(11,11,14,0.55)"]);
  const glass  = useTransform(themeProgress, [0, 1], ["rgba(20,20,26,0.55)", "rgba(255,255,255,0.62)"]);
  const line   = useTransform(themeProgress, [0, 1], ["rgba(255,255,255,0.14)", "rgba(11,11,14,0.1)"]);
  const chip   = useTransform(themeProgress, [0, 1], ["rgba(255,255,255,0.12)", "rgba(11,11,14,0.08)"]);
  const ctaFg  = useTransform(themeProgress, [0, 1], ["#0B0B0E", "#FFFFFF"]);
  const accent = useTransform(themeProgress, [0, 1], ["#00F0FF", "#00AABB"]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      let current = "";
      document.querySelectorAll("section[id]").forEach((s) => {
        if (s.getBoundingClientRect().top < window.innerHeight / 2) current = s.id;
      });
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={"gnav-wrap" + (scrolled ? " is-scrolled" : "")}>
      <motion.nav
        className="gnav"
        aria-label="Primary"
        style={{
          "--gn-ink": ink,
          "--gn-muted": muted,
          "--gn-glass": glass,
          "--gn-line": line,
          "--gn-chip": chip,
          "--gn-cta-fg": ctaFg,
          "--gn-accent": accent,
        }}
      >
        <span className="gnav-glass" aria-hidden="true" />

        <a
          href="#"
          className="gnav-brand"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        >
          <span className="gnav-fold">by</span>C<span className="gnav-fold">arlo</span>
        </a>

        <div className="gnav-links">
          {NAV_LINKS.map(({ id, label }) => (
            <a
              key={id || label}
              href={id ? "#" + id : "#"}
              onClick={(e) => { if (!id) e.preventDefault(); }}
              className={"gnav-link" + (id && active === id ? " on" : "")}
            >
              {label}
            </a>
          ))}
        </div>

        <a href="#contact" className="gnav-cta">Contact</a>
      </motion.nav>
    </div>
  );
}

`;

/* ─────────────────────────  new styles  ───────────────────────── */
const NEW_CSS = `/* Gather navbar – flush at the top, floating glass capsule after scroll */
.gnav-wrap {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 0;
  pointer-events: none;
  transition: padding 0.7s cubic-bezier(0.65, 0, 0.2, 1);
}
.gnav-wrap.is-scrolled { padding: 12px 12px 0; }

.gnav {
  pointer-events: auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 100%;
  padding: 16px 28px;
  border-radius: 0;
  color: var(--gn-ink, #EBEBF5);
  font-family: var(--font-sans), system-ui, sans-serif;
  transition:
    width 0.7s cubic-bezier(0.65, 0, 0.2, 1),
    padding 0.7s cubic-bezier(0.65, 0, 0.2, 1),
    border-radius 0.7s cubic-bezier(0.65, 0, 0.2, 1),
    box-shadow 0.5s;
}
.gnav-wrap.is-scrolled .gnav {
  width: 640px;
  padding: 8px 8px 8px 20px;
  border-radius: 999px;
  box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.55);
}
.gnav > *:not(.gnav-glass) { position: relative; z-index: 1; }

.gnav-glass {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid var(--gn-line, rgba(255, 255, 255, 0.14));
  background: var(--gn-glass, rgba(20, 20, 26, 0.55));
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  backdrop-filter: blur(18px) saturate(160%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s;
}
.gnav-wrap.is-scrolled .gnav-glass { opacity: 1; }

.gnav a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }

.gnav-brand {
  font-family: var(--font-display), system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--gn-ink);
  text-decoration: none;
  white-space: nowrap;
}
.gnav-fold {
  display: inline-block;
  max-width: 2.5em;
  overflow: hidden;
  vertical-align: bottom;
  white-space: nowrap;
  transition: max-width 0.7s cubic-bezier(0.65, 0, 0.2, 1), opacity 0.4s;
}
.gnav-wrap.is-scrolled .gnav-fold { max-width: 0; opacity: 0; }

.gnav-links {
  display: flex;
  align-items: center;
  gap: 22px;
  min-width: 0;
  transition: gap 0.7s cubic-bezier(0.65, 0, 0.2, 1);
}
.gnav-wrap.is-scrolled .gnav-links { gap: 4px; }

.gnav-link {
  padding: 8px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  color: var(--gn-muted);
  transition: background-color 0.3s;
}
.gnav-link:hover { color: var(--gn-ink); background: var(--gn-chip); }
.gnav-link.on {
  color: var(--gn-ink);
  border-radius: 0;
  box-shadow: inset 0 -2px 0 var(--gn-accent);
}
.gnav-wrap.is-scrolled .gnav-link.on {
  border-radius: 999px;
  box-shadow: none;
  background: var(--gn-chip);
}

.gnav-cta {
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid var(--gn-ink);
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  color: var(--gn-ink);
  transition: background-color 0.4s, color 0.4s;
}
.gnav-wrap.is-scrolled .gnav-cta {
  background: var(--gn-ink);
  color: var(--gn-cta-fg);
}

@media (max-width: 640px) {
  .gnav { padding: 12px 16px; }
  .gnav-wrap.is-scrolled .gnav { padding: 6px 10px 6px 14px; }
  .gnav-fold { max-width: 0; opacity: 0; }
  .gnav-cta { display: none; }
  .gnav-links {
    gap: 2px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .gnav-links::-webkit-scrollbar { display: none; }
  .gnav-link { padding: 8px; font-size: 0.75rem; }
}

@media (prefers-reduced-motion: reduce) {
  .gnav-wrap, .gnav, .gnav-glass, .gnav-fold, .gnav-links, .gnav-link, .gnav-cta { transition: none; }
}
`;

/* ─────────────────────────  patch page.js  ───────────────────────── */
const page = read(pagePath);
const css = read(cssPath);

if (page.text.includes("gnav-wrap") && css.text.includes(".gnav-wrap")) {
  console.log("Gather navbar is already applied. Nothing to do.");
  process.exit(0);
}

// start of a block = its leading "/* ... */" comment line when it sits right above the code
const blockStart = (text, idx) => {
  const c = text.lastIndexOf("/*", idx);
  return c >= 0 && idx - c < 120 ? c : idx;
};

const fnStart = page.text.indexOf("function GlassNavbar()");
const cursorFn = page.text.indexOf("function Cursor()");
if (fnStart < 0) fail("Could not find 'function GlassNavbar()' in app/page.js.");
if (cursorFn < 0 || cursorFn < fnStart) fail("Could not find 'function Cursor()' after the navbar in app/page.js.");

const from = blockStart(page.text, fnStart);
const to = blockStart(page.text, cursorFn);
page.text = page.text.slice(0, from) + NEW_NAV + page.text.slice(to);

if (!page.text.includes("<GlassNavbar />")) fail("Could not find '<GlassNavbar />' usage in app/page.js.");
page.text = page.text.replace("<GlassNavbar />", "<GlassNavbar themeProgress={themeProgress} />");

if (!/useTransform/.test(page.text.slice(0, 400))) fail("useTransform is not imported from framer-motion in app/page.js.");

/* ─────────────────────────  patch globals.css  ───────────────────────── */
const cssRe = /(\/\* Glass navbar[^\n]*\n)?\.glass-nav\s*\{[\s\S]*?\n\}\n/;
if (!cssRe.test(css.text)) fail("Could not find the .glass-nav block in app/globals.css.");
css.text = css.text.replace(cssRe, () => NEW_CSS);

/* ─────────────────────────  write  ───────────────────────── */
save(pagePath, page);
save(cssPath, css);

console.log("Gather navbar applied.");
console.log("  app/page.js      GlassNavbar replaced, now receives themeProgress");
console.log("  app/globals.css  .glass-nav replaced with .gnav-* styles");
console.log("\nNext: npm run dev, check it, then git add . && git commit -m \"Gather navbar\" && git push");
