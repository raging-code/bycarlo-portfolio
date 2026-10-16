#!/usr/bin/env node
/**
 * byCarlo - Tech stack: fanned card deck
 *
 * Applies the "B - seam" reference (techstack-B-seam.html) to the Tech stack section
 * of the Next.js site, with the numbered category list and the "Tech stack" eyebrow removed:
 *
 *   - app/page.js       TechStack section rewritten (tabs + 3D icons -> red band + card deck),
 *                       Mobile category added, unused react-icons imports removed
 *   - app/globals.css   old .ts-* tab / 3D-icon CSS replaced with the new .tsd-* CSS
 *   - public/logos/     adds nextjs, express, github, vercel, expo, flutter (same SVGs as the reference)
 *
 * Usage (run from the project root, or pass the project folder):
 *   node patch-techstack-deck.mjs
 *   node patch-techstack-deck.mjs C:\path\to\bycarlo-portfolio
 *   node patch-techstack-deck.mjs --dry-run     show what would change, write nothing
 *   node patch-techstack-deck.mjs --revert      restore the backups and remove the added logos
 *
 * Safe to run twice: it detects its own markers and skips. Backups go to
 * .patch-backups/techstack-deck/ (the original files are only copied the first time).
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const REVERT = args.includes("--revert");
const ROOT = path.resolve(args.find((a) => !a.startsWith("--")) || process.cwd());

const PAGE = path.join(ROOT, "app", "page.js");
const CSS = path.join(ROOT, "app", "globals.css");
const LOGO_DIR = path.join(ROOT, "public", "logos");
const BACKUP_DIR = path.join(ROOT, ".patch-backups", "techstack-deck");
const MANIFEST = path.join(BACKUP_DIR, "created-files.json");

const PAGE_START = "/* techstack-deck:start */";
const PAGE_END = "/* techstack-deck:end */";
const CSS_START = "/* techstack-deck:css:start */";

const log = (m) => console.log(m);
const fail = (m) => { console.error("\nERROR: " + m + "\nNothing was changed."); process.exit(1); };
const eolOf = (s) => (s.includes("\r\n") ? "\r\n" : "\n");
const toEol = (s, eol) => s.replace(/\r?\n/g, eol);

/* ---------- new code ---------- */

