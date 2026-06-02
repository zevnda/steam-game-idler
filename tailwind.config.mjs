// eslint-disable-next-line @typescript-eslint/no-require-imports
const { heroui } = require('@heroui/react')

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: ['break-inside-avoid'],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-bg': 'var(--gradient-bg)',
        'gradient-alt': 'var(--gradient-alt)',
      },
      width: {
        'calc': 'calc(100vw - 250px)',
        'calc-collapsed': 'calc(100vw - 56px)',
      },
      height: {
        calc: 'calc(100vh - 48px)',
      },
      maxHeight: {
        calc: 'calc(100vh - 48px)',
      },
      minHeight: {
        calc: 'calc(100vh - 48px)',
      },
      animation: {
        'skew-scroll': 'skew-scroll 30s linear infinite',
      },
      keyframes: {
        'skew-scroll': {
          '0%': {
            transform: 'rotatex(20deg) rotateZ(-20deg) skewX(20deg) translateZ(0) translateY(0)',
          },
          '100%': {
            transform:
              'rotatex(20deg) rotateZ(-20deg) skewX(20deg) translateZ(0) translateY(-100%)',
          },
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            'base': '#080808',
            'surface': '#111111',
            'card': '#1a1a1a',
            'surface-raised': '#1e1e1e',
            'dynamic': '#7ac2e3ff',
            'dynamic-hover': '#5aa3c4ff',
            'btn-text': '#000000',
            'btn-secondary': '#e8e8e8',
            'btn-achievement-header': '#2a2a2a80',
            'btn-achievement-header-hover': '#2a2a2a60',
            'content': '#ffffff',
            'altwhite': '#a0a0a0',
            'header-hover': '#ffffff',
            'sidebar': '#111111ff',
            'gold': '#ffc700',
            'item-active': '#ffffff0f',
            'item-hover': '#ffffff0a',
            'search': '#2a2a2a80',
            'border': '#2a2a2aff',
            'input': '#1a1a1aff',
            'inputhover': '#222222ff',
            'switch': '#2a2a2aff',
            'tab-panel': '#11111190',
            'popover': '#111111ff',
            'achievement-main': '#1a1a1acc',
            'achievement-footer': '#111111cc',
            'stats-input': '#1a1a1aff',
            'stats-inputhover': '#222222ff',
            'primary': {
              DEFAULT: '#2c7adb',
            },
            'secondary': {
              DEFAULT: '#137eb5',
            },
            'danger': {
              DEFAULT: '#ef4444',
              foreground: '#fff',
            },
          },
        },
      },
    }),
  ],
}

export default config
