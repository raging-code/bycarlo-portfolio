"use client";

import { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react";
import GlassSurface from "./GlassSurface";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  animate,
  AnimatePresence,
} from "framer-motion";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiNodedotjs,
  SiExpress,
  SiGraphql,
  SiPython,
  SiPostman,
  SiPostgresql,
  SiMongodb,
  SiCloudflare,
  SiJsonwebtokens,
  SiAuth0,
  SiVercel,
  SiDocker,
  SiGit,
  SiGithub,
  SiEslint,
  SiJest,
  SiNpm,
} from "react-icons/si";
import { VscVscode } from "react-icons/vsc";


const E = [0.25, 1, 0.25, 1];

const DARK = {
  bg: "#121212",
  surface: "#1C1B1A",
  text: "#F2EFEA",
  muted: "#9A958D",
  accent: "#FF6A4D",
  accent2: "#C9A66B",
  border: "rgba(242,239,234,0.16)",
};

const LIGHT = {
  bg: "#F6F5F2",
  surface: "#EAE6DF",
  text: "#141414",
  muted: "#6B6762",
  accent: "#CC3419",
  accent2: "#C9A66B",
  border: "rgba(20,20,20,0.14)",
};

const THEME_KEY = "bycarlo-theme";

function interpolateHex(c1, c2, t) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const r1 = parseInt(c1.slice(1, 3), 16),
    g1 = parseInt(c1.slice(3, 5), 16),
    b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16),
    g2 = parseInt(c2.slice(3, 5), 16),
    b2 = parseInt(c2.slice(5, 7), 16);
  return `rgb(${clamp(r1 + (r2 - r1) * t)},${clamp(g1 + (g2 - g1) * t)},${clamp(
    b1 + (b2 - b1) * t
  )})`;
}

const PROJECTS = [
  {
    id: "01", title: "Helix Protocol", cat: "Web3 Platform",
    desc: "A next-gen DeFi dashboard with real-time data visualisation.",
    tech: ["Solidity", "Next.js", "D3"], live: "#", colorAccent: "#CC3419"
  },
  {
    id: "02", title: "Mirage Events", cat: "Experience Portal",
    desc: "Immersive event microsite blending video and 3D ticketing.",
    tech: ["Three.js", "GSAP", "Firebase"], live: "#", colorAccent: "#CC3419"
  },
  {
    id: "03", title: "Core Studio", cat: "Agency Rebrand",
    desc: "Brutalist portfolio for a creative studio moving into architecture.",
    tech: ["Tailwind", "Framer Motion", "Storyblok"], live: "#", colorAccent: "#CC3419"
  },
  {
    id: "04", title: "Void Commerce", cat: "Headless Store",
    desc: "Product-first shopping with AI search and zero-click checkout.",
    tech: ["Medusa", "Algolia", "Astro"], live: "#", colorAccent: "#CC3419"
  },
];

const TESTIMONIALS = [
  {
    quote: "Working with this team felt like tapping into a future I didn't know existed. The result is still ahead of the market.",
    name: "Nova Chen", role: "Founder, Helix"
  },
  {
    quote: "They don't just build pages - they engineer moments. Three weeks and our conversion increased by 43%.",
    name: "Rafael Ortiz", role: "VP Product, Mirage"
  },
  {
    quote: "Unflinchingly modern. Every pixel has a reason. We've never received compliments like this on a website before.",
    name: "Clara Jensen", role: "Creative Director, Core"
  },
];

