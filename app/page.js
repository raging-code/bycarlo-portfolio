"use client";

// ═══════════════════════════════════════════════════════════════
//  byCarlo — Full Redesign
//  Fonts: Outfit (headings) · Plus Jakarta Sans (body) · Cormorant (hero brand)
// ═══════════════════════════════════════════════════════════════

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

// ─── Easing ──────────────────────────────────────
const E = [0.22, 1, 0.36, 1];

// ─── Color palette ───────────────────────────────
const C = {
  bg:       "#F7F4EE",
  fg:       "#14110C",
  accent:   "#1A3EE0",
  gold:     "#C48A0A",
  surface:  "#EDE8DF",
  surface2: "#E4DDD2",
  muted:    "#8E8A84",
};

// CSS transition string shared across all section background transitions
const BG_TRANSITION = "background-color 1s cubic-bezier(0.22, 1, 0.36, 1)";

// ─── Projects data ────────────────────────────────
const PROJECTS = [
  {
    id: "01",
    title: "Vow & Verse",
    type: "Wedding Website",
    tags: ["Next.js", "Framer Motion", "Sanity CMS"],
    year: "2024",
    url: "#",
    desc: "An intimate digital experience crafted for a wedding day — from invitation to gallery.",
    colors: {
      desktopFrom: "#FDF0ED",
      desktopTo:   "#F0CCB8",
      mobileFrom:  "#FDE8E4",
      mobileTo:    "#EEC0B0",
      accent:      "#B5634A",
    },
  },
  {
    id: "02",
    title: "Luminara",
    type: "Birthday Celebration",
    tags: ["React", "Tailwind", "EmailJS"],
    year: "2024",
    url: "#",
    desc: "A radiant celebration website that doubles as a glowing digital invitation.",
    colors: {
      desktopFrom: "#FFFBEE",
      desktopTo:   "#FDE588",
      mobileFrom:  "#FFF5D0",
      mobileTo:    "#FADA7C",
      accent:      "#C4870A",
    },
  },
  {
    id: "03",
    title: "Nexus Corp",
    type: "Corporate Website",
    tags: ["Next.js", "TypeScript", "Vercel"],
    year: "2024",
    url: "#",
    desc: "Corporate authority made approachable through precision, hierarchy, and clean digital design.",
    colors: {
      desktopFrom: "#E8EFF8",
      desktopTo:   "#BACCF2",
      mobileFrom:  "#E4EDF8",
      mobileTo:    "#B8CBF0",
      accent:      "#1A40A0",
    },
  },
  {
    id: "04",
    title: "Folio & Co",
    type: "Business Portfolio",
    tags: ["Next.js", "Sanity", "Analytics"],
    year: "2024",
    url: "#",
    desc: "A portfolio built to convert first-time visitors into long-term clients.",
    colors: {
      desktopFrom: "#EAF3EC",
      desktopTo:   "#BCDEC8",
      mobileFrom:  "#E5F2E8",
      mobileTo:    "#B8DAC4",
      accent:      "#1A6B4A",
    },
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We handed Carlo a mood board and a deadline. He returned a website that felt like it cost ten times what we paid. Every detail — the typography, the transitions — felt considered.",
    name: "Sofia Reyes",
    role: "Bride · Vow & Verse",
  },
  {
    quote:
      "Most designers build websites. Carlo builds experiences. The difference is visible in the first three seconds a visitor lands on your page.",
    name: "Daniel Fonseca",
    role: "CEO · Nexus Corp",
  },
  {
    quote:
      "I was skeptical about the four-day timeline. Four days later I had a site I was genuinely proud to share with every client I've had since.",
    name: "Marco Torres",
    role: "Founder · Folio & Co",
  },
];

// ═══════════════════════════════════════════════════════════════
//  LOGO MARK
// ═══════════════════════════════════════════════════════════════

