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
        'dark': {
          colors: {
            'base': '#000000ff',
            'dynamic': '#a5f84cff',
            'dynamic-hover': '#90de3cff',
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
        'dark-alt1': {
          colors: {
            'base': '#18181b',
            'dynamic': '#fbbf24',
            'dynamic-hover': '#f59e42',
            'btn-text': '#18181b',
            'btn-secondary': '#27272a',
            'btn-achievement-header': '#3f3f4652',
            'btn-achievement-header-hover': '#27272a52',
            'content': '#f3f4f6',
            'altwhite': '#d4d4d8',
            'header-hover': '#fbbf24',
            'sidebar': '#23232a',
            'item-active': '#fbbf2411',
            'item-hover': '#fbbf240c',
            'search': '#fbbf2442',
            'border': '#27272a',
            'input': '#23232a',
            'inputhover': '#18181b',
            'switch': '#23232a',
            'tab-panel': '#23232a58',
            'popover': '#23232a',
            'achievement-main': '#23232acc',
            'achievement-footer': '#27272acc',
            'primary': {
              DEFAULT: '#fbbf24',
            },
            'secondary': {
              DEFAULT: '#f59e42',
            },
            'danger': {
              DEFAULT: '#ef4444',
              foreground: '#fff',
            },
          },
        },
        'dark-alt2': {
          colors: {
            'base': '#0f172a',
            'dynamic': '#38bdf8',
            'dynamic-hover': '#0ea5e9',
            'btn-text': '#0f172a',
            'btn-secondary': '#1e293b',
            'btn-achievement-header': '#33415552',
            'btn-achievement-header-hover': '#1e293b52',
            'content': '#f1f5f9',
            'altwhite': '#64748b',
            'header-hover': '#38bdf8',
            'sidebar': '#1e293b',
            'item-active': '#38bdf811',
            'item-hover': '#38bdf80c',
            'search': '#38bdf842',
            'border': '#334155',
            'input': '#1e293b',
            'inputhover': '#0f172a',
            'switch': '#1e293b',
            'tab-panel': '#1e293b58',
            'popover': '#1e293b',
            'achievement-main': '#1e293bcc',
            'achievement-footer': '#334155cc',
            'primary': {
              DEFAULT: '#38bdf8',
            },
            'secondary': {
              DEFAULT: '#0ea5e9',
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
