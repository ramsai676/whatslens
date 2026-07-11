import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Chart chrome & ink (dataviz reference palette)
        surface: { light: '#fcfcfb', dark: '#1a1a19' },
        page: { light: '#f9f9f7', dark: '#0d0d0d' },
        ink: {
          DEFAULT: '#0b0b0b',
          secondary: '#52514e',
          muted: '#898781',
          'dark-primary': '#ffffff',
          'dark-secondary': '#c3c2b7',
        },
        grid: { light: '#e1e0d9', dark: '#2c2c2a' },
        // Brand accent — WhatsApp-adjacent green, deepened for contrast
        brand: {
          50: '#eefbf2',
          100: '#d7f4e1',
          200: '#b2e8c8',
          300: '#7fd5a7',
          400: '#4abb81',
          500: '#25a066',
          600: '#188252',
          700: '#146845',
          800: '#125338',
          900: '#10442f',
          950: '#07261a',
        },
        series: {
          blue: '#2a78d6',
          'blue-dark': '#3987e5',
          aqua: '#1baf7a',
          yellow: '#eda100',
          violet: '#4a3aa7',
          'violet-dark': '#9085e9',
          red: '#e34948',
          'red-dark': '#e66767',
        },
        status: {
          good: '#0ca30c',
          warning: '#fab219',
          serious: '#ec835a',
          critical: '#d03b3b',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      transitionTimingFunction: {
        'out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