const NAV_LINKS = [
  { id: "work", label: "Projects" },
  { id: "about", label: "About" },
  { id: "", label: "Services" },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

/* ── ThemeToggle – light / dark switch (tap it, or swipe it left / right) ── */
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
  const ink    = useTransform(themeProgress, [0, 1], ["#F2EFEA", "#141414"]);
  const muted  = useTransform(themeProgress, [0, 1], ["rgba(242,239,234,0.65)", "rgba(20,20,20,0.60)"]);
  const glass  = useTransform(themeProgress, [0, 1], ["rgba(18,18,18,0.62)", "rgba(246,245,242,0.72)"]);
  const line   = useTransform(themeProgress, [0, 1], ["rgba(242,239,234,0.16)", "rgba(20,20,20,0.12)"]);
  const chip   = useTransform(themeProgress, [0, 1], ["rgba(242,239,234,0.12)", "rgba(20,20,20,0.08)"]);
  const ctaFg  = useTransform(themeProgress, [0, 1], ["#121212", "#F6F5F2"]);
  const accent = useTransform(themeProgress, [0, 1], ["#FF6A4D", "#CC3419"]);

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
        <div className="gnav-glass" aria-hidden="true">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={scrolled ? 999 : 0}
            backgroundOpacity={0.1}
            brightness={50}
            opacity={0.93}
            blur={11}
            displace={0.5}
            distortionScale={-180}
            redOffset={0}
            greenOffset={10}
            blueOffset={20}
          />
        </div>

        <a
          href="#"
          className="gnav-brand"
          aria-label="byCarlo, back to top"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        >
          {/* light mode -> bcdlogo.png, dark mode -> bcwlogo.png (both preloaded, cross-faded) */}
          <img src="/png/bcdlogo.png" alt="" width={26} height={26} className="gnav-logo gnav-logo-light" draggable={false} />
          <img src="/png/bcwlogo.png" alt="" width={26} height={26} className="gnav-logo gnav-logo-dark" draggable={false} />
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

/* ── Custom Cursor (desktop only) ────────────────── */
function Cursor() {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const sx = useSpring(mx, { stiffness: 400, damping: 28 });
  const sy = useSpring(my, { stiffness: 400, damping: 28 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const move = (e) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    const onEnter = () => setHover(true);
    const onLeave = () => setHover(false);
    const attach = () => {
      document.querySelectorAll("a, button, [data-hover]").forEach((el) => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };
    attach();
    const obs = new MutationObserver(attach);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("mousemove", move);
      obs.disconnect();
    };
  }, [mx, my]);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%", mixBlendMode: "difference" }}
    >
      <motion.div
        animate={{
          width: hover ? 48 : 12,
          height: hover ? 48 : 12,
          backgroundColor: hover ? "rgba(255,255,255,0.12)" : "#FFFFFF",
          borderColor: hover ? "#FFFFFF" : "transparent",
          borderWidth: hover ? 1.5 : 0,
        }}
        style={{ borderRadius: "50%", borderStyle: "solid" }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />
    </motion.div>
  );
}

/* ── Device Mockup ───────────────────────────────── */
function DeviceMockup({ accent, themeProgress, isMobile }) {
  const acc = accent || "#CC3419";
  const frameBg = useTransform(themeProgress, [0, 1], [DARK.surface, LIGHT.surface]);
  const screenBg = useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]);
  const barColor = useTransform(themeProgress, [0, 1], [
    "rgba(255,255,255,0.12)",
    "rgba(0,0,0,0.05)",
  ]);

  return (
    <div className="mt-6 mb-12">
      <div className="relative mx-auto" style={{ maxWidth: "600px" }}>
        <motion.div
          className="rounded-xl overflow-hidden border-2 w-full aspect-video"
          style={{ borderColor: acc, backgroundColor: frameBg }}
        >
          <div className="flex items-center gap-1.5 px-4 py-2" style={{ backgroundColor: barColor }}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-70" />
          </div>
          <motion.div className="flex-1 p-4 flex flex-col gap-2 h-full" style={{ backgroundColor: screenBg }}>
            <div className="w-2/3 h-3 rounded" style={{ backgroundColor: acc, opacity: 0.3 }} />
            <div className="w-1/2 h-3 rounded" style={{ backgroundColor: acc, opacity: 0.15 }} />
            <div className="w-1/4 h-8 rounded mt-auto" style={{ backgroundColor: acc, opacity: 0.4 }} />
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-[-24px] right-[-12px] w-24 rounded-2xl overflow-hidden border-2 z-10"
          style={{ borderColor: acc, backgroundColor: frameBg }}
        >
          <div className="flex justify-center py-1.5" style={{ backgroundColor: barColor }}>
            <div className="w-3 h-1 rounded-full bg-gray-500 opacity-60" />
          </div>
          <motion.div className="h-32 p-2 flex flex-col gap-1.5" style={{ backgroundColor: screenBg }}>
            <div className="w-full h-2 rounded" style={{ backgroundColor: acc, opacity: 0.3 }} />
            <div className="w-3/4 h-2 rounded" style={{ backgroundColor: acc, opacity: 0.2 }} />
            <div className="w-1/2 h-4 rounded mt-auto" style={{ backgroundColor: acc, opacity: 0.4 }} />
          </motion.div>
          <div className="flex justify-center py-1.5" style={{ backgroundColor: barColor }}>
            <div className="w-2 h-1 rounded-full bg-gray-500 opacity-60" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Hero (always dark) ──────────────────────────── */
function Hero({ globalProgress, themeProgress, isMobile }) {
  const heroVars = {
    "--h-text":    useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]),
    "--h-muted":   useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]),
    "--h-accent":  useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]),
    "--h-accent2": useTransform(themeProgress, [0, 1], [DARK.accent2, LIGHT.accent2]),
    "--h-border":  useTransform(themeProgress, [0, 1], [DARK.border, LIGHT.border]),
    "--h-on-accent": useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]),
  };
  const ref = useRef(null);
  const [, setMouse] = useState({ x: 0.5, y: 0.5 });

  const handleMouse = useCallback(
    (e) => {
      if (isMobile) return;
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    },
    [isMobile]
  );

  return (
    <motion.section
      ref={ref}
      onMouseMove={handleMouse}
      className="relative min-h-screen flex flex-col justify-center items-start px-6 md:px-20 overflow-hidden pt-20"
      style={heroVars}
    >
      <div className="relative z-10 flex flex-col gap-6 md:gap-8">
        <motion.h1
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: E }}
          className="text-[clamp(2.4rem,8vw,5.5rem)] font-display font-black leading-[0.95] tracking-tight"
        >
          <span className="block" style={{ color: "var(--h-text)" }}>Websites, apps</span>
          <span className="block" style={{ color: "var(--h-text)" }}>and connected</span>
          <span className="block" style={{ color: "var(--h-text)" }}>devices<span style={{ color: "var(--h-accent)" }}>.</span></span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: E }}
          className="max-w-xl text-[clamp(1.05rem,2.6vw,1.375rem)] leading-[1.5]"
          style={{ color: "var(--h-muted)" }}
        >
          I design and build landing pages, full-stack web apps and IoT dashboards, and see each one through to launch.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0, ease: E }}
          className="flex flex-wrap gap-3 mt-4"
        >
          <a href="#work" className="px-7 py-3 rounded-full font-semibold text-sm tracking-wide" style={{ background: "var(--h-accent)", color: "var(--h-on-accent)" }}>
            See projects
          </a>
          <a href="#contact" className="px-7 py-3 rounded-full font-semibold text-sm tracking-wide border" style={{ borderColor: "var(--h-border)", color: "var(--h-text)" }}>
            Get in touch
          </a>
        </motion.div>
      </div>

    </motion.section>
  );
}

