// patch-navbar-glass-surface.mjs
// byCarlo: replaces the navbar's glass effect with the React Bits <GlassSurface />
// (SVG displacement "liquid glass"). Navbar size, padding, links, logo, switch and
// the flat-bar -> floating-pill scroll behaviour are NOT touched. Only the glass layer.
//
// What it does:
//   1. creates app/GlassSurface.js and app/GlassSurface.css (the component, unchanged)
//   2. app/page.js: imports GlassSurface and renders it inside the existing
//      .gnav-glass layer (same place the old glass was)
//   3. app/globals.css: removes the old glass look (border, tint, blur, shadow) from
//      .gnav-glass, keeps its fade-in on scroll, makes the glass follow the navbar's
//      corner radius, and makes the fallback look follow the SITE theme toggle
//
// Notes:
//   - The full distortion effect only renders in Chromium browsers (Chrome, Edge,
//     Brave, Android Chrome). Safari / iOS / Firefox automatically get the component's
//     built-in frosted fallback. That is how GlassSurface is designed.
//   - light/dark follows your site's theme switch (the site already sets color-scheme).
//   - No npm install needed (the component only uses React).
//
// Tune later: the props on <GlassSurface /> in app/page.js
//   backgroundOpacity (0-1)  frost / readability of the links over the glass
//   distortionScale          strength of the refraction (try -100 for softer)
//   blur, brightness, opacity, displace, redOffset / greenOffset / blueOffset
//
// Safe to run more than once.
// Run from the project root:   node patch-navbar-glass-surface.mjs
// Backups go into .patch-backups/

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app", "page.js");
const cssPath = path.join(root, "app", "globals.css");
const compJsPath = path.join(root, "app", "GlassSurface.js");
const compCssPath = path.join(root, "app", "GlassSurface.css");

for (const p of [pagePath, cssPath]) {
  if (!fs.existsSync(p)) {
    console.error("Cannot find " + p + "\nRun this script from the bycarlo-portfolio root folder.");
    process.exit(1);
  }
}

const read = (p) => {
  const raw = fs.readFileSync(p, "utf8");
  return { raw, text: raw.replace(/\r\n/g, "\n"), crlf: raw.includes("\r\n") };
};
const fail = (msg) => {
  console.error("Patch aborted, nothing was written.\n" + msg);
  process.exit(1);
};

const page = read(pagePath);
const css = read(cssPath);
let text = page.text;
let styles = css.text;

if (text.includes('import GlassSurface from "./GlassSurface";') && styles.includes("/* gnav-glass-surface */")) {
  console.log("Already applied, nothing to do.");
  process.exit(0);
}

const replaceOnce = (src, from, to, label) => {
  const first = src.indexOf(from);
  if (first === -1) fail("Could not find: " + label);
  if (src.indexOf(from, first + 1) !== -1) fail("Found more than once: " + label);
  return src.replace(from, () => to);
};

/* ── page.js ── */
if (!text.includes('import GlassSurface from "./GlassSurface";')) {
  text = replaceOnce(
    text,
    'import { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react";',
    'import { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react";\nimport GlassSurface from "./GlassSurface";',
    "react import line"
  );
  text = replaceOnce(
    text,
    '<span className="gnav-glass" aria-hidden="true" />',
    [
      '<div className="gnav-glass" aria-hidden="true">',
      "          <GlassSurface",
      '            width="100%"',
      '            height="100%"',
      "            borderRadius={scrolled ? 999 : 0}",
      "            backgroundOpacity={0.1}",
      "            brightness={50}",
      "            opacity={0.93}",
      "            blur={11}",
      "            displace={0.5}",
      "            distortionScale={-180}",
      "            redOffset={0}",
      "            greenOffset={10}",
      "            blueOffset={20}",
      "          />",
      "        </div>",
    ].join("\n"),
    "navbar glass span"
  );
}