const NEW_PAGE_BLOCK = String.raw`/* techstack-deck:start */
/* ── Tech stack: fanned card deck ───────────────────
   One card per category. Drag the front card sideways, click a card behind it,
   or focus the deck and use the arrow keys.
   Edit the tools here: file = /public/logos/<file>.svg */
const TECH_CATEGORIES = [
  {
    label: "Frontend",
    tools: [
      { name: "React", file: "react" },
      { name: "Next.js", file: "nextjs" },
      { name: "TypeScript", file: "typescript" },
      { name: "Tailwind", file: "tailwindcss" },
    ],
  },
  {
    label: "Backend",
    tools: [
      { name: "Node.js", file: "nodejs" },
      { name: "Express", file: "express" },
      { name: "GraphQL", file: "graphql" },
      { name: "Python", file: "python" },
      { name: "Postman", file: "postman" },
    ],
  },
  {
    label: "Database",
    tools: [
      { name: "PostgreSQL", file: "postgresql" },
      { name: "MongoDB", file: "mongodb" },
      { name: "Cloudflare D1", file: "cloudflare" },
    ],
  },
  {
    label: "Security",
    tools: [
      { name: "JWT", file: "jwt" },
      { name: "OAuth", file: "auth0" },
    ],
  },
  {
    label: "Deploy",
    tools: [
      { name: "Cloudflare", file: "cloudflare" },
      { name: "Vercel", file: "vercel" },
      { name: "Docker", file: "docker" },
    ],
  },
  {
    label: "Dev tools",
    tools: [
      { name: "Git", file: "git" },
      { name: "GitHub", file: "github" },
      { name: "VS Code", file: "vscode" },
      { name: "ESLint", file: "eslint" },
      { name: "Jest", file: "jest" },
      { name: "npm", file: "npm" },
    ],
  },
  {
    label: "Mobile",
    tools: [
      { name: "React Native", file: "react" },
      { name: "Expo", file: "expo" },
      { name: "Flutter", file: "flutter" },
    ],
  },
];

const TSD_DRAG_THRESHOLD = 70; // px a card has to travel to count as a swipe
const TSD_STAGGER = 0.09; // seconds between each ring of cards when the deck fans out
// how far each ring of cards sits from the front card (index = distance from the front card)
const TSD_FAN_X = [0, 64, 112, 150];
const TSD_FAN_Y = [0, 14, 26, 38];
const TSD_FAN_ROTATE = [0, 6, 11, 15];
const TSD_FAN_SCALE = [1, 0.93, 0.87, 0.81];
const TSD_FAN_SHADE = [0, 0.12, 0.22, 0.31];

function tsdReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// shortest signed distance from the front card, so the deck wraps around
function tsdRelative(i, active, total) {
  let rel = i - active;
  if (rel > total / 2) rel -= total;
  if (rel < -total / 2) rel += total;
  return rel;
}

function TechStack() {
  const total = TECH_CATEGORIES.length;
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.12 });
  const deckInView = useInView(stageRef, { once: true, amount: 0.6 });

  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [staggering, setStaggering] = useState(false);
  const [scale, setScale] = useState(1); // follows --tsd-s so the fan spreads with the card size
  const [dragging, setDragging] = useState(false);
  const [dragDx, setDragDx] = useState(0);
  const drag = useRef(null);
  const revealedRef = useRef(false);
  const timers = useRef([]);

  const reveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    if (!tsdReducedMotion()) {
      setStaggering(true);
      timers.current.push(setTimeout(() => setStaggering(false), 1400));
    }
  }, []);

  // only the front card at first; the rest fan out once the deck is mostly on screen
  useEffect(() => {
    if (!deckInView) return;
    timers.current.push(setTimeout(reveal, tsdReducedMotion() ? 0 : 250));
  }, [deckInView, reveal]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    const read = () => {
      if (!sectionRef.current) return;
      const s = parseFloat(getComputedStyle(sectionRef.current).getPropertyValue("--tsd-s"));
      setScale(Number.isFinite(s) && s > 0 ? s : 1);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const goTo = useCallback(
    (i) => {
      reveal();
      setActive(((i % total) + total) % total);
    },
    [reveal, total]
  );

  // relative moves use the latest state, so quick repeated key presses never lose a step
  const step = useCallback(
    (delta) => {
      reveal();
      setActive((a) => (((a + delta) % total) + total) % total);
    },
    [reveal, total]
  );

  const handlePointerDown = (e, i) => {
    if (tsdRelative(i, active, total) !== 0) {
      goTo(i);
      return;
    }
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { id: e.pointerId, x0: e.clientX, t0: performance.now(), dx: 0 };
    setDragDx(0);
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const handlePointerMove = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    d.dx = e.clientX - d.x0;
    setDragDx(d.dx);
  };

  const handlePointerUp = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    setDragging(false);
    setDragDx(0);
    const velocity = d.dx / Math.max(performance.now() - d.t0, 1);
    if (d.dx < -TSD_DRAG_THRESHOLD || velocity < -0.5) step(1);
    else if (d.dx > TSD_DRAG_THRESHOLD || velocity > 0.5) step(-1);
  };

  // the browser took the gesture over (e.g. a vertical page scroll): just put the card back
  const handlePointerCancel = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    setDragging(false);
    setDragDx(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  };

  const cardStyle = (i) => {
    const rel = tsdRelative(i, active, total);
    const abs = Math.abs(rel);
    const dir = Math.sign(rel);
    const style = { zIndex: 50 - abs, "--shade": String(TSD_FAN_SHADE[Math.min(abs, 3)]) };
    if (staggering) style.transitionDelay = Math.max(abs - 1, 0) * TSD_STAGGER + "s";
    if (abs > 3) {
      style.visibility = "hidden";
      style.pointerEvents = "none";
      style.transform = "translateX(" + (dir > 0 ? 260 : -260) + "px) scale(0.6)";
    } else if (!revealed && rel !== 0) {
      // collapsed: tuck every other card behind the front one
      style.pointerEvents = "none";
      style.transform = "translateX(0) translateY(0) rotate(0deg) scale(0.9)";
    } else if (rel === 0 && dragging) {
      style.transform = "translateX(" + dragDx + "px) rotate(" + dragDx / 18 + "deg) scale(1)";
    } else {
      style.transform =
        "translateX(" + dir * TSD_FAN_X[abs] * scale + "px) translateY(" + TSD_FAN_Y[abs] * scale +
        "px) rotate(" + dir * TSD_FAN_ROTATE[abs] + "deg) scale(" + TSD_FAN_SCALE[abs] + ")";
    }
    return style;
  };

  return (
    <section ref={sectionRef} id="stack" className="tsd-sec" aria-labelledby="stack-heading">
      <div className="tsd-top">
        <motion.h2
          id="stack-heading"
          className="tsd-title"
          initial={{ opacity: 0, y: 26 }}
          animate={sectionInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: E }}
        >
          What I build with<span className="ink">.</span>
        </motion.h2>
      </div>

      <div className="tsd-deck">
        <div
          ref={stageRef}
          className={"tsd-stage" + (revealed ? "" : " collapsed")}
          role="group"
          aria-roledescription="carousel"
          aria-label="Tech stack categories"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {TECH_CATEGORIES.map((cat, i) => {
            const isFront = tsdRelative(i, active, total) === 0;
            return (
              <div
                key={cat.label}
                className={"tsd-card " + (isFront ? "front" : "side") + (isFront && dragging ? " dragging" : "")}
                style={cardStyle(i)}
                role="group"
                aria-roledescription="slide"
                aria-label={i + 1 + " of " + total + ": " + cat.label}
                aria-current={isFront ? "true" : undefined}
                onPointerDown={(e) => handlePointerDown(e, i)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              >
                <div className="tsd-card-rule" />
                <div className="tsd-card-title">{cat.label}</div>
                {/* 4 tools sit as a tidy 2x2 instead of 3 + 1 */}
                <div className={"tsd-icons" + (cat.tools.length === 4 ? " two-col" : "")}>
                  {cat.tools.slice(0, 6).map((tool) => (
                    <div className="tsd-tool" key={tool.name}>
                      <div className="tsd-tool-icon">
                        <img src={"/logos/" + tool.file + ".svg"} alt="" width="34" height="34" loading="lazy" decoding="async" draggable={false} />
                      </div>
                      <div className="tsd-tool-name">{tool.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
/* techstack-deck:end */`;

