/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",   /* StayEase Signature Corporate Blue */
        secondary: "#475569", /* Soft Minimal slate grey */
        accent: "#10b981"    /* Transaction Success Green */
      }
    },
  },
  plugins: [],
}
