import "./globals.css";

export const metadata = {
  title: "byCarlo — Web Design Studio",
  description:
    "Wedding, birthday, corporate, and business websites. Crafted with precision. Shipped in days.",
  openGraph: {
    title: "byCarlo — Web Design Studio",
    description: "Built to convert. Designed to last.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
