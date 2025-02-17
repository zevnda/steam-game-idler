const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
        extend: {
            width: {
                'calc': 'calc(100vw - 57px)'
            },
            height: {
                'calc': 'calc(100vh - 45px)',
            },
            maxHeight: {
                'calc': 'calc(100vh - 45px)',
            },
            minHeight: {
                'calc': 'calc(100vh - 45px)',
            },
            maxWidth: {
                'calc': 'calc(100vw - 57px)',
            },
            minWidth: {
                'calc': 'calc(100vw - 57px)',
            }
        }
    },
    darkMode: 'class',
    plugins: [heroui({
        themes: {
            light: {
                colors: {
                    'offwhite': '#ffffff',
                    'altwhite': '#5c6674',
                    'titlebar': '#ffffff',
                    'titlehover': '#f5f5f5',
                    'base': '#fafafa',
                    'container': '#f7f7f7',
                    'containerhover': '#f5f5f5',
                    'footer': '#efefef',
                    'border': '#e3e3e3',
                    'input': '#f7f7f7',
                    'link': '#006fee',
                    'linkhover': '#4b82bb',
                    'modalheader': '#ffffff',
                    'modalbody': '#fafafa',
                    'modalfooter': '#ffffff',
                    'notibase': '#ffffff',
                    'notihead': '#fafafa',
                    'notiunread': '#ebebeb',
                    'notihover': '#f5f5f5',
                    primary: {
                        DEFAULT: '#2c7adb',
                    },
                    secondary: {
                        DEFAULT: '#137eb5',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            dark: {
                colors: {
                    'offwhite': '#ebebeb',
                    'altwhite': '#a9a9a9',
                    'titlebar': '#141414',
                    'titlehover': '#2b2b2b',
                    'base': '#101010',
                    'container': '#161616',
                    'containerhover': '#252525',
                    'footer': '#0f0f0f',
                    'border': '#272727',
                    'input': '#181818',
                    'link': '#5a95d3',
                    'linkhover': '#4b82bb',
                    'modalheader': '#121212',
                    'modalbody': '#171717',
                    'modalfooter': '#121212',
                    'notibase': '#101010',
                    'notihead': '#181818',
                    'notiunread': '#212121',
                    'notihover': '#1e1e1e',
                    primary: {
                        DEFAULT: '#2c7adb',
                    },
                    secondary: {
                        DEFAULT: '#137eb5',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
        }
    })],
};
