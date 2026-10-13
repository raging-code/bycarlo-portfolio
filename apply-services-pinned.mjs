#!/usr/bin/env node
/**
 * apply-services-pinned.mjs
 *
 * Adds the final "Services" section: a red panel that stays pinned while you scroll.
 * Each of the six services gets its own stretch of scrolling. The one in focus turns
 * white with black text, expands, and shows its description. Everything is centered,
 * with thin lines between services running edge to edge. Clicking a title jumps to it.
 *
 * Works on a fresh project AND on one where the earlier apply-services.mjs was already
 * run: it upgrades that version in place instead of adding a second copy.
 *
 * What it changes
 *   - app/page.js     1) adds (or replaces) `const SERVICES` + `function Services()` just above
 *                        `export default function Page()`
 *                     2) renders <Services /> right after <TechStack /> (skipped if already there)
 *                     3) points the nav "Services" link at #services (skipped if already done)
 *   - app/globals.css adds (or replaces) one marked block with the .svc-* styles
 *
 * Usage (from the project root, next to package.json):
 *   node apply-services-pinned.mjs --dry-run     # preview only, writes nothing
 *   node apply-services-pinned.mjs               # apply
 *   node apply-services-pinned.mjs --revert      # remove the Services section completely
 *
 * Safe to re-run. Nothing is written unless every anchor is found. Backups (made once,
 * before the first change; an existing backup from the earlier script is kept as is):
 *   app/page.js.bak-services, app/globals.css.bak-services
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const F = {
  page: path.join(__dirname, "app", "page.js"),
  css: path.join(__dirname, "app", "globals.css"),
};
const BAK = ".bak-services";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const REVERT = args.includes("--revert");

const note = (m) => console.log(m);
const fail = (m) => { console.error("✗ " + m); process.exit(1); };

for (const k of Object.keys(F)) {
  if (!existsSync(F[k])) fail(`${path.relative(__dirname, F[k])} not found. Run this from the project root.`);
}

let page = readFileSync(F.page, "utf8");
let css = readFileSync(F.css, "utf8");
const EOL = page.includes("\r\n") ? "\r\n" : "\n"; // keep Windows line endings intact
const nl = (s) => s.replace(/\r?\n/g, EOL);

/* ── What gets inserted ─────────────────────────────────────────────────── */

const COMPONENT = nl(
`/* services:start */
/* ── Services (pinned red panel, one service opens at a time) ──────── */
const SERVICES = [
  {
    title: "Website Development",
    text: "Modern, responsive websites designed to showcase your brand, engage visitors, and deliver a seamless experience across all devices.",
  },
  {
    title: "Mobile & Web Apps",
    text: "Custom mobile and web applications built to solve problems, simplify tasks, and provide accessible, user-friendly digital experiences.",
  },
  {
    title: "Business Systems",
    text: "Smart digital solutions that streamline business operations, manage data, automate workflows, and improve overall efficiency.",
  },
  {
    title: "AI Automation & Integration",
    text: "AI-powered solutions that automate repetitive tasks, enhance decision-making, and integrate intelligent features into existing systems.",
  },
  {
    title: "IoT Solutions",
    text: "Connected devices and smart systems that use sensors, microcontrollers, and real-time data to monitor, control, and automate processes.",
  },
  {
    title: "Custom Full-Stack Development",
    text: "End-to-end development of tailored digital solutions, combining intuitive frontends, powerful backends, databases, and APIs into one integrated system.",
  },
];

function Services() {
  const trackRef = useRef(null);
  const pinRef = useRef(null);
  const [active, setActive] = useState(-1);

  // Which service is open depends only on how far you have scrolled through the pinned
  // stretch (each service owns an equal slice), never on the rows' own height, so opening
  // and closing rows can't make it flicker.
  useEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    if (!track || !pin) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const span = track.offsetHeight - pin.offsetHeight;
      const p = span > 0 ? -track.getBoundingClientRect().top / span : 0;
      const idx = p < 0 ? -1 : Math.min(SERVICES.length - 1, Math.floor(p * SERVICES.length));
      setActive((prev) => (prev === idx ? prev : idx));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const jumpTo = (i) => {
    const track = trackRef.current;
    const pin = pinRef.current;
    if (!track || !pin) return;
    const span = track.offsetHeight - pin.offsetHeight;
    const top = track.getBoundingClientRect().top + window.scrollY + span * ((i + 0.5) / SERVICES.length);
    if (window.__lenis) window.__lenis.scrollTo(top, { duration: 1.2 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section
      ref={trackRef}
      id="services"
      className="svc-track"
      style={{ "--svc-n": SERVICES.length }}
      aria-label="Services"
    >
      <div ref={pinRef} className="svc-pin">
        <h2 className="svc-heading">Services</h2>
        <ul className={"svc-list" + (active !== -1 ? " has-on" : "")}>
          {SERVICES.map((s, i) => (
            <li key={s.title} className={"svc-row" + (i === active ? " on" : "")}>
              <h3>
                <button
                  type="button"
                  className="svc-title"
                  aria-expanded={i === active}
                  onClick={() => jumpTo(i)}
                >
                  {s.title}
                </button>
              </h3>
              <div className="svc-desc">
                <div className="svc-desc-in">
                  <p>{s.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
/* services:end */`);

