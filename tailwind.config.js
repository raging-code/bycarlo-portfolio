/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display:   ["var(--font-display)", "system-ui", "sans-serif"], // Plus Jakarta Sans (headings)
        sans:      ["var(--font-body)", "system-ui", "sans-serif"],    // DM Sans (body)
        mono:      ["var(--font-syne-mono)", "monospace"],
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      colors: {
        bg:       "#F4F5F9",
        fg:       "#0D1222",
        accent:   "#4338CA",
        gold:     "#5CD6C0",
        surface:  "#E6E9F0",
        surface2: "#D8DCE6",
        muted:    "#5A6277",
      },
    },
  },
  plugins: [],
};