/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d1117',
        surface: '#161b22',
        border: '#21262d',
        accent: '#2dd4bf',
        'accent-dim': '#14b8a6',
        text: '#f1f5f9',
        muted: '#8b949e',
        subtle: '#334155',
      },
    },
  },
  plugins: [],
}