/* ── Projects (transparent background) ───────────── */
function Projects({ globalProgress, themeProgress, isMobile }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);
  const borderColor = useTransform(themeProgress, [0, 1], [DARK.border, LIGHT.border]);

  return (
    <motion.section
      ref={ref}
      id="work"
      className="relative py-28 md:py-44 px-6 md:px-14 theme-section"
    >
      <div className="mb-20">
        <motion.h2
          className="text-[clamp(1.8rem,5vw,3rem)] font-display font-black tracking-tight leading-[1.1]"
          style={{ color: textColor }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, ease: E }}
        >
          Selected projects
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
        {PROJECTS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.15 + 0.3, duration: 0.8, ease: E }}
            className="group"
          >
            <DeviceMockup accent={p.colorAccent} themeProgress={themeProgress} isMobile={isMobile} />
            <div>
              <div className="flex items-center justify-between">
                <motion.span className="text-[13px] font-medium" style={{ color: accentColor }}>
                  {p.cat}
                </motion.span>
                <motion.span className="text-xs tracking-widest opacity-50 font-mono" style={{ color: mutedColor }}>
                  {p.id}
                </motion.span>
              </div>
              <motion.h3 className="font-display font-black text-[1.9rem] md:text-[2.15rem] leading-[1.02] tracking-[-0.01em] mt-2" style={{ color: textColor }}>
                {p.title}
              </motion.h3>
              <motion.p className="text-base leading-relaxed mt-2" style={{ color: mutedColor }}>
                {p.desc}
              </motion.p>
              <div className="flex flex-wrap gap-2 mt-4">
                {p.tech.map((t) => (
                  <motion.span key={t} className="text-[12.5px] px-3 py-1.5 rounded-full border" style={{ borderColor: borderColor, color: mutedColor }}>
                    {t}
                  </motion.span>
                ))}
              </div>
              <motion.a
                href={p.live}
                className="inline-flex items-center gap-2 mt-6 text-sm font-semibold transition-colors"
                style={{ color: accentColor }}
              >
                View project <span className="group-hover:translate-x-1 transition-transform">&#8594;</span>
              </motion.a>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}


/* ── Icon coloring ─────────────────────────────────
   false = every icon follows the theme (light text in dark mode, dark text in light mode)
   true  = keep each icon's brand color, but near-black brand icons still follow the theme */
const KEEP_BRAND_COLORS = false;
const NEAR_BLACK_BRANDS = ["#000000", "#181717"];

/* ── Full-colour logos ─────────────────────────────
   file  = /public/logos/<file>.svg (real multi-colour logo)
   side  = colour of the 3D thickness (darkened automatically towards the back)
   scale = visual size tweak so every logo looks the same size (1 = fills the 39px box)
   No entry = black-brand tool: plain react-icon in the site accent colour */
const TECH_LOGOS = {
  /* logos-v3 */
  "React": { file: "react", side: "#1FB6D9", scale: 1.1 },
  "TypeScript": { file: "typescript", side: "#3178C6", scale: 0.85 },
  "Tailwind": { file: "tailwindcss", side: "#06B6D4", scale: 1.2 },
  "Node.js": { file: "nodejs", side: "#5FA04E", scale: 1.05 },
  "GraphQL": { file: "graphql", side: "#E535AB", scale: 1.1 },
  "Python": { file: "python", side: "#3776AB", scale: 0.92 },
  "Postman": { file: "postman", side: "#FF6C37", scale: 0.88 },
  "PostgreSQL": { file: "postgresql", side: "#336791", scale: 0.88 },
  "MongoDB": { file: "mongodb", side: "#47A248", scale: 0.85 },
  "Cloudflare D1": { file: "cloudflare", side: "#F38020", scale: 1.2 },
  "JWT": { file: "jwt", side: "#D63AFF" },
  "OAuth": { file: "auth0", side: "#EB5424" },
  "Cloudflare": { file: "cloudflare", side: "#F38020", scale: 1.2 },
  "Docker": { file: "docker", side: "#2396ED", scale: 1.15 },
  "Git": { file: "git", side: "#DE4C36" },
  "VS Code": { file: "vscode", side: "#007ACC", scale: 0.95 },
  "ESLint": { file: "eslint", side: "#4B32C3" },
  "Jest": { file: "jest", side: "#C21325", scale: 0.95 },
  "npm": { file: "npm", side: "#CB3837", scale: 0.82 },
};

