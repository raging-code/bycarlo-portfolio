#!/usr/bin/env node
// remove-contact-threads.mjs
//
// Removes the animated "threads" ribbon canvas background from the
// Contact section (app/ContactMorphSection.js), leaving the liquid-morph
// heading, copy, and ct-glow-free background untouched.
//
// What it does:
//   1. Deletes the initThreads(...) function entirely.
//   2. Removes the stopThreads() call/wiring in the component's useEffect.
//   3. Removes the <div className="ct-threads"> ... </div> JSX block
//      (which contained ct-glow + the canvas).
//   4. Strips the now-unused .ct-threads / .ct-glow / canvas CSS rules.
//
// Usage:
//   node remove-contact-threads.mjs [path-to-repo-root]
//
// A timestamped backup of any file it touches is written to
// .patch-backup/<label>/<original-relative-path> before editing.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(process.argv[2] || __dirname);
const targetRel = "app/ContactMorphSection.js";
const targetPath = join(repoRoot, targetRel);

function backup(label, relPath, content) {
  const dir = join(repoRoot, ".patch-backup", label, dirname(relPath));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, relPath.split("/").pop()), content, "utf8");
}

function fail(msg) {
  console.error("✖ " + msg);
  process.exit(1);
}

if (!existsSync(targetPath)) {
  fail(`Could not find ${targetRel} under ${repoRoot}`);
}

let src = readFileSync(targetPath, "utf8");
const original = src;
const label = `remove-contact-threads-${new Date().toISOString().replace(/[:.]/g, "-")}`;

let changed = 0;

/* 1. Remove the initThreads function block entirely (comment header included) */
{
  const start = src.indexOf("/* ------------------------------------------------------------------ */\n/*  Ribbon threads canvas                                              */\n/* ------------------------------------------------------------------ */\nfunction initThreads(root) {");
  if (start === -1) {
    fail("Could not locate initThreads() function header — file may have changed.");
  }
  // Find the matching closing brace for "function initThreads(root) {" by
  // brace-counting from the function's opening brace.
  const fnOpenMarker = "function initThreads(root) {";
  const fnOpenIdx = src.indexOf(fnOpenMarker, start);
  let i = fnOpenIdx + fnOpenMarker.length;
  let depth = 1;
  while (depth > 0 && i < src.length) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  if (depth !== 0) fail("Brace matching for initThreads() failed — file may have changed.");
  // consume a trailing newline after the closing brace, and the blank line(s) before "export default"
  let end = i;
  while (src[end] === "\n") end++;
  src = src.slice(0, start) + src.slice(end);
  changed++;
}

/* 2. Remove stopThreads wiring inside the component's useEffect */
{
  const before = src;
  src = src.replace(
    /\s*const stopThreads = initThreads\(root\);\n/,
    "\n"
  );
  src = src.replace(
    /\s*stopThreads\(\);\n/,
    "\n"
  );
  if (src === before) fail("Could not find stopThreads() wiring — file may have changed.");
  changed++;
}

/* 3. Remove the <div className="ct-threads"> ... </div> JSX block */
{
  const blockRe = /\n\s*<div className="ct-threads"[\s\S]*?<\/div>\n/;
  const before = src;
  src = src.replace(blockRe, "\n");
  if (src === before) fail("Could not find the ct-threads JSX block — file may have changed.");
  changed++;
}

/* 4. Strip the now-unused CSS rules (.ct-threads, .ct-glow, canvas mask) */
{
  const cssLines = [
    '  ".ct-root .ct-threads{position:absolute;inset:0;z-index:0;pointer-events:none}",\n',
    '  ".ct-root .ct-glow{position:absolute;inset:0;background:radial-gradient(48% 55% at 50% 58%,rgba(224,43,32,.09),rgba(224,43,32,0) 70%),radial-gradient(34% 40% at 72% 52%,rgba(201,166,107,.15),rgba(201,166,107,0) 72%)}",\n',
    '  ".ct-root .ct-threads canvas{position:absolute;inset:0;width:100%;height:100%;display:block;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 22%,#000 82%,transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 22%,#000 82%,transparent 100%)}",\n',
  ];
  let removedCss = 0;
  for (const line of cssLines) {
    if (src.includes(line)) {
      src = src.replace(line, "");
      removedCss++;
    }
  }
  if (removedCss === 0) fail("Could not find the .ct-threads/.ct-glow CSS rules — file may have changed.");
  changed++;
}

if (changed < 4) {
  fail("Not all expected edits were applied — aborting without writing.");
}

backup(label, targetRel, original);
writeFileSync(targetPath, src, "utf8");

console.log(`✔ Removed the threads ribbon background from ${targetRel}`);
console.log(`  Backup of the original saved to .patch-backup/${label}/${targetRel}`);
