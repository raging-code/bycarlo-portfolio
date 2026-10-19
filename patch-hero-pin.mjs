#!/usr/bin/env node
/**
 * patch-hero-pin.mjs   (run AFTER patch-hero-red.mjs and patch-font-sitewide.mjs)
 *
 * 1. Hero word carousel: "Forward." now cycles Forward / Ahead / Beyond / Next /
 *    Further / Faster, letter by letter, and the dot animates with the word.
 * 2. Hero services list: removes "Mobile & Web Apps", "Business Systems" and
 *    "AI Automation & Integration" (keeps Website Development, IoT Solutions,
 *    Custom Full-Stack Development).
 * 3. Pinned hero: the hero stays in place while the About section slides up over
 *    it like a sheet. As it does, the hero blurs, dims and shrinks a little.
 *
 * Usage (repo root):
 *   node patch-hero-pin.mjs            apply
 *   node patch-hero-pin.mjs --revert   undo
 *
 * Touches: app/page.js, app/globals.css      Backup: .patch-backups/hero-pin/
 */
import fs from "node:fs";
import path from "node:path";

/* ── tweak the scroll effect here, then run --revert and apply again ── */
const PIN = {
  blur: 14,     // px of blur on the hero when About fully covers it (0 = none)
  dim: 0.25,    // how much the hero darkens, 0 to 1 (0 = none)
  scale: 0.96,  // hero shrinks to this size, 1 = no shrink
  radius: 36,   // px, rounded top corners of the About sheet (0 = square)
};
const WORDS = ["Forward", "Ahead", "Beyond", "Next", "Further", "Faster"];
const SERVICES = ["Website Development", "IoT Solutions", "Custom Full-Stack Development"];
const WORD_EVERY_MS = 2600;

const ROOT = process.cwd();
const PAGE = path.join(ROOT, "app/page.js");
const CSS = path.join(ROOT, "app/globals.css");
const BK = path.join(ROOT, ".patch-backups/hero-pin");
const MARK = "hero-pin:applied";
const die = (m) => { console.error("\n✖ " + m + "\n"); process.exit(1); };

for (const f of [PAGE, CSS]) if (!fs.existsSync(f)) die(`Missing ${path.relative(ROOT, f)}. Run this from the repo root.`);

if (process.argv.includes("--revert")) {
  if (!fs.existsSync(BK)) die("No backup found in .patch-backups/hero-pin/");
  fs.copyFileSync(path.join(BK, "page.js.bak"), PAGE);
  fs.copyFileSync(path.join(BK, "globals.css.bak"), CSS);
  console.log("✔ Reverted page.js and globals.css");
  process.exit(0);
}

let page = fs.readFileSync(PAGE, "utf8");
let css = fs.readFileSync(CSS, "utf8");
if (page.includes(MARK) || css.includes(MARK)) die("Already applied. Use --revert first to run it again.");
if (!page.includes("hf-frame") || !css.includes("hero-red:start")) die("The red hero isn't installed yet. Run patch-hero-red.mjs first.");

