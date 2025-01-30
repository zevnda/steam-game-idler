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
                'calc': 'calc(100vw - 56px)'
            },
            height: {
                'calc': 'calc(100vh - 56px)',
            },
            maxHeight: {
                'calc': 'calc(100vh - 56px)',
            },
            minHeight: {
                'calc': 'calc(100vh - 56px)',
            },
            maxWidth: {
                'calc': 'calc(100vw - 56px)',
            },
            minWidth: {
                'calc': 'calc(100vw - 56px)',
            }
        }
    },
    darkMode: 'class',
    plugins: [heroui({
        themes: {
            light: {
                colors: {
                    'sgi': '#137eb5',
                    'offwhite': '#ffffff',
                    'altwhite': '#5c6674',
                    'sidebar': '#1a8fcb',
                    'titlebar': '#ffffff',
                    'titletext': '#0a0a0a',
                    'titlehover': '#dddddd',
                    'titleborder': '#00000015',
                    'base': '#fafafa',
                    'container': '#f7f7f7',
                    'containerhover': '#efefef',
                    'footer': '#efefef',
                    'border': '#00000015',
                    'input': '#f7f7f7',
                    'inputborder': '#00000015',
                    'link': '#3c93f1',
                    'linkhover': '#4b82bb',
                    'modalheader': '#ffffff',
                    'modalbody': '#fafafa',
                    'modalfooter': '#ffffff',
                    'notibase': '#ffffff',
                    'notihead': '#fafafa',
                    'notiunread': '#ebebeb',
                    'notihover': '#f5f5f5',
                    primary: {
                        DEFAULT: '#1a8fcb',
                        foreground: '#fff'
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
                    'sgi': '#137eb5',
                    'offwhite': '#ebebeb',
                    'altwhite': '#a9a9a9',
                    'sidebar': '#141414',
                    'titlebar': '#141414',
                    'titletext': '#efefef',
                    'titlehover': '#2b2b2b',
                    'titleborder': '#ffffff15',
                    'base': '#101010',
                    'container': '#161616',
                    'containerhover': '#252525',
                    'footer': '#0f0f0f',
                    'border': '#ffffff15',
                    'input': '#181818',
                    'inputborder': '#ffffff15',
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
                        DEFAULT: '#ebebeb',
                        foreground: '#000'
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
