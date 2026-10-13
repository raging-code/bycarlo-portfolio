#!/usr/bin/env node
/**
 * apply-about-hero.mjs
 *
 * Replaces the "Hi, I'm Carlo." About / IntroProfile section with the new
 * design: photo inside concentric rings on the left, big heading and
 * paragraph on the right. On phones the photo stacks on top and the text
 * goes below.
 *
 * What it changes:
 *   1. app/page.js     -> replaces the IntroProfile component
 *   2. app/globals.css -> adds a clearly marked "about-hero" CSS block
 *
 * Fonts/colors come from your existing setup (nothing new to install):
 *   heading   = var(--font-display)  Plus Jakarta Sans 800
 *   paragraph = var(--font-body)     DM Sans
 *   colors    = --accent, --text-primary, --text-secondary
 *
 * Usage (run from the project root, next to package.json):
 *   node apply-about-hero.mjs             # apply
 *   node apply-about-hero.mjs --dry-run   # preview only, writes nothing
 *
 * Safe to re-run. Backups are saved once as
 *   app/page.js.bak-about-hero and app/globals.css.bak-about-hero
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(__dirname, "app", "page.js");
const CSS = path.join(__dirname, "app", "globals.css");
const DRY_RUN = process.argv.includes("--dry-run");

const JSX_MARK = "about-hero v2";
const CSS_START = "/* about-hero:start */";
const CSS_END = "/* about-hero:end */";

const NEW_COMPONENT = `/* ── Intro Profile (${JSX_MARK}) ─── */
function IntroProfile({ isMobile }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const E = [0.22, 1, 0.36, 1];

  return (
    <motion.section ref={ref} className="ip-section theme-section">
      <div className="ip-stage">
        <div className="ip-about">
          <motion.div
            className="ip-visual"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.9, ease: E }}
          >
            <div className="ip-outer" aria-hidden="true">
              <span className="ip-ring ip-r3" />
              <span className="ip-ring ip-r2" />
              <span className="ip-ring ip-r1" />
            </div>
            <span className="ip-ring ip-r0" aria-hidden="true" />
            <div className="ip-me">
              <img src="/png/me.png" alt="Carlo" draggable={false} />
            </div>
          </motion.div>

          <div className="ip-text">
            <motion.h2
              className="ip-title"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.15, ease: E }}
            >
              Hi, I&rsquo;m
              <br />
              Carlo<span className="ip-dot">.</span>
            </motion.h2>
            <motion.p
              className="ip-copy"
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease: E }}
            >
              I&rsquo;m a Computer Engineering student and a software developer passionate about building practical, innovative tech solutions. From web and mobile apps to AI, automation, and IoT, I enjoy turning ideas into real-world projects that solve problems and make life easier.
            </motion.p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

`;

