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
        bg:       "#F8F6F5",
        fg:       "#1A0D08",
        accent:   "#A32A0B",
        gold:     "#FFC24B",
        surface:  "#EEE9E6",
        surface2: "#E0D8D3",
        muted:    "#6B5D57",
      },
    },
  },
  plugins: [],
};