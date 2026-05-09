"use client";

// ═══════════════════════════════════════════════════════════════
//  byCarlo — Portfolio Website
//  All sections in a single file for easy editing.
//  Sections: Hero → Projects → Why byCarlo → Story → Testimonials → Contact
// ═══════════════════════════════════════════════════════════════

import { useRef, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";

// ─────────────────────────────────────────────
// DATA  ← edit everything here
// ─────────────────────────────────────────────

const PROJECTS = [
  {
    id: "01",
    title: "Vow & Verse",
    type: "Wedding Website",
    tags: ["Next.js", "Framer Motion", "Sanity CMS"],
    features: ["RSVP System", "Photo Gallery", "Countdown Timer"],
    accentHex: "#C8B89A",
    url: "#",
  },
  {
    id: "02",
    title: "Luminara",
    type: "Birthday Celebration",
    tags: ["React", "Tailwind CSS", "EmailJS"],
    features: ["Guest Registry", "Event Timeline", "Gift Wishlist"],
    accentHex: "#AFAFAF",
    url: "#",
  },
  {
    id: "03",
    title: "Nexus Corp",
    type: "Corporate Website",
    tags: ["Next.js", "TypeScript", "Vercel"],
    features: ["Team Directory", "Service Catalog", "Contact Hub"],
    accentHex: "#E0E0E0",
    url: "#",
  },
  {
    id: "04",
    title: "Folio & Co",
    type: "Business Portfolio",
    tags: ["Next.js", "Sanity CMS", "Analytics"],
    features: ["Case Studies", "Blog Engine", "Lead Capture"],
    accentHex: "#B8A898",
    url: "#",
  },
];

const TAGLINES = [
  "Shipped in days, not months.",
  "Built to convert, not just impress.",
  "Every pixel earns its place.",
  "Your story, designed with precision.",
  "No templates. No shortcuts. No compromise.",
];

const MARQUEE_ITEMS = [
  '"Delivered beyond what we briefed."',
  '"The most intentional designer we\'ve worked with."',
  '"Launched in a week. Clients loved it immediately."',
  '"Not just beautiful — it actually converts."',
  '"Carlo speaks design and business fluently."',
  '"We gave a mood board. He gave us a masterpiece."',
  '"Our bookings doubled the month we launched."',
];

const TESTIMONIALS = [
  {
    quote:
      "We handed Carlo a mood board and a deadline. He returned a website that felt like it cost ten times what we paid. Every detail — the typography, the transitions — felt considered.",
    name: "Sofia Reyes",
    role: "Bride, Vow & Verse",
  },
  {
    quote:
      "Most designers build websites. Carlo builds experiences. The difference is visible in the first three seconds a visitor lands on your page.",
    name: "Daniel Fonseca",
    role: "CEO, Nexus Corp",
  },
  {
    quote:
      "I was skeptical about the four-day timeline. Four days later I had a site I was genuinely proud to share with every client I've had since.",
    name: "Marco Torres",
    role: "Founder, Folio & Co",
  },
];

// ─────────────────────────────────────────────
// ANIMATION PRESETS
// ─────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: EASE },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};

// ─────────────────────────────────────────────
// HOOK: magnetic cursor pull
// ─────────────────────────────────────────────

function useMagnet(strength = 0.35) {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 12 });
  const sy = useSpring(my, { stiffness: 120, damping: 12 });

  const move = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - (r.left + r.width / 2)) * strength);
      my.set((e.clientY - (r.top + r.height / 2)) * strength);
    },
    [mx, my, strength]
  );

  const reset = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  return { ref, sx, sy, move, reset };
}

// ═══════════════════════════════════════════════════════════════
//  LOGO MARK  — geometric "bC" assembled via stroke animation
// ═══════════════════════════════════════════════════════════════

