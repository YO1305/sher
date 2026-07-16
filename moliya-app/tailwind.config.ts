import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F1117',
        surface: '#1A1D27',
        surface2: '#242838',
        border: '#2E3348',
        income: '#22C55E',
        expense: '#EF4444',
        primary: {
          DEFAULT: '#6366F1',
          light: '#818CF8',
        },
        muted: '#94A3B8',
        gold: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tight2: '-0.02em',
      },
    },
  },
  plugins: [],
} satisfies Config
