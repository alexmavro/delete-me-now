/** @type {import('tailwindcss').Config} */
const withVar = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
    './index.html',
    './index.tsx',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // Manual class strategy. We toggle html.theme-dark, not the prefers-color-scheme.
  // The token swap happens via CSS variables in index.css; Tailwind only sees
  // these var() expressions, so dark/light share one class vocabulary.
  darkMode: ['class', '.theme-dark'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        sm:   '0 1px 2px rgb(16 24 40 / 0.04), 0 1px 3px rgb(16 24 40 / 0.06)',
        card: '0 1px 2px rgb(16 24 40 / 0.05), 0 8px 24px -6px rgb(16 24 40 / 0.08)',
      },
      colors: {
        canvas: {
          DEFAULT:  withVar('canvas'),
          elevated: withVar('canvas-elevated'),
          sunken:   withVar('canvas-sunken'),
        },
        rule: {
          DEFAULT: withVar('rule'),
          soft:    withVar('rule-soft'),
          strong:  withVar('rule-strong'),
        },
        ink: {
          primary:   withVar('ink-primary'),
          secondary: withVar('ink-secondary'),
          tertiary:  withVar('ink-tertiary'),
          quiet:     withVar('ink-quiet'),
        },
        critical: {
          DEFAULT: withVar('critical'),
          hover:   withVar('critical-hover'),
          quiet:   withVar('critical-quiet'),
          wash:    withVar('critical-wash'),
        },
        positive: {
          DEFAULT: withVar('positive'),
          quiet:   withVar('positive-quiet'),
          wash:    withVar('positive-wash'),
        },
        honey: {
          DEFAULT: withVar('honey'),
          quiet:   withVar('honey-quiet'),
        },
        accent: {
          DEFAULT: withVar('accent'),
          hover:   withVar('accent-hover'),
          soft:    withVar('accent-soft'),
          strong:  withVar('accent-strong'),
        },
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'rise-in': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.18s ease-out forwards',
        'rise-in':  'rise-in 0.28s cubic-bezier(0.22,1,0.36,1) forwards',
      },
    },
  },
  plugins: [],
};