const NEW_CSS_BLOCK = String.raw`/* techstack-deck:css:start */
/* Tech stack: fanned card deck on a red band (cards straddle the red and the cream below). */
.tsd-sec {
  --tsd-bg: #F6F5F2;
  --tsd-text: #141414;
  --tsd-accent: #E02B20;
  --tsd-card-1: #3C3C41; /* lit corner */
  --tsd-card-2: #2D2D31; /* base */
  --tsd-card-3: #1F1F22; /* shaded corner */
  --tsd-pad: clamp(24px, 5.5vw, 80px);
  --tsd-top-pad: clamp(24px, 3vw, 48px); /* space above the heading: Services (red) sits right above, so this stays small */
  --tsd-s: 1; /* overall deck scale, raised on bigger screens below (the page reads it too) */
  --tsd-stage-h: 460px;
  position: relative;
  overflow: hidden; /* the fanned cards can poke past the screen edge: no sideways scroll */
  background: var(--tsd-bg);
  color: var(--tsd-text);
  padding-bottom: clamp(72px, 9vw, 140px);
}
@media (max-width: 480px) {
  .tsd-sec { --tsd-stage-h: 420px; }
}
@media (min-width: 768px) {
  .tsd-sec { --tsd-s: 1.1; --tsd-stage-h: calc(460px * var(--tsd-s)); }
}
@media (min-width: 1100px) {
  .tsd-sec { --tsd-s: 1.25; }
}

.tsd-top {
  background: var(--tsd-accent);
  color: var(--tsd-bg);
  text-align: center;
  padding: var(--tsd-top-pad) var(--tsd-pad) calc(var(--tsd-stage-h) * 0.5 + 30px);
}
.tsd-top ::selection { background: var(--tsd-bg); color: var(--tsd-accent); }
.tsd-title {
  margin: 0 auto;
  max-width: 15ch;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(2.9rem, 9.2vw, 9.4rem);
  line-height: 0.9;
  letter-spacing: -0.055em;
  word-spacing: 0.07em;
  text-wrap: balance;
}
.tsd-title .ink { color: var(--tsd-text); }
@media (max-width: 820px) {
  .tsd-title { max-width: 11ch; }
}

.tsd-deck {
  position: relative;
  z-index: 2;
  margin-top: calc(var(--tsd-stage-h) * -0.5);
}
.tsd-stage {
  position: relative;
  width: 100%;
  height: var(--tsd-stage-h);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: pan-y; /* sideways drag = swipe the deck, vertical = page scroll */
  -webkit-tap-highlight-color: transparent;
}
.tsd-stage:focus { outline: none; }
.tsd-stage:focus-visible { outline: 2px solid var(--tsd-text); outline-offset: -6px; border-radius: 28px; }

.tsd-card {
  position: absolute;
  width: 252px;
  height: 340px;
  border-radius: 22px;
  background:
    radial-gradient(120% 70% at 18% 0%, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0) 60%),
    linear-gradient(165deg, var(--tsd-card-1) 0%, var(--tsd-card-2) 48%, var(--tsd-card-3) 100%);
  border: 1px solid rgba(246, 245, 242, 0.14);
  padding: 28px 26px 26px;
  display: flex;
  flex-direction: column;
  cursor: grab;
  will-change: transform;
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.6s ease;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}
.tsd-card:active { cursor: grabbing; }
.tsd-card.dragging { transition: none; }
/* darkens the cards behind the front one; sits above the card background, below the content */
.tsd-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: #000;
  opacity: var(--shade, 0);
  transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}
.tsd-card.front {
  border-color: rgba(246, 245, 242, 0.22);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.55),
    0 40px 70px -22px rgba(20, 20, 20, 0.55),
    0 12px 24px -4px rgba(0, 0, 0, 0.4);
}
.tsd-card.side {
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.5),
    0 16px 28px -8px rgba(0, 0, 0, 0.5);
}
/* collapsed: no shadow, so nothing peeks out from behind the front card */
.tsd-stage.collapsed .tsd-card.side { box-shadow: none; }

.tsd-card-rule {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  pointer-events: none;
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.30),
    inset 0 0 0 1px rgba(255, 255, 255, 0.09),
    inset 0 -2px 0 0 rgba(0, 0, 0, 0.40);
}
.tsd-card-title {
  margin: 0 0 24px;
  text-align: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 30px;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--tsd-bg);
}
.tsd-icons {
  --tsd-tool-w: 60px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start;
  gap: 20px 8px;
  width: 100%;
  margin: 0 auto;
}
.tsd-icons.two-col { max-width: calc(var(--tsd-tool-w) * 2 + 20px); }
.tsd-tool {
  width: var(--tsd-tool-w);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.tsd-tool-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.tsd-tool-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  -webkit-user-drag: none;
}
.tsd-tool-name {
  font-family: var(--font-body);
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: 0.01em;
  text-align: center;
  color: rgba(246, 245, 242, 0.78);
}

@media (max-width: 480px) {
  .tsd-card { width: 218px; height: 300px; padding: 24px 20px 22px; }
  .tsd-card-title { font-size: 25px; margin: 0 0 20px; }
  .tsd-tool-icon { width: 30px; height: 30px; }
  .tsd-icons { gap: 18px 6px; --tsd-tool-w: 54px; }
}
/* desktop: wider cards, scaled up with --tsd-s */
@media (min-width: 768px) {
  .tsd-card {
    width: calc(320px * var(--tsd-s));
    height: calc(340px * var(--tsd-s));
    border-radius: calc(22px * var(--tsd-s));
    padding: calc(28px * var(--tsd-s)) calc(26px * var(--tsd-s)) calc(26px * var(--tsd-s));
  }
  .tsd-card-rule { border-radius: calc(22px * var(--tsd-s)); }
  .tsd-card-title { font-size: calc(34px * var(--tsd-s)); margin: 0 0 calc(24px * var(--tsd-s)); }
  .tsd-icons { --tsd-tool-w: calc(80px * var(--tsd-s)); gap: calc(20px * var(--tsd-s)) calc(8px * var(--tsd-s)); }
  .tsd-tool { gap: calc(8px * var(--tsd-s)); }
  .tsd-tool-icon { width: calc(38px * var(--tsd-s)); height: calc(38px * var(--tsd-s)); }
  .tsd-tool-name { font-size: calc(11.5px * var(--tsd-s)); }
}
@media (prefers-reduced-motion: reduce) {
  .tsd-card, .tsd-card::before { transition: none; }
}
/* techstack-deck:css:end */`;