function LogoMark({ size = 38 }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: size > 40 ? 7 : 4 }}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Pulsing ambient glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: `${C.accent}14` }}
          animate={{ scale: [1, 1.22, 1], opacity: [0.55, 0.12, 0.55] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Outer rotating dashed ring */}
        <motion.svg
          className="absolute inset-0"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ overflow: "visible" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 1.5}
            fill="none"
            stroke={C.accent}
            strokeWidth="1.2"
            strokeDasharray="5 4"
            strokeLinecap="round"
            opacity="0.42"
          />
        </motion.svg>

        {/* Inner counter-rotating dotted ring */}
        <div className="absolute" style={{ top: 6, left: 6, right: 6, bottom: 6 }}>
          <motion.svg
            width="100%"
            height="100%"
            viewBox="0 0 26 26"
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            <circle
              cx="13" cy="13" r="11"
              fill="none"
              stroke={`${C.accent}38`}
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          </motion.svg>
        </div>

        {/* Orbiting cobalt dot */}
        <motion.div
          className="absolute inset-0"
          style={{ transformOrigin: "center" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <div
            style={{
              position: "absolute",
              width: size > 40 ? 5 : 4,
              height: size > 40 ? 5 : 4,
              borderRadius: "50%",
              backgroundColor: C.accent,
              top: 1,
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: `0 0 7px ${C.accent}`,
            }}
          />
        </motion.div>

        {/* Logo PNG */}
        <img
          src="/png/logo.png"
          alt="ByCarlo logo"
          style={{ position: "absolute", top: 5, left: 5, right: 5, bottom: 5, objectFit: "contain" }}
        />
      </div>

      {/* ByCarlo wordmark — Cormorant Garamond */}
      <span
        style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
          fontWeight: 700,
          fontSize: size > 40 ? 14 : 10,
          letterSpacing: "0.22em",
          color: C.fg,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        ByCarlo
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CUSTOM CURSOR
// ═══════════════════════════════════════════════════════════════

function Cursor() {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const sx = useSpring(mx, { stiffness: 380, damping: 26 });
  const sy = useSpring(my, { stiffness: 380, damping: 26 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const move = (e) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", move);

    const onEnter = () => setHovering(true);
    const onLeave = () => setHovering(false);
    const attach = () => {
      document.querySelectorAll("a, button, [data-hover]").forEach((el) => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };
    attach();

    const obs = new MutationObserver(attach);
    obs.observe(document.body, { childList: true, subtree: true });

    return () => { window.removeEventListener("mousemove", move); obs.disconnect(); };
  }, [mx, my]);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[99999] hidden md:block"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
    >
      <motion.div
        className="rounded-full"
        animate={{
          width: hovering ? 44 : 18,
          height: hovering ? 44 : 18,
          backgroundColor: hovering ? `${C.accent}10` : "transparent",
          borderColor: hovering ? C.accent : `${C.fg}40`,
          borderWidth: 1,
        }}
        style={{ borderStyle: "solid" }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DEVICE MOCKUPS
// ═══════════════════════════════════════════════════════════════

function DesktopMockup({ colors, title }) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    <div
      className="rounded-xl overflow-hidden w-full"
      style={{ border: `1px solid ${C.fg}10`, boxShadow: `0 8px 28px ${C.fg}0a` }}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ backgroundColor: C.surface2 }}>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#E06060", opacity: 0.75 }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#E0B040", opacity: 0.75 }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#50C060", opacity: 0.75 }} />
        <div
          className="flex-1 mx-2 rounded text-center"
          style={{ backgroundColor: "rgba(255,255,255,0.5)", fontSize: 6, padding: "1.5px 5px", color: `${C.fg}50`, fontFamily: "monospace" }}
        >
          {slug}.bycarlo.com
        </div>
      </div>
      <div
        className="relative overflow-hidden"
        style={{ height: 145, background: `linear-gradient(140deg, ${colors.desktopFrom} 0%, ${colors.desktopTo} 100%)` }}
      >
        <div
          className="absolute rounded-full opacity-20"
          style={{ width: 110, height: 110, right: -18, top: -22, background: `radial-gradient(circle, ${colors.accent}, transparent 72%)` }}
        />
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
          <div style={{ width: 26, height: 4, backgroundColor: colors.accent, opacity: 0.55, borderRadius: 2 }} />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 16, height: 2.5, backgroundColor: colors.accent, opacity: 0.2, borderRadius: 1 }} />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col justify-center pl-4 gap-2">
          <div style={{ width: 72, height: 9, backgroundColor: colors.accent, opacity: 0.42, borderRadius: 2 }} />
          <div style={{ width: 110, height: 6, backgroundColor: colors.accent, opacity: 0.24, borderRadius: 2 }} />
          <div style={{ width: 90, height: 5, backgroundColor: colors.accent, opacity: 0.16, borderRadius: 2 }} />
          <div className="rounded flex items-center justify-center" style={{ width: 42, height: 13, backgroundColor: colors.accent, opacity: 0.65, marginTop: 2 }}>
            <div style={{ width: 26, height: 2.5, backgroundColor: "#fff", borderRadius: 1, opacity: 0.9 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileMockup({ colors }) {
  return (
    <div
      className="flex-shrink-0 rounded-2xl overflow-hidden"
      style={{ width: 64, border: `1.5px solid ${C.fg}14`, boxShadow: `0 8px 22px ${C.fg}0c`, backgroundColor: C.surface2 }}
    >
      <div className="flex justify-center items-center py-1.5" style={{ backgroundColor: C.surface2 }}>
        <div style={{ width: 18, height: 3, backgroundColor: `${C.fg}22`, borderRadius: 2 }} />
      </div>
      <div style={{ height: 102, background: `linear-gradient(160deg, ${colors.mobileFrom} 0%, ${colors.mobileTo} 100%)` }}>
        <div className="flex flex-col items-center justify-center h-full gap-1.5 p-2">
          <div style={{ width: 28, height: 3, backgroundColor: colors.accent, opacity: 0.5, borderRadius: 1 }} />
          <div style={{ width: 42, height: 7, backgroundColor: colors.accent, opacity: 0.32, borderRadius: 1 }} />
          <div style={{ width: 34, height: 4, backgroundColor: colors.accent, opacity: 0.18, borderRadius: 1 }} />
          <div className="rounded flex items-center justify-center" style={{ width: 28, height: 9, backgroundColor: colors.accent, opacity: 0.6, marginTop: 2 }}>
            <div style={{ width: 16, height: 2.5, backgroundColor: "#fff", borderRadius: 1, opacity: 0.85 }} />
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center py-1.5" style={{ backgroundColor: C.surface2 }}>
        <div style={{ width: 16, height: 2, backgroundColor: `${C.fg}20`, borderRadius: 1 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  HERO
//  Receives manifestoBg → transitions its own backgroundColor
// ═══════════════════════════════════════════════════════════════

function Hero({ manifestoBg }) {
  const ref = useRef(null);
  const [spot, setSpot] = useState({ x: 0, y: 0, active: false });

  const handleMouse = useCallback((e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setSpot({ x: e.clientX - r.left, y: e.clientY - r.top, active: true });
  }, []);

  return (
    <section
      ref={ref}
      onMouseMove={handleMouse}
      className="relative w-full min-h-screen flex flex-col overflow-hidden"
      // ↓ FIX: transitions between warm bg and accent blue
      style={{ backgroundColor: manifestoBg ? C.accent : C.bg, transition: BG_TRANSITION }}
    >
      {/* Ambient background blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 55% 45% at 12% 88%, ${C.accent}06 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 88% 10%, ${C.gold}06 0%, transparent 55%)
          `,
        }}
      />

      {/* Mouse spotlight */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: spot.active ? 1 : 0 }}
        transition={{ duration: 0.45 }}
        style={{
          background: `radial-gradient(550px circle at ${spot.x}px ${spot.y}px, ${C.accent}05, transparent 52%)`,
        }}
      />

      {/* ─── Top navigation bar ─── */}
      <div
        className="relative z-10 flex items-center justify-between px-6 md:px-14 h-16 shrink-0"
        style={{ borderBottom: `1px solid ${C.fg}08` }}
      >
        <LogoMark size={36} />

        <div className="hidden md:flex items-center gap-2">
          <motion.span
            className="w-1.5 h-1.5 rounded-full block"
            style={{ backgroundColor: "#1A6B4A", boxShadow: "0 0 6px rgba(26,107,74,0.7)" }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="font-mono text-[8.5px] tracking-[0.34em] uppercase" style={{ color: `${C.fg}70` }}>
            Available for projects
          </span>
        </div>

        <a
          href="#contact"
          className="font-sans text-[9px] tracking-[0.28em] uppercase"
          style={{ color: `${C.fg}CC`, transition: "color 0.2s ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = `${C.fg}CC`)}
        >
          Get in touch →
        </a>
      </div>

      {/* ─── BYCARLO Reveal ─── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-16 md:px-20 md:py-16">
        <div>
          <div className="hero-brand">
            <span>BYCARL</span>
            <span style={{ color: C.accent }}>O</span>
          </div>
          <div className="hero-tagline">
            DIGITAL EXPERIENCES
          </div>
        </div>
      </div>

      {/* ─── Bottom bar ─── */}
      <motion.div
        className="relative z-10 flex items-center justify-between px-6 md:px-14 h-14 shrink-0"
        style={{ borderTop: `1px solid ${C.fg}08` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.52, duration: 0.8 }}
      >
        <span className="font-mono text-[8px] tracking-[0.36em] uppercase" style={{ color: `${C.fg}44` }}>
          001 / Hero
        </span>
        <div className="flex items-center gap-2.5">
          <div className="relative overflow-hidden" style={{ width: 1, height: 28, backgroundColor: `${C.fg}0a` }}>
            <motion.div
              className="absolute inset-x-0 top-0"
              style={{ height: "100%", backgroundColor: C.accent, opacity: 0.4 }}
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeIn", repeatDelay: 1.0 }}
            />
          </div>
          <span className="font-mono text-[7.5px] tracking-[0.36em] uppercase" style={{ color: `${C.fg}44` }}>
            Scroll
          </span>
        </div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PROJECTS
//  Receives manifestoBg → transitions its own backgroundColor
// ═══════════════════════════════════════════════════════════════

function ProjectCard({ project, index, inView }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl"
      style={{
        backgroundColor: C.bg,
        border: `1px solid ${C.fg}08`,
        boxShadow: hovered ? `0 20px 56px ${C.fg}0e` : `0 2px 10px ${C.fg}05`,
        transition: "box-shadow 0.38s ease",
      }}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.12, ease: E }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5 z-10"
        style={{ background: `linear-gradient(90deg, ${project.colors.accent}, ${C.accent})`, transformOrigin: "left" }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.38, ease: E }}
      />

      <div className="p-5 md:p-7">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[7px] tracking-[0.32em] uppercase" style={{ color: `${C.accent}90` }}>
                {project.id}
              </span>
              <span
                className="font-mono text-[6.5px] tracking-wider uppercase px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${C.accent}0e`, color: C.accent, border: `1px solid ${C.accent}20` }}
              >
                {project.type}
              </span>
            </div>
            <h3
              className="font-display italic"
              style={{ fontSize: "clamp(1.55rem, 3.2vw, 2.6rem)", letterSpacing: "-0.02em", color: C.fg, lineHeight: 1 }}
            >
              {project.title}
            </h3>
          </div>
          <span className="font-mono text-[7.5px]" style={{ color: `${C.fg}55`, marginTop: 2 }}>
            {project.year}
          </span>
        </div>

        <p className="font-sans mb-5" style={{ fontSize: 13, lineHeight: 1.72, color: `${C.fg}99`, maxWidth: 310, fontWeight: 500 }}>
          {project.desc}
        </p>

        <div className="flex items-end gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <DesktopMockup colors={project.colors} title={project.title} />
          </div>
          <MobileMockup colors={project.colors} />
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[6px] tracking-wider uppercase px-2 py-1 rounded-full"
                style={{ backgroundColor: `${C.fg}05`, color: `${C.fg}70`, border: `1px solid ${C.fg}0c` }}
              >
                {tag}
              </span>
            ))}
          </div>
          <motion.a
            href={project.url}
            animate={{ x: hovered ? 3 : 0 }}
            transition={{ duration: 0.2 }}
            className="font-mono text-[7.5px] tracking-[0.22em] uppercase shrink-0"
            style={{ color: C.accent }}
          >
            View ↗
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}

function Projects({ manifestoBg }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-8%" });

  return (
    // ↓ FIX: transitions between warm surface and accent blue
    <section ref={ref} className="py-24 md:py-36" style={{ backgroundColor: manifestoBg ? C.accent : C.surface, transition: BG_TRANSITION }}>
      <div
        className="flex items-baseline justify-between px-6 md:px-14 mb-12 pb-5"
        style={{ borderBottom: `1px solid ${C.fg}07` }}
      >
        <motion.span
          className="font-mono text-[9px] tracking-[0.42em] uppercase"
          style={{ color: `${C.fg}66` }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          002 / Selected Work
        </motion.span>
        <motion.span
          className="font-display italic text-sm"
          style={{ color: `${C.fg}55` }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {PROJECTS.length} projects
        </motion.span>
      </div>

      <div className="px-6 md:px-14 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} inView={inView} />
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MANIFESTO
//  FIX 1: Removed top gradient blend div (was: surface → transparent)
//  FIX 2: Removed bottom gradient blend div (was: bg → transparent)
//  FIX 3: Removed ambient background blobs
//  Result: truly solid #1A3EE0 background, no visual gradients
// ═══════════════════════════════════════════════════════════════

function Manifesto({ onBgChange }) {
  const ref = useRef(null);

  const inView = useInView(ref, { once: true, margin: "-5%" });
  const bgInView = useInView(ref, { once: false, margin: "-15% 0px -15% 0px" });

  useEffect(() => {
    onBgChange?.(bgInView);
  }, [bgInView, onBgChange]);

  const lines = [
    { text: "Shipped in days,", bright: false },
    { text: "not months.",      bright: true  },
    { text: "Built to convert.", bright: false },
    { text: "Every pixel",      bright: false },
    { text: "earns its place.", bright: true  },
    { text: "No templates.",    bright: false },
    { text: "No compromise.",   bright: true  },
  ];

  return (
    <section
      ref={ref}
      className="relative py-28 md:py-44 px-6 md:px-14 overflow-hidden"
      // ↓ Solid blue — no gradients overlaid on top of this
      style={{ backgroundColor: C.accent }}
    >
      {/*
        ── REMOVED: top blend gradient div ──────────────────────────
        Was: <div style={{ background: `linear-gradient(to bottom, ${C.surface}, transparent)` }} />
        This was the cause of the gradient appearance at the top of the section.

        ── REMOVED: bottom blend gradient div ───────────────────────
        Was: <div style={{ background: `linear-gradient(to top, ${C.bg}, transparent)` }} />
        This was the cause of the gradient appearance at the bottom.

        ── REMOVED: ambient background blobs ────────────────────────
        Was: radial-gradient blobs adding white/gold tints.
        All three removals together give a perfectly solid cobalt blue.
      */}

      <motion.span
        className="font-mono text-[9px] tracking-[0.42em] uppercase block mb-16 relative z-10"
        style={{ color: "rgba(247,244,238,0.72)" }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        003 / Why byCarlo
      </motion.span>

      <div className="relative z-10">
        {lines.map((line, i) => (
          <div key={i} className="overflow-hidden">
            <motion.p
              style={{
                fontSize: "clamp(2.1rem, 9vw, 9.5rem)",
                lineHeight: 0.88,
                letterSpacing: "-0.03em",
                color: line.bright ? C.bg : "rgba(247,244,238,0.85)",
                fontFamily: "var(--font-display), sans-serif",
                fontStyle: "italic",
                fontWeight: i % 2 === 0 ? 400 : 300,
              }}
              initial={{ y: "108%" }}
              animate={inView ? { y: "0%" } : {}}
              transition={{ duration: 0.88, delay: 0.08 + i * 0.07, ease: E }}
            >
              {line.text}
            </motion.p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  STORY
//  Receives manifestoBg → transitions its own backgroundColor
// ═══════════════════════════════════════════════════════════════

function Story({ manifestoBg }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineH = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    // ↓ FIX: transitions between warm bg and accent blue
    <section ref={ref} className="relative py-28 md:py-44 overflow-hidden" style={{ backgroundColor: manifestoBg ? C.accent : C.bg, transition: BG_TRANSITION }}>
      <div
        className="absolute left-[2.5rem] md:left-[3.5rem] top-0 bottom-0 pointer-events-none"
        style={{ width: 1, backgroundColor: `${C.fg}06` }}
      >
        <motion.div
          className="absolute top-0 left-0 right-0"
          style={{ height: lineH, backgroundColor: C.accent, opacity: 0.22 }}
        />
      </div>

      <div className="px-6 md:px-14 lg:px-24">
        <motion.span
          className="font-mono text-[9px] tracking-[0.42em] uppercase block mb-16"
          style={{ color: `${C.fg}66` }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          004 / The Person Behind the Work
        </motion.span>

        <motion.p
          className="font-display italic leading-[1.22] mb-16"
          style={{ fontSize: "clamp(1.48rem, 3.3vw, 2.9rem)", letterSpacing: "-0.02em", maxWidth: "52rem", color: C.fg }}
          initial={{ opacity: 0, y: 26 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.1, ease: E }}
        >
          "A great website should feel{" "}
          <em style={{ color: C.accent, fontStyle: "normal" }}>inevitable</em>{" "}
          — like nothing else could have looked quite this way for quite this brand."
        </motion.p>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 max-w-[52rem]"
          initial={{ opacity: 0, y: 22 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, delay: 0.28, ease: E }}
        >
          <p className="font-sans leading-[1.9]" style={{ fontSize: 15, color: `${C.fg}99`, fontWeight: 500 }}>
            I didn't start in an agency. I started with a blank screen, a lot of questions, and an
            obsessive need to understand why some websites stop you mid-scroll — and why others
            disappear the moment you close the tab.
          </p>
          <p className="font-sans leading-[1.9]" style={{ fontSize: 15, color: `${C.fg}88`, fontWeight: 500 }}>
            I work with couples building the first public face of their marriage, with founders
            launching something they've believed in for years, and with businesses who are tired of
            websites that look exactly like their competitors.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.5, ease: E }}
        >
          <div style={{ width: 24, height: 1, backgroundColor: `${C.fg}16` }} />
          <span className="font-display italic text-xl" style={{ color: `${C.fg}66` }}>
            Carlo
          </span>
        </motion.div>

        <motion.div
          className="flex gap-px mt-14 w-fit rounded-xl overflow-hidden"
          style={{ backgroundColor: `${C.fg}06` }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.6, ease: E }}
        >
          {[
            { n: "4–7", label: "Days avg. delivery" },
            { n: "100%", label: "Custom built" },
          ].map(({ n, label }) => (
            <div key={n} className="p-6" style={{ backgroundColor: C.bg }}>
              <p
                className="font-display italic"
                style={{ fontSize: "clamp(1.35rem, 2.8vw, 2.3rem)", letterSpacing: "-0.02em", color: C.accent }}
              >
                {n}
              </p>
              <p className="font-mono text-[7.5px] tracking-wider uppercase mt-1.5" style={{ color: `${C.fg}66` }}>
                {label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TESTIMONIALS
//  Receives manifestoBg → transitions its own backgroundColor
// ═══════════════════════════════════════════════════════════════

function Testimonials({ manifestoBg }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [active, setActive] = useState(0);
  const total = TESTIMONIALS.length;

  return (
    // ↓ FIX: transitions between warm surface and accent blue
    <section ref={ref} className="py-28 md:py-44 px-6 md:px-14" style={{ backgroundColor: manifestoBg ? C.accent : C.surface, transition: BG_TRANSITION }}>
      <div
        className="flex items-center justify-between pb-5 mb-16"
        style={{ borderBottom: `1px solid ${C.fg}07` }}
      >
        <motion.span
          className="font-mono text-[9px] tracking-[0.42em] uppercase"
          style={{ color: `${C.fg}66` }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          005 / Testimonials
        </motion.span>
        <motion.span
          className="font-mono text-[9px]"
          style={{ color: `${C.fg}55` }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.1 }}
        >
          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </motion.span>
      </div>

      <div className="max-w-[58rem]">
        <motion.span
          className="font-display italic block"
          style={{ fontSize: "clamp(4rem, 8vw, 7rem)", lineHeight: 0.75, marginBottom: "0.3rem", color: C.accent, opacity: 0.14 }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.14 } : {}}
          transition={{ duration: 0.5 }}
        >
          &ldquo;
        </motion.span>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.42, ease: E }}
          >
            <p
              className="font-display italic font-light leading-[1.62]"
              style={{ fontSize: "clamp(1.12rem, 2.5vw, 1.95rem)", letterSpacing: "-0.01em", color: C.fg }}
            >
              {TESTIMONIALS[active].quote}
            </p>

            <div className="flex items-center gap-4 mt-8">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${C.accent}10`, border: `1px solid ${C.accent}25` }}
              >
                <span className="font-mono text-[7px]" style={{ color: C.accent }}>
                  {TESTIMONIALS[active].name.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <div>
                <p className="font-sans text-[10px] tracking-wider" style={{ color: `${C.fg}CC`, fontWeight: 600 }}>
                  {TESTIMONIALS[active].name}
                </p>
                <p className="font-mono text-[8.5px] tracking-wider mt-0.5" style={{ color: `${C.fg}66` }}>
                  {TESTIMONIALS[active].role}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-2 mt-12">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Testimonial ${i + 1}`}
              style={{
                height: 1.5,
                width: i === active ? 36 : 12,
                backgroundColor: i === active ? C.accent : `${C.fg}20`,
                border: "none",
                borderRadius: 1,
                padding: 0,
                cursor: "pointer",
              }}
            />
          ))}
          <div className="ml-auto flex gap-5">
            {[
              { label: "← Prev", action: () => setActive((p) => (p - 1 + total) % total) },
              { label: "Next →", action: () => setActive((p) => (p + 1) % total) },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                className="font-mono text-[8px] tracking-[0.28em] uppercase"
                style={{ color: `${C.fg}66`, background: "none", border: "none", cursor: "pointer", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.color = `${C.fg}66`)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CONTACT
//  Receives manifestoBg → transitions its own backgroundColor
// ═══════════════════════════════════════════════════════════════

const ViberIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.28 2 11.5c0 2.19.75 4.2 2 5.78V22l4.5-2.25A10.3 10.3 0 0012 20.5c5.52 0 10-4.28 10-9.5S17.52 2 12 2z" />
    <path d="M9.5 10s.4-1.2 1.8-1.2c.9 0 1.5.6 1.7 1.1l.1.4c.1.7-.3 1.2-.9 1.5-.5.3-.7.9-.2 1.7.4.7 1.3 1.4 2 1.5" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);

function Contact({ manifestoBg }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [hovered, setHovered] = useState(null);

  const links = [
    { id: "01", label: "Viber",     handle: "@bycarlo", href: "viber://chat?number=%2Bbycarlo",  Icon: ViberIcon     },
    { id: "02", label: "Instagram", handle: "@bycarlo", href: "https://instagram.com/bycarlo",    Icon: InstagramIcon },
    { id: "03", label: "Facebook",  handle: "@bycarlo", href: "https://facebook.com/bycarlo",     Icon: FacebookIcon  },
  ];

  return (
    // ↓ FIX: transitions between warm bg and accent blue
    <section ref={ref} id="contact" className="py-28 md:py-44 px-6 md:px-14" style={{ backgroundColor: manifestoBg ? C.accent : C.bg, transition: BG_TRANSITION }}>
      <motion.span
        className="font-mono text-[9px] tracking-[0.42em] uppercase block mb-14"
        style={{ color: `${C.fg}55` }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        006 / Get in Touch
      </motion.span>

      <div className="overflow-hidden mb-20">
        <motion.h2
          className="font-display"
          style={{ fontSize: "clamp(3.4rem, 15vw, 16rem)", lineHeight: 0.85, letterSpacing: "-0.032em", fontStyle: "italic", color: C.fg }}
          initial={{ y: "108%" }}
          animate={inView ? { y: "0%" } : {}}
          transition={{ duration: 1.1, ease: E }}
        >
          Let&apos;s
          <br />
          <span style={{ color: C.accent }}>
            talk.
            <motion.span
              className="inline-block align-middle ml-1"
              style={{ width: "0.05em", height: "0.78em", backgroundColor: C.accent, display: "inline-block", verticalAlign: "middle" }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1.05, repeat: Infinity, ease: "linear" }}
            />
          </span>
        </motion.h2>
      </div>

      <div className="max-w-md">
        {links.map((link, i) => (
          <motion.a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-5 py-5"
            style={{ borderBottom: `1px solid ${C.fg}06` }}
            initial={{ opacity: 0, x: -14 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: i * 0.1 + 0.6, ease: E }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="font-mono text-[8px]" style={{ color: `${C.fg}55`, width: 20 }}>
              {link.id}
            </span>
            <motion.span
              className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
              animate={{
                backgroundColor: hovered === i ? `${C.accent}12` : "transparent",
                borderColor:     hovered === i ? `${C.accent}35` : `${C.fg}20`,
                color:           hovered === i ? C.accent : `${C.fg}66`,
              }}
              style={{ border: "1px solid", transition: "all 0.18s ease" }}
            >
              <link.Icon />
            </motion.span>
            <div className="flex-1">
              <span
                className="font-sans text-[9.5px] tracking-[0.26em] uppercase block font-semibold"
                style={{ color: hovered === i ? C.accent : `${C.fg}BB`, transition: "color 0.18s ease" }}
              >
                {link.label}
              </span>
              <span className="font-mono text-[8px] mt-0.5 block" style={{ color: `${C.fg}55` }}>
                {link.handle}
              </span>
            </div>
            <motion.span
              className="font-sans text-base"
              animate={{ opacity: hovered === i ? 1 : 0, x: hovered === i ? 0 : -8, color: C.accent }}
              transition={{ duration: 0.18 }}
            >
              →
            </motion.span>
          </motion.a>
        ))}
      </div>

      <motion.footer
        className="mt-24 pt-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
        style={{ borderTop: `1px solid ${C.fg}06` }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.3, duration: 0.85 }}
      >
        <span className="font-mono text-[7.5px] tracking-widest" style={{ color: `${C.fg}44` }}>
          byCarlo © {new Date().getFullYear()}
        </span>
        <span className="font-mono text-[7.5px] tracking-widest" style={{ color: `${C.fg}44` }}>
          Web Design Studio · Philippines
        </span>
      </motion.footer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ROOT PAGE
//
//  FIX SUMMARY — two issues resolved:
//
//  1. Page background not actually turning blue:
//     The old approach only changed html + body backgroundColor, but
//     every <section> has its own opaque backgroundColor inline style
//     that covers the body entirely. The body color was never visible.
//     Fix: pass manifestoBg as a prop to every section. Each section
//     now transitions its own backgroundColor between its normal color
//     and C.accent when the manifesto scrolls into view.
//
//  2. useEffect cleanup bug causing a flash:
//     The single combined useEffect ran cleanup (removing backgroundColor)
//     before setting the new color on every manifestoBg change. Split
//     into two effects: one that sets the transition on mount/unmount
//     only, and one that updates the color value without cleanup.
// ═══════════════════════════════════════════════════════════════

export default function Page() {
  const [manifestoBg, setManifestoBg] = useState(false);

  // ── Effect 1: set transition on html + body ONCE on mount ──
  // Cleans up fully only when the component unmounts.
  // This avoids the flash caused by clearing backgroundColor in cleanup
  // before the next render sets the new one.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.transition = BG_TRANSITION;
    body.style.transition = BG_TRANSITION;

    return () => {
      html.style.transition = "";
      html.style.backgroundColor = "";
      body.style.transition = "";
      body.style.backgroundColor = "";
    };
  }, []); // ← empty dep array: runs once on mount, cleans up on unmount

  // ── Effect 2: update html + body color whenever manifestoBg changes ──
  // No cleanup here — we don't want to clear the color between renders.
  // This covers overscroll bounce areas and the scrollbar track.
  useEffect(() => {
    const color = manifestoBg ? C.accent : C.bg;
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
  }, [manifestoBg]); // ← only runs when manifestoBg flips

  return (
    <>
      <Cursor />
      <main className="overflow-x-hidden">
        {/* Every section receives manifestoBg so it can transition its own background */}
        <Hero          manifestoBg={manifestoBg} />
        <Projects      manifestoBg={manifestoBg} />
        <Manifesto     onBgChange={setManifestoBg} />
        <Story         manifestoBg={manifestoBg} />
        <Testimonials  manifestoBg={manifestoBg} />
        <Contact       manifestoBg={manifestoBg} />
      </main>
    </>
  );
}