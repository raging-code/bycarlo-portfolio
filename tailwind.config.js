/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display:   ["var(--font-display)", "system-ui", "sans-serif"], // Outfit
        sans:      ["var(--font-sans)", "system-ui", "sans-serif"],    // Plus Jakarta Sans
        mono:      ["var(--font-syne-mono)", "monospace"],
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      colors: {
        bg:       "#F7F4EE",
        fg:       "#14110C",
        accent:   "#1A3EE0",
        gold:     "#C48A0A",
        surface:  "#EDE8DF",
        surface2: "#E4DDD2",
        muted:    "#8E8A84",
      },
    },
  },
  plugins: [],
};