#!/usr/bin/env node
// Adds a first-load intro: a white panel slides up, then a #CC3419 panel slides up.
//
// Usage (run from the project root, commit first so you can review with git diff):
//   node add-intro-animation.mjs --dry-run   (shows what would change, writes nothing)
//   node add-intro-animation.mjs             (applies the patch)
//
// Supports: Next.js app router, Next.js pages router, and any project with an
// index.html (plain HTML, Vite, CRA). Safe to re-run: it skips if already patched.

import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry-run");
const ROOT = process.cwd();

// ---- tweak these ----
const RED = "#CC3419";
const SLIDE_MS = 900;
const WHITE_DELAY_MS = 500;
const RED_DELAY_MS = 1000;
const EASE = "cubic-bezier(.76,0,.24,1)";
// ---------------------

const CSS = [
  ".intro-overlay{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;pointer-events:none;overflow:hidden}",
  ".intro-overlay>div{position:absolute;top:0;right:0;bottom:0;left:0;will-change:transform}",
  `.intro-red{background:${RED};animation:intro-up ${SLIDE_MS}ms ${EASE} ${RED_DELAY_MS}ms forwards}`,
  `.intro-white{background:#ffffff;animation:intro-up ${SLIDE_MS}ms ${EASE} ${WHITE_DELAY_MS}ms forwards}`,
  "@keyframes intro-up{from{transform:translateY(0)}to{transform:translateY(-101%)}}",
  "@media (prefers-reduced-motion:reduce){.intro-overlay{display:none}}",
].join("\n");

const COMPONENT = [
  '"use client";',
  "",
  'import { useState } from "react";',
  "",
  `const CSS = ${JSON.stringify(CSS)};`,
  "",
  "export default function IntroAnimation() {",
  "  const [done, setDone] = useState(false);",
  "  if (done) return null;",
  "  return (",
  '    <div className="intro-overlay" aria-hidden="true">',
  "      <style dangerouslySetInnerHTML={{ __html: CSS }} />",
  '      <div className="intro-red" onAnimationEnd={() => setDone(true)} />',
  '      <div className="intro-white" />',
  "    </div>",
  "  );",
  "}",
  "",
].join("\n");

const HTML_STYLE = `<style id="intro-overlay-style">\n${CSS}\n</style>`;
const HTML_MARKUP = [
  "<!-- intro-overlay:start -->",
  '<div id="intro-overlay" class="intro-overlay" aria-hidden="true"><div class="intro-red"></div><div class="intro-white"></div></div>',
  "<script>(function(){var r=document.querySelector('#intro-overlay .intro-red');if(!r)return;r.addEventListener('animationend',function(){var o=document.getElementById('intro-overlay');if(o&&o.parentNode)o.parentNode.removeChild(o);});})();</script>",
  "<!-- intro-overlay:end -->",
].join("\n");

// ---------- helpers ----------
const abs = (p) => path.join(ROOT, p);
const exists = (p) => fs.existsSync(abs(p));
const firstExisting = (list) => list.find(exists);
const read = (p) => fs.readFileSync(abs(p), "utf8");

function write(p, content) {
  console.log(`${DRY ? "[dry-run] would write" : "wrote"}  ${p}`);
  if (DRY) return;
  fs.mkdirSync(path.dirname(abs(p)), { recursive: true });
  fs.writeFileSync(abs(p), content);
}

function relImport(fromFile, toFileNoExt) {
  let rel = path
    .relative(path.dirname(abs(fromFile)), abs(toFileNoExt))
    .split(path.sep)
    .join("/");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel;
}