/* ── 1. new Hero component ─────────────────────────────── */
const HERO_JSX = `/* ── Hero (hero-pin) ─────────────────────────────── */
const HERO_WORDS = ${JSON.stringify(WORDS)};
const HERO_SERVICES = ${JSON.stringify(SERVICES, null, 2).replace(/\n/g, "\n")};
const HERO_PIN = ${JSON.stringify(PIN)};

function Hero() {
  const [go, setGo] = useState(false);
  const frameRef = useRef(null);
  const titleRef = useRef(null);
  const colRef = useRef(null);
  const listRef = useRef(null);
  const wordsRef = useRef(null);

  /* headline fit, services rotator and word carousel */
  useEffect(() => {
    const ht = titleRef.current, col = colRef.current, ul = listRef.current, wd = wordsRef.current;
    if (!ht || !col || !ul || !wd) return;
    const lis = Array.from(ul.children);
    const ws = Array.from(wd.children);
    const N = HERO_SERVICES.length;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let idx = 0, wi = 0, interval = 0, reset = 0, start = 0, wTimer = 0, wStart = 0, dead = false;

    // scale the headline so its widest line exactly fills the column, then size the word box
    const fit = () => {
      wd.style.width = "";
      ht.style.fontSize = "100px";
      const w = Math.max(...Array.from(ht.querySelectorAll(".hf-l > span")).map((s) => s.getBoundingClientRect().width));
      const cw = col.getBoundingClientRect().width;
      if (w > 0 && cw > 0) ht.style.fontSize = Math.min((100 * cw) / w, 200) + "px";
      ws.forEach((x) => { x.dataset.w = x.getBoundingClientRect().width; });
      wd.style.width = ws[wi].dataset.w + "px";
    };

    // services rotator: the dark row is always the 3rd visible one
    const step = () => {
      const lh = ul.firstElementChild.offsetHeight;
      lis.forEach((li, i) => li.classList.toggle("on", i === idx + 2));
      ul.style.transform = "translateY(" + -idx * lh + "px)";
    };
    const tick = () => {
      idx++;
      step();
      if (idx === N) {
        reset = setTimeout(() => {
          ul.style.transition = "none";
          idx = 0;
          step();
          void ul.offsetWidth;
          ul.style.transition = "";
        }, 850);
      }
    };

    // word carousel: old word's letters rise out, new word's letters rise in
    const nextWord = () => {
      const p = ws[wi];
      wi = (wi + 1) % ws.length;
      const n = ws[wi];
      p.classList.remove("hf-in");
      p.classList.add("hf-out");
      n.classList.remove("hf-out");
      n.classList.add("hf-in");
      wd.style.width = n.dataset.w + "px";
      clearTimeout(p._t);
      p._t = setTimeout(() => p.classList.remove("hf-out"), 1500);
    };

    const onResize = () => { fit(); step(); };
    window.addEventListener("resize", onResize);

    const fonts = document.fonts;
    const ready = fonts
      ? Promise.all([fonts.load("600 100px HeroDisplay"), fonts.ready]).catch(() => {})
      : Promise.resolve();
    ready.then(() => {
      if (dead) return;
      fit();
      step();
      // wait for the intro overlay to lift before the headline reveals
      start = setTimeout(() => { if (!dead) setGo(true); }, 700);
      interval = setInterval(tick, 2300);
      if (!still) wStart = setTimeout(() => { wTimer = setInterval(nextWord, ${WORD_EVERY_MS}); }, 1400);
    });

    return () => {
      dead = true;
      clearInterval(interval);
      clearInterval(wTimer);
      clearTimeout(reset);
      clearTimeout(start);
      clearTimeout(wStart);
      ws.forEach((x) => clearTimeout(x._t));
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /* pinned hero: it stays put while About slides over it, blurring and dimming as it goes */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const sheet = document.querySelector(".after-hero");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = -1;

    const apply = () => {
      raf = 0;
      const h = frame.offsetHeight || window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      if (p === last) return;
      last = p;
      const e = p * p * (3 - 2 * p); // smoothstep
      frame.style.visibility = p >= 1 ? "hidden" : ""; // fully covered: stop painting it
      if (!reduce) {
        const f = [];
        if (HERO_PIN.blur) f.push("blur(" + (e * HERO_PIN.blur).toFixed(2) + "px)");
        if (HERO_PIN.dim) f.push("brightness(" + (1 - HERO_PIN.dim * e).toFixed(3) + ")");
        frame.style.filter = e > 0 ? f.join(" ") : "";
        frame.style.transform = e > 0 && HERO_PIN.scale < 1 ? "scale(" + (1 - (1 - HERO_PIN.scale) * e).toFixed(4) + ")" : "";
      }
      if (sheet && HERO_PIN.radius) {
        const r = (HERO_PIN.radius * (1 - e)).toFixed(1);
        sheet.style.borderRadius = r + "px " + r + "px 0 0";
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={frameRef} className={"hf-frame" + (go ? " hf-go" : "")}>
      <div className="hf-hero">
        <div className="hf-grid">
          <div className="hf-col" ref={colRef}>
            <h1 className="hf-title" ref={titleRef} aria-label="Building what moves you forward.">
              <span className="hf-l"><span><span className="hf-hl">Building</span> What</span></span>
              <span className="hf-l"><span>Moves You</span></span>
              <span className="hf-l">
                <span>
                  <span className="hf-hl hf-fw" aria-hidden="true">
                    <span className="hf-wd" ref={wordsRef}>
                      {HERO_WORDS.map((w, k) => (
                        <span key={w} className={"hf-w" + (k === 0 ? " hf-in" : "")}>
                          {Array.from(w + ".").map((c, i) => (
                            <span key={i} className="hf-c" style={{ "--i": i }}>{c}</span>
                          ))}
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
              </span>
            </h1>
          </div>
        </div>
        <div className="hf-rot" aria-hidden="true">
          <ul ref={listRef}>
            {HERO_SERVICES.concat(HERO_SERVICES.slice(0, 3)).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

`;

