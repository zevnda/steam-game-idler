// eslint-disable-next-line @typescript-eslint/no-require-imports
const { heroui } = require('@heroui/react');

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
            }
        }
    },
    darkMode: 'class',
    plugins: [heroui({
        themes: {
            light: {
                colors: {
                    'base': '#f6f6f6',
                    'container': '#f7f7f7',
                    'containerhover': '#f5f5f5',
                    'dynamic': '#4894e7',
                    'content': '#000000',
                    'offwhite': '#ebebeb',
                    'altwhite': '#5c6674',
                    'titlebar': '#ffffff',
                    'titlehover': '#ececec',
                    'button-text': '#ffffff',
                    'border': '#e3e3e3',
                    'header-border': '#e3e3e3',
                    'input': '#f7f7f7',
                    'inputhover': '#f0f0f0',
                    'modalheader': '#ffffff',
                    'modalbody': '#fafafa',
                    'modalbody-hover': '#f4f4f4',
                    'modalfooter': '#ffffff',
                    'tablehead': '#efefef',
                    'tablerow': '#f1f1f1',
                    'tablerowalt': '#f7f7f7',
                    'link': '#006fee',
                    'linkhover': '#4b82bb',
                    'tab-select': '#f6f6f6',
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
                    'base': '#101010',
                    'container': '#161616',
                    'containerhover': '#252525',
                    'dynamic': '#1c79de',
                    'content': '#ffffff',
                    'offwhite': '#ebebeb',
                    'altwhite': '#a9a9a9',
                    'titlebar': '#141414',
                    'titlehover': '#2b2b2b',
                    'button-text': '#ffffff',
                    'border': '#272727',
                    'header-border': '#272727',
                    'input': '#181818',
                    'inputhover': '#1e1e1e',
                    'modalheader': '#121212',
                    'modalbody': '#171717',
                    'modalbody-hover': '#1e1e1e',
                    'modalfooter': '#121212',
                    'tablehead': '#131313',
                    'tablerow': '#1a1a1a',
                    'tablerowalt': '#161616',
                    'link': '#5a95d3',
                    'linkhover': '#4b82bb',
                    'tab-select': '#242424',
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
            ash: {
                colors: {
                    'base': '#16181C',
                    'container': '#16181C',
                    'containerhover': '#1c1d22',
                    'dynamic': '#3f7dc8',
                    'content': '#ffffff',
                    'offwhite': '#ebebeb',
                    'altwhite': '#a9a9a9',
                    'titlebar': '#26292F',
                    'titlehover': '#35383f',
                    'button-text': '#ffffff',
                    'border': '#404144',
                    'header-border': '#434956',
                    'input': '#202328',
                    'inputhover': '#22252a',
                    'modalheader': '#26292F',
                    'modalbody': '#22252a',
                    'modalbody-hover': '#1c1e23',
                    'modalfooter': '#26292F',
                    'tablehead': '#22252a',
                    'tablerow': '#16181C',
                    'tablerowalt': '#1c1d22',
                    'link': '#5a95d3',
                    'linkhover': '#4b82bb',
                    'tab-select': '#1f2125',
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
            oled: {
                colors: {
                    'base': '#000000',
                    'container': '#161616',
                    'containerhover': '#252525',
                    'dynamic': '#1c79de',
                    'content': '#ffffff',
                    'offwhite': '#ebebeb',
                    'altwhite': '#a9a9a9',
                    'titlebar': '#060606',
                    'titlehover': '#191919',
                    'button-text': '#ffffff',
                    'border': '#181818',
                    'header-border': '#181818',
                    'input': '#111111',
                    'inputhover': '#151515',
                    'modalheader': '#060606',
                    'modalbody': '#000000',
                    'modalbody-hover': '#060606',
                    'modalfooter': '#060606',
                    'tablehead': '#131313',
                    'tablerow': '#1a1a1a',
                    'tablerowalt': '#161616',
                    'link': '#5a95d3',
                    'linkhover': '#4b82bb',
                    'tab-select': '#242424',
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
