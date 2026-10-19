"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { frame, cancelFrame } from "framer-motion";

/* Option 1: Soft Glide
   Gentle inertia. Scrolling follows the wheel with a short, smooth trail. */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // perf-optimize: touch/coarse-pointer devices (phones, most low-end
    // hardware) get smoother, cheaper scrolling from the browser's native
    // compositor than from a JS-driven rAF loop fighting it every frame.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const lenis = new Lenis({
      lerp: 0.085,          // lower = floatier (0.05 very floaty, 0.15 snappy)
      wheelMultiplier: 1,
      smoothWheel: true,
      anchors: true,        // #work, #contact etc. glide instead of jump
    });
    window.__lenis = lenis;

    // run Lenis on framer-motion's frame loop so both stay in sync
    const update = ({ timestamp }) => lenis.raf(timestamp);
    frame.update(update, true);

    return () => {
      cancelFrame(update);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return null;
}
