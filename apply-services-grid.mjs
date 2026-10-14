#!/usr/bin/env node
/**
 * apply-services-grid.mjs
 *
 * Replaces the pinned, scroll-driven Services section with a static grid:
 * a large "SERVICES" heading, then your six services in 2 columns x 3 rows on the
 * site's red (#E02B20), each with a hairline above it, a title and a short description.
 * No numbering, no hover or scroll animation. Single column on phones.
 *
 * Run from the repo root (bycarlo-portfolio):
 *
 *   node apply-services-grid.mjs
 *
 * What it does
 *  1. app/page.js     - replaces everything between the "services:start" and "services:end"
 *     markers with a simple <Services /> component. Your existing SERVICES array
 *     (titles + descriptions) is kept exactly as it is in the file, so any copy edits
 *     you made are preserved. The pin/scroll logic, gold indicator and word-by-word
 *     reveal are removed. <Services /> is still rendered in the same place.
 *  2. app/globals.css - replaces everything between "services:css:start" and
 *     "services:css:end" with the new grid styles.
 *
 * Tuning (app/globals.css, .svc-section / .svc-grid / .svc-item)
 *  - --svc-pull        how far the section tucks up under Projects (set 0 for no overlap)
 *  - .svc-grid row-gap space between rows (0 = lines touch the row above's text block)
 *  - .svc-item padding space inside each cell
 *
 * Safety
 *  - Works with LF or CRLF files; original line endings are kept.
 *  - Everything is validated in memory first. If a marker is missing, NOTHING is written.
 *  - Originals are copied once to .patch-backups/ before being changed.
 *  - Safe to re-run: if the grid is already applied it does nothing.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const TAG = 'services-grid';
const PAGE = resolve('app/page.js');
const CSS = resolve('app/globals.css');
const BACKUP_DIR = resolve('.patch-backups');

const JS_START = '/* services:start */';
const JS_END = '/* services:end */';
const CSS_START = '/* services:css:start */';
const CSS_END = '/* services:css:end */';

/* ------------------------------------------------------------------ */
/* New blocks                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_SERVICES = `const SERVICES = [
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
];`;

function jsBlock(servicesArray) {
  return `${JS_START}
/* ── Services (${TAG}: static 2-column grid on red) ─────────────────── */
${servicesArray}

function Services() {
  return (
    <section id="services" className="svc-section" aria-labelledby="services-heading">
      <div className="svc-wrap">
        <h2 id="services-heading" className="svc-heading">SERVICES</h2>
        <ul className="svc-grid">
          {SERVICES.map((s) => (
            <li key={s.title} className="svc-item">
              <h3 className="svc-title">{s.title}</h3>
              <p className="svc-text">{s.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
${JS_END}`;
}

const CSS_BLOCK = `${CSS_START}
/* ${TAG}: Services as a static 2-column x 3-row grid on the site red.
   Same red (#E02B20) and cream (#F6F5F2) as the rest of the site. */
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
  margin: 0 0 clamp(24px, 4vw, 56px);
  text-align: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(52px, 12.5vw, 176px);
  line-height: 0.88;
  letter-spacing: -0.055em;
}

.svc-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: clamp(16px, 2.4vw, 32px);
  row-gap: 0;
}

/* one hairline above each service, no numbering, no hover or scroll motion */
.svc-item {
  border-top: 1px solid rgba(246, 245, 242, 0.34);
  padding: clamp(14px, 1.8vw, 24px) clamp(20px, 4vw, 64px) clamp(16px, 2vw, 28px);
  text-align: center;
}
.svc-title {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(24px, 3vw, 42px);
  line-height: 1.05;
  letter-spacing: -0.04em;
  text-wrap: balance;
}
.svc-text {
  margin: 0 auto;
  max-width: 44ch;
  font-family: var(--font-body);
  font-weight: 400;
  font-size: clamp(14px, 1.2vw, 16px);
  line-height: 1.7;
  opacity: 0.9;
  text-wrap: balance;
}

@media (max-width: 767px) {
  .svc-grid { grid-template-columns: 1fr; }
  .svc-item { padding: 16px 20px 20px; }
}
${CSS_END}`;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fail(msg) {
  console.error('\n✖ ' + msg + '\n  Nothing was written.\n');
  process.exit(1);
}

function load(path) {
  if (!existsSync(path)) fail('Cannot find ' + path + '. Run this from the repo root (bycarlo-portfolio).');
  const raw = readFileSync(path, 'utf8');
  const crlf = raw.includes('\r\n');
  return { raw, crlf, text: crlf ? raw.replace(/\r\n/g, '\n') : raw };
}

function swapBlock(text, start, end, replacement, label) {
  const a = text.indexOf(start);
  const b = text.indexOf(end);
  if (a === -1 || b === -1 || b < a) {
    fail('Could not find the "' + start + '" / "' + end + '" markers in ' + label + '.');
  }
  return {
    before: text.slice(a, b + end.length),
    next: text.slice(0, a) + replacement + text.slice(b + end.length),
  };
}

function backup(path) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const dest = resolve(BACKUP_DIR, basename(path) + '.' + TAG + '.bak');
  if (!existsSync(dest)) copyFileSync(path, dest);
}

/* ------------------------------------------------------------------ */
/* Run                                                                 */
/* ------------------------------------------------------------------ */

const page = load(PAGE);
const css = load(CSS);

if (page.text.includes('svc-grid') && css.text.includes('.svc-grid')) {
  console.log('✔ Services grid is already applied. Nothing to do.');
  process.exit(0);
}

// keep the user's current SERVICES array (copy edits included) if it can be found
const old = page.text.slice(
  Math.max(0, page.text.indexOf(JS_START)),
  Math.max(0, page.text.indexOf(JS_END))
);
const m = old.match(/const SERVICES = \[[\s\S]*?\n\];/);
const servicesArray = m ? m[0] : DEFAULT_SERVICES;

const pageSwap = swapBlock(page.text, JS_START, JS_END, jsBlock(servicesArray), 'app/page.js');
const cssSwap = swapBlock(css.text, CSS_START, CSS_END, CSS_BLOCK, 'app/globals.css');

// everything validated: back up once, then write
backup(PAGE);
backup(CSS);

const out = (t, crlf) => (crlf ? t.replace(/\n/g, '\r\n') : t);
writeFileSync(PAGE, out(pageSwap.next, page.crlf));
writeFileSync(CSS, out(cssSwap.next, css.crlf));

console.log('✔ app/page.js     - Services replaced with the static grid' + (m ? ' (existing services kept)' : ' (default services used)'));
console.log('✔ app/globals.css - new Services styles added');
console.log('  Backups in .patch-backups/. Run "npm run dev" to check it.');
