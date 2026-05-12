"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";

const E = [0.25, 1, 0.25, 1];

const DARK = {
  bg: "#0B0B0E",
  surface: "#14141A",
  text: "#EBEBF5",
  muted: "#9898A8",
  accent: "#00F0FF",
  accent2: "#B24BF3",
  border: "rgba(255,255,255,0.08)",
};

const LIGHT = {
  bg: "#FFFFFF",
  surface: "#F5F5F5",
  text: "#0B0B0E",
  muted: "#555555",
  accent: "#00AABB",
  accent2: "#8A2BE2",
  border: "rgba(0,0,0,0.08)",
};

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
    id: "01",
    title: "Helix Protocol",
    cat: "Web3 Platform",
    desc: "A next‑gen DeFi dashboard with real‑time data visualisation.",
    tech: ["Solidity", "Next.js", "D3"],
    live: "#",
    colorAccent: "#00F0FF",
  },
  {
    id: "02",
    title: "Mirage Events",
    cat: "Experience Portal",
    desc: "Immersive event microsite blending video and 3D ticketing.",
    tech: ["Three.js", "GSAP", "Firebase"],
    live: "#",
    colorAccent: "#B24BF3",
  },
  {
    id: "03",
    title: "Core Studio",
    cat: "Agency Rebrand",
    desc: "Brutalist portfolio for a creative studio moving into architecture.",
    tech: ["Tailwind", "Framer Motion", "Storyblok"],
    live: "#",
    colorAccent: "#00F0FF",
  },
  {
    id: "04",
    title: "Void Commerce",
    cat: "Headless Store",
    desc: "Product‑first shopping with AI search and zero‑click checkout.",
    tech: ["Medusa", "Algolia", "Astro"],
    live: "#",
    colorAccent: "#B24BF3",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Working with this team felt like tapping into a future I didn't know existed. The result is still ahead of the market.",
    name: "Nova Chen",
    role: "Founder, Helix",
  },
  {
    quote:
      "They don't just build pages – they engineer moments. Three weeks and our conversion increased by 43%.",
    name: "Rafael Ortiz",
    role: "VP Product, Mirage",
  },
  {
    quote:
      "Unflinchingly modern. Every pixel has a reason. We've never received compliments like this on a website before.",
    name: "Clara Jensen",
    role: "Creative Director, Core",
  },
];

const NAV_LINKS = [
  { id: "work", label: "Projects" },
  { id: "about", label: "About" },
  { id: "", label: "Services" },
  { id: "manifesto", label: "Insights" },
];

