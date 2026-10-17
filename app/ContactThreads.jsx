"use client";

import { useEffect, useRef } from "react";

/* contact-threads: Contact background.
   One flowing ribbon of fine lines that twists in the middle. Drawn on a canvas,
   pauses when off-screen or in a background tab, respects prefers-reduced-motion. */
export default function ContactThreads() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return undefined;
    const section = wrap.parentElement || wrap;
    const ctx = cv.getContext("2d");
    if (!ctx) return undefined;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0, last: -1e9, has: false };
    let W = 0;
    let H = 0;
    let raf = 0;
    let running = false;
    let visible = true;

    const onMove = (e) => {
      const r = section.getBoundingClientRect();
      ptr.tx = e.clientX - r.left;
      ptr.ty = e.clientY - r.top;
      if (!ptr.has) {
        ptr.x = ptr.tx;
        ptr.y = ptr.ty;
        ptr.has = true;
      }
      ptr.last = performance.now();
    };

    /* idle "ghost cursor" so it keeps moving on touch screens / when the mouse is still */
    const idleTarget = (t) => {
      if (performance.now() - ptr.last > 2500) {
        ptr.tx = W * (0.62 + 0.26 * Math.sin(t * 0.00031));
        ptr.ty = H * ((W < 700 ? 0.72 : 0.55) + 0.14 * Math.sin(t * 0.00047 + 1));
        if (!ptr.has) {
          ptr.x = ptr.tx;
          ptr.y = ptr.ty;
          ptr.has = true;
        }
      }
    };

    const draw = (t) => {
      idleTarget(t);
      const sec = t * 0.00036;
      const small = W < 700; /* phone layout */
      const Z = small ? 1.6 : 1; /* phone: zoom in, the ends run off-screen */
      const n = small ? 36 : 46; /* identical, evenly spaced lines */
      const step = small ? 7 : 8;
      const base = H * (small ? 0.72 : 0.6);
      const A = H * (small ? 0.075 : 0.14) * (1 + 0.1 * Math.sin(sec * 0.8)); /* S-curve height */
      const HW = H * (small ? 0.09 : 0.16); /* half-width of the ribbon */
      const p0 = 0.49 + 0.05 * Math.sin(sec * 0.7); /* where the ribbon twists */
      const ph = 0.85 * Math.sin(sec * 0.6);
      const tilt = (-0.2 + 0.2 * Math.sin(sec * 0.55 + 1)) * (small ? 0.6 : 1); /* swing of the whole ribbon */
      const reach = small ? 120 : 160; /* cursor influence */

      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "rgba(163,42,11,0.75)");
      g.addColorStop(0.38, "rgba(199,62,18,0.8)");
      g.addColorStop(0.52, "rgba(232,96,31,0.85)");
      g.addColorStop(0.78, "rgba(245,154,46,0.8)");
      g.addColorStop(1, "rgba(255,194,75,0.85)");
      ctx.strokeStyle = g;
      ctx.lineWidth = small ? 0.9 : 1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < n; i++) {
        const s = (i / (n - 1)) * 2 - 1; /* -1 .. 1 across the ribbon */
        ctx.beginPath();
        for (let x = -10; x <= W + 10; x += step) {
          const nx = 0.5 + (x / W - 0.5) / Z;
          const c = base - A * Math.sin((2 * Math.PI * (nx + 0.035 * s - 0.3)) / 0.76 + Math.PI / 2 + ph);
          /* the width flips sign at the pinch, so the lines cross over each other there */
          const hw = HW * Math.tanh((nx - p0 - 0.035 * s) * 4.4);
          let y = c + s * hw + (nx - 0.5) * H * tilt;
          y = base + (y - base) * Z;
          const dx = x - ptr.x;
          const dy = y - ptr.y;
          y += (ptr.y - y) * 0.09 * Math.exp(-(dx * dx + dy * dy) / (2 * reach * reach));
          if (x === -10) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (!small) {
        /* desktop: keep the heading area quiet */
        ctx.globalCompositeOperation = "destination-out";
        const m = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, W * 0.3);
        m.addColorStop(0, "rgba(0,0,0,0.85)");
        m.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = m;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }
    };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (t) => {
      ptr.x += (ptr.tx - ptr.x) * 0.08;
      ptr.y += (ptr.ty - ptr.y) * 0.08;
      ctx.clearRect(0, 0, W, H);
      draw(reduce ? 4000 : t);
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const ro = new ResizeObserver(() => {
      size();
      if (!running) frame(performance.now());
    });
    ro.observe(wrap);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 }
    );
    io.observe(wrap);

    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    section.addEventListener("pointermove", onMove, { passive: true });

    size();
    frame(performance.now());
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      section.removeEventListener("pointermove", onMove);
    };
  }, []);

  const fade = "linear-gradient(to bottom, transparent 0, #000 22%, #000 82%, transparent 100%)";

  return (
    <div ref={wrapRef} aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(48% 55% at 50% 58%, rgba(163,42,11,.09), rgba(163,42,11,0) 70%), radial-gradient(34% 40% at 72% 52%, rgba(255,194,75,.15), rgba(255,194,75,0) 72%)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ WebkitMaskImage: fade, maskImage: fade }}
      />
    </div>
  );
}
