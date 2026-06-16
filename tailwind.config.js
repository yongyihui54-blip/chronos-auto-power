import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Semantic tokens driven by CSS variables (see index.css)
        ink: 'rgb(var(--ink) / <alpha-value>)',
        glass: 'rgb(var(--glass) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(15, 23, 42, 0.12)',
        'glass-lg': '0 16px 48px 0 rgba(15, 23, 42, 0.18)',
        glow: '0 0 24px -2px rgb(var(--accent) / 0.45)',
      },
      keyframes: {
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'spin-slower': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        'drift': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(20px,-15px) scale(1.05)' },
        },
      },
      animation: {
        'spin-slow': 'spin-slow 120s linear infinite',
        'spin-slower': 'spin-slower 180s linear infinite',
        drift: 'drift 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
