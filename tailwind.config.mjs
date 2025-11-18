// eslint-disable-next-line @typescript-eslint/no-require-imports
const { heroui } = require('@heroui/react')

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
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
    },
  },
  darkMode: 'class',
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            'base': '#111218',
            'dynamic': '#009FC2',
            'dynamic-hover': '#0090af',
            'btn-text': '#000000',
            'btn-secondary': '#ebebeb',
            'btn-achievement-header': '#6f6f6f7b',
            'btn-achievement-header-hover': '#5656567b',
            'content': '#ffffff',
            'altwhite': '#a9a9a9',
            'header-hover': '#ffffff',
            'sidebar': '#161920',
            'item-active': '#ffffff11',
            'item-hover': '#ffffff0c',
            'search': '#6d6d6d42',
            'border': '#292929ff',
            'input': '#262a32ff',
            'inputhover': '#1e2129ff',
            'switch': '#2e3237',
            'tab-panel': '#00000058',
            'achievement-main': '#1a1e26ff',
            'achievement-footer': '#222631ff',
            'stat-input': '#2b2d32ff',
            'stat-input-hover': '#313338ff',
            'notification': '#121316',
            'notification-unseen': '#18191dff',
            'notification-hover': '#202126ff',
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
