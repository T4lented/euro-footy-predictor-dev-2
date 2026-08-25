/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/web-react/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    borderRadius: {
      none: '0px',
      sm: '0px',
      DEFAULT: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '0px',
    },
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