function LogoMark() {
  const draw = (delay) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: {
      pathLength: { delay, duration: 1.5, ease: "easeInOut" },
      opacity: { delay, duration: 0.01 },
    },
  });

  return (
    <svg
      width="88"
      height="88"
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="byCarlo logo"
    >
      {/* Ring */}
      <motion.circle cx="44" cy="44" r="40" stroke="white" strokeWidth="0.6" {...draw(0.3)} />

      {/* b — vertical stem */}
      <motion.line
        x1="26" y1="18" x2="26" y2="64"
        stroke="white" strokeWidth="1.5" strokeLinecap="round"
        {...draw(0.7)}
      />

      {/* b — rounded bowl */}
      <motion.path
        d="M26 43 C26 43 26 62 38.5 62 C51 62 51 51 51 47 C51 43 51 33 38.5 33 C26 33 26 43 26 43"
        stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"
        {...draw(1.1)}
      />

      {/* C — arc */}
      <motion.path
        d="M68 31 C61 20 49 20 45 26 C41 32 41 52 45 58 C49 64 61 64 68 53"
        stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"
        {...draw(1.55)}
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 1 — HERO
// ═══════════════════════════════════════════════════════════════

function Hero() {
  return (
    <section className="relative w-full h-svh min-h-[600px] bg-ink flex flex-col items-center justify-center overflow-hidden">
      {/* Subtle radial ambient light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 44%, rgba(255,255,255,0.028) 0%, transparent 70%)",
        }}
      />

      {/* Logo + wordmark */}
      <motion.div
        className="flex flex-col items-center gap-10"
        initial={{ opacity: 0, scale: 0.91 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: EASE, delay: 0.15 }}
      >
        <LogoMark />

        <motion.div
          className="text-center space-y-2.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4, duration: 0.9, ease: EASE }}
        >
          <p
            className="font-serif text-white font-light tracking-[0.24em] text-[1.6rem]"
          >
            byCarlo
          </p>
          <p className="font-sans text-[8.5px] text-mist tracking-[0.48em] uppercase">
            Web Design Studio
          </p>
        </motion.div>
      </motion.div>

      {/* Scroll indicator — thin line with travelling light dot */}
      <motion.div
        aria-hidden
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.1, duration: 1 }}
      >
        <div
          className="relative w-px h-14 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <motion.div
            className="absolute inset-x-0 top-0 h-full"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
              y: -56,
            }}
            animate={{ y: 56 }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeIn",
              repeatDelay: 0.7,
            }}
          />
        </div>
        <div className="w-1 h-1 rounded-full bg-white/25" />
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 2 — PROJECTS
// ═══════════════════════════════════════════════════════════════

// Desktop browser mockup
function DesktopMockup({ project }) {
  return (
    <div
      className="w-full rounded-md overflow-hidden"
      style={{
        background: "#0f0f0f",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 20px 70px rgba(0,0,0,0.65)",
      }}
    >
      {/* Browser chrome bar */}
      <div
        className="flex items-center gap-1.5 px-3 py-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        {[0.09, 0.06, 0.04].map((op, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: `rgba(255,255,255,${op})` }}
          />
        ))}
        <div
          className="flex-1 mx-3 h-3.5 rounded-sm flex items-center px-2"
          style={{ background: "rgba(255,255,255,0.035)" }}
        >
          <span className="font-sans text-[5.5px] text-white/15 tracking-wider">
            bycarlo.design/{project.title.toLowerCase().replace(/ /g, "-").replace(/&/g, "and")}
          </span>
        </div>
      </div>

      {/* Screen contents — abstract site layout */}
      <div className="p-5 h-52 flex flex-col gap-3 relative overflow-hidden">
        {/* Color accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            background: `radial-gradient(ellipse 60% 70% at 25% 35%, ${project.accentHex}, transparent 60%)`,
          }}
        />

        {/* Hero section sim */}
        <div
          className="h-[4.5rem] rounded flex items-center justify-center relative"
          style={{ border: "1px solid rgba(255,255,255,0.055)" }}
        >
          <p className="font-serif text-[10px] text-white/35 tracking-[0.28em] uppercase">
            {project.type}
          </p>
        </div>

        {/* Two column content */}
        <div className="flex gap-2 flex-1">
          {[0.025, 0.018].map((op, i) => (
            <div
              key={i}
              className="flex-1 rounded"
              style={{
                background: `rgba(255,255,255,${op})`,
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            />
          ))}
        </div>

        {/* Text skeleton */}
        <div className="space-y-1.5">
          <div className="h-1 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="h-1 rounded-full w-1/2" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>
    </div>
  );
}