const LOGOS = {
  nextjs: String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#F6F5F2" d="M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z"/></svg>`,
  express: String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#F6F5F2" d="M12.262 16.666h1.146l6.975-9.325H19.22zm9.778 1.441v.004l-4.334-5.706-.557.74 4.873 6.682H.945V4.173h9.505l5.026 6.7.574-.772-4.374-5.928h.003l-.719-.945H0v17.544h24zM10.917 8.705a3.8 3.8 0 0 0-1.292-1.183q-.796-.45-1.916-.45c-.746 0-1.37.14-1.906.424a3.76 3.76 0 0 0-1.31 1.12 4.9 4.9 0 0 0-.75 1.581 7.17 7.17 0 0 0 0 3.696c.148.567.402 1.101.75 1.573a3.5 3.5 0 0 0 1.31 1.066q.803.39 1.906.389 1.77 0 2.739-.868.966-.867 1.328-2.457h-1.139q-.271 1.084-.977 1.734-.704.651-1.952.65-.812 0-1.392-.342a3.1 3.1 0 0 1-.957-.869 3.5 3.5 0 0 1-.551-1.182 5 5 0 0 1-.17-1.133 9 9 0 0 0-.015-.286 4.5 4.5 0 0 1 .015-.829c.047-.418.147-.83.296-1.223A3.7 3.7 0 0 1 5.54 9.05a2.9 2.9 0 0 1 .922-.742q.541-.28 1.246-.28c.47 0 .869.093 1.23.28q.541.281.922.742.379.461.587 1.057t.225 1.246H5.625l.004.957h6.182a7.3 7.3 0 0 0-.18-1.924 4.9 4.9 0 0 0-.715-1.68z"/></svg>`,
  github: String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#F6F5F2" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
  vercel: String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#F6F5F2" d="m12 1.608 12 20.784H0Z"/></svg>`,
  expo: String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#F6F5F2" d="M0 20.084c.043.53.23 1.063.718 1.778.58.849 1.576 1.315 2.303.567.49-.505 5.794-9.776 8.35-13.29a.761.761 0 011.248 0c2.556 3.514 7.86 12.785 8.35 13.29.727.748 1.723.282 2.303-.567.57-.835.728-1.42.728-2.046 0-.426-8.26-15.798-9.092-17.078-.8-1.23-1.044-1.498-2.397-1.542h-1.032c-1.353.044-1.597.311-2.398 1.542C8.267 3.991.33 18.758 0 19.77Z"/></svg>`,
  flutter: String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#47C5FB" d="M14.314 0L2.3 12 6 15.7 21.684.013h-7.357zm.014 11.072L7.857 17.53l6.47 6.47H21.7l-6.46-6.468 6.46-6.46h-7.37z"/></svg>`,
};

