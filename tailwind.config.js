/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1e3c72",
        "navy-light": "#2a5298",
        primary: "#2b5ab5",
      },
      fontFamily: {
        headline: ["Manrope", "Prompt", "sans-serif"],
        body: ["Prompt", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
