// patch-tech-stack.mjs
// byCarlo: adds a "Tech Stack" section between Projects and Manifesto.
//   - pill-style category tabs (Frontend / Backend / Database / Security / Deploy / Dev tools)
//     with a sliding thumb, built in the spirit of RubberSegment but inline + theme-aware
//   - counter ("02 / 06") + short progress bar under the tabs
//   - responsive logo grid for the active category (edit TECH_CATEGORIES below)
//   - fully wired to themeProgress like every other section (dark/light aware)
//
// Run from the project root:   node patch-tech-stack.mjs
// Then:                        npm run dev   ->   git add . && git commit -m "Tech stack section" && git push
// A backup of the changed file goes into .patch-backups/

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app", "page.js");

if (!fs.existsSync(pagePath)) {
  console.error("Cannot find " + pagePath + "\nRun this script from the bycarlo-portfolio root folder.");
  process.exit(1);
}

const read = (p) => {
  const raw = fs.readFileSync(p, "utf8");
  return { text: raw.replace(/\r\n/g, "\n"), crlf: raw.includes("\r\n") };
};
const save = (p, f) => fs.writeFileSync(p, f.crlf ? f.text.replace(/\n/g, "\r\n") : f.text, "utf8");
const fail = (msg) => { console.error("Patch aborted, nothing was written.\n" + msg); process.exit(1); };

const page = read(pagePath);

if (page.text.includes("function TechStack(")) {
  console.log("Tech stack section is already applied. Nothing to do.");
  process.exit(0);
}

/* helpers ---------------------------------------------------------------- */
const count = (t, s) => t.split(s).length - 1;
const sliceInsertBefore = (t, marker, insertion, label) => {
  const i = t.indexOf(marker);
  if (i < 0) fail("Could not locate insertion point: " + label);
  return t.slice(0, i) + insertion + "\n" + t.slice(i);
};
const replaceOnce = (t, find, rep, label) => {
  const n = count(t, find);
  if (n !== 1) fail("Expected exactly 1 match for " + label + ", found " + n + ". Did page.js change since this patch was written?");
  return t.split(find).join(rep);
};

/* ======================================================================= */
/* 1. Edit this data to match your real stack                              */
/* ======================================================================= */

const TECH_DATA_BLOCK = `
/* ── Tech stack data (edit logos/labels here) ─────── */
const TECH_CATEGORIES = [
  {
    label: "Frontend",
    tools: [
      { name: "React", icon: "/png/tech/react.png" },
      { name: "Next.js", icon: "/png/tech/nextjs.png" },
      { name: "TypeScript", icon: "/png/tech/typescript.png" },
      { name: "Tailwind", icon: "/png/tech/tailwind.png" },
    ],
  },
  {
    label: "Backend",
    tools: [
      { name: "Node.js", icon: "/png/tech/nodejs.png" },
      { name: "Express", icon: "/png/tech/express.png" },
      { name: "GraphQL", icon: "/png/tech/graphql.png" },
      { name: "Python", icon: "/png/tech/python.png" },
      { name: "Postman", icon: "/png/tech/postman.png" },
    ],
  },
  {
    label: "Database",
    tools: [
      { name: "PostgreSQL", icon: "/png/tech/postgresql.png" },
      { name: "MongoDB", icon: "/png/tech/mongodb.png" },
      { name: "Cloudflare D1", icon: "/png/tech/cloudflare.png" },
    ],
  },
  {
    label: "Security",
    tools: [
      { name: "JWT", icon: "/png/tech/jwt.png" },
      { name: "OAuth", icon: "/png/tech/oauth.png" },
    ],
  },
  {
    label: "Deploy",
    tools: [
      { name: "Cloudflare", icon: "/png/tech/cloudflare.png" },
      { name: "Vercel", icon: "/png/tech/vercel.png" },
      { name: "Docker", icon: "/png/tech/docker.png" },
    ],
  },
  {
    label: "Dev tools",
    tools: [
      { name: "Git", icon: "/png/tech/git.png" },
      { name: "GitHub", icon: "/png/tech/github.png" },
      { name: "VS Code", icon: "/png/tech/vscode.png" },
      { name: "ESLint", icon: "/png/tech/eslint.png" },
      { name: "Jest", icon: "/png/tech/jest.png" },
      { name: "npm", icon: "/png/tech/npm.png" },
    ],
  },
];
`;

/* ======================================================================= */
/* 2. The section component itself                                         */
/* ======================================================================= */