/* ---------- revert ---------- */

if (REVERT) {
  if (!fs.existsSync(BACKUP_DIR)) fail("No backups found in " + BACKUP_DIR);
  for (const [name, target] of [["page.js", PAGE], ["globals.css", CSS]]) {
    const bak = path.join(BACKUP_DIR, name + ".bak");
    if (fs.existsSync(bak)) { fs.copyFileSync(bak, target); log("restored  " + path.relative(ROOT, target)); }
  }
  if (fs.existsSync(MANIFEST)) {
    for (const rel of JSON.parse(fs.readFileSync(MANIFEST, "utf8"))) {
      const f = path.join(ROOT, rel);
      if (fs.existsSync(f)) { fs.unlinkSync(f); log("removed   " + rel); }
    }
    fs.unlinkSync(MANIFEST);
  }
  log("\nReverted. (Backups are still in .patch-backups/techstack-deck/ - delete the folder when you no longer need them.)");
  process.exit(0);
}

/* ---------- checks ---------- */

for (const f of [PAGE, CSS]) if (!fs.existsSync(f)) fail("Cannot find " + f + "\nRun this from the project root (the folder that contains app/ and package.json), or pass that folder as an argument.");

const pageSrc = fs.readFileSync(PAGE, "utf8");
const cssSrc = fs.readFileSync(CSS, "utf8");
const pageDone = pageSrc.includes(PAGE_START);
const cssDone = cssSrc.includes(CSS_START);

