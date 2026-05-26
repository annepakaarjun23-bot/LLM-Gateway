/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#f6efe7',
          card: '#fffaf5',
          sidebar: '#e8dece',
        },
        text: {
          primary: '#2b2b2b',
          secondary: '#6f6a63',
        },
        accent: {
          primary: '#c96a3d',
          'primary-hover': '#b55a30',
          secondary: '#657153',
        },
        border: {
          DEFAULT: '#d8cdbd',
        },
        danger: '#b54a3f',
        warning: '#c98a3d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.375rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
