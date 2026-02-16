/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#111a23',
        accent: '#39ce86',
        surface: '#1a2634',
        border: '#2a3b4d',
      },
    },
  },
  plugins: [],
}