function addImport(src, line) {
  const re = /^import\s+(?:[^;]*?\s+from\s+)?["'][^"']+["'];?[ \t]*$/gm;
  let last = null;
  let m;
  while ((m = re.exec(src))) last = m;
  if (last) {
    const i = last.index + last[0].length;
    return src.slice(0, i) + "\n" + line + src.slice(i);
  }
  const directive = src.match(/^\s*["']use (?:client|server)["'];?[ \t]*\n/);
  if (directive) {
    const i = directive[0].length;
    return src.slice(0, i) + line + "\n" + src.slice(i);
  }
  return line + "\n" + src;
}

function fail(msg) {
  console.error("\nCould not patch automatically: " + msg);
  console.error("Send me the file named above and I'll write the exact edit.");
  process.exit(1);
}

// ---------- patchers ----------
function patchNextApp(layout) {
  const src = read(layout);
  if (src.includes("IntroAnimation")) return console.log(`${layout} already patched, skipping.`);

  const body = /<body[^>]*>/.exec(src);
  if (!body) fail(`no <body> tag found in ${layout}`);

  const ext = path.extname(layout) === ".tsx" ? ".tsx" : ".jsx";
  const compBase = path.posix.join(path.posix.dirname(layout), "IntroAnimation");
  write(compBase + ext, COMPONENT);

  const at = body.index + body[0].length;
  let out = src.slice(0, at) + "\n        <IntroAnimation />" + src.slice(at);
  out = addImport(out, `import IntroAnimation from "${relImport(layout, compBase)}";`);
  write(layout, out);
}

function patchNextPages(appFile) {
  const src = read(appFile);
  if (src.includes("IntroAnimation")) return console.log(`${appFile} already patched, skipping.`);

  const re = /<Component\s+\{\.\.\.pageProps\}\s*\/>/;
  if (!re.test(src)) fail(`could not find <Component {...pageProps} /> in ${appFile}`);

  const ext = path.extname(appFile) === ".tsx" ? ".tsx" : ".jsx";
  const base = appFile.startsWith("src/") ? "src/components" : "components";
  const compBase = path.posix.join(base, "IntroAnimation");
  write(compBase + ext, COMPONENT);

  let out = src.replace(re, (m) => `<>\n      <IntroAnimation />\n      ${m}\n    </>`);
  out = addImport(out, `import IntroAnimation from "${relImport(appFile, compBase)}";`);
  write(appFile, out);
}

function patchHtml(file) {
  const src = read(file);
  if (src.includes("intro-overlay")) return console.log(`${file} already patched, skipping.`);

  const head = /<\/head>/i.exec(src);
  const body = /<body[^>]*>/i.exec(src);
  if (!head || !body) fail(`${file} needs both </head> and <body> tags`);

  let out = src.slice(0, head.index) + HTML_STYLE + "\n" + src.slice(head.index);
  const b = /<body[^>]*>/i.exec(out);
  const at = b.index + b[0].length;
  out = out.slice(0, at) + "\n" + HTML_MARKUP + "\n" + out.slice(at);
  write(file, out);
}

// ---------- detect and run ----------
const appLayout = firstExisting([
  "app/layout.tsx", "app/layout.jsx", "app/layout.js",
  "src/app/layout.tsx", "src/app/layout.jsx", "src/app/layout.js",
]);
const pagesApp = firstExisting([
  "pages/_app.tsx", "pages/_app.jsx", "pages/_app.js",
  "src/pages/_app.tsx", "src/pages/_app.jsx", "src/pages/_app.js",
]);
const htmlFile = firstExisting(["index.html", "public/index.html"]);

console.log(DRY ? "Dry run, no files will be changed.\n" : "");

if (appLayout) {
  console.log(`Detected Next.js app router: ${appLayout}`);
  patchNextApp(appLayout);
} else if (pagesApp) {
  console.log(`Detected Next.js pages router: ${pagesApp}`);
  patchNextPages(pagesApp);
} else if (htmlFile) {
  console.log(`Detected HTML entry: ${htmlFile}`);
  patchHtml(htmlFile);
} else {
  fail("no app/layout, pages/_app, or index.html found. Run this from the project root.");
}

console.log("\nDone. Run your dev server and hard refresh to see it. Review changes with: git diff");