/* ── Tech stack data (edit icons/labels here) ─────── */
const TECH_CATEGORIES = [
  {
    label: "Frontend",
    tools: [
      { name: "React", Icon: SiReact, color: "#61DAFB" },
      { name: "Next.js", Icon: SiNextdotjs, color: "#000000" },
      { name: "TypeScript", Icon: SiTypescript, color: "#3178C6" },
      { name: "Tailwind", Icon: SiTailwindcss, color: "#06B6D4" },
    ],
  },
  {
    label: "Backend",
    tools: [
      { name: "Node.js", Icon: SiNodedotjs, color: "#5FA04E" },
      { name: "Express", Icon: SiExpress, color: "#000000" },
      { name: "GraphQL", Icon: SiGraphql, color: "#E10098" },
      { name: "Python", Icon: SiPython, color: "#3776AB" },
      { name: "Postman", Icon: SiPostman, color: "#FF6C37" },
    ],
  },
  {
    label: "Database",
    tools: [
      { name: "PostgreSQL", Icon: SiPostgresql, color: "#4169E1" },
      { name: "MongoDB", Icon: SiMongodb, color: "#47A248" },
      { name: "Cloudflare D1", Icon: SiCloudflare, color: "#F38020" },
    ],
  },
  {
    label: "Security",
    tools: [
      { name: "JWT", Icon: SiJsonwebtokens, color: "#000000" },
      { name: "OAuth", Icon: SiAuth0, color: "#EB5424" },
    ],
  },
  {
    label: "Deploy",
    tools: [
      { name: "Cloudflare", Icon: SiCloudflare, color: "#F38020" },
      { name: "Vercel", Icon: SiVercel, color: "#000000" },
      { name: "Docker", Icon: SiDocker, color: "#2496ED" },
    ],
  },
  {
    label: "Dev tools",
    tools: [
      { name: "Git", Icon: SiGit, color: "#F05032" },
      { name: "GitHub", Icon: SiGithub, color: "#181717" },
      { name: "VS Code", Icon: VscVscode, color: "#007ACC" },
      { name: "ESLint", Icon: SiEslint, color: "#4B32C3" },
      { name: "Jest", Icon: SiJest, color: "#C21325" },
      { name: "npm", Icon: SiNpm, color: "#CB3837" },
    ],
  },
];

/* ── Tech Stack (theme-aware, RubberSegment-style tabs) ─ */
const RUBBER_EASE_OUT = [0.23, 1, 0.32, 1];
const RUBBER_SPRING_UI = { type: "spring", duration: 0.3, bounce: 0 };
const RUBBER_SPRING_MOMENTUM = { type: "spring", duration: 0.4, bounce: 0.2 };
const RUBBER_SPRING_RELAX = { type: "spring", duration: 0.16, bounce: 0 };
const RUBBER_DILATE = 0.19;
const RUBBER_HANDOFF = 0.15;
const RUBBER_FLICK = 110;
const RUBBER_MAX_VELOCITY = 2000;
const RUBBER_DEADZONE = 4;
const RUBBER_SLOP = 10;
const RUBBER_STRENGTH = 0.55;
const RUBBER_SQUASH = 3;

const rubberClamp = (v, min, max) => Math.min(max, Math.max(min, v));
const rubberOverscroll = (over, dim) => (over * dim * RUBBER_STRENGTH) / (dim + RUBBER_STRENGTH * Math.abs(over));
const rubberProject = (v, glide) => {
  const d = 1 - 0.1 * Math.pow(0.05, glide / 100);
  return ((v / 1000) * d) / (1 - d);
};
const rubberVelocityOf = (hist, now) => {
  const recent = hist.filter(([t]) => now - t <= 100);
  if (recent.length < 2) return 0;
  const [t0, x0] = recent[0];
  const [t1, x1] = recent[recent.length - 1];
  return t1 - t0 >= 8 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0;
};
const rubberNearestSlot = (slots, x) => {
  let best = 0;
  for (let i = 1; i < slots.length; i++) {
    if (Math.abs((slots[i].l + slots[i].r) / 2 - x) < Math.abs((slots[best].l + slots[best].r) / 2 - x)) best = i;
  }
  return best;
};

/* ── 3D icon: stacked copies along the depth axis = a thick, extruded icon ── */
const ICON3D_DEPTH = 14;        // number of layers
const ICON3D_THICKNESS = 0.36;  // total thickness as a fraction of the icon size
const ICON3D_STAGGER_MS = 70;   // delay between icons when the category changes
const ICON3D_SIZE = 39;         // icon size in px (was 30, now 1.3x bigger)