const a = page.indexOf("/* ── Hero");
const b = page.indexOf("/* about-brush:start */");
if (a < 0 || b < 0 || a > b) die("Could not locate the Hero block in app/page.js (between '/* ── Hero' and '/* about-brush:start */').");
page = page.slice(0, a) + HERO_JSX + page.slice(b);

/* ── 2. wrap everything after the hero in the sliding sheet ─ */
const openTag = "<IntroProfile isMobile={isMobile} />";
const closeTag = "<Contact isMobile={isMobile} />";
if (!page.includes(openTag) || !page.includes(closeTag)) die("Could not find <IntroProfile /> / <Contact /> in the Page component.");
page = page.replace(openTag, `<div className="after-hero">\n        ${openTag}`);
page = page.replace(closeTag, `${closeTag}\n        </div>`);

const im = page.match(/import\s*\{([^}]*)\}\s*from\s*"react";/);
if (!im) die('Could not find the `import { ... } from "react"` line.');
const have = im[1].split(",").map((s) => s.trim()).filter(Boolean);
for (const n of ["useRef", "useState", "useEffect"]) if (!have.includes(n)) have.push(n);
page = page.replace(im[0], `import { ${have.join(", ")} } from "react";`);
page = page.replace(/\s*$/, "\n/* hero-pin:applied */\n");

/* ── 3. css ─────────────────────────────────────────────── */
const CSS_ADD = `
/* hero-pin:start */
/* hero stays put (sticky) while everything after it slides up over it */
.hf-frame {
  --hf-e: cubic-bezier(.22, 1, .36, 1);
  position: sticky;
  top: 0;
  z-index: 0;
  min-height: 100vh;
  min-height: 100svh;
  will-change: filter, transform;
}
.after-hero {
  position: relative;
  z-index: 1;
  background: var(--bg-primary);
  border-radius: ${PIN.radius}px ${PIN.radius}px 0 0;
  box-shadow: 0 -28px 70px -24px rgba(42, 14, 7, .35);
}

/* word carousel: letters rise in, the dot included */
.hf-wd { display: inline-grid; transition: width 1s var(--hf-e); }
.hf-w { grid-area: 1 / 1; justify-self: start; white-space: nowrap; visibility: hidden; }
.hf-w.hf-in, .hf-w.hf-out { visibility: visible; }
.hf-c {
  display: inline-block;
  transform: translateY(120%);
  transition: transform .9s var(--hf-e) calc(var(--i) * 45ms);
}
.hf-in .hf-c { transform: none; }
.hf-out .hf-c { transform: translateY(-120%); transition-delay: calc(var(--i) * 30ms); }
@media (prefers-reduced-motion: reduce) {
  .hf-wd, .hf-c { transition: none !important; }
}
/* hero-pin:end */
/* hero-pin:applied */
`;
css = css.replace(/\s*$/, "\n") + CSS_ADD;

/* ── write ──────────────────────────────────────────────── */
fs.mkdirSync(BK, { recursive: true });
fs.copyFileSync(PAGE, path.join(BK, "page.js.bak"));
fs.copyFileSync(CSS, path.join(BK, "globals.css.bak"));
fs.writeFileSync(PAGE, page);
fs.writeFileSync(CSS, css);

console.log("✔ Hero: word carousel (" + WORDS.join(", ") + ")");
console.log("✔ Hero: services trimmed to " + SERVICES.length + " rows");
console.log("✔ Hero pinned, About slides over it (blur " + PIN.blur + "px, dim " + PIN.dim + ", scale " + PIN.scale + ")");
console.log("  Backups: .patch-backups/hero-pin/   (undo: node patch-hero-pin.mjs --revert)");
console.log("\nNext: npm run dev");