/* ── globals.css ── */
if (!styles.includes("/* gnav-glass-surface */")) {
  const OLD_GLASS = `/* liquid glass */
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
}`;
  const NEW_GLASS = `/* gnav-glass-surface */
/* liquid glass: drawn by <GlassSurface /> (app/GlassSurface.js). This layer only
   handles position, fade-in on scroll and the corner radius. */
.gnav-glass {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s;
}
/* follow the navbar's flat -> pill corner morph instead of a fixed radius */
.gnav-glass .glass-surface {
  border-radius: inherit !important;
}
/* Safari / Firefox fallback: follow the SITE theme switch, not the OS theme */
.gnav-wrap[data-theme="light"] .glass-surface--fallback {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(11, 11, 14, 0.1);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.6),
    0 8px 24px -8px rgba(0, 0, 0, 0.25);
}
.gnav-wrap[data-theme="dark"] .glass-surface--fallback {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.1);
}`;
  styles = replaceOnce(styles, OLD_GLASS, NEW_GLASS, "old .gnav-glass block");
}

/* ── write ── */
const GLASS_JS = `'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef, useId } from 'react';
import './GlassSurface.css';

const GlassSurface = ({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  className = '',
  style = {}
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = \`glass-filter-\${uniqueId}\`;
  const redGradId = \`red-grad-\${uniqueId}\`;
  const blueGradId = \`blue-grad-\${uniqueId}\`;

  const [svgSupported, setSvgSupported] = useState(false);

  const containerRef = useRef(null);
  const feImageRef = useRef(null);
  const redChannelRef = useRef(null);
  const greenChannelRef = useRef(null);
  const blueChannelRef = useRef(null);
  const gaussianBlurRef = useRef(null);

  const generateDisplacementMap = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = rect?.width || 400;
    const actualHeight = rect?.height || 200;
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);

    const svgContent = \`
      <svg viewBox="0 0 \${actualWidth} \${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="\${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="\${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="\${actualWidth}" height="\${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="\${actualWidth}" height="\${actualHeight}" rx="\${borderRadius}" fill="url(#\${redGradId})" />
        <rect x="0" y="0" width="\${actualWidth}" height="\${actualHeight}" rx="\${borderRadius}" fill="url(#\${blueGradId})" style="mix-blend-mode: \${mixBlendMode}" />
        <rect x="\${edgeSize}" y="\${edgeSize}" width="\${actualWidth - edgeSize * 2}" height="\${actualHeight - edgeSize * 2}" rx="\${borderRadius}" fill="hsl(0 0% \${brightness}% / \${opacity})" style="filter:blur(\${blur}px)" />
      </svg>
    \`;

    return \`data:image/svg+xml,\${encodeURIComponent(svgContent)}\`;
  };

  const updateDisplacementMap = () => {
    feImageRef.current?.setAttribute('href', generateDisplacementMap());
  };

  useEffect(() => {
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });

    gaussianBlurRef.current?.setAttribute('stdDeviation', displace.toString());
  }, [
    width,
    height,
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateDisplacementMap, 0);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    setTimeout(updateDisplacementMap, 0);
  }, [width, height]);

  useEffect(() => {
    setSvgSupported(supportsSVGFilters());
  }, []);

  const supportsSVGFilters = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    if (isWebkit || isFirefox) {
      return false;
    }

    const div = document.createElement('div');
    div.style.backdropFilter = \`url(#\${filterId})\`;

    return div.style.backdropFilter !== '';
  };

  const containerStyle = {
    ...style,
    width: typeof width === 'number' ? \`\${width}px\` : width,
    height: typeof height === 'number' ? \`\${height}px\` : height,
    borderRadius: \`\${borderRadius}px\`,
    '--glass-frost': backgroundOpacity,
    '--glass-saturation': saturation,
    '--filter-id': \`url(#\${filterId})\`
  };

  return (
    <div
      ref={containerRef}
      className={\`glass-surface \${svgSupported ? 'glass-surface--svg' : 'glass-surface--fallback'} \${className}\`}
      style={containerStyle}
    >
      <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />

            <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" id="redchannel" result="dispRed" />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="red"
            />

            <feDisplacementMap
              ref={greenChannelRef}
              in="SourceGraphic"
              in2="map"
              id="greenchannel"
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="green"
            />

            <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="blue"
            />

            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      <div className="glass-surface__content">{children}</div>
    </div>
  );
};

export default GlassSurface;
`;
const GLASS_CSS = `.glass-surface {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: opacity 0.26s ease-out;
}

.glass-surface__filter {
  width: 100%;
  height: 100%;
  pointer-events: none;
  position: absolute;
  inset: 0;
  opacity: 0;
  z-index: -1;
}

.glass-surface__content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: inherit;
  position: relative;
  z-index: 1;
}

.glass-surface--svg {
  background: light-dark(hsl(0 0% 100% / var(--glass-frost, 0)), hsl(0 0% 0% / var(--glass-frost, 0)));
  backdrop-filter: var(--filter-id, url(#glass-filter)) saturate(var(--glass-saturation, 1));
  box-shadow:
    0 0 2px 1px light-dark(color-mix(in oklch, black, transparent 85%), color-mix(in oklch, white, transparent 65%))
      inset,
    0 0 10px 4px light-dark(color-mix(in oklch, black, transparent 90%), color-mix(in oklch, white, transparent 85%))
      inset,
    0px 4px 16px rgba(17, 17, 26, 0.05),
    0px 8px 24px rgba(17, 17, 26, 0.05),
    0px 16px 56px rgba(17, 17, 26, 0.05),
    0px 4px 16px rgba(17, 17, 26, 0.05) inset,
    0px 8px 24px rgba(17, 17, 26, 0.05) inset,
    0px 16px 56px rgba(17, 17, 26, 0.05) inset;
}

.glass-surface--fallback {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px) saturate(1.8) brightness(1.1);
  -webkit-backdrop-filter: blur(12px) saturate(1.8) brightness(1.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 8px 32px 0 rgba(31, 38, 135, 0.2),
    0 2px 16px 0 rgba(31, 38, 135, 0.1),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.2);
}

@media (prefers-color-scheme: dark) {
  .glass-surface--fallback {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px) saturate(1.8) brightness(1.2);
    -webkit-backdrop-filter: blur(12px) saturate(1.8) brightness(1.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow:
      inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
      inset 0 -1px 0 0 rgba(255, 255, 255, 0.1);
  }
}

@supports not (backdrop-filter: blur(10px)) {
  .glass-surface--fallback {
    background: rgba(255, 255, 255, 0.4);
    box-shadow:
      inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
      inset 0 -1px 0 0 rgba(255, 255, 255, 0.3);
  }

  .glass-surface--fallback::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.15);
    border-radius: inherit;
    z-index: -1;
  }
}

@supports not (backdrop-filter: blur(10px)) {
  @media (prefers-color-scheme: dark) {
    .glass-surface--fallback {
      background: rgba(0, 0, 0, 0.4);
    }

    .glass-surface--fallback::before {
      background: rgba(255, 255, 255, 0.05);
    }
  }
}

.glass-surface:focus-visible {
  outline: 2px solid light-dark(#007aff, #0a84ff);
  outline-offset: 2px;
}
`;

const backupDir = path.join(root, ".patch-backups");
fs.mkdirSync(backupDir, { recursive: true });
const stamp = Date.now();
fs.writeFileSync(path.join(backupDir, "page.js." + stamp + ".bak"), page.raw, "utf8");
fs.writeFileSync(path.join(backupDir, "globals.css." + stamp + ".bak"), css.raw, "utf8");

const save = (p, f, t) => fs.writeFileSync(p, f.crlf ? t.replace(/\n/g, "\r\n") : t, "utf8");
save(pagePath, page, text);
save(cssPath, css, styles);
fs.writeFileSync(compJsPath, GLASS_JS, "utf8");
fs.writeFileSync(compCssPath, GLASS_CSS, "utf8");

console.log("Done. Navbar glass replaced with GlassSurface (size and layout unchanged).");
console.log("Created app/GlassSurface.js and app/GlassSurface.css");
console.log("Next: npm run dev (use Chrome / Edge to see the full distortion effect)");
