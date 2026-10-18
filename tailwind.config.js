/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display:   ["var(--font-display)", "system-ui", "sans-serif"], // Cooper Hewitt (headings)
        sans:      ["var(--font-body)", "system-ui", "sans-serif"],    // Cooper Hewitt (body)
        mono:      ["var(--font-syne-mono)", "monospace"],
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      colors: {
        bg:       "#EBE9E1",
        fg:       "#2A0E07",
        accent:   "#D23412",
        gold:     "#FFA2B6", // signal (pink)
        surface:  "#DFDCD0",
        surface2: "#D3CFC2",
        muted:    "#665549",
        on:       "#FFF4EA", // text on accent bands
      },
    },
  },
  plugins: [],
};