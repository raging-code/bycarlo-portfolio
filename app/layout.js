import "./globals.css";
import {
  Outfit,
  Plus_Jakarta_Sans,
  Syne_Mono,
  Cormorant_Garamond,
} from "next/font/google";

// Outfit → headings / display
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

// Plus Jakarta Sans → body / sans
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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakartaSans.variable} ${syneMono.variable} ${cormorantGaramond.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}