#!/usr/bin/env node
/**
 * apply-patch.mjs
 *
 * Applies the scroll-glitch fix to app/Threads.jsx and app/page.js
 * without needing `git apply` or `patch`. Run from the repo root:
 *
 *   node apply-patch.mjs
 *
 * What it does:
 *  - app/Threads.jsx: guards resize() against redundant GPU texture
 *    reallocation, and batches the ResizeObserver callback through
 *    requestAnimationFrame so it can't race the draw loop mid-scroll.
 *  - app/page.js: switches the Hero section from `min-h-screen` to
 *    `min-h-svh` so its height stays stable while the mobile browser
 *    chrome shows/hides during scroll (stops the resize storm at the
 *    source).
 *
 * Safe to re-run: each edit is skipped if already applied, and the
 * script errors out (without writing anything) if the expected
 * original text isn't found, so it won't silently corrupt a file
 * that has diverged.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const files = {
  threads: resolve('app/Threads.jsx'),
  page: resolve('app/page.js'),
};

for (const [key, path] of Object.entries(files)) {
  if (!existsSync(path)) {
    console.error(`✗ Could not find ${path}`);
    console.error('  Run this script from the root of the bycarlo-portfolio repo.');
    process.exit(1);
  }
}

/**
 * Apply one or more find/replace edits to a file.
 * Each edit is {find, replace, label}. If `find` isn't present but
 * `replace` already is, the edit is treated as already applied and
 * skipped. If neither is present, we bail loudly instead of guessing.
 */
function applyEdits(path, edits) {
  let source = readFileSync(path, 'utf8');
  let changed = false;

  for (const { find, replace, label } of edits) {
    if (source.includes(replace)) {
      console.log(`  • ${label}: already applied, skipping`);
      continue;
    }
    if (!source.includes(find)) {
      console.error(`✗ ${label}: expected original text not found in ${path}`);
      console.error('  The file may have changed since this patch was written.');
      console.error('  No changes were written to this file.');
      process.exit(1);
    }
    const count = source.split(find).length - 1;
    if (count > 1) {
      console.error(`✗ ${label}: match is not unique (${count} occurrences) in ${path}`);
      console.error('  Refusing to guess which one to patch. No changes were written.');
      process.exit(1);
    }
    source = source.replace(find, replace);
    changed = true;
    console.log(`  • ${label}: applied`);
  }

  if (changed) {
    writeFileSync(path, source, 'utf8');
    console.log(`✓ Wrote ${path}`);
  } else {
    console.log(`= No changes needed for ${path}`);
  }
}

console.log('app/Threads.jsx');
applyEdits(files.threads, [
  {
    label: 'guard resize() against redundant texture reallocation',
    find: `      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      state.width = width;
      state.height = height;
      gl.bindTexture(gl.TEXTURE_2D, target);`,
    replace: `      const nextCanvasWidth = Math.max(1, Math.round(width * dpr));
      const nextCanvasHeight = Math.max(1, Math.round(height * dpr));

      // Mobile browsers fire ResizeObserver repeatedly while scrolling
      // (address-bar show/hide shrinks and grows the viewport). Re-allocating
      // the framebuffer texture on every one of those ticks, while the RAF
      // loop is mid-draw, is what produced the torn/garbled frames. Skip the
      // GPU work entirely when the pixel size hasn't actually changed.
      if (nextCanvasWidth === canvas.width && nextCanvasHeight === canvas.height && state.width === width && state.height === height) {
        return;
      }

      canvas.width = nextCanvasWidth;
      canvas.height = nextCanvasHeight;
      state.width = width;
      state.height = height;
      gl.bindTexture(gl.TEXTURE_2D, target);`,
  },
  {
    label: 'batch ResizeObserver through requestAnimationFrame',
    find: `    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);`,
    replace: `    let resizeRaf = 0;
    const scheduleResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resize();
      });
    };
    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(container);`,
  },
  {
    label: 'clean up pending resize rAF on unmount',
    find: `      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = null;`,
    replace: `      alive = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      wakeRef.current = null;`,
  },
]);

console.log('\napp/page.js');
applyEdits(files.page, [
  {
    label: 'Hero: min-h-screen → min-h-svh',
    find: `      className="relative min-h-screen flex flex-col justify-center items-start px-6 md:px-20 overflow-hidden pt-20"`,
    replace: `      className="relative min-h-svh flex flex-col justify-center items-start px-6 md:px-20 overflow-hidden pt-20"`,
  },
]);

console.log('\nDone.');
