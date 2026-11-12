import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF8F4',
        sand: '#F3EFE7',
        parchment: '#FBF9F6',
        ink: {
          DEFAULT: '#17150F',
          soft: '#3B3730',
          mute: '#6E685D',
          faint: '#9A9385',
        },
        line: { DEFAULT: '#E7E1D5', strong: '#D8D0C0' },
        clay: {
          50: '#FBF1EC',
          100: '#F6E2D8',
          200: '#EDC4B2',
          300: '#E0A189',
          400: '#D0784F',
          500: '#C05B34',
          600: '#A94A28',
          700: '#8A3A20',
        },
        pine: {
          50: '#EFF4F2',
          100: '#DCE7E3',
          300: '#8FB0A8',
          500: '#2F5F57',
          600: '#1F4A43',
          700: '#143631',
          900: '#0C2320',
        },
        gold: { 400: '#D8B26A', 500: '#C99A4B', 600: '#A97E33' },
        sky: { 50: '#EEF4F8', 500: '#3F6E8C' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Iowan Old Style', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: { xl2: '1.25rem', '4xl': '2rem' },
      boxShadow: {
        card: '0 1px 2px rgba(23,21,15,0.04), 0 8px 24px -12px rgba(23,21,15,0.10)',
        lift: '0 2px 4px rgba(23,21,15,0.04), 0 18px 40px -18px rgba(23,21,15,0.22)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
        'marquee-x': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        'marquee-x': 'marquee-x 40s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
