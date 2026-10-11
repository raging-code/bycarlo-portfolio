import "./globals.css";
import { Titillium_Web } from "next/font/google";

const titilliumWeb = Titillium_Web({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

// kept as aliases so --font-sans / --font-syne-mono / --font-cormorant
// (still referenced by tailwind.config.js and a few components) resolve
// to the same family instead of falling back to system-ui.
const plusJakartaSans = { variable: "--font-sans" };
const syneMono = { variable: "--font-syne-mono" };
const cormorantGaramond = { variable: "--font-cormorant" };

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
      className={`${titilliumWeb.variable} ${plusJakartaSans.variable} ${syneMono.variable} ${cormorantGaramond.variable}`}
    >
      {/*
        Explicit meta is a belt-and-suspenders fallback for older Next.js builds
        that may not honour the viewport export above.
      */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body>{children}</body>
    </html>
  );
}