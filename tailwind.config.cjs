/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream:   "#F5EEDC",   // 60% — neutral light background
        blue:    "#27548A",   // 30% — structural elements, nav, secondary text
        teal:    "#183B4E",   // 30% — primary typography, dominant headers
        gold:    "#DDA853",   // 10% — CTA buttons & critical highlights
      },
      boxShadow: {
        card:    "0 1px 3px rgba(24,59,78,0.08), 0 8px 24px rgba(24,59,78,0.10)",
        "card-lg":"0 4px 6px rgba(24,59,78,0.06), 0 20px 48px rgba(24,59,78,0.14)",
      },
    },
  },
  plugins: [],
};