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
        calc: 'calc(100vw - 250px)',
      },
      height: {
        calc: 'calc(100vh - 36px)',
      },
      maxHeight: {
        calc: 'calc(100vh - 36px)',
      },
      minHeight: {
        calc: 'calc(100vh - 36px)',
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
            transform: 'rotatex(20deg) rotateZ(-20deg) skewX(20deg) translateZ(0) translateY(-100%)',
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
            'base': '#000000ff',
            'dynamic': '#7ac2e3ff',
            'dynamic-hover': '#5aa3c4ff',
            'btn-text': '#000000',
            'btn-secondary': '#ebebeb',
            'btn-achievement-header': '#6f6f6f52',
            'btn-achievement-header-hover': '#58585852',
            'content': '#ffffff',
            'altwhite': '#a9a9a9',
            'header-hover': '#ffffff',
            'sidebar': '#151515ff',
            'item-active': '#ffffff11',
            'item-hover': '#ffffff0c',
            'search': '#6d6d6d42',
            'border': '#1f1f1fff',
            'input': '#333333ff',
            'inputhover': '#272727ff',
            'switch': '#333333ff',
            'tab-panel': '#00000058',
            'popover': '#101010ff',
            'achievement-main': '#1c1c1ccc',
            'achievement-footer': '#1f1f1fcc',
            'stats-input': '#333333ff',
            'stats-inputhover': '#272727ff',
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
        black: {
          colors: {
            'base': '#000000',
            'dynamic': '#dadadaff',
            'dynamic-hover': '#cdcdcdff',
            'btn-text': '#000000',
            'btn-secondary': '#f2f2f2',
            'btn-achievement-header': '#ffffff1a',
            'btn-achievement-header-hover': '#ffffff33',
            'content': '#ffffff',
            'altwhite': '#bfbfbf',
            'header-hover': '#ffffff',
            'sidebar': '#000000',
            'item-active': '#ffffff0f',
            'item-hover': '#ffffff08',
            'search': '#ffffff1a',
            'border': '#1a1a1a',
            'input': '#111111ff',
            'inputhover': '#0c0c0cff',
            'switch': '#161616ff',
            'tab-panel': '#00000088',
            'popover': '#050505',
            'achievement-main': '#1a1a1acc',
            'achievement-footer': '#1a1a1ae6',
            'stats-input': '#212121ff',
            'stats-inputhover': '#1b1b1bff',
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
