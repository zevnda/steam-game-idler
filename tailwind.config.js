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
            },
            colors: {
                'dynamic': 'rgb(var(--dynamic-r) var(--dynamic-g) var(--dynamic-b) / <alpha-value>)',
                'dynamic-text': 'var(--dynamic-text)'
            }
        }
    },
    darkMode: 'class',
    plugins: [heroui({
        themes: {
            light: {
                colors: {
                    'content': '#000000',
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
                    'tablehead': '#dedede',
                    'tablerow': '#f1f1f1',
                    'tablerowalt': '#f7f7f7',
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
                    'content': '#ffffff',
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
                    'tablehead': '#131313',
                    'tablerow': '#1a1a1a',
                    'tablerowalt': '#161616',
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
            'nordic': {
                colors: {
                    'content': '#000000',
                    'offwhite': '#ffffff',
                    'altwhite': '#5c6674',
                    'titlebar': '#edf3fc',
                    'titlehover': '#dde6f1',
                    'base': '#f3f8ff',
                    'container': '#f7f7f7',
                    'containerhover': '#f5f5f5',
                    'footer': '#efefef',
                    'border': '#e3e3e3',
                    'input': '#f3f8ff',
                    'link': '#006fee',
                    'linkhover': '#4b82bb',
                    'modalheader': '#eff6ff',
                    'modalbody': '#fafafa',
                    'modalfooter': '#ffffff',
                    'notibase': '#fafafa',
                    'notihead': '#eff6ff',
                    'notiunread': '#ffffff',
                    'notihover': '#f5f5f5',
                    'tablehead': '#cdd7e4',
                    'tablerow': '#ebf1f9',
                    'tablerowalt': '#dee7f3',
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
            'coffee': {
                colors: {
                    'content': '#2c1b12',
                    'offwhite': '#f4e8d8',
                    'altwhite': '#c2a97d',
                    'titlebar': '#7b5e42',
                    'titlehover': '#6a4e36',
                    'base': '#a88d72',
                    'container': '#f1e1c6',
                    'containerhover': '#e7d6b8',
                    'footer': '#a38b69',
                    'border': '#8b7256',
                    'input': '#c8b091',
                    'link': '#6b3e2e',
                    'linkhover': '#5c3225',
                    'modalheader': '#9c7859',
                    'modalbody': '#f6f0e2',
                    'modalfooter': '#f4e8d8',
                    'notibase': '#e7dac6',
                    'notihead': '#b39575',
                    'notiunread': '#f6f0e2',
                    'notihover': '#d4b999',
                    'tablehead': '#a68b6d',
                    'tablerow': '#dbc4a4',
                    'tablerowalt': '#c2a97d',
                    primary: {
                        DEFAULT: '#5c3d2e',
                    },
                    secondary: {
                        DEFAULT: '#7b5e42',
                    },
                    danger: {
                        DEFAULT: '#a83232',
                        foreground: '#fff'
                    }
                }
            },
            'forest': {
                colors: {
                    'content': '#ffffff',
                    'offwhite': '#e6f2eb',
                    'altwhite': '#a4c8b5',
                    'titlebar': '#274e3f',
                    'titlehover': '#1f4235',
                    'base': '#2c5444',
                    'container': '#cbe4d7',
                    'containerhover': '#b8d9c7',
                    'footer': '#8fa89b',
                    'border': '#36584b',
                    'input': '#d5eadd',
                    'link': '#285943',
                    'linkhover': '#1e4a38',
                    'modalheader': '#3c6652',
                    'modalbody': '#e6f2eb',
                    'modalfooter': '#f4f8f5',
                    'notibase': '#e0f2e9',
                    'notihead': '#b8d9c7',
                    'notiunread': '#e6f2eb',
                    'notihover': '#cbe4d7',
                    'tablehead': '#6a8d7d',
                    'tablerow': '#cbe4d7',
                    'tablerowalt': '#b8d9c7',
                    primary: {
                        DEFAULT: '#3c6652',
                    },
                    secondary: {
                        DEFAULT: '#285943',
                    },
                    danger: {
                        DEFAULT: '#d63031',
                        foreground: '#fff'
                    }
                }
            },
            'high-contrast': {
                colors: {
                    'content': '#ffffff',
                    'offwhite': '#ebebeb',
                    'altwhite': '#a9a9a9',
                    'titlebar': '#000000',
                    'titlehover': '#2b2b2b',
                    'base': '#000000',
                    'container': '#161616',
                    'containerhover': '#252525',
                    'footer': '#0f0f0f',
                    'border': '#ffffff',
                    'input': '#000000',
                    'link': '#5a95d3',
                    'linkhover': '#4b82bb',
                    'modalheader': '#121212',
                    'modalbody': '#171717',
                    'modalfooter': '#121212',
                    'notibase': '#101010',
                    'notihead': '#181818',
                    'notiunread': '#212121',
                    'notihover': '#1e1e1e',
                    'tablehead': '#0a0a0a',
                    'tablerow': '#000000',
                    'tablerowalt': '#0a0a0a',
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
