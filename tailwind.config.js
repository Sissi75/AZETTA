/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1F2A',
        azure: '#2457A6',
        saffron: '#F2B01E',
        emerald: '#1F7A5C',
        rouge: '#C8372D',
        surface: '#F2F5F9',
      },
      fontFamily: {
        display: ['"Young Serif"', 'serif'],
        body: ['Figtree', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