// Colors come from CSS variables set on the icon grid, so they follow the theme live:
//   --ic-face (front), --ic-a (side next to the face) -> --ic-b (back of the icon)
function Icon3D({ Icon, logo, brand, scale = 1, size = ICON3D_SIZE, autoSpin = false, index = 0 }) {
  // one turn per hover (mouse) or tap (touch); ignored while it is already turning
  // autoSpin: the icon mounts already turning (used when the category changes)
  // logo: path to a full-colour SVG (front layer) - its silhouette becomes the thickness
  // brand: colour of the thickness (any CSS colour or var)
  const [spinning, setSpinning] = useState(autoSpin);
  const [autoDelay, setAutoDelay] = useState(autoSpin ? index * ICON3D_STAGGER_MS : 0);
  const step = (size * ICON3D_THICKNESS) / (ICON3D_DEPTH - 1);
  const half = (ICON3D_DEPTH - 1) / 2; // centers the thickness on z=0 so it spins around its own middle
  const px = Math.round(size * scale);
  const maskUrl = logo ? "url(" + logo + ")" : undefined;
  const layers = [];
  for (let k = ICON3D_DEPTH - 1; k >= 0; k--) {
    // thickness = brand colour, mixed with more black towards the back (22% -> 52%)
    const dark = Math.round(22 + (k / (ICON3D_DEPTH - 1)) * 30);
    const side = "color-mix(in srgb, " + brand + " " + (100 - dark) + "%, black)";
    let content;
    if (logo) {
      content = k === 0
        ? <img src={logo} alt="" width={px} height={px} draggable={false} className="ts-icon3d-img" style={{ width: px, height: px, maxWidth: "none" }} />
        : <span className="ts-icon3d-sil" style={{ width: px, height: px, background: side, WebkitMaskImage: maskUrl, maskImage: maskUrl }} />;
    } else {
      content = <Icon size={size} />;
    }
    layers.push(
      <span
        key={k}
        className="ts-icon3d-layer"
        style={{
          color: k === 0 ? brand : side,
          transform: "translateZ(" + ((half - k) * step).toFixed(2) + "px)",
        }}
      >
        {content}
      </span>
    );
  }
  return (
    <span className="ts-icon3d-hit" onPointerEnter={() => { setAutoDelay(0); setSpinning(true); }}>
      <span className="ts-icon3d-wrap" aria-hidden="true" style={{ width: size, height: size, perspective: size * 15 }}>
        <span
          className={"ts-icon3d" + (spinning ? " is-spinning" : "")}
          style={autoDelay ? { animationDelay: autoDelay + "ms" } : undefined}
          onAnimationEnd={(e) => { if (e.target === e.currentTarget) { setSpinning(false); setAutoDelay(0); } }}
        >
          {layers}
        </span>
      </span>
    </span>
  );
}