const CSS_BLOCK = nl(
`/* services:css:start */
/* Services: pinned red panel. Same red (#E02B20) and cream (#F6F5F2) as the rest of the site.
   Heights use the same small/large viewport variables as the About brush (--ab-svh / --ab-lvh)
   so phones with a collapsing URL bar don't show a strip under the panel. */
.svc-track {
  --svc-n: 6;      /* number of services (set from React) */
  --svc-zone: 60;  /* scroll per service, in % of one screen: higher = slower, lower = faster */
  position: relative;
  height: calc(100vh * (1 + var(--svc-n) * var(--svc-zone) / 100));
  height: calc(var(--ab-svh, 100vh) * (1 + var(--svc-n) * var(--svc-zone) / 100) + (var(--ab-lvh, 100vh) - var(--ab-svh, 100vh)));
}
.svc-pin {
  position: sticky;
  top: 0;
  height: 100vh;
  height: var(--ab-lvh, 100vh);
  overflow: hidden;
  background: #E02B20;
  color: #F6F5F2;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* extra space on top keeps the content clear of the floating navbar */
  padding: calc(4vh + 48px) 0 4vh;
  padding: calc(max(4svh, env(safe-area-inset-top, 0px)) + 48px) 0 calc(4svh + var(--ab-lvh, 100vh) - var(--ab-svh, 100vh));
}
.svc-pin ::selection { background: #F6F5F2; color: #E02B20; }

.svc-heading {
  margin: 0 0 clamp(18px, 4.2vh, 44px);
  margin-bottom: clamp(18px, 4.2svh, 44px);
  padding: 0 20px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.15rem, min(3.6vw, 3.4vh), 1.9rem);
  font-size: clamp(1.15rem, min(3.6vw, 3.4svh), 1.9rem);
  line-height: 1.1;
  letter-spacing: -0.03em;
  opacity: 0.9;
}

.svc-list { list-style: none; margin: 0; padding: 0; }

.svc-row {
  text-align: center;
  transition: background-color 0.8s cubic-bezier(0.22, 1, 0.36, 1),
              color 0.8s cubic-bezier(0.22, 1, 0.36, 1),
              padding 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.svc-row + .svc-row { border-top: 1px solid rgba(246, 245, 242, 0.3); } /* edge-to-edge hairlines */
.svc-row h3 { margin: 0; }

.svc-title {
  display: block;
  width: 100%;
  min-height: 0; /* beats the global mobile \`button { min-height: 44px }\` */
  margin: 0;
  padding: 0.27em clamp(20px, 6vw, 80px);
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.2rem, min(6.2vw, 5vh), 3.6rem);
  font-size: clamp(1.2rem, min(6.2vw, 5svh), 3.6rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
  text-wrap: balance;
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1); /* beats the global \`button { transition: all }\` */
  -webkit-tap-highlight-color: transparent;
}
.svc-title:focus-visible { outline: 2px solid currentColor; outline-offset: -6px; border-radius: 12px; }

/* description opens with a smooth height animation (grid rows 0fr -> 1fr) */
.svc-desc {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.svc-desc-in { min-height: 0; overflow: hidden; }
.svc-desc p {
  margin: 0 auto;
  max-width: 50ch;
  padding: 0 28px clamp(18px, 4vh, 48px);
  padding-bottom: clamp(18px, 4svh, 48px);
  font-family: var(--font-body);
  font-weight: 400;
  font-size: clamp(0.95rem, 1.5vw, 1.1rem);
  line-height: 1.7;
  text-align: center;
  text-wrap: balance;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s, transform 0.4s;
}

/* the service in focus: white, black text, expanded */
.svc-row.on {
  background: #F6F5F2;
  color: #141414;
  padding-top: clamp(10px, 2.2vh, 24px);
  padding-top: clamp(10px, 2.2svh, 24px);
}
.svc-row.on .svc-desc { grid-template-rows: 1fr; }
.svc-row.on .svc-desc p {
  opacity: 1;
  transform: none;
  transition: opacity 0.7s 0.25s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.svc-list.has-on .svc-row:not(.on) .svc-title { opacity: 0.5; }

/* short laptop screens: slightly smaller titles so everything still fits on one screen */
@media (max-height: 640px) {
  .svc-title { font-size: clamp(1.1rem, min(6.2vw, 4.4vh), 3rem); font-size: clamp(1.1rem, min(6.2vw, 4.4svh), 3rem); }
}

@media (prefers-reduced-motion: reduce) {
  .svc-row, .svc-title, .svc-desc, .svc-desc p { transition: none !important; }
  .svc-desc p { transform: none; }
}
/* services:css:end */`);

