/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        jubeat: {
          pink: '#FF69B4',
          blue: '#4169E1',
          green: '#32CD32',
          yellow: '#FFD700',
          red: '#FF4500',
        },
      },
    },
  },
  plugins: [],
}