/* ---------- page.js ---------- */

let newPage = pageSrc;
if (pageDone) {
  log("page.js        already patched - skipped");
} else {
  const START_ANCHOR = "/* \u2500\u2500 Icon coloring";
  const END_ANCHOR = "/* \u2500\u2500 Manifesto (transparent background)";
  const count = (s, sub) => s.split(sub).length - 1;
  if (count(pageSrc, START_ANCHOR) !== 1) fail('Expected exactly one "' + START_ANCHOR + '" comment in app/page.js (found ' + count(pageSrc, START_ANCHOR) + "). The file has changed since this patch was written.");
  if (count(pageSrc, END_ANCHOR) !== 1) fail('Expected exactly one "' + END_ANCHOR + '" comment in app/page.js (found ' + count(pageSrc, END_ANCHOR) + "). The file has changed since this patch was written.");
  const a = pageSrc.indexOf(START_ANCHOR);
  const b = pageSrc.indexOf(END_ANCHOR);
  if (a > b) fail("The Tech stack block is not where this patch expects it (Icon coloring comes after Manifesto).");
  const oldBlock = pageSrc.slice(a, b);
  if (!oldBlock.includes("function TechStack(") || !oldBlock.includes("const TECH_CATEGORIES")) fail("The block between the anchors is not the old Tech stack section.");

  const eol = eolOf(pageSrc);
  newPage = pageSrc.slice(0, a) + toEol(NEW_PAGE_BLOCK, eol) + eol + eol + pageSrc.slice(b);

  // the old section was the only user of the react-icons imports
  const importRe = /import\s*\{[^}]*\}\s*from\s*"react-icons\/si";\s*\r?\nimport\s*\{\s*VscVscode\s*\}\s*from\s*"react-icons\/vsc";\s*\r?\n/;
  if (importRe.test(newPage)) {
    const without = newPage.replace(importRe, "");
    if (/\b(Si[A-Z][A-Za-z0-9]*|VscVscode)\b/.test(without)) log("page.js        react-icons still used elsewhere - imports kept");
    else { newPage = without; log("page.js        removed the unused react-icons imports"); }
  } else {
    log("page.js        react-icons imports not in the expected form - left as they are (unused imports are harmless)");
  }
  // useLayoutEffect was only used by the old tab pill
  if ((newPage.match(/\buseLayoutEffect\b/g) || []).length === 1 && /,\s*useLayoutEffect\b/.test(newPage)) {
    newPage = newPage.replace(/,\s*useLayoutEffect\b/, "");
    log("page.js        removed the unused useLayoutEffect import");
  }
  log("page.js        Tech stack section replaced");
}

