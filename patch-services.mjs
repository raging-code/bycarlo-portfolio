#!/usr/bin/env node
/**
 * patch-services.mjs — byCarlo portfolio
 * Replaces the Services section with the new premium accordion (red background kept).
 *
 * Run from the repo root:
 *   node patch-services.mjs            apply the patch
 *   node patch-services.mjs --dry-run  show what would change, write nothing
 *   node patch-services.mjs --revert   restore the .bak backups made by the patch
 *
 * It only touches the text between these markers (they already exist in your repo):
 *   app/page.js      /* services:start *\/      ...  /* services:end *\/
 *   app/globals.css  /* services:css:start *\/  ...  /* services:css:end *\/
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const PAGE = path.join(root, "app", "page.js");
const CSS = path.join(root, "app", "globals.css");
const args = new Set(process.argv.slice(2));
const dry = args.has("--dry-run");

const JSX_START = "/* services:start */";
const JSX_END = "/* services:end */";
const CSS_START = "/* services:css:start */";
const CSS_END = "/* services:css:end */";

/* ───────────────────────── new JSX ───────────────────────── */
const JSX_BLOCK = String.raw`${JSX_START}
/* ── Services (accordion on red: premium, clean, mobile-first) ─────────────── */
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
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section id="services" className="svc-section" aria-labelledby="services-heading">
      <div className="svc-wrap">
        <h2 id="services-heading" className="svc-heading">SERVICES</h2>
        <ul className="svc-list">
          {SERVICES.map((s, i) => {
            const isOpen = openIndex === i;
            return (
              <li key={s.title} className={isOpen ? "svc-row is-open" : "svc-row"}>
                <h3 className="svc-head">
                  <button
                    type="button"
                    id={"svc-btn-" + i}
                    className="svc-trigger"
                    aria-expanded={isOpen}
                    aria-controls={"svc-panel-" + i}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    <span className="svc-title">{s.title}</span>
                    <span className="svc-icon" aria-hidden="true" />
                  </button>
                </h3>
                <div
                  id={"svc-panel-" + i}
                  role="region"
                  aria-labelledby={"svc-btn-" + i}
                  className="svc-panel"
                >
                  <div className="svc-panel-inner">
                    <p className="svc-text">{s.text}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
${JSX_END}`;

/* ───────────────────────── new CSS ───────────────────────── */
const CSS_BLOCK = String.raw`${CSS_START}
/* services-accordion: premium accordion on the site red (#E02B20) with cream (#F6F5F2). */
.svc-section {
  --svc-pull: 100px; /* tucks Services up toward Projects: bigger = closer, 0 = no overlap */
  position: relative;
  margin-top: calc(var(--svc-pull) * -1);
  background: #E02B20;
  color: #F6F5F2;
  /* extra top space keeps the heading clear of the floating navbar and the overlap above */
  padding: calc(var(--svc-pull) + clamp(72px, 10vw, 140px)) clamp(20px, 5vw, 64px) clamp(72px, 10vw, 140px);
}
.svc-section ::selection { background: #F6F5F2; color: #E02B20; }
.svc-wrap { max-width: 1180px; margin: 0 auto; }

.svc-heading {
  margin: 0 0 clamp(40px, 6vw, 80px);
  text-align: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(52px, 12.5vw, 176px);
  line-height: 0.88;
  letter-spacing: -0.055em;
}

.svc-list { list-style: none; margin: 0; padding: 0; }
.svc-row { border-top: 1px solid rgba(246, 245, 242, 0.34); }
.svc-row:last-child { border-bottom: 1px solid rgba(246, 245, 242, 0.34); }
.svc-head { margin: 0; font: inherit; }

.svc-trigger {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: clamp(20px, 2.6vw, 34px) 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.svc-trigger:focus-visible { outline: 2px solid #F6F5F2; outline-offset: 4px; border-radius: 8px; }

.svc-title {
  flex: 1;
  text-align: left;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(24px, 4.2vw, 56px);
  line-height: 1.05;
  letter-spacing: -0.04em;
  text-wrap: balance;
  transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
}
@media (hover: hover) {
  .svc-trigger:hover .svc-title { transform: translateX(10px); }
  .svc-trigger:hover .svc-icon { border-color: #F6F5F2; }
}

/* plus / minus circle */
.svc-icon {
  flex: none;
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(246, 245, 242, 0.5);
  transition: background 0.35s, color 0.35s, border-color 0.35s, transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.svc-icon::before,
.svc-icon::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 1.5px;
  background: currentColor;
  transform: translate(-50%, -50%);
}
.svc-icon::after {
  transform: translate(-50%, -50%) rotate(90deg);
  transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.svc-row.is-open .svc-icon {
  background: #F6F5F2;
  color: #E02B20;
  border-color: #F6F5F2;
  transform: rotate(180deg);
}
.svc-row.is-open .svc-icon::after { transform: translate(-50%, -50%) rotate(0deg); }

/* smooth height animation without measuring */
.svc-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.svc-row.is-open .svc-panel { grid-template-rows: 1fr; }
.svc-panel-inner { overflow: hidden; }
.svc-text {
  margin: 0;
  max-width: 62ch;
  padding: 0 60px clamp(24px, 3vw, 40px) 0;
  font-family: var(--font-body);
  font-weight: 400;
  font-size: clamp(15px, 1.3vw, 18px);
  line-height: 1.7;
  opacity: 0.9;
}

@media (max-width: 600px) {
  .svc-icon { width: 38px; height: 38px; }
  .svc-trigger { gap: 12px; }
  .svc-text { padding-right: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .svc-title, .svc-icon, .svc-icon::after, .svc-panel { transition: none; }
}
${CSS_END}`;

