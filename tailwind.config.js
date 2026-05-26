/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent:  { DEFAULT: '#2A5C45', light: '#DCF0E7', dark: '#3D7A5E' },
        gold:    { DEFAULT: '#B07D2C', light: '#F5EDDA' },
        brand:   { red: '#9B3232', 'red-lt': '#FAEAEA', blue: '#1D4B8F', 'blue-lt': '#E3EBF8', amber: '#8F5A14', 'amber-lt': '#F7EDDA' },
        surface: { DEFAULT: '#FFFFFF', 2: '#EDE9E1', 3: '#E4DFD5' },
        bg:      '#F4F1EC',
      },
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono:  ['DM Mono', 'monospace'],
      },
      borderRadius: { sm: '8px', md: '12px', lg: '18px', xl: '24px' },
    },
  },
  plugins: [],
}
