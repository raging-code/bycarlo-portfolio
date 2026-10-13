#!/usr/bin/env node
/**
 * fix-intro-profile-photo.mjs
 *
 * Fixes two rendering bugs in the IntroProfile section added by
 * add-intro-profile.mjs:
 *
 *  1. The fade-to-background mask was built by combining a CSS
 *     border-radius (circle clip) with a mask-image gradient on the
 *     same element. Those two interact unpredictably and produced a
 *     soft grey halo instead of a clean circular photo with a fade
 *     only at the bottom. Fixed by splitting the fade into a separate
 *     overlay div painted in the page's own background color.
 *
 *  2. public/png/me.png is 1086×1448 — taller than it is wide. Inside
 *     a square frame, object-fit:cover alone only ever crops
 *     vertically (width is already the limiting dimension), so the
 *     face landed off-center with dead background space left visible
 *     no matter what object-position was set. Fixed by rendering the
 *     image oversized (128%) with negative margins, which gives
 *     object-position real room to pan on both axes, then repositioning
 *     against the actual measured head position in the source photo.
 *
 * Usage:
 *   node fix-intro-profile-photo.mjs            # apply
 *   node fix-intro-profile-photo.mjs --dry-run  # preview only
 *
 * Safe to re-run: if the fix is already applied, it exits without
 * making changes. Requires add-intro-profile.mjs to have been run
 * first (i.e. IntroProfile must already exist in app/page.js).
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = path.join(__dirname, "app", "page.js");
const DRY_RUN = process.argv.includes("--dry-run");

const FIXED_MARKER = "Fit into a square with object-fit:cover alone never crops horizontally";

const OLD_RINGS = `  const Rings = () => (
    <svg
      viewBox="0 0 600 600"
      className="absolute pointer-events-none select-none"
      style={{
        width: "150%",
        height: "150%",
        left: "-25%",
        top: "-25%",
        zIndex: 0,
      }}
    >
      <circle cx="300" cy="300" r="298" fill="none" stroke={accentColor} strokeOpacity="0.16" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="258" fill="none" stroke={accent2Color} strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="232" fill="none" stroke={accentColor} strokeOpacity="0.85" strokeWidth="2" />
    </svg>
  );

  const Portrait = () => (
    <div className="relative flex items-center justify-center" style={{ aspectRatio: "1 / 1" }}>
      <Rings />
      <div
        className="relative z-10 overflow-hidden"
        style={{
          width: "72%",
          height: "72%",
          borderRadius: "9999px",
          WebkitMaskImage: "linear-gradient(to bottom, black 72%, transparent 97%)",
          maskImage: "linear-gradient(to bottom, black 72%, transparent 97%)",
        }}
      >
        <img
          src="/png/me.png"
          alt="Carlo"
          draggable={false}
          className="w-full h-full"
          style={{ objectFit: "cover", objectPosition: "50% 22%" }}
        />
      </div>
    </div>
  );`;

const NEW_RINGS = `  const Rings = () => (
    <svg
      viewBox="0 0 600 600"
      className="absolute pointer-events-none select-none"
      style={{
        width: "118%",
        height: "118%",
        left: "-9%",
        top: "-9%",
        zIndex: 0,
      }}
    >
      <circle cx="300" cy="300" r="298" fill="none" stroke={accentColor} strokeOpacity="0.14" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="270" fill="none" stroke={accent2Color} strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="252" fill="none" stroke={accentColor} strokeOpacity="0.85" strokeWidth="2" />
    </svg>
  );

  // Source photo (/public/png/me.png) is 1086×1448 — taller than it is wide.
  // Fit into a square with object-fit:cover alone never crops horizontally
  // (width is already the limiting dimension), so the face ends up off-center
  // with dead background space on one side. Oversizing the <img> to 128% and
  // pulling it back with negative margins gives real room to pan both axes.
  const Portrait = () => (
    <div className="relative w-full" style={{ paddingBottom: "100%" }}>
      <Rings />
      <div
        className="absolute z-10 overflow-hidden"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "72%",
          height: "72%",
          borderRadius: "9999px",
        }}
      >
        <img
          src="/png/me.png"
          alt="Carlo"
          draggable={false}
          style={{
            width: "128%",
            height: "128%",
            maxWidth: "none",
            objectFit: "cover",
            objectPosition: "56% 26%",
            display: "block",
            marginLeft: "-14%",
            marginTop: "-14%",
          }}
        />
        {/* Fade-to-background overlay: a mask-image gradient combined with a
            circular border-radius clip renders inconsistently (the gradient
            fights the circle clip), so the fade is a separate painted layer
            instead, in the section's own background color. */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: "9999px",
            background: \`linear-gradient(to bottom, rgba(246,245,242,0) 55%, rgba(246,245,242,0.55) 75%, rgba(246,245,242,0.92) 90%, \${LIGHT.bg} 100%)\`,
          }}
        />
      </div>
    </div>
  );`;

function main() {
  if (!existsSync(TARGET)) {
    console.error(`✗ Could not find ${TARGET}. Run this from the project root.`);
    process.exit(1);
  }

  let code = readFileSync(TARGET, "utf8");

  if (code.includes(FIXED_MARKER)) {
    console.log("✓ Fix already applied in app/page.js — nothing to do.");
    process.exit(0);
  }

  if (!code.includes("function IntroProfile(")) {
    console.error(
      "✗ IntroProfile section not found in app/page.js.\n" +
      "  Run add-intro-profile.mjs first to add the section, then run this fix."
    );
    process.exit(1);
  }

  if (!code.includes(OLD_RINGS)) {
    console.error(
      "✗ Could not find the expected (buggy) Rings/Portrait block to replace.\n" +
      "  app/page.js may have been hand-edited since add-intro-profile.mjs ran —\n" +
      "  aborting without changes so nothing is corrupted. You can apply the fix\n" +
      "  by hand using the diff in this script's NEW_RINGS constant."
    );
    process.exit(1);
  }

  const patched = code.replace(OLD_RINGS, NEW_RINGS);

  if (DRY_RUN) {
    console.log("── DRY RUN — no files written ──");
    console.log("Would replace the Rings/Portrait block with the corrected version");
    console.log("(tighter rings, fixed fade overlay, corrected face crop).");
    console.log("\nRun again without --dry-run to apply.");
    process.exit(0);
  }

  writeFileSync(TARGET, patched, "utf8");
  console.log("✓ Fixed the fade mask (now a separate overlay instead of a compound mask).");
  console.log("✓ Fixed the face crop (image now overscanned so object-position can pan both axes).");
  console.log("✓ Tightened the rings to sit closer to the photo.");
  console.log("\nnpm run dev and check the section below the hero.");
  console.log("If your specific photo's face still isn't centered well, adjust the");
  console.log("objectPosition value (currently \"56% 26%\") in the Portrait() img style —");
  console.log("the first number pans left/right, the second up/down.");
}

main();