/* ───────────────────────── helpers ───────────────────────── */
function fail(msg) {
  console.error("✖ " + msg);
  process.exit(1);
}
function readFile(p) {
  if (!fs.existsSync(p)) fail("Cannot find " + path.relative(root, p) + ". Run this from the repo root.");
  return fs.readFileSync(p, "utf8");
}
function swap(src, start, end, block, label) {
  const a = src.indexOf(start);
  const b = src.indexOf(end);
  if (a === -1 || b === -1 || b < a) fail("Markers for " + label + " not found in the expected order.");
  const before = src.slice(0, a);
  const after = src.slice(b + end.length);
  return before + block + after;
}

/* ───────────────────────── revert ───────────────────────── */
if (args.has("--revert")) {
  for (const p of [PAGE, CSS]) {
    const bak = p + ".bak";
    if (!fs.existsSync(bak)) fail("No backup found for " + path.relative(root, p));
    fs.copyFileSync(bak, p);
    console.log("↩ restored " + path.relative(root, p));
  }
  process.exit(0);
}

/* ───────────────────────── apply ───────────────────────── */
const pageSrc = readFile(PAGE);
const cssSrc = readFile(CSS);

if (!/\buseState\b/.test(pageSrc.split("\n").slice(0, 8).join("\n"))) {
  fail('app/page.js must import useState from "react" (it normally does).');
}

const pageOut = swap(pageSrc, JSX_START, JSX_END, JSX_BLOCK, "page.js");
const cssOut = swap(cssSrc, CSS_START, CSS_END, CSS_BLOCK, "globals.css");

if (pageOut === pageSrc && cssOut === cssSrc) {
  console.log("✓ Already up to date, nothing to change.");
  process.exit(0);
}

if (dry) {
  console.log("Dry run. Would update:");
  console.log("  app/page.js      " + pageSrc.length + " → " + pageOut.length + " chars");
  console.log("  app/globals.css  " + cssSrc.length + " → " + cssOut.length + " chars");
  process.exit(0);
}

for (const p of [PAGE, CSS]) {
  if (!fs.existsSync(p + ".bak")) fs.copyFileSync(p, p + ".bak");
}
fs.writeFileSync(PAGE, pageOut);
fs.writeFileSync(CSS, cssOut);

console.log("✓ Services section updated (red background kept).");
console.log("  Backups: app/page.js.bak, app/globals.css.bak");
console.log("  Undo with: node patch-services.mjs --revert");
console.log("  Then run:  npm run dev");