/* ---------- globals.css ---------- */

let newCss = cssSrc;
if (cssDone) {
  log("globals.css    already patched - skipped");
} else {
  const eol = eolOf(cssSrc);
  const OLD_START = "/* Tech stack tabs: always fit the screen";
  const OLD_END = "/* navbar-glass-v4";
  const s = cssSrc.indexOf(OLD_START);
  const e = cssSrc.indexOf(OLD_END);
  const css = toEol(NEW_CSS_BLOCK, eol) + eol + eol;
  if (s !== -1 && e !== -1 && s < e) {
    newCss = cssSrc.slice(0, s) + css + cssSrc.slice(e);
    log("globals.css    old .ts-* tab / 3D icon CSS replaced");
  } else {
    newCss = cssSrc.replace(/\s*$/, eol + eol) + css;
    log("globals.css    old tab CSS not found in the expected place - new CSS appended at the end");
  }
}

/* ---------- logos ---------- */

const logoWrites = [];
for (const [name, svg] of Object.entries(LOGOS)) {
  const f = path.join(LOGO_DIR, name + ".svg");
  if (fs.existsSync(f)) log("logo           " + name + ".svg already exists - kept");
  else logoWrites.push([f, svg]);
}
if (logoWrites.length) log("logos          adding " + logoWrites.map(([f]) => path.basename(f)).join(", "));

/* ---------- write ---------- */

if (DRY) { log("\nDry run: nothing written."); process.exit(0); }

fs.mkdirSync(BACKUP_DIR, { recursive: true });
for (const [name, src] of [["page.js", PAGE], ["globals.css", CSS]]) {
  const bak = path.join(BACKUP_DIR, name + ".bak");
  if (!fs.existsSync(bak)) fs.copyFileSync(src, bak);
}
if (newPage !== pageSrc) fs.writeFileSync(PAGE, newPage);
if (newCss !== cssSrc) fs.writeFileSync(CSS, newCss);
if (logoWrites.length) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
  const created = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : [];
  for (const [f, svg] of logoWrites) {
    fs.writeFileSync(f, svg);
    created.push(path.relative(ROOT, f).split(path.sep).join("/"));
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(created, null, 2));
}

/* ---------- verify ---------- */

const afterPage = fs.readFileSync(PAGE, "utf8");
const afterCss = fs.readFileSync(CSS, "utf8");
const problems = [];
if (!afterPage.includes(PAGE_START) || !afterPage.includes(PAGE_END)) problems.push("page.js is missing the new section markers");
if (afterPage.includes("function Icon3D(") || afterPage.includes("RUBBER_EASE_OUT")) problems.push("page.js still contains the old tab / 3D icon code");
if (!afterPage.includes("<TechStack />")) problems.push("page.js no longer renders <TechStack />");
if (!afterCss.includes(CSS_START)) problems.push("globals.css is missing the new CSS");
if (/\.ts-icon3d\b|\.ts-seg\b/.test(afterCss)) problems.push("globals.css still contains the old .ts-* CSS");
for (const name of Object.keys(LOGOS)) if (!fs.existsSync(path.join(LOGO_DIR, name + ".svg"))) problems.push("missing public/logos/" + name + ".svg");
if (problems.length) {
  console.error("\nVerification failed:\n - " + problems.join("\n - ") + "\nRestore with: node " + path.basename(process.argv[1]) + " --revert");
  process.exit(1);
}

log("\nDone. Backups: .patch-backups/techstack-deck/   Undo: node " + path.basename(process.argv[1]) + " --revert");
log("Next: npm run dev  ->  open the Tech stack section (below Services).");
