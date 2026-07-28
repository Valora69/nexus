/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // App palette (dark-first, matches the current screens).
        bg: '#0b0b0f',
        surface: '#15151b',
        border: '#2a2a33',
        muted: '#8a8a94',
        accent: '#4f7cff',
      },
    },
  },
  plugins: [],
};