/* ── Patterns ───────────────────────────────────────────────────────────── */

const COMP_RE = /[ \t]*\/\* services:start \*\/[\s\S]*?\/\* services:end \*\/(?:\r?\n)*/;
const CSS_RE = /(?:\r?\n)*\/\* services:css:start \*\/[\s\S]*?\/\* services:css:end \*\/(?:\r?\n)?/;

const PAGE_FN = "export default function Page() {";
const JSX_ANCHOR_RE = /^([ \t]*)<TechStack \/>\r?\n/m;
const JSX_SERVICES_RE = /^[ \t]*<Services \/>\r?\n/m;

const NAV_OLD_RE = /\{\s*id:\s*"",\s*label:\s*"Services"\s*\}/;
const NAV_NEW_RE = /\{\s*id:\s*"services",\s*label:\s*"Services"\s*\}/;
const NAV_OLD = '{ id: "", label: "Services" }';
const NAV_NEW = '{ id: "services", label: "Services" }';

function backupOnce(file) {
  const bak = file + BAK;
  if (!existsSync(bak)) {
    if (!DRY) copyFileSync(file, bak);
    note(`  backup   ${path.relative(__dirname, bak)}`);
  }
}

/* ── Revert ─────────────────────────────────────────────────────────────── */
if (REVERT) {
  note("Reverting services section" + (DRY ? " (dry run)" : "") + "...");
  let pageChanged = false;

  if (JSX_SERVICES_RE.test(page)) { page = page.replace(JSX_SERVICES_RE, ""); pageChanged = true; note("  removed <Services /> from the page"); }
  if (COMP_RE.test(page)) { page = page.replace(COMP_RE, ""); pageChanged = true; note("  removed Services() component"); }
  if (NAV_NEW_RE.test(page)) { page = page.replace(NAV_NEW_RE, NAV_OLD); pageChanged = true; note("  restored nav Services link"); }
  if (!pageChanged) note("  app/page.js: nothing to revert");
  else if (!DRY) writeFileSync(F.page, page);

  if (CSS_RE.test(css)) {
    css = css.replace(CSS_RE, EOL).replace(/(\r?\n)+$/, EOL);
    if (!DRY) writeFileSync(F.css, css);
    note("  reverted app/globals.css");
  } else note("  app/globals.css: nothing to revert");

  if (!DRY) for (const k of Object.keys(F)) if (existsSync(F[k] + BAK)) unlinkSync(F[k] + BAK);
  note(DRY ? "Dry run only, nothing was written." : "Done.");
  process.exit(0);
}