const TECH_STACK_COMPONENT = `
/* ── Tech Stack (theme-aware, transparent background) ─ */
function TechStack({ themeProgress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [active, setActive] = useState(0);
  const tabRefs = useRef([]);
  const trackRef = useRef(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0 });

  const textColor = useTransform(themeProgress, [0, 1], [DARK.text, LIGHT.text]);
  const mutedColor = useTransform(themeProgress, [0, 1], [DARK.muted, LIGHT.muted]);
  const accentColor = useTransform(themeProgress, [0, 1], [DARK.accent, LIGHT.accent]);
  const borderColor = useTransform(themeProgress, [0, 1], [DARK.border, LIGHT.border]);
  const trackBg = useTransform(themeProgress, [0, 1], ["rgba(255,255,255,0.06)", "rgba(0,0,0,0.04)"]);
  const thumbBg = useTransform(themeProgress, [0, 1], [DARK.bg, LIGHT.bg]);

  const measure = useCallback(() => {
    const el = tabRefs.current[active];
    const track = trackRef.current;
    if (!el || !track) return;
    const elRect = el.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    setThumb({ left: elRect.left - trackRect.left, width: elRect.width });
  }, [active]);

  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const total = TECH_CATEGORIES.length;
  const current = TECH_CATEGORIES[active];
  const progress = total > 1 ? (active / (total - 1)) * 100 : 100;

  return (
    <motion.section ref={ref} id="stack" className="relative py-28 md:py-44 px-6 md:px-14 theme-section">
      <div className="max-w-xl mx-auto text-center">
        <motion.span
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.4em] uppercase mb-4"
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
          ref={trackRef}
          role="tablist"
          aria-label="Tech stack category"
          className="relative inline-flex flex-wrap justify-center gap-1 p-1 rounded-2xl mb-8"
          style={{ background: trackBg }}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, ease: E }}
        >
          <motion.span
            className="absolute top-1 bottom-1 rounded-xl"
            style={{ background: thumbBg, left: thumb.left, width: thumb.width }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
          />
          {TECH_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              ref={(el) => { tabRefs.current[i] = el; }}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className="relative z-10 px-4 py-2 text-[12px] md:text-[13px] font-medium rounded-xl transition-colors whitespace-nowrap"
              style={{ color: i === active ? textColor.get() : mutedColor.get() }}
            >
              {cat.label}
            </button>
          ))}
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
        <p className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: mutedColor.get() }}>
          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
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
          className="grid grid-cols-3 gap-x-4 gap-y-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: E }}
        >
          {current.tools.map((tool) => (
            <div key={tool.name} className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 flex items-center justify-center rounded-2xl border"
                style={{ borderColor: borderColor.get() }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tool.icon} alt="" className="w-6 h-6 object-contain" loading="lazy" />
              </div>
              <span className="text-[11px] font-medium" style={{ color: mutedColor.get() }}>{tool.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
`;

/* ======================================================================= */
/* 3. Apply                                                                 */
/* ======================================================================= */

let text = page.text;

// Insert the data block + component right before Manifesto's definition.
const MANIFESTO_MARKER = "/* ── Manifesto (transparent background) ──────────── */";
text = sliceInsertBefore(text, MANIFESTO_MARKER, TECH_DATA_BLOCK + TECH_STACK_COMPONENT, "Manifesto section marker");

// Render <TechStack /> between <Projects ... /> and <Manifesto ... /> in Page().
const PROJECTS_JSX =
  '<Projects globalProgress={globalProgress} themeProgress={themeProgress} isMobile={isMobile} />';
text = replaceOnce(
  text,
  PROJECTS_JSX,
  PROJECTS_JSX + '\n        <TechStack themeProgress={themeProgress} />',
  "Projects JSX in Page()"
);

/* ======================================================================= */
/* 4. Write out                                                            */
/* ======================================================================= */

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(pagePath, path.join(backupDir, "page.js." + Date.now() + ".bak"));

save(pagePath, { text, crlf: page.crlf });

console.log("Tech stack section added to app/page.js (backup saved in .patch-backups/).");
console.log("");
console.log("Next steps:");
console.log("  1. Add your logo PNGs/SVGs to public/png/tech/ (react.png, nodejs.png, etc.)");
console.log("     — or edit the TECH_CATEGORIES icon paths in page.js to point at files you already have.");
console.log('  2. npm run dev   and check the "stack" section between Projects and Manifesto.');
console.log('  3. git add . && git commit -m "Add tech stack section" && git push');
