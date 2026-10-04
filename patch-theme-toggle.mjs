// patch-theme-toggle.mjs
// byCarlo: replaces the scroll-triggered dark->light wipe with a manual light / dark theme.
//   - light = white (#FFFFFF), dark = grey (#3B3B3B)
//   - light/dark swipe switch in the navbar (tap, or swipe it left/right)
//   - navbar is shorter and fully visible on mobile (no hidden links, Contact stays)
//   - logo swaps: light -> /png/bcdlogo.png, dark -> /png/bcwlogo.png
//
// Run from the project root:   node patch-theme-toggle.mjs
// Then:                        npm run dev   ->   git add . && git commit -m "Theme toggle" && git push
// A backup of every changed file goes into .patch-backups/

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
for (const f of ["bcdlogo.png", "bcwlogo.png"]) {
  if (!fs.existsSync(path.join(root, "public", "png", f))) {
    console.warn("Warning: public/png/" + f + " not found. The logo will be broken until it exists.");
  }
}

const read = (p) => {
  const raw = fs.readFileSync(p, "utf8");
  return { text: raw.replace(/\r\n/g, "\n"), crlf: raw.includes("\r\n") };
};
const save = (p, f) => fs.writeFileSync(p, f.crlf ? f.text.replace(/\n/g, "\r\n") : f.text, "utf8");
const fail = (msg) => { console.error("Patch aborted, nothing was written.\n" + msg); process.exit(1); };

const page = read(pagePath);
const css = read(cssPath);

if (page.text.includes("function ThemeToggle")) {
  console.log("Theme toggle is already applied. Nothing to do.");
  process.exit(0);
}

/* helpers ---------------------------------------------------------------- */
const count = (t, s) => t.split(s).length - 1;
const replaceAll = (t, find, rep, label, expected) => {
  const n = count(t, find);
  if (n === 0 || (expected && n !== expected)) fail("Could not find expected code (" + label + "), found " + n + " match(es). Did page.js change since this patch was written?");
  return t.split(find).join(rep);
};
const sliceBetween = (t, startMarker, endMarker, replacement, label) => {
  const a = t.indexOf(startMarker);
  const b = t.indexOf(endMarker, a + 1);
  if (a < 0 || b < 0) fail("Could not locate section: " + label);
  return t.slice(0, a) + replacement + t.slice(b);
};

/* ======================================================================= */
/*  page.js                                                                */
/* ======================================================================= */
let p = page.text;

// 1. imports: add `animate`
p = replaceAll(p, "  useSpring,\n  AnimatePresence,\n} from \"framer-motion\";", "  useSpring,\n  animate,\n  AnimatePresence,\n} from \"framer-motion\";", "framer-motion import", 1);

// 2. palettes
p = sliceBetween(
  p,
  "const DARK = {",
  "function interpolateHex",
  `const DARK = {
  bg: "#3B3B3B",
  surface: "#474747",
  text: "#F4F4F4",
  muted: "#BDBDBD",
  accent: "#00F0FF",
  accent2: "#B24BF3",
  border: "rgba(255,255,255,0.14)",
};

const LIGHT = {
  bg: "#FFFFFF",
  surface: "#F5F5F5",
  text: "#0B0B0E",
  muted: "#555555",
  accent: "#00AABB",
  accent2: "#8A2BE2",
  border: "rgba(0,0,0,0.10)",
};

const THEME_KEY = "bycarlo-theme";

`,
  "palettes"
);