// Mobile phone mockup (overlaid top-right)
function PhoneMockup({ project }) {
  return (
    <div
      className="rounded-[1.35rem] overflow-hidden"
      style={{
        width: 70,
        height: 124,
        background: "#0c0c0c",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.75)",
      }}
    >
      {/* Pill notch */}
      <div className="flex justify-center pt-2">
        <div className="w-8 h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.09)" }} />
      </div>

      {/* Screen */}
      <div className="px-2 mt-2 flex flex-col gap-1.5">
        <div
          className="h-[3.5rem] rounded-lg relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.055)",
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${project.accentHex}, transparent 65%)`,
            }}
          />
        </div>
        <div className="h-[3px] rounded-full w-full" style={{ background: "rgba(255,255,255,0.1)" }} />
        <div className="h-[3px] rounded-full w-2/3" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
    </div>
  );
}

function ProjectCard({ project, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-8%" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 52 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.95, delay: (index % 2) * 0.08, ease: EASE }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Mockup stack — desktop with phone overlaid */}
      <div className="relative pb-4 pr-3">
        <DesktopMockup project={project} />
        <div className="absolute -top-3 right-0">
          <PhoneMockup project={project} />
        </div>
      </div>

      {/* Project title row */}
      <div className="flex items-start justify-between mt-4 pr-1">
        <div>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="font-sans text-[8px] text-mist tracking-widest tabular-nums">
              {project.id}
            </span>
            <motion.h3
              className="font-serif text-[1.35rem] text-white font-light"
              animate={{ y: hovered ? -3 : 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {project.title}
            </motion.h3>
          </div>
          <p className="font-sans text-[9px] text-mist tracking-[0.22em] uppercase ml-7">
            {project.type}
          </p>
        </div>

        <motion.a
          href={project.url}
          className="font-sans text-[9px] text-white tracking-[0.25em] uppercase mt-1 shrink-0"
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 6 }}
          transition={{ duration: 0.2 }}
        >
          Visit →
        </motion.a>
      </div>

      {/* Tags & features — fade in on hover (opacity + translateY only) */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="mt-4 ml-7 flex flex-wrap gap-2"
          >
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="font-sans text-[8px] px-2 py-0.5 text-mist tracking-wider uppercase"
                style={{ border: "1px solid rgba(154,154,154,0.3)" }}
              >
                {tag}
              </span>
            ))}
            {project.features.map((f) => (
              <span key={f} className="font-sans text-[8px] text-mist/60 tracking-wider self-center">
                · {f}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rule */}
      <div
        className="mt-6 h-px"
        style={{ background: "rgba(255,255,255,0.07)" }}
      />
    </motion.article>
  );
}

function Projects() {
  const headRef = useRef(null);
  const inView = useInView(headRef, { once: true, margin: "-15%" });

  return (
    <section className="bg-ink py-32 px-6 md:px-16 lg:px-24">
      {/* Section header */}
      <motion.div
        ref={headRef}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={stagger}
        className="mb-24"
      >
        <motion.p variants={fadeUp} className="font-sans text-[8.5px] text-mist tracking-[0.48em] uppercase mb-5">
          Selected Work
        </motion.p>
        <motion.h2
          variants={fadeUp}
          className="font-serif text-5xl sm:text-6xl lg:text-[5.5rem] xl:text-[6.5rem] text-white leading-[0.9] tracking-tight"
        >
          Projects
        </motion.h2>
      </motion.div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-20 gap-x-14 lg:gap-x-20">
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 3 — WHY BYCARLO
// ═══════════════════════════════════════════════════════════════

function WhyCarlo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section ref={ref} className="bg-paper py-32 px-6 md:px-16 lg:px-24">
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="font-sans text-[8.5px] text-mist tracking-[0.48em] uppercase mb-20"
      >
        Why byCarlo
      </motion.p>

      <div>
        {TAGLINES.map((line, i) => (
          // overflow-hidden + translateY = pure GPU composited reveal
          <div
            key={i}
            className="overflow-hidden"
            style={{ borderBottom: "1px solid rgba(10,10,10,0.08)" }}
          >
            <motion.div
              initial={{ y: "105%", opacity: 0 }}
              animate={inView ? { y: "0%", opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.08 + i * 0.1, ease: EASE }}
              className="py-6 flex items-baseline gap-5"
            >
              <span className="font-sans text-[8px] text-mist tracking-widest tabular-nums shrink-0 w-5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] text-ink leading-[1.04] tracking-tight">
                {line}
              </p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 4 — PERSONAL STORY
// ═══════════════════════════════════════════════════════════════

function Story() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [24, -24]);

  return (
    <section ref={ref} className="relative bg-ink py-32 overflow-hidden">
      {/* Parallax grain texture */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{ y: bgY }}
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='t'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23t)' fill='white'/%3E%3C/svg%3E\")",
          }}
        />
      </motion.div>

      <div className="relative max-w-[42rem] mx-auto px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="font-sans text-[8.5px] text-mist tracking-[0.48em] uppercase mb-16"
        >
          The Person Behind the Work
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.95, delay: 0.15, ease: EASE }}
          className="space-y-7"
        >
          {/* Drop-cap paragraph */}
          <p className="font-sans text-white/72 text-[15px] leading-[1.95]">
            <span
              aria-hidden
              className="float-left font-serif text-[5.8rem] leading-[0.75] text-white mr-3 mt-2 select-none"
            >
              I
            </span>
            didn't start in an agency. I started with a blank screen, a lot of questions, and an obsessive need to understand why some websites stop you mid-scroll — and why others disappear the moment you close the tab.
          </p>

          <p className="font-sans text-white/68 text-[15px] leading-[1.95]">
            byCarlo was built on a simple belief: that a great website should feel inevitable — like nothing else could have looked quite this way for quite this brand. Not assembled. Not templated. Crafted from first principles, every single time.
          </p>

          <p className="font-sans text-white/68 text-[15px] leading-[1.95]">
            I work with couples building the first public face of their marriage, with founders launching something they've believed in for years, and with businesses who are tired of websites that look exactly like their competitors. What connects them is the same instinct I started with — that detail matters. That intention shows.
          </p>

          <p className="font-sans text-white/38 text-[13.5px] leading-[1.9] italic">
            The right website is never just a deliverable. It's an argument for why you deserve to be taken seriously.
          </p>
        </motion.div>

        {/* Signature */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
          className="mt-14 flex items-center gap-4"
        >
          <div className="h-px w-8" style={{ background: "rgba(154,154,154,0.45)" }} />
          <span className="font-serif text-white/75 text-xl italic font-light">Carlo</span>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 5 — TESTIMONIALS
// ═══════════════════════════════════════════════════════════════

function MarqueeStrip() {
  const [paused, setPaused] = useState(false);
  // Double the items for seamless infinite loop
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div
      className="overflow-hidden py-5 select-none cursor-default"
      style={{
        borderTop: "1px solid rgba(10,10,10,0.09)",
        borderBottom: "1px solid rgba(10,10,10,0.09)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex gap-10 whitespace-nowrap will-change-transform"
        style={{
          animation: "marquee 32s linear infinite",
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {doubled.map((q, i) => (
          <span key={i} className="font-sans text-[12.5px] text-mist shrink-0">
            {q}
            <span className="mx-5" style={{ color: "rgba(10,10,10,0.14)" }}>
              ◆
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section className="bg-paper py-32">
      <MarqueeStrip />

      <div ref={ref} className="mt-24 px-6 md:px-16 lg:px-24">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          className="font-sans text-[8.5px] text-mist tracking-[0.48em] uppercase mb-16"
        >
          What Clients Say
        </motion.p>

        {/* Staggered editorial layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 items-start">
          {TESTIMONIALS.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.88, delay: i * 0.14, ease: EASE }}
              style={{ marginTop: i === 1 ? 44 : 0 }}
            >
              <p className="font-serif text-[1.13rem] leading-[1.8] text-ink mb-8">
                "{t.quote}"
              </p>
              <footer className="flex items-center gap-4">
                <div className="h-px w-6 bg-mist shrink-0" />
                <div>
                  <p className="font-sans text-[9.5px] text-ink tracking-wider">{t.name}</p>
                  <p className="font-sans text-[8.5px] text-mist tracking-wider mt-0.5">{t.role}</p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 6 — CONTACT
// ═══════════════════════════════════════════════════════════════

// Line-drawn SVG icons (no FontAwesome, no icon libraries)
const ViberIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.28 2 11.5c0 2.19.75 4.2 2 5.78V22l4.5-2.25A10.3 10.3 0 0012 20.5c5.52 0 10-4.28 10-9.5S17.52 2 12 2z" />
    <path d="M9.5 10s.4-1.2 1.8-1.2c.9 0 1.5.6 1.7 1.1l.1.4c.1.7-.3 1.2-.9 1.5-.5.3-.7.9-.2 1.7.4.7 1.3 1.4 2 1.5" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);

function SocialLink({ href, label, Icon }) {
  const { ref, sx, sy, move, reset } = useMagnet(0.42);
  const [hov, setHov] = useState(false);

  return (
    <motion.a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4"
      style={{ x: sx, y: sy }}
      onMouseMove={move}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { reset(); setHov(false); }}
    >
      {/* Icon circle — fills on hover */}
      <motion.span
        className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
        animate={{
          backgroundColor: hov ? "#FFFFFF" : "rgba(255,255,255,0)",
          borderColor: hov ? "#FFFFFF" : "rgba(255,255,255,0.18)",
        }}
        style={{ border: "1px solid" }}
        transition={{ duration: 0.22 }}
      >
        <motion.span
          animate={{ color: hov ? "#0A0A0A" : "#9A9A9A" }}
          transition={{ duration: 0.22 }}
        >
          <Icon />
        </motion.span>
      </motion.span>

      {/* Label slides in */}
      <motion.span
        className="font-sans text-[9px] tracking-[0.3em] uppercase text-mist"
        animate={{ opacity: hov ? 1 : 0, x: hov ? 0 : -10 }}
        transition={{ duration: 0.22 }}
      >
        {label}
      </motion.span>
    </motion.a>
  );
}

function Contact() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section ref={ref} className="bg-ink py-36 md:py-48 px-6 md:px-16 lg:px-24">
      <motion.div
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={stagger}
      >
        <motion.p
          variants={fadeUp}
          className="font-sans text-[8.5px] text-mist tracking-[0.48em] uppercase mb-8"
        >
          Get in touch
        </motion.p>

        {/* Giant typographic CTA */}
        <motion.h2
          variants={fadeUp}
          className="font-serif text-5xl sm:text-7xl lg:text-[7rem] xl:text-[8.5rem] text-white leading-[0.9] tracking-tight mb-16"
        >
          Let's build
          <br />
          <em className="not-italic text-mist">something.</em>
        </motion.h2>

        {/* Social links with magnetic effect */}
        <motion.div variants={fadeUp} className="flex flex-col gap-5 mt-14">
          <SocialLink href="viber://chat?number=%2Bbycarlo" label="@bycarlo on Viber" Icon={ViberIcon} />
          <SocialLink href="https://instagram.com/bycarlo" label="@bycarlo on Instagram" Icon={InstagramIcon} />
          <SocialLink href="https://facebook.com/bycarlo" label="@bycarlo on Facebook" Icon={FacebookIcon} />
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="mt-32 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span className="font-sans text-[8.5px] text-mist/60 tracking-widest">
          byCarlo © {new Date().getFullYear()}
        </span>
        <span className="font-sans text-[8.5px] text-mist/60 tracking-widest">
          Web Design Studio · Philippines
        </span>
      </motion.footer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ROOT PAGE
// ═══════════════════════════════════════════════════════════════

export default function Page() {
  return (
    <main className="overflow-x-hidden">
      <Hero />
      <Projects />
      <WhyCarlo />
      <Story />
      <Testimonials />
      <Contact />
    </main>
  );
}