// ─── GLASS NAVBAR ───────────────────────────────────
function GlassNavbar() {
  const [active, setActive] = useState("work");
  const [hovered, setHovered] = useState(null);

  const barLeft = useMotionValue(0);
  const barWidth = useMotionValue(0);
  const springL = useSpring(barLeft, { stiffness: 380, damping: 28 });
  const springW = useSpring(barWidth, { stiffness: 380, damping: 28 });

  const groupRef = useRef(null);
  const linkRefs = useRef({});

  const moveBar = useCallback(
    (key) => {
      const group = groupRef.current;
      const link = linkRefs.current[key];
      if (!group || !link) return;
      const gRect = group.getBoundingClientRect();
      const lRect = link.getBoundingClientRect();
      barLeft.set(lRect.left - gRect.left);
      barWidth.set(lRect.width);
    },
    [barLeft, barWidth]
  );

  useEffect(() => {
    const onScroll = () => {
      let current = "work";
      document.querySelectorAll("section[id]").forEach((s) => {
        if (s.getBoundingClientRect().top < window.innerHeight / 2) {
          current = s.id;
        }
      });
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => moveBar(hovered ?? active));
  }, [active, hovered, moveBar]);

  useEffect(() => {
    const onResize = () => moveBar(hovered ?? active);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, hovered, moveBar]);

  return (
    <nav className="glass-nav">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 sm:px-6">
        <a
          href="#"
          className="logo-gradient font-black no-underline leading-none select-none"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontFamily: "var(--font-display)" }}
        >
          V
        </a>

        <div
          ref={groupRef}
          className="glow-bar-track flex items-center gap-4 sm:gap-6 md:gap-8"
        >
          {NAV_LINKS.map(({ id, label }) => {
            const key = id || label;
            return (
              <a
                key={key}
                ref={(el) => {
                  if (el) linkRefs.current[key] = el;
                }}
                href={id ? `#${id}` : "#"}
                onClick={(e) => {
                  if (!id) e.preventDefault();
                }}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                className="no-underline pb-1 transition-colors duration-200 whitespace-nowrap"
                style={{
                  fontSize: "clamp(0.7rem, 2vw, 0.875rem)",
                  fontWeight: 600,
                  color: active === id ? "#ffffff" : "#999999",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {label}
              </a>
            );
          })}

          <motion.div
            style={{
              position: "absolute",
              bottom: -1,
              left: springL,
              width: springW,
              height: 2,
              borderRadius: 1,
              background: "#ffffff",
              boxShadow:
                "0 0 8px rgba(255,255,255,0.7), 0 0 18px rgba(255,255,255,0.3)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </nav>
  );
}

// ─── CUSTOM CURSOR ──────────────────────────────────
function Cursor() {
  const mx = useMotionValue(-100),
    my = useMotionValue(-100);
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
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
    >
      <motion.div
        animate={{
          width: hover ? 48 : 12,
          height: hover ? 48 : 12,
          backgroundColor: hover ? `${DARK.accent}18` : DARK.accent,
          borderColor: hover ? DARK.accent : "transparent",
          borderWidth: hover ? 1.5 : 0,
        }}
        style={{ borderRadius: "50%", borderStyle: "solid" }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />
    </motion.div>
  );
}

// ─── DEVICE MOCKUPS ─────────────────────────────────
function DeviceMockup({ accent = "#00F0FF", themeProgress }) {
  const frameBg = useTransform(themeProgress, [0, 1], [DARK.surface, LIGHT.surface]);
  const screenBg = useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]);
  const barColor = useTransform(themeProgress, [0, 1], [
    "rgba(255,255,255,0.1)",
    "rgba(0,0,0,0.05)",
  ]);

  return (
    <div className="mt-6 mb-12">
      <div className="relative mx-auto" style={{ maxWidth: "600px" }}>
        <motion.div
          className="rounded-xl overflow-hidden border w-full aspect-video"
          style={{ borderColor: DARK.border, backgroundColor: frameBg }}
          animate={{
            boxShadow: [
              `0 0 15px ${accent}30`,
              `0 0 25px ${accent}50`,
              `0 0 15px ${accent}30`,
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <div
            className="flex items-center gap-1.5 px-4 py-2"
            style={{ backgroundColor: barColor }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-70" />
          </div>
          <motion.div
            className="flex-1 p-4 flex flex-col gap-2 h-full"
            style={{ backgroundColor: screenBg }}
          >
            <div
              className="w-2/3 h-3 rounded"
              style={{ backgroundColor: accent, opacity: 0.3 }}
            />
            <div
              className="w-1/2 h-3 rounded"
              style={{ backgroundColor: accent, opacity: 0.15 }}
            />
            <div
              className="w-1/4 h-8 rounded mt-auto"
              style={{ backgroundColor: accent, opacity: 0.4 }}
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-[-24px] right-[-12px] w-24 rounded-2xl overflow-hidden border shadow-xl z-10"
          style={{ borderColor: DARK.border, backgroundColor: frameBg }}
          animate={{
            boxShadow: [
              `0 0 10px ${accent}30`,
              `0 0 20px ${accent}50`,
              `0 0 10px ${accent}30`,
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.2 }}
        >
          <div
            className="flex justify-center py-1.5"
            style={{ backgroundColor: barColor }}
          >
            <div className="w-3 h-1 rounded-full bg-gray-500 opacity-60" />
          </div>
          <motion.div
            className="h-32 p-2 flex flex-col gap-1.5"
            style={{ backgroundColor: screenBg }}
          >
            <div
              className="w-full h-2 rounded"
              style={{ backgroundColor: accent, opacity: 0.3 }}
            />
            <div
              className="w-3/4 h-2 rounded"
              style={{ backgroundColor: accent, opacity: 0.2 }}
            />
            <div
              className="w-1/2 h-4 rounded mt-auto"
              style={{ backgroundColor: accent, opacity: 0.4 }}
            />
          </motion.div>
          <div
            className="flex justify-center py-1.5"
            style={{ backgroundColor: barColor }}
          >
            <div className="w-2 h-1 rounded-full bg-gray-500 opacity-60" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── HERO ────────────────────────────────────────────
function Hero({ globalProgress }) {
  const ref = useRef(null);
  const [, setMouse] = useState({ x: 0.5, y: 0.5 });
  const handleMouse = useCallback((e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setMouse({
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    });
  }, []);

  const bgY = useTransform(globalProgress, [0, 0.4], [0, -100]);

  return (
    <motion.section
      ref={ref}
      onMouseMove={handleMouse}
      className="relative min-h-screen flex flex-col justify-center items-start px-6 md:px-20 overflow-hidden pt-20"
      style={{ backgroundColor: DARK.bg }}
    >
      <motion.div className="absolute top-0 left-0 w-full h-full z-0" style={{ y: bgY }}>
        <motion.div
          className="absolute -top-20 -right-20 w-[50vw] h-[50vw] rounded-full opacity-10 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${DARK.accent}, transparent 70%)`,
            y: useTransform(globalProgress, [0, 0.5], [0, -80]),
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-[40vw] h-[40vw] rounded-full opacity-10 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${DARK.accent2}, transparent 70%)`,
            y: useTransform(globalProgress, [0, 0.5], [0, 80]),
          }}
        />
      </motion.div>

      <div className="relative z-10 flex flex-col gap-6 md:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: E }}
          className="flex items-center gap-3"
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span
            className="text-[11px] tracking-[0.35em] uppercase font-medium"
            style={{ color: DARK.muted }}
          >
            Studio · Est. 2025
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: E }}
          className="text-[clamp(2.8rem,10vw,7rem)] font-display font-bold leading-[0.9] tracking-tight"
        >
          <span className="block" style={{ color: DARK.text }}>
            Crafting
          </span>
          <span className="block">
            <span style={{ color: DARK.accent }}>Digital</span>
            <br />
            <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              Realities
            </span>
            <span style={{ color: DARK.accent }}>.</span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: E }}
          className="max-w-xl text-[clamp(1rem,2.5vw,1.3rem)] leading-relaxed"
          style={{ color: DARK.muted }}
        >
          We build immersive, high‑performing websites that merge design with code – before you
          even know you need them.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0, ease: E }}
          className="flex gap-4 mt-4"
        >
          <a
            href="#work"
            className="px-7 py-3 rounded-full font-semibold text-sm tracking-wide"
            style={{ background: DARK.accent, color: "#0B0B0E" }}
          >
            See work →
          </a>
          <a
            href="#contact"
            className="px-7 py-3 rounded-full font-semibold text-sm tracking-wide border"
            style={{ borderColor: DARK.border, color: DARK.text }}
          >
            Get in touch
          </a>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <span
          className="text-[9px] tracking-[0.3em] uppercase"
          style={{ color: DARK.muted }}
        >
          Scroll
        </span>
        <motion.div
          className="w-4 h-8 rounded-full border flex justify-center p-1"
          style={{ borderColor: DARK.border }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-accent"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

// ─── PROJECTS ────────────────────────────────────────
function Projects({ globalProgress, themeProgress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  const sectionBg = useTransform(themeProgress, [0, 1], [DARK.surface, LIGHT.surface]);
  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);
  const borderColor = useTransform(themeProgress, [0, 1], [DARK.border, LIGHT.border]);

  return (
    <motion.section
      ref={ref}
      id="work"
      className="relative py-28 md:py-44 px-6 md:px-14"
      style={{ backgroundColor: sectionBg }}
    >
      <div className="mb-20">
        <motion.span
          className="text-[11px] tracking-[0.4em] uppercase block mb-4"
          style={{ color: mutedColor }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          Selected Work
        </motion.span>
        <motion.h2
          className="text-[clamp(2.2rem,6vw,4.5rem)] font-bold tracking-tight leading-[1.1]"
          style={{ color: textColor, fontFamily: "var(--font-display)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, ease: E }}
        >
          Projects that define
          <br />
          the <span style={{ color: accentColor }}>future</span>
          <span style={{ color: accentColor }}>.</span>
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
            <DeviceMockup accent={p.colorAccent} themeProgress={themeProgress} />

            <div>
              <div className="flex items-center justify-between">
                <motion.span
                  className="text-[10px] tracking-[0.25em] uppercase"
                  style={{ color: accentColor }}
                >
                  {p.cat}
                </motion.span>
                <motion.span
                  className="text-[10px] tracking-widest opacity-50 font-mono"
                  style={{ color: mutedColor }}
                >
                  {p.id}
                </motion.span>
              </div>
              <motion.h3
                className="text-2xl md:text-3xl font-display font-semibold mt-1"
                style={{ color: textColor }}
              >
                {p.title}
              </motion.h3>
              <motion.p
                className="text-base leading-relaxed mt-2"
                style={{ color: mutedColor }}
              >
                {p.desc}
              </motion.p>
              <div className="flex flex-wrap gap-2 mt-4">
                {p.tech.map((t) => (
                  <motion.span
                    key={t}
                    className="text-[10px] tracking-wider px-3 py-1.5 rounded-full border"
                    style={{ borderColor: borderColor, color: mutedColor }}
                  >
                    {t}
                  </motion.span>
                ))}
              </div>
              <motion.a
                href={p.live}
                className="inline-flex items-center gap-2 mt-6 text-sm font-semibold transition-colors"
                style={{ color: accentColor }}
              >
                View project{" "}
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </motion.a>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── MANIFESTO ───────────────────────────────────────
function Manifesto({ globalProgress, manifestoRef, themeProgress }) {
  const inView = useInView(manifestoRef, { once: true, margin: "-5%" });
  const sectionBg = useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]);
  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);

  const bgY = useTransform(globalProgress, [0.3, 0.7], [0, -80]);

  const lines = [
    "We ship in weeks,",
    "not years.",
    "We design for the",
    "borderless age.",
    "No templates.",
    "No bullshit.",
    "Just clarity.",
  ];

  return (
    <motion.section
      ref={manifestoRef}
      id="manifesto"
      className="relative py-28 md:py-44 px-6 md:px-20 overflow-hidden"
      style={{ backgroundColor: sectionBg }}
    >
      <motion.div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ y: bgY }}
      >
        <div
          className="absolute top-[20%] right-[10%] w-[40%] h-[60%] rounded-full blur-3xl opacity-10"
          style={{ background: `radial-gradient(circle, ${DARK.accent2}, transparent 70%)` }}
        />
        <div
          className="absolute bottom-[10%] left-[5%] w-[30%] h-[40%] rounded-full blur-3xl opacity-10"
          style={{ background: `radial-gradient(circle, ${DARK.accent}, transparent 70%)` }}
        />
      </motion.div>

      <motion.span
        className="text-[10px] tracking-[0.4em] uppercase mb-16 relative z-10 block"
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
              className="font-display font-bold leading-[1.05]"
              style={{
                fontSize: "clamp(2.4rem, 8vw, 6.5rem)",
                color: i % 2 === 0 ? textColor : accentColor,
                letterSpacing: "-0.02em",
              }}
              initial={{ y: "120%", opacity: 0 }}
              animate={inView ? { y: "0%", opacity: 1 } : {}}
              transition={{ duration: 1, delay: i * 0.06, ease: E }}
            >
              {line}{" "}
              {line.endsWith(".") && i === lines.length - 1 ? (
                <span style={{ color: accentColor }}>.</span>
              ) : null}
            </motion.p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── STORY ───────────────────────────────────────────
function Story({ themeProgress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const sectionBg = useTransform(themeProgress, [0, 1], [DARK.surface, LIGHT.surface]);
  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);

  return (
    <motion.section
      ref={ref}
      id="about"
      className="py-28 md:py-44 px-6 md:px-20"
      style={{ backgroundColor: sectionBg }}
    >
      <motion.span
        className="text-[10px] tracking-[0.4em] uppercase block mb-10"
        style={{ color: mutedColor }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
      >
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
          We are a remote collective of designers and engineers obsessed with the{" "}
          <span style={{ color: accentColor }}>edge</span> of web performance and aesthetics.
        </motion.p>
        <motion.p
          className="mt-8 text-lg leading-relaxed max-w-2xl"
          style={{ color: mutedColor }}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          Started in 2025 with a single belief – that a website should feel like a part of your
          brand&apos;s nervous system, not a static brochure.
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
              border: `1px solid`,
              borderColor: useTransform(themeProgress, [0, 1], [DARK.border, LIGHT.border]),
              backgroundColor: useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]),
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <p
              className="text-3xl md:text-4xl font-display font-bold"
              style={{ color: accentColor }}
            >
              {s.n}
            </p>
            <p className="text-xs tracking-wider uppercase mt-2" style={{ color: mutedColor }}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── TESTIMONIALS ────────────────────────────────────
function Testimonials({ themeProgress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [active, setActive] = useState(0);
  const t = TESTIMONIALS[active];
  const sectionBg = useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]);
  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);

  const quoteY = useTransform(
    useScroll({ target: ref, offset: ["start end", "end start"] }).scrollYProgress,
    [0, 1],
    [40, -40]
  );

  return (
    <motion.section
      ref={ref}
      className="py-28 md:py-44 px-6 md:px-20"
      style={{ backgroundColor: sectionBg }}
    >
      <motion.span
        className="text-[10px] tracking-[0.4em] uppercase block mb-16"
        style={{ color: mutedColor }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
      >
        Testimonials
      </motion.span>
      <div className="max-w-3xl relative">
        <motion.span
          className="absolute top-0 left-0 text-[10rem] font-display opacity-10 select-none"
          style={{ y: quoteY, color: accentColor }}
        >
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
            <motion.p
              className="text-[clamp(1.3rem,4vw,2.2rem)] font-display font-medium leading-[1.5] italic relative z-10"
              style={{ color: textColor }}
            >
              &quot;{t.quote}&quot;
            </motion.p>
            <div className="mt-8 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: accentColor, color: DARK.bg }}
              >
                {t.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <motion.p className="font-semibold" style={{ color: textColor }}>
                  {t.name}
                </motion.p>
                <motion.p className="text-xs tracking-wider" style={{ color: mutedColor }}>
                  {t.role}
                </motion.p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-4 mt-12">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === active ? 32 : 12,
                background: i === active ? accentColor : "rgba(255,255,255,0.15)",
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

// ─── CONTACT ─────────────────────────────────────────
function Contact({ themeProgress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const sectionBg = useTransform(themeProgress, [0, 1], [DARK.surface, LIGHT.surface]);
  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);

  return (
    <motion.section
      ref={ref}
      id="contact"
      className="py-28 md:py-44 px-6 md:px-20"
      style={{ backgroundColor: sectionBg }}
    >
      <div className="max-w-3xl">
        <motion.h2
          className="text-[clamp(3rem,10vw,7rem)] font-display font-bold leading-[0.95] tracking-tight mb-8"
          style={{ color: textColor }}
          initial={{ y: 40, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: E }}
        >
          Let&apos;s make
          <br />
          <span style={{ color: accentColor, whiteSpace: "nowrap" }}>
            something cool
            <span style={{ color: accentColor }}>.</span>
            <motion.span
              style={{
                display: "inline-block",
                width: "0.18em",
                height: "0.75em",
                backgroundColor: accentColor,
                marginLeft: "0.08em",
                verticalAlign: "baseline",
              }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            />
          </span>
        </motion.h2>
        <motion.a
          href="mailto:hello@bycarlo.dev"
          className="inline-flex items-center gap-3 mt-8 text-lg font-semibold transition-all"
          style={{ color: accentColor }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
        >
          hello@bycarlo.dev <span className="text-2xl">&rarr;</span>
        </motion.a>
      </div>
      <motion.footer
        className="mt-32 flex flex-col md:flex-row justify-between text-xs tracking-widest uppercase"
        style={{ color: mutedColor }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
      >
        <span>© 2025 ByCarlo Studio</span>
        <span>Manila · Remote · Worldwide</span>
      </motion.footer>
    </motion.section>
  );
}

// ─── ROOT PAGE ────────────────────────────────────────
export default function Page() {
  const manifestoRef = useRef(null);
  const containerRef = useRef(null);

  const { scrollYProgress: globalScroll } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const globalProgress = useSpring(globalScroll, { stiffness: 50, damping: 25, mass: 0.3 });

  const { scrollYProgress: manifestoScroll } = useScroll({
    target: manifestoRef,
    offset: ["start start", "end start"],
  });
  const rawThemeProgress = useTransform(manifestoScroll, [0, 0.15, 1], [0, 1, 1]);
  const themeProgress = useSpring(rawThemeProgress, { stiffness: 40, damping: 20, mass: 0.3 });

  useEffect(() => {
    const changeBg = (v) => {
      const bg = interpolateHex(DARK.bg, LIGHT.bg, v);
      document.body.style.backgroundColor = bg;
      document.documentElement.style.backgroundColor = bg;
    };
    const unsub = themeProgress.on("change", changeBg);
    return () => unsub();
  }, [themeProgress]);

  return (
    <>
      <Cursor />
      <GlassNavbar />
      <main ref={containerRef}>
        <Hero globalProgress={globalProgress} />
        <Projects globalProgress={globalProgress} themeProgress={themeProgress} />
        <Manifesto
          globalProgress={globalProgress}
          manifestoRef={manifestoRef}
          themeProgress={themeProgress}
        />
        <Story themeProgress={themeProgress} />
        <Testimonials themeProgress={themeProgress} />
        <Contact themeProgress={themeProgress} />
      </main>
    </>
  );
}