// 3. navbar (+ theme toggle)
const NEW_NAV = `/* ── ThemeToggle – light / dark switch (tap it, or swipe it left / right) ── */
function ThemeToggle({ theme, onChange }) {
  const startX = useRef(null);
  const swiped = useRef(false);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="gnav-toggle"
      data-theme={theme}
      onPointerDown={(e) => {
        startX.current = e.clientX;
        swiped.current = false;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      }}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 10) {
          swiped.current = true;
          onChange(dx > 0 ? "dark" : "light");
        }
      }}
      onPointerCancel={() => { startX.current = null; }}
      onClick={() => {
        if (swiped.current) { swiped.current = false; return; }
        onChange(isDark ? "light" : "dark");
      }}
    >
      <span className="gnav-toggle-thumb" aria-hidden="true">
        <svg className="gnav-ico gnav-ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <svg className="gnav-ico gnav-ico-moon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a.6.6 0 0 0-.8-.7A9.5 9.5 0 1 0 21.2 15a.6.6 0 0 0-.7-.8z" />
        </svg>
      </span>
    </button>
  );
}

/* ── GlassNavbar – compact, flush at the top, glass capsule on scroll ── */
function GlassNavbar({ themeProgress, theme, onThemeChange }) {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // Colors follow the theme through the same eased motion value as the sections
  const ink    = useTransform(themeProgress, [0, 1], ["#F4F4F4", "#0B0B0E"]);
  const muted  = useTransform(themeProgress, [0, 1], ["rgba(244,244,244,0.65)", "rgba(11,11,14,0.55)"]);
  const glass  = useTransform(themeProgress, [0, 1], ["rgba(59,59,59,0.62)", "rgba(255,255,255,0.72)"]);
  const line   = useTransform(themeProgress, [0, 1], ["rgba(255,255,255,0.16)", "rgba(11,11,14,0.10)"]);
  const chip   = useTransform(themeProgress, [0, 1], ["rgba(255,255,255,0.14)", "rgba(11,11,14,0.08)"]);
  const ctaFg  = useTransform(themeProgress, [0, 1], ["#3B3B3B", "#FFFFFF"]);
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
    <div className={"gnav-wrap" + (scrolled ? " is-scrolled" : "")} data-theme={theme}>
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
          aria-label="byCarlo, back to top"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        >
          {/* light mode -> bcdlogo.png, dark mode -> bcwlogo.png (both preloaded, cross-faded) */}
          <img src="/png/bcdlogo.png" alt="" width={30} height={30} className="gnav-logo gnav-logo-light" draggable={false} />
          <img src="/png/bcwlogo.png" alt="" width={30} height={30} className="gnav-logo gnav-logo-dark" draggable={false} />
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

        <div className="gnav-end">
          <a href="#contact" className="gnav-cta">Contact</a>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
      </motion.nav>
    </div>
  );
}

`;
p = sliceBetween(p, "/* ── GlassNavbar", "/* ── Custom Cursor", NEW_NAV, "GlassNavbar");

// 4. cursor: blend-mode so it is visible on both white and grey
p = replaceAll(p, "style={{ x: sx, y: sy, translateX: \"-50%\", translateY: \"-50%\" }}", "style={{ x: sx, y: sy, translateX: \"-50%\", translateY: \"-50%\", mixBlendMode: \"difference\" }}", "cursor wrapper", 1);
p = replaceAll(p, "backgroundColor: hover ? `${DARK.accent}18` : DARK.accent,", "backgroundColor: hover ? \"rgba(255,255,255,0.12)\" : \"#FFFFFF\",", "cursor bg", 1);
p = replaceAll(p, "borderColor: hover ? DARK.accent : \"transparent\",", "borderColor: hover ? \"#FFFFFF\" : \"transparent\",", "cursor border", 1);

// 5. device mockup frame border follows the theme
p = replaceAll(p, "  const frameBg = useTransform(themeProgress, [0, 1], [DARK.surface, LIGHT.surface]);", "  const frameBg = useTransform(themeProgress, [0, 1], [DARK.surface, LIGHT.surface]);\n  const frameBorder = useTransform(themeProgress, [0, 1], [DARK.border, LIGHT.border]);", "mockup frameBg", 1);
p = replaceAll(p, "style={{ borderColor: DARK.border, backgroundColor: frameBg }}", "style={{ borderColor: frameBorder, backgroundColor: frameBg }}", "mockup borders", 2);
p = replaceAll(p, "    \"rgba(255,255,255,0.1)\",\n    \"rgba(0,0,0,0.05)\",", "    \"rgba(255,255,255,0.12)\",\n    \"rgba(0,0,0,0.05)\",", "mockup bar", 1);

