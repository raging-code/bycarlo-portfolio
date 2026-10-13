import "./globals.css";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import IntroAnimation from "./IntroAnimation";

// Display / headings
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// Body / labels
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
  weight: ["400", "500", "600", "700"],
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
      className={`${plusJakarta.variable} ${dmSans.variable}`}
    >
      {/*
        Explicit meta is a belt-and-suspenders fallback for older Next.js builds
        that may not honour the viewport export above.
      */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body>
        <IntroAnimation />{children}</body>
    </html>
  );
}