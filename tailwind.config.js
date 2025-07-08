// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vwBg: '#FDF6F3',
        vwRed: '#4C1D1D',
        vwAccent: '#D6BEBE',
      },
      fontFamily: {
        caslon: ['EB Garamond', 'serif'],
        mono: ['Space Mono', 'monospace'],
      },
      backgroundImage: {
        grain: "url('/path-to-your-grain.svg')",
      },
    },
  },
};