// 6. Hero follows the theme (it used to be "always dark")
{
  const start = p.indexOf("function Hero(");
  const end = p.indexOf("/* ── Projects");
  if (start < 0 || end < 0) fail("Could not locate Hero.");
  let h = p.slice(start, end);

  h = replaceAll(h, "function Hero({ globalProgress, isMobile }) {", `function Hero({ globalProgress, themeProgress, isMobile }) {
  const heroVars = {
    "--h-text":    useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]),
    "--h-muted":   useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]),
    "--h-accent":  useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]),
    "--h-accent2": useTransform(themeProgress, [0, 1], [DARK.accent2, LIGHT.accent2]),
    "--h-border":  useTransform(themeProgress, [0, 1], [DARK.border, LIGHT.border]),
  };`, "Hero signature", 1);
  h = replaceAll(h, "style={{ backgroundColor: DARK.bg }}", "style={heroVars}", "Hero section bg", 1);
  h = replaceAll(h, "bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent\">", "bg-clip-text text-transparent\" style={{ backgroundImage: \"linear-gradient(90deg, var(--h-accent), var(--h-accent2))\" }}>", "Hero gradient", 1);
  h = replaceAll(h, "className=\"w-2 h-2 rounded-full bg-accent animate-pulse\"", "className=\"w-2 h-2 rounded-full animate-pulse\" style={{ background: \"var(--h-accent)\" }}", "Hero dot", 1);
  h = replaceAll(h, "className=\"w-1.5 h-1.5 rounded-full bg-accent\"", "className=\"w-1.5 h-1.5 rounded-full\" style={{ background: \"var(--h-accent)\" }}", "Hero scroll dot", 1);
  // radial orbs keep their static colors (they are just soft glows); everything else -> CSS variables
  h = h.replace(/style=\{\{ background: `radial-gradient\(circle, \$\{DARK\.accent\}/g, "§ORB1").replace(/style=\{\{ background: `radial-gradient\(circle, \$\{DARK\.accent2\}/g, "§ORB2");
  h = h.split("DARK.text").join("\"var(--h-text)\"").split("DARK.muted").join("\"var(--h-muted)\"").split("DARK.border").join("\"var(--h-border)\"");
  h = h.split("background: DARK.accent,").join("background: \"var(--h-accent)\",").split("color: DARK.accent }").join("color: \"var(--h-accent)\" }");
  h = h.replace("§ORB1", "style={{ background: `radial-gradient(circle, ${DARK.accent}").replace("§ORB2", "style={{ background: `radial-gradient(circle, ${DARK.accent2}");
  if (/DARK\.(text|muted|border)/.test(h)) fail("Hero still references DARK colors, please send me your page.js.");
  p = p.slice(0, start) + h + p.slice(end);
}

// 7. MotionValue styles on plain tags never worked (React cannot read a MotionValue); make them motion elements
p = replaceAll(p, "the <span style={{ color: accentColor }}>future</span><span style={{ color: accentColor }}>.</span>", "the <motion.span style={{ color: accentColor }}>future</motion.span><motion.span style={{ color: accentColor }}>.</motion.span>", "projects heading", 1);
p = replaceAll(p, "<span style={{ color: accentColor }}>edge</span>", "<motion.span style={{ color: accentColor }}>edge</motion.span>", "about heading", 1);
p = replaceAll(p, "<p className=\"text-3xl md:text-4xl font-display font-bold\" style={{ color: accentColor }}>{s.n}</p>", "<motion.p className=\"text-3xl md:text-4xl font-display font-bold\" style={{ color: accentColor }}>{s.n}</motion.p>", "stat number", 1);
p = replaceAll(p, "<p className=\"text-xs tracking-wider uppercase mt-2\" style={{ color: mutedColor }}>{s.label}</p>", "<motion.p className=\"text-xs tracking-wider uppercase mt-2\" style={{ color: mutedColor }}>{s.label}</motion.p>", "stat label", 1);
p = replaceAll(p, "<div className=\"w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0\" style={{ background: accentColor, color: DARK.bg }}>\n                {t.name.split(\" \").map((n) => n[0]).join(\"\")}\n              </div>", "<motion.div className=\"w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0\" style={{ background: accentColor, color: \"#0B0B0E\" }}>\n                {t.name.split(\" \").map((n) => n[0]).join(\"\")}\n              </motion.div>", "testimonial avatar", 1);
p = replaceAll(p, "            <button\n              key={i}\n              onClick={() => setActive(i)}\n              className=\"h-1.5 rounded-full transition-all duration-300\"\n              style={{\n                width: i === active ? 32 : 12,\n                background: i === active ? accentColor : \"rgba(255,255,255,0.15)\",", "            <motion.button\n              key={i}\n              onClick={() => setActive(i)}\n              className=\"h-1.5 rounded-full transition-all duration-300\"\n              style={{\n                width: i === active ? 32 : 12,\n                background: i === active ? accentColor : dotIdle,", "testimonial dots", 1);
p = replaceAll(p, "  const t = TESTIMONIALS[active];\n", "  const t = TESTIMONIALS[active];\n  const dotIdle = useTransform(themeProgress, [0, 1], [\"rgba(255,255,255,0.22)\", \"rgba(0,0,0,0.14)\"]);\n", "dotIdle", 1);
p = replaceAll(p, "<span style={{ color: accentColor, whiteSpace: isMobile ? \"normal\" : \"nowrap\" }}>", "<motion.span style={{ color: accentColor, whiteSpace: isMobile ? \"normal\" : \"nowrap\" }}>", "contact span open", 1);
p = replaceAll(p, "              transition={{ repeat: Infinity, duration: 1.2, ease: \"linear\" }}\n            />\n          </span>", "              transition={{ repeat: Infinity, duration: 1.2, ease: \"linear\" }}\n            />\n          </motion.span>", "contact span close", 1);

// 8. remove the scroll-triggered hook + white wipe layer, add the manual theme
p = sliceBetween(
  p,
  "/* ──────────────────────────────────────────────────\n   Custom hook",
  "/* ── Page root",
  "",
  "scroll-trigger hook"
);

const PAGE_ROOT = `/* ── Page root – manual light / dark theme ──────── */
export default function Page() {
  const manifestoRef = useRef(null);
  const containerRef = useRef(null);
  const isMobile = useIsMobile();

  const { scrollYProgress: globalScroll } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const globalProgress = useSpring(globalScroll, {
    stiffness: 120,
    damping: 30,
    mass: 0.2,
  });

  // 1 = light (default), 0 = dark. Every section already reads colors from this value.
  const themeProgress = useMotionValue(1);
  const [theme, setTheme] = useState("light");

  const applyTheme = useCallback((next, instant) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    const target = next === "light" ? 1 : 0;
    if (instant) themeProgress.jump(target);
    else animate(themeProgress, target, { duration: 0.45, ease: "easeInOut" });
  }, [themeProgress]);

  const handleThemeChange = useCallback((next) => {
    applyTheme(next, false);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  }, [applyTheme]);

  // restore the visitor's last choice (first visit = light)
  useLayoutEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch {}
    applyTheme(saved === "dark" ? "dark" : "light", true);
  }, [applyTheme]);

  return (
    <>
      <Cursor />
      <GlassNavbar themeProgress={themeProgress} theme={theme} onThemeChange={handleThemeChange} />
      <main ref={containerRef} style={{ position: "relative", zIndex: 10 }}>
        <Hero globalProgress={globalProgress} themeProgress={themeProgress} isMobile={isMobile} />
        <Projects globalProgress={globalProgress} themeProgress={themeProgress} isMobile={isMobile} />
        <Manifesto globalProgress={globalProgress} manifestoRef={manifestoRef} themeProgress={themeProgress} isMobile={isMobile} />
        <Story themeProgress={themeProgress} />
        <Testimonials themeProgress={themeProgress} />
        <Contact themeProgress={themeProgress} isMobile={isMobile} />
      </main>
    </>
  );
}
`;
{
  const i = p.indexOf("/* ── Page root");
  if (i < 0) fail("Could not locate Page root.");
  p = p.slice(0, i) + PAGE_ROOT;
}
page.text = p;

/* ======================================================================= */
/*  globals.css                                                            */
/* ======================================================================= */
let c = css.text;

// theme variables + body background
c = sliceBetween(
  c,
  ":root {",
  "html {",
  `:root {
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;

  /* light (default) */
  --bg-primary:   #FFFFFF;
  --text-primary: #0B0B0E;
  --text-secondary: #555555;
  --accent:       #00AABB;
  --accent-2:     #8A2BE2;
  --border:       rgba(0,0,0,0.10);
  color-scheme: light;
}

/* dark */
:root[data-theme="dark"] {
  --bg-primary:   #3B3B3B;
  --text-primary: #F4F4F4;
  --text-secondary: #BDBDBD;
  --accent:       #00F0FF;
  --accent-2:     #B24BF3;
  --border:       rgba(255,255,255,0.14);
  color-scheme: dark;
}

`,
  "theme variables"
);
if (!c.includes("  background: var(--bg-primary);\n  -webkit-overflow-scrolling: touch;")) fail("Could not find the body background rule in globals.css.");
c = c.replace("  background: var(--bg-primary);\n  -webkit-overflow-scrolling: touch;", "  background: var(--bg-primary);\n  transition: background-color 0.45s ease-in-out;\n  -webkit-overflow-scrolling: touch;");
c = c.replace("  color: #0B0B0E;\n}\n\nbutton, a {", "  color: #0B0B0E;\n}\n\nbutton, a {");

// navbar styles
c = sliceBetween(c, "/* Gather navbar", ".logo-gradient {", `/* Gather navbar – compact, flush at the top, glass capsule after scroll */
.gnav-wrap {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 0;
  pointer-events: none;
  transition: padding 0.6s cubic-bezier(0.65, 0, 0.2, 1);
}
.gnav-wrap.is-scrolled { padding: 8px 10px 0; }

.gnav {
  pointer-events: auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  padding: 8px 20px;
  border-radius: 0;
  color: var(--gn-ink, #0B0B0E);
  font-family: var(--font-sans), system-ui, sans-serif;
  transition:
    width 0.6s cubic-bezier(0.65, 0, 0.2, 1),
    padding 0.6s cubic-bezier(0.65, 0, 0.2, 1),
    border-radius 0.6s cubic-bezier(0.65, 0, 0.2, 1),
    box-shadow 0.5s;
}
.gnav-wrap.is-scrolled .gnav {
  width: 680px;
  padding: 5px 6px 5px 8px;
  border-radius: 999px;
}
.gnav > *:not(.gnav-glass) { position: relative; z-index: 1; }

/* the global mobile rule gives every a/button a 44px min-height, which would make the bar tall */
.gnav a, .gnav button { min-height: 0; }

/* liquid glass */
.gnav-glass {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid var(--gn-line, rgba(11, 11, 14, 0.1));
  background: var(--gn-glass, rgba(255, 255, 255, 0.7));
  -webkit-backdrop-filter: blur(14px) saturate(180%);
  backdrop-filter: blur(14px) saturate(180%);
  box-shadow:
    inset 1.5px 1.5px 2px -0.5px rgba(255, 255, 255, 0.55),
    inset -1.5px -1.5px 2px -0.5px rgba(255, 255, 255, 0.25),
    0 8px 24px -8px rgba(0, 0, 0, 0.28);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s;
}
.gnav-wrap.is-scrolled .gnav-glass { opacity: 1; }

.gnav a:focus-visible,
.gnav button:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }

/* logo – 1:1 circle, light / dark files cross-fade */
.gnav-brand {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  line-height: 0;
  text-decoration: none;
  transition: width 0.6s cubic-bezier(0.65, 0, 0.2, 1), height 0.6s cubic-bezier(0.65, 0, 0.2, 1), transform 0.3s;
}
.gnav-wrap.is-scrolled .gnav-brand { width: 28px; height: 28px; }
.gnav-brand:hover { transform: scale(1.06); }
.gnav-logo {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  user-select: none;
  box-shadow: 0 0 0 1px var(--gn-line, rgba(11, 11, 14, 0.14));
  transition: opacity 0.45s ease-in-out;
}
.gnav-logo-dark { opacity: 0; }
.gnav-wrap[data-theme="dark"] .gnav-logo-light { opacity: 0; }
.gnav-wrap[data-theme="dark"] .gnav-logo-dark { opacity: 1; }

.gnav-links {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
  transition: gap 0.6s cubic-bezier(0.65, 0, 0.2, 1);
}
.gnav-wrap.is-scrolled .gnav-links { gap: 2px; }

.gnav-link {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
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

.gnav-end {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.gnav-cta {
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--gn-ink);
  font-size: 0.78rem;
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

/* light / dark swipe switch */
.gnav-toggle {
  --tw: 44px; --th: 24px; --tk: 18px; --pad: 3px;
  position: relative;
  flex-shrink: 0;
  width: var(--tw);
  height: var(--th);
  padding: 0;
  border: 1px solid var(--gn-line);
  border-radius: 999px;
  background: var(--gn-chip);
  color: inherit;
  touch-action: pan-y;
  -webkit-tap-highlight-color: transparent;
}
.gnav-toggle-thumb {
  position: absolute;
  top: 50%;
  left: var(--pad);
  width: var(--tk);
  height: var(--tk);
  margin-top: calc(var(--tk) / -2);
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--gn-ink);
  color: var(--gn-cta-fg);
  transform: translateX(0);
  transition: transform 0.35s cubic-bezier(0.65, 0, 0.2, 1);
}
.gnav-toggle[data-theme="dark"] .gnav-toggle-thumb {
  transform: translateX(calc(var(--tw) - var(--tk) - var(--pad) * 2 - 2px));
}
.gnav-ico { position: absolute; width: 11px; height: 11px; transition: opacity 0.3s, transform 0.35s; }
.gnav-ico-moon { opacity: 0; transform: rotate(-40deg) scale(0.6); }
.gnav-toggle[data-theme="dark"] .gnav-ico-sun  { opacity: 0; transform: rotate(40deg) scale(0.6); }
.gnav-toggle[data-theme="dark"] .gnav-ico-moon { opacity: 1; transform: none; }

/* mobile – everything stays visible: logo, all links, Contact and the switch */
@media (max-width: 640px) {
  .gnav-wrap.is-scrolled { padding: 6px 8px 0; }
  .gnav { padding: 6px 10px; gap: 4px; }
  .gnav-wrap.is-scrolled .gnav { width: 100%; padding: 4px 6px; }

  .gnav-brand, .gnav-wrap.is-scrolled .gnav-brand { width: 24px; height: 24px; }

  .gnav-links,
  .gnav-wrap.is-scrolled .gnav-links {
    flex: 1;
    justify-content: center;
    gap: 0;
    overflow-x: auto;          /* safety net on very narrow phones */
    scrollbar-width: none;
  }
  .gnav-links::-webkit-scrollbar { display: none; }

  /* one size knob: font scales with the screen width */
  .gnav-link, .gnav-cta { font-size: clamp(9px, 2.85vw, 12px); }
  .gnav-link { padding: 6px 0.45em; }
  .gnav-cta  { padding: 6px 0.55em; }

  .gnav-end { gap: 6px; }
  .gnav-toggle { --tw: 36px; --th: 20px; --tk: 14px; --pad: 3px; }
  .gnav-ico { width: 9px; height: 9px; }
}
@media (max-width: 380px) {
  .gnav-link { padding: 6px 0.36em; }
  .gnav-cta  { padding: 6px 0.45em; }
  .gnav-end  { gap: 4px; }
}

@media (prefers-reduced-motion: reduce) {
  .gnav-wrap, .gnav, .gnav-glass, .gnav-links, .gnav-link, .gnav-cta, .gnav-logo,
  .gnav-brand, .gnav-toggle-thumb, .gnav-ico, body { transition: none; }
}

`);
css.text = c;

/* ======================================================================= */
/*  backup + write                                                         */
/* ======================================================================= */
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
for (const f of [pagePath, cssPath]) fs.copyFileSync(f, path.join(backupDir, path.basename(f) + "." + stamp + ".bak"));

save(pagePath, page);
save(cssPath, css);

console.log("Theme toggle applied.");
console.log("  app/page.js      light/dark state + switch, compact navbar, logo swap, scroll wipe removed");
console.log("  app/globals.css  white / #3B3B3B theme variables, compact + mobile navbar styles");
console.log("  backups          .patch-backups/");
console.log("\nNext: npm run dev, check it, then git add . && git commit -m \"Theme toggle\" && git push");
