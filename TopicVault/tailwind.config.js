/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#2fbe5f',
          deep: '#06110d',
          panel: '#101514',
          muted: '#1a2220',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(47,190,95,0.24), 0 20px 80px rgba(0,0,0,0.36)',
      },
    },
  },
  plugins: [],
}
