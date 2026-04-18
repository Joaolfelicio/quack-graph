import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pond: {
          50: '#eff9ff',
          100: '#def3ff',
          200: '#b6e8ff',
          300: '#75d6ff',
          400: '#2cc0ff',
          500: '#00a6f0',
          600: '#0083c7',
          700: '#0069a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f4a',
        },
        duck: {
          50: '#fffceb',
          100: '#fff6c6',
          200: '#ffec88',
          300: '#ffdb49',
          400: '#ffc61f',
          500: '#f9a606',
          600: '#dd7d02',
          700: '#b75706',
          800: '#94430c',
          900: '#7a380d',
          950: '#461b02',
        },
        reed: {
          500: '#2a9d8f',
          600: '#218077',
        },
        sand: {
          50: '#faf7f2',
          100: '#f4ede0',
          200: '#e7d7bb',
          300: '#d7bb8c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 30px -10px rgba(8, 47, 74, 0.25)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
