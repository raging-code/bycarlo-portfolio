import "./globals.css";
import localFont from "next/font/local";
import IntroAnimation from "./IntroAnimation";
import SmoothScroll from "./SmoothScroll";

// Cooper Hewitt, renamed web build "Hewitt Web" (SIL OFL, see ./fonts/OFL.txt): drives --font-display and --font-body
// Only the 400 weight ships: --font-cooper is a system-fallback link in the
// --font-display/--font-body stack (see globals.css) and is never painted
// while HeroDisplay (Archivo) loads successfully, so the other 4 static
// weights were pure dead weight. perf-optimize:trimmed
const cooper = localFont({
  src: [{ path: "./fonts/HewittWeb-Book.woff2", weight: "400", style: "normal" }],
  variable: "--font-cooper",
  display: "swap",
  preload: false, // perf-optimize-2: fallback only, never painted
});

export const metadata = {
  title: "byCarlo — Web Design Studio",
  description:
    "Wedding, birthday, corporate, and business websites. Crafted from first principles. Shipped in days.",
};

// ── Viewport exported separately per Next.js App Router spec ──────────────
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={cooper.variable}
    >
      {/*
        Explicit meta is a belt-and-suspenders fallback for older Next.js builds
        that may not honour the viewport export above.
      */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body>
        <SmoothScroll />
        <IntroAnimation />{children}</body>
    </html>
  );
}
// cooper-hewitt:applied

// hero-v2:applied
