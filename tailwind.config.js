/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nuuz: {
          yellow: '#F5B800',
          'yellow-dark': '#D9A500',
        },
      },
    },
  },
  plugins: [],
};
