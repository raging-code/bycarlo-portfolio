/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display:   ["var(--font-display)", "system-ui", "sans-serif"], // Cooper Hewitt (headings)
        sans:      ["var(--font-body)", "system-ui", "sans-serif"],    // Cooper Hewitt (body)
      },
    },
  },
  plugins: [],
};