const NEW_CSS = `${CSS_START}
.ip-section { position: relative; overflow: hidden; }
.ip-stage { container-type: inline-size; width: 100%; }
.ip-about {
  display: flex; align-items: center; gap: 1.6cqw;
  min-height: 46cqw; padding: 3cqw 0 3cqw 7cqw;
}
.ip-visual { position: relative; flex: none; width: 38.9cqw; aspect-ratio: 1; margin-top: 1.6cqw; }
.ip-ring { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 50%; aspect-ratio: 1; }
.ip-r0 { width: 100%; border: 1.5px solid var(--accent);
  background: radial-gradient(circle at 32% 48%, #efe5d6 0%, #f2ece2 45%, #f6f5f2 100%); }
.ip-outer {
  position: absolute; left: 50%; top: 50%; width: 150%; aspect-ratio: 1;
  transform: translate(-50%, -50%); pointer-events: none;
  -webkit-mask-image: linear-gradient(to right, #000 62%, transparent 84%);
          mask-image: linear-gradient(to right, #000 62%, transparent 84%);
}
.ip-r1 { width: 77.6%; border: 1.2px solid rgba(201, 166, 107, 0.65); }
.ip-r2 { width: 88.7%; border: 1.2px solid rgba(224, 43, 32, 0.38); }
.ip-r3 { width: 100%;  border: 1px solid rgba(224, 43, 32, 0.14); }
/* me.png is 1086x1448 with transparent padding; the figure itself occupies
   x 405-1064, y 424-1448. The wrapper is the figure's box and the image is
   offset inside it, so no re-cropping of the file is needed. */
.ip-me {
  position: absolute; left: 29%; top: 2%; width: 62.5%;
  aspect-ratio: 659 / 1024; overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, #000 74%, transparent 100%);
          mask-image: linear-gradient(to bottom, #000 74%, transparent 100%);
}
.ip-me img {
  position: absolute; left: -61.46%; top: -41.41%;
  width: 164.8%; max-width: none; height: auto; display: block;
  user-select: none; -webkit-user-drag: none;
}
.ip-text { max-width: 42cqw; position: relative; z-index: 1; }
.ip-title {
  margin: 0; font-family: var(--font-display); font-weight: 800;
  font-size: clamp(52px, 7.1cqw, 140px); line-height: 0.92; letter-spacing: -0.045em;
  color: var(--text-primary);
}
.ip-dot { color: var(--accent); }
.ip-copy {
  margin: 2.2cqw 0 0; font-family: var(--font-body); font-weight: 400;
  font-size: clamp(15px, 1.5cqw, 30px); line-height: 1.63; color: var(--text-secondary);
}
/* Phones: photo on top, text below */
@container (max-width: 767px) {
  .ip-about { flex-direction: column; align-items: flex-start; padding: 40px 24px 48px; min-height: 0; gap: 28px; }
  .ip-visual { width: 64cqw; max-width: 300px; margin: 12px 0 0; align-self: center; }
  .ip-outer { -webkit-mask-image: none; mask-image: none; }
  .ip-text { max-width: 100%; }
  .ip-title { font-size: 56px; }
  .ip-copy { font-size: 16px; margin-top: 18px; }
}
${CSS_END}
`;

function fail(msg) { console.error("✖ " + msg); process.exit(1); }
function backup(file) {
  const bak = file + ".bak-about-hero";
  if (!existsSync(bak)) copyFileSync(file, bak);
}

if (!existsSync(PAGE) || !existsSync(CSS)) fail("Run this from the project root (app/page.js and app/globals.css must exist).");

// ── 1. page.js ───────────────────────────────────────────────────────────
let page = readFileSync(PAGE, "utf8");
if (page.includes(JSX_MARK)) {
  console.log("• page.js: already updated, skipping.");
} else {
  const a = page.indexOf("Intro Profile (rings");
  const b = page.indexOf("Projects (transparent");
  if (a === -1 || b === -1 || b < a) fail("Could not find the IntroProfile section markers in app/page.js.");
  const start = page.lastIndexOf("\n", a) + 1;
  const end = page.lastIndexOf("\n", b) + 1;
  page = page.slice(0, start) + NEW_COMPONENT + page.slice(end);
  console.log("✔ page.js: IntroProfile replaced.");
  if (!DRY_RUN) { backup(PAGE); writeFileSync(PAGE, page); }
}

// ── 2. globals.css ───────────────────────────────────────────────────────
let css = readFileSync(CSS, "utf8");
const s = css.indexOf(CSS_START);
const e = css.indexOf(CSS_END);
if (s !== -1 && e !== -1) {
  css = css.slice(0, s) + NEW_CSS.trimEnd() + css.slice(e + CSS_END.length);
  console.log("✔ globals.css: about-hero block refreshed.");
} else {
  css = css.trimEnd() + "\n\n" + NEW_CSS;
  console.log("✔ globals.css: about-hero block added.");
}
if (!DRY_RUN) { backup(CSS); writeFileSync(CSS, css); }

console.log(DRY_RUN ? "\n(dry run: nothing was written)" : "\nDone. Run `npm run dev` and check the About section.");