/* ── Apply ──────────────────────────────────────────────────────────────── */
note("Applying pinned services section" + (DRY ? " (dry run)" : "") + "...");

// Work out every change in memory first, so nothing is written if an anchor is missing.
let pageChanged = false;
let cssChanged = false;
const steps = [];

// 1) component + data (adds it, or replaces an earlier version in place)
if (COMP_RE.test(page)) {
  const next = page.replace(COMP_RE, () => COMPONENT + EOL + EOL);
  if (next === page) {
    steps.push("  app/page.js: Services() already up to date, skipped");
  } else {
    page = next;
    pageChanged = true;
    steps.push("  patched  app/page.js (upgraded the earlier Services() to the pinned version)");
  }
} else {
  const at = page.indexOf(PAGE_FN);
  if (at === -1) fail(`"${PAGE_FN}" not found in app/page.js. Has the file been restructured? Nothing was written.`);
  page = page.slice(0, at) + COMPONENT + EOL + EOL + page.slice(at);
  pageChanged = true;
  steps.push("  patched  app/page.js (added SERVICES + Services())");
}

// 2) render it after <TechStack />
if (JSX_SERVICES_RE.test(page)) {
  steps.push("  app/page.js: <Services /> already rendered, skipped");
} else {
  if (!JSX_ANCHOR_RE.test(page)) fail("<TechStack /> not found in app/page.js, so there is no place to render Services. Nothing was written.");
  page = page.replace(JSX_ANCHOR_RE, (m, indent) => m + indent + "<Services />" + EOL);
  pageChanged = true;
  steps.push("  patched  app/page.js (<Services /> after <TechStack />)");
}

// 3) nav link
if (NAV_NEW_RE.test(page)) {
  steps.push("  app/page.js: nav link already points to #services, skipped");
} else if (NAV_OLD_RE.test(page)) {
  page = page.replace(NAV_OLD_RE, NAV_NEW);
  pageChanged = true;
  steps.push('  patched  app/page.js (nav "Services" -> #services)');
} else {
  fail('The NAV_LINKS entry for "Services" was not found as expected. Nothing was written.');
}

// 4) css (adds the block, or replaces an earlier version in place)
if (CSS_RE.test(css)) {
  const next = css.replace(CSS_RE, () => EOL + EOL + CSS_BLOCK + EOL);
  if (next === css) {
    steps.push("  app/globals.css: already up to date, skipped");
  } else {
    css = next;
    cssChanged = true;
    steps.push("  updated  app/globals.css (replaced the earlier Services styles)");
  }
} else {
  css = css.replace(/\s*$/, EOL + EOL) + CSS_BLOCK + EOL;
  cssChanged = true;
  steps.push("  patched  app/globals.css");
}

if (pageChanged) backupOnce(F.page);
if (cssChanged) backupOnce(F.css);
steps.forEach(note);

if (!DRY) {
  if (pageChanged) writeFileSync(F.page, page);
  if (cssChanged) writeFileSync(F.css, css);
}

if (DRY) {
  note("Dry run only, nothing was written.");
} else {
  note("");
  note("Done. Next steps:");
  note("  1. Run `npm run dev` (or refresh if it is already running) and open http://localhost:3000");
  note("  2. Scroll past \"What I build with\", or click \"Services\" in the nav. The red panel pins and each");
  note("     service opens in turn as you scroll. Click a title to jump to it.");
  note("  3. Titles and descriptions live in the SERVICES array in app/page.js.");
  note("  4. Scroll speed: change --svc-zone in app/globals.css (60 = 60% of a screen per service;");
  note("     higher is slower, lower is faster).");
  note("  5. Happy with it? Commit: git add -A && git commit -m \"Add pinned services section\"");
  note("  6. Not happy? Remove it completely: node apply-services-pinned.mjs --revert");
}
