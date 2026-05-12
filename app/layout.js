import "./globals.css";
import {
  Outfit,
  Plus_Jakarta_Sans,
  Syne_Mono,
  Cormorant_Garamond,
} from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const syneMono = Syne_Mono({
  subsets: ["latin"],
  variable: "--font-syne-mono",
  weight: ["400"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
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
      className={`${outfit.variable} ${plusJakartaSans.variable} ${syneMono.variable} ${cormorantGaramond.variable}`}
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