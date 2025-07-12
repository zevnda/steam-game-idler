// eslint-disable-next-line @typescript-eslint/no-require-imports
const { heroui } = require('@heroui/react')

/** @type {import('tailwindcss').Config} */
export default {
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
            'base': '#0D0F12',
            'container': '#161616',
            'containerhover': '#252525',
            'dynamic': '#009FC2',
            'dynamic-hover': '#0090af',
            'btn-text': '#000000',
            'btn-text-alt': '#ffffff',
            'btn-secondary': '#ebebeb',
            'btn-achievement-header': '#6f6f6f7b',
            'btn-achievement-header-hover': '#5656567b',
            'btn-carousel': '#6f6f6f7b',
            'btn-carousel-hover': '#5656567b',
            'content': '#ffffff',
            'offwhite': '#ebebeb',
            'altwhite': '#a9a9a9',
            'header-hover': '#ffffff',
            'sidebar': '#121316',
            'item-active': '#f3f3f323',
            'item-hover': '#92929223',
            'search': '#6d6d6d42',
            'searchhover': '#65656542',
            'searchborder': '#3E3F41',
            'button-text': '#ffffff',
            'border': '#272727',
            'input': '#1e2024ff',
            'inputhover': '#24262a',
            'switch': '#2e3237',
            'modalheader': '#121212',
            'modalbody': '#171717',
            'modalbody-hover': '#212427',
            'modalfooter': '#121212',
            'tablehead': '#131313',
            'tablerow': '#1a1a1a',
            'tablerowalt': '#161616',
            'alert': '#1f2125',
            'tab-panel': '#1e2024ff',
            'achievement-main': '#1e2024ff',
            'achievement-footer': '#2a2c31ff',
            'stat-input': '#2b2d32ff',
            'stat-input-hover': '#313338ff',
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