function TechStack({ themeProgress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [active, setActive] = useState(0);
  // icons spin on mount only after the category has actually changed (not on page load)
  const initialActive = useRef(active);
  const switched = useRef(false);
  if (active !== initialActive.current) switched.current = true;

  const trackRef = useRef(null);
  const itemRefs = useRef([]);
  const slots = useRef([]);
  const box = useRef(null);
  const committed = useRef(0);
  const handoff = useRef(0);
  const drag = useRef(null);
  const gen = useRef(0);
  const watchdog = useRef(0);
  const glide = 75;

  const edgeL = useMotionValue(0);
  const edgeR = useMotionValue(0);
  const innerW = useMotionValue(0);

  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);
  const borderColor = useTransform(themeProgress, [0, 1], [DARK.border, LIGHT.border]);
  // Matches the original RubberSegment CSS variables 1:1, swapped per theme:
  // light mode = --rs-track:#27272a / --rs-thumb:#fafafa (dark track, light thumb)
  // dark mode  = inverted, so the pill still reads clearly against a dark page.
  const trackBg = useTransform(themeProgress, [0, 1], ["#2A2826", "#E4DFD6"]);
  const thumbBg = useTransform(themeProgress, [0, 1], ["#F6F5F2", "#141414"]);
  const inkIdle = useTransform(themeProgress, [0, 1], ["#F6F5F2", "#141414"]); // --rs-ink, opacity 0.7 in CSS
  const inkActive = useTransform(themeProgress, [0, 1], ["#141414", "#F6F5F2"]); // --rs-ink-active, full opacity
  // 3D icon colors (face = site text color, thickness = site gray tones), all theme-live
  const iconSideA = useTransform(themeProgress, [0, 1], ["rgb(189,189,189)", "rgb(85,85,85)"]);
  const iconSideB = useTransform(themeProgress, [0, 1], ["rgb(96,96,96)", "rgb(170,170,170)"]);
  const clipPath = useTransform(
    () => `inset(0 ${Math.max(0, innerW.get() - edgeR.get())}px 0 ${Math.max(0, edgeL.get())}px round 10px)`
  );

  const jumpTo = useCallback((i) => {
    const s = slots.current[i];
    if (!s) return;
    clearTimeout(handoff.current);
    gen.current += 1;
    edgeL.jump(s.l);
    edgeR.jump(s.r);
  }, [edgeL, edgeR]);

  // Safety net: some time after the last interaction, if the thumb is not sitting
  // on the active tab (interrupted spring, lost pointer event...), put it there.
  const armWatchdog = useCallback(() => {
    clearTimeout(watchdog.current);
    watchdog.current = setTimeout(() => {
      if (drag.current) return;
      const s = slots.current[committed.current];
      if (!s) return;
      if (Math.abs(edgeL.get() - s.l) > 0.5 || Math.abs(edgeR.get() - s.r) > 0.5) jumpTo(committed.current);
    }, 800);
  }, [edgeL, edgeR, jumpTo]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    box.current = rect;
    slots.current = TECH_CATEGORIES.map((_, i) => {
      const el = itemRefs.current[i];
      if (!el) return { l: 0, r: 0 };
      const r = el.getBoundingClientRect();
      return { l: r.left - rect.left - 4, r: r.right - rect.left - 4 };
    });
    innerW.set(rect.width - 8);
    jumpTo(committed.current);
  }, [innerW, jumpTo]);

  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  useEffect(() => () => { clearTimeout(handoff.current); clearTimeout(watchdog.current); edgeL.stop(); edgeR.stop(); }, [edgeL, edgeR]);

  const commit = useCallback((i) => {
    committed.current = i;
    setActive(i);
  }, []);

  const land = useCallback((to, v, flick, withSquash) => {
    const b = slots.current[to];
    if (!b) return;
    const g = ++gen.current;
    const dir = Math.sign((b.l + b.r) / 2 - (edgeL.get() + edgeR.get()) / 2) || 1;
    const [lead, leadTo, trail, trailTo] = dir > 0 ? [edgeR, b.r, edgeL, b.l] : [edgeL, b.l, edgeR, b.r];
    const velocityFor = (mv) => rubberClamp(v === null ? mv.getVelocity() : v, -RUBBER_MAX_VELOCITY, RUBBER_MAX_VELOCITY);
    animate(lead, leadTo, { ...(flick ? RUBBER_SPRING_MOMENTUM : RUBBER_SPRING_UI), velocity: velocityFor(lead) });
    const trailVelocity = velocityFor(trail);
    if (!withSquash || RUBBER_SQUASH <= 0) {
      animate(trail, trailTo, { ...RUBBER_SPRING_UI, velocity: trailVelocity });
      return;
    }
    animate(trail, trailTo + dir * RUBBER_SQUASH, { ...RUBBER_SPRING_UI, velocity: trailVelocity }).then(() => {
      if (gen.current === g) animate(trail, trailTo, RUBBER_SPRING_RELAX);
    });
  }, [edgeL, edgeR]);

  const travel = useCallback((from, to) => {
    const b = slots.current[to];
    if (!b) return;
    clearTimeout(handoff.current);
    gen.current += 1;
    // stretch from where the thumb actually is right now, not from where the
    // previous tab was, so rapid presses never snap or get left behind
    const l0 = edgeL.get();
    const r0 = edgeR.get();
    const tween = { duration: RUBBER_DILATE, ease: RUBBER_EASE_OUT };
    animate(edgeL, Math.min(l0, b.l), tween);
    animate(edgeR, Math.max(r0, b.r), tween);
    handoff.current = setTimeout(() => land(to, null, false, true), RUBBER_HANDOFF * 1000);
    armWatchdog();
  }, [edgeL, edgeR, land, armWatchdog]);

  const localX = (e) => e.clientX - (box.current ? box.current.left : 0) - 4;

  const handlePointerDown = (e, i) => {
    if (e.button !== 0) return;
    drag.current = null; // a stale drag must never swallow a new press
    box.current = trackRef.current.getBoundingClientRect();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    const x = localX(e);
    const onThumb = x >= edgeL.get() && x <= edgeR.get();
    drag.current = { id: e.pointerId, x0: x, slot: i, onThumb, live: false, offset: 0, w: 0, hist: [[e.timeStamp, x]] };
    if (onThumb) {
      clearTimeout(handoff.current);
      gen.current += 1;
      edgeL.stop();
      edgeR.stop();
    }
  };

  const handlePointerMove = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id || !d.onThumb) return;
    const x = localX(e);
    d.hist.push([e.timeStamp, x]);
    if (d.hist.length > 8) d.hist.shift();
    if (!d.live) {
      if (Math.abs(x - d.x0) < RUBBER_DEADZONE) return;
      d.live = true;
      d.offset = x - edgeL.get();
      d.w = edgeR.get() - edgeL.get();
    }
    const width = innerW.get();
    const l = x - d.offset;
    const maxL = width - d.w;
    if (l < 0) {
      edgeL.set(0);
      edgeR.set(d.w - rubberOverscroll(-l, d.w));
    } else if (l > maxL) {
      edgeR.set(width);
      edgeL.set(maxL + rubberOverscroll(l - maxL, d.w));
    } else {
      edgeL.set(l);
      edgeR.set(l + d.w);
    }
  };

  const release = () => {
    const d = drag.current;
    drag.current = null;
    return d;
  };

  const handlePointerUp = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    release();
    const x = localX(e);
    if (!d.live) {
      if (Math.abs(x - d.x0) <= RUBBER_SLOP && d.slot !== committed.current) {
        const from = committed.current;
        commit(d.slot);
        travel(from, d.slot);
      } else if (d.onThumb) {
        // the press froze the thumb; always let it finish on the active tab
        land(committed.current, null, false, false);
      }
      armWatchdog();
      return;
    }
    const v = rubberVelocityOf(d.hist, e.timeStamp);
    const flick = Math.abs(v) > RUBBER_FLICK;
    let to = rubberNearestSlot(slots.current, (edgeL.get() + edgeR.get()) / 2 + rubberProject(v, glide));
    if (flick && to === committed.current) to = rubberClamp(to + Math.sign(v), 0, TECH_CATEGORIES.length - 1);
    commit(to);
    land(to, v, flick, flick);
    armWatchdog();
  };

  const handlePointerCancel = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    release();
    if (d.live || d.onThumb) land(committed.current, null, false, false);
    armWatchdog();
  };

  const handleKeyDown = (e) => {
    const last = TECH_CATEGORIES.length - 1;
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(last, active + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(0, active - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null || next === active) return;
    e.preventDefault();
    commit(next);
    jumpTo(next);
    itemRefs.current[next]?.focus();
  };

  const total = TECH_CATEGORIES.length;
  const current = TECH_CATEGORIES[active];
  const progress = total > 1 ? (active / (total - 1)) * 100 : 100;

  return (
    <motion.section ref={ref} id="stack" className="relative py-28 md:py-44 px-6 md:px-14 theme-section">
      <div className="max-w-xl mx-auto text-center">
        <motion.span
          className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase mb-4"
          style={{ color: mutedColor }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          <span className="w-1 h-1 rounded-full" style={{ background: "currentColor" }} />
          Tech stack
        </motion.span>
        <motion.h2
          className="text-[clamp(1.8rem,5vw,3rem)] font-bold tracking-tight leading-[1.1] mb-10"
          style={{ color: textColor, fontFamily: "var(--font-display)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, ease: E }}
        >
          What I build with
        </motion.h2>

        <motion.div
          className="flex justify-center -mx-4 md:mx-0 mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, ease: E }}
        >
        <motion.div
          ref={trackRef}
          role="radiogroup"
          aria-label="Tech stack category"
          className="relative inline-grid max-w-full p-1 rounded-2xl select-none"
          style={{ background: trackBg, gridAutoFlow: "column", gridAutoColumns: "auto" }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handlePointerCancel}
        >
          {/* bottom layer: idle labels at reduced opacity (--rs-ink, opacity 0.7) */}
          {TECH_CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.label}
              ref={(el) => { itemRefs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={i === active}
              tabIndex={i === active ? 0 : -1}
              onPointerDown={(e) => handlePointerDown(e, i)}
              onKeyDown={handleKeyDown}
              className="ts-tab ts-seg flex items-center justify-center font-medium rounded-xl whitespace-nowrap cursor-pointer"
              style={{ color: inkIdle, opacity: i === active ? 0 : 0.7 }}
            >
              {cat.label}
            </motion.button>
          ))}

          {/* top layer: the clipped "thumb" — same grid, same labels, full-opacity
              active ink, revealed only where the clip-path window currently sits */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-1 grid pointer-events-none"
            style={{ gridAutoFlow: "column", gridAutoColumns: "auto", background: thumbBg, clipPath }}
          >
            {TECH_CATEGORIES.map((cat) => (
              <motion.span
                key={cat.label}
                className="ts-seg flex items-center justify-center font-medium rounded-xl whitespace-nowrap"
                style={{ color: inkActive }}
              >
                {cat.label}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
        </motion.div>

        <motion.h3
          key={"title-" + active}
          className="text-sm font-semibold mb-1"
          style={{ color: textColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {current.label} &amp; tools
        </motion.h3>
        <motion.p className="text-xs font-semibold tracking-wider mb-2" style={{ color: mutedColor }}>
          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </motion.p>
        <div className="w-7 h-[3px] mx-auto mb-10 rounded-full overflow-hidden" style={{ background: "rgba(128,128,128,0.25)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: accentColor }}
            animate={{ width: progress + "%" }}
            transition={{ duration: 0.3, ease: E }}
          />
        </div>

        <motion.div
          key={"grid-" + active}
          className="flex flex-wrap justify-center gap-x-[3%] gap-y-7 md:gap-x-6 max-w-[420px] mx-auto"
          style={{ "--ic-face": textColor, "--ic-a": iconSideA, "--ic-b": iconSideB, "--ic-accent": accentColor }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: E }}
        >
          {current.tools.map((tool, toolIndex) => (
            <div key={tool.name} className="flex flex-col items-center gap-3 w-[30%] max-w-[110px]">
              {/* 3D icon, no box around it; colors follow the theme live */}
              <Icon3D
                Icon={tool.Icon}
                size={ICON3D_SIZE}
                autoSpin={switched.current}
                index={toolIndex}
                logo={(TECH_LOGOS[tool.name] || {}).file ? "/logos/" + TECH_LOGOS[tool.name].file + ".svg" : undefined}
                brand={(TECH_LOGOS[tool.name] || {}).side || "var(--ic-accent)"}
                scale={(TECH_LOGOS[tool.name] || {}).scale || 1}
              />
              <motion.span className="text-[12.5px] font-medium text-center leading-tight" style={{ color: mutedColor }}>{tool.name}</motion.span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ── Manifesto (transparent background) ──────────── */
function Manifesto({ globalProgress, manifestoRef, themeProgress, isMobile }) {
  const inView = useInView(manifestoRef, { once: true, margin: "-5%" });
  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);

  const lines = [
    "One developer,",
    "from first sketch",
    "to deployed product.",
    "Fewer handoffs.",
    "Fewer surprises.",
  ];

  return (
    <motion.section
      ref={manifestoRef}
      id="manifesto"
      className="relative py-28 md:py-44 px-6 md:px-20 overflow-hidden theme-section"
    >
      <motion.span
        className="text-xs tracking-[0.3em] uppercase mb-16 relative z-10 block"
        style={{ color: mutedColor }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
      >
        Manifesto
      </motion.span>

      <div className="relative z-10 max-w-5xl">
        {lines.map((line, i) => (
          <div key={i} className="overflow-hidden">
            <motion.p
              className="font-display font-black leading-[1.05]"
              style={{
                fontSize: "clamp(1.8rem, 6vw, 4rem)",
                color: i % 2 === 0 ? textColor : accentColor,
                letterSpacing: "-0.02em",
              }}
              initial={{ y: "120%", opacity: 0 }}
              animate={inView ? { y: "0%", opacity: 1 } : {}}
              transition={{ duration: 1, delay: i * 0.06, ease: E }}
            >
              {line}
            </motion.p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* ── Story / About (transparent) ───────────────────── */
function Story({ themeProgress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);

  return (
    <motion.section ref={ref} id="about" className="py-28 md:py-44 px-6 md:px-20 theme-section">
      <motion.span className="text-xs tracking-[0.3em] uppercase block mb-10" style={{ color: mutedColor }} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}>
        About
      </motion.span>
      <div className="max-w-4xl">
        <motion.p
          className="text-[clamp(1.5rem,4vw,2.8rem)] font-display font-semibold leading-[1.3] tracking-tight"
          style={{ color: textColor }}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.9, ease: E }}
        >
          I build websites, web apps and connected devices for people who need the whole thing working, not just the front page.
        </motion.p>
        <motion.p
          className="mt-8 text-lg leading-relaxed max-w-2xl"
          style={{ color: mutedColor }}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          Landing pages that load fast, full-stack products with a real back end, and IoT dashboards that read from actual hardware.
        </motion.p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
        {[
          { n: "14", label: "Projects" },
          { n: "8", label: "Clients" },
          { n: "100%", label: "Custom" },
          { n: "3+", label: "Countries" },
        ].map((s) => (
          <motion.div
            key={s.label}
            className="text-center p-4 rounded-xl"
            style={{
              border: "1px solid",
              borderColor: useTransform(themeProgress, [0, 1], [DARK.border, LIGHT.border]),
              backgroundColor: useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]),
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <motion.p className="text-3xl md:text-4xl font-display font-bold" style={{ color: accentColor }}>{s.n}</motion.p>
            <motion.p className="text-xs tracking-wider uppercase mt-2" style={{ color: mutedColor }}>{s.label}</motion.p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ── Testimonials (transparent background) ────────── */
function Testimonials({ themeProgress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [active, setActive] = useState(0);
  const t = TESTIMONIALS[active];
  const dotIdle = useTransform(themeProgress, [0, 1], ["rgba(255,255,255,0.22)", "rgba(0,0,0,0.14)"]);
  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);

  const { scrollYProgress: tScroll } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const quoteY = useTransform(tScroll, [0, 1], [40, -40]);

  return (
    <motion.section ref={ref} className="py-28 md:py-44 px-6 md:px-20 theme-section">
      <motion.span className="text-xs tracking-[0.3em] uppercase block mb-16" style={{ color: mutedColor }} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}>
        Testimonials
      </motion.span>
      <div className="max-w-3xl relative">
        <motion.span className="absolute top-0 left-0 text-[10rem] font-display opacity-10 select-none" style={{ y: quoteY, color: accentColor }}>
          &quot;
        </motion.span>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: E }}
          >
            <motion.p className="text-[clamp(1.3rem,4vw,2.2rem)] font-display font-medium leading-[1.5] italic relative z-10" style={{ color: textColor }}>
              &quot;{t.quote}&quot;
            </motion.p>
            <div className="mt-8 flex items-center gap-4">
              <motion.div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: accentColor, color: "var(--bg-primary)" }}>
                {t.name.split(" ").map((n) => n[0]).join("")}
              </motion.div>
              <div>
                <motion.p className="font-semibold" style={{ color: textColor }}>{t.name}</motion.p>
                <motion.p className="text-xs tracking-wider" style={{ color: mutedColor }}>{t.role}</motion.p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-4 mt-12">
          {TESTIMONIALS.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setActive(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === active ? 32 : 12,
                background: i === active ? accentColor : dotIdle,
                border: "none",
                cursor: "pointer",
              }}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ── Contact (transparent background) ────────────── */
function Contact({ themeProgress, isMobile }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);

  return (
    <motion.section ref={ref} id="contact" className="py-28 md:py-44 px-6 md:px-20 theme-section">
      <div className="max-w-3xl">
        <motion.h2
          className="text-[clamp(3rem,10vw,7rem)] font-display font-bold leading-[0.95] tracking-tight mb-8"
          style={{ color: textColor }}
          initial={{ y: 40, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: E }}
        >
          Have a project<br />
          in mind?
        </motion.h2>
        <motion.a
          href="mailto:hello@bycarlo.dev"
          className="inline-flex items-center gap-3 mt-8 text-lg font-semibold transition-all"
          style={{ color: accentColor }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
        >
          hello@bycarlo.dev <span className="text-2xl">&#8594;</span>
        </motion.a>
      </div>
      <motion.footer
        className="mt-32 flex flex-col md:flex-row justify-between gap-2 text-xs tracking-widest uppercase"
        style={{ color: mutedColor }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
      >
        <span>&#169; 2025 byCarlo</span>
        <span>Based in Manila, working worldwide</span>
      </motion.footer>
    </motion.section>
  );
}

/* ── Page root – manual light / dark theme ──────── */
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
        <TechStack themeProgress={themeProgress} />
        <Manifesto globalProgress={globalProgress} manifestoRef={manifestoRef} themeProgress={themeProgress} isMobile={isMobile} />
        <Story themeProgress={themeProgress} />
        <Testimonials themeProgress={themeProgress} />
        <Contact themeProgress={themeProgress} isMobile={isMobile} />
      </main>
    </>
  );
}
