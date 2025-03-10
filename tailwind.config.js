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
                    'content': '#000000',
                    'offwhite': '#ffffff',
                    'altwhite': '#5c6674',
                    'dynamic': '#4894e7',
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
                    'dynamic': '#1c79de',
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
            nordic: {
                colors: {
                    'content': '#000000',
                    'offwhite': '#ffffff',
                    'altwhite': '#5c6674',
                    'dynamic': '#8cafe2',
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
                    'modalbody': '#f3f8ff',
                    'modalfooter': '#eff6ff',
                    'notibase': '#fafafa',
                    'notihead': '#eff6ff',
                    'notiunread': '#ffffff',
                    'notihover': '#f5f5f5',
                    'tablehead': '#cdd7e4',
                    'tablerow': '#ebf1f9',
                    'tablerowalt': '#f4faff',
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
            pastel: {
                colors: {
                    'content': '#333333',
                    'offwhite': '#ffffff',
                    'altwhite': '#6c7884',
                    'dynamic': '#c98ce2',
                    'titlebar': '#fef6ff',
                    'titlehover': '#f7ebfd',
                    'base': '#fcf4ff',
                    'container': '#fefaff',
                    'containerhover': '#f9f0fc',
                    'footer': '#f5ebfc',
                    'border': '#e8d5f4',
                    'input': '#fefaff',
                    'link': '#9a6dd7',
                    'linkhover': '#8259c3',
                    'modalheader': '#fef6ff',
                    'modalbody': '#fcf4ff',
                    'modalfooter': '#fef6ff',
                    'notibase': '#fefaff',
                    'notihead': '#fef6ff',
                    'notiunread': '#f7ebfd',
                    'notihover': '#f2e5f9',
                    'tablehead': '#f2e5f9',
                    'tablerow': '#fef9ff',
                    'tablerowalt': '#fcf3ff',
                    primary: {
                        DEFAULT: '#9a6dd7',
                    },
                    secondary: {
                        DEFAULT: '#738ee5',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            sunshine: {
                colors: {
                    'content': '#3d3223',
                    'offwhite': '#ffffff',
                    'altwhite': '#6c7067',
                    'dynamic': '#d8be7a',
                    'titlebar': '#fffcf0',
                    'titlehover': '#fff9e6',
                    'base': '#fffaed',
                    'container': '#fffdf5',
                    'containerhover': '#fff7e0',
                    'footer': '#fff5e0',
                    'border': '#f2e8cc',
                    'input': '#fffdf5',
                    'link': '#e6a417',
                    'linkhover': '#d09213',
                    'modalheader': '#fffcf0',
                    'modalbody': '#fffaed',
                    'modalfooter': '#fffcf0',
                    'notibase': '#fffdf5',
                    'notihead': '#fffcf0',
                    'notiunread': '#fff9e6',
                    'notihover': '#fff6db',
                    'tablehead': '#fff6db',
                    'tablerow': '#fffdf7',
                    'tablerowalt': '#fff9e8',
                    primary: {
                        DEFAULT: '#f5b72e',
                    },
                    secondary: {
                        DEFAULT: '#e6980f',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            seafoam: {
                colors: {
                    'content': '#223d3a',
                    'offwhite': '#ffffff',
                    'altwhite': '#607872',
                    'dynamic': '#79d4c5',
                    'titlebar': '#f0fffc',
                    'titlehover': '#e6fff9',
                    'base': '#edfffc',
                    'container': '#f5fffd',
                    'containerhover': '#e0fff8',
                    'footer': '#e0fff5',
                    'border': '#cceee7',
                    'input': '#f5fffd',
                    'link': '#17bda7',
                    'linkhover': '#14a794',
                    'modalheader': '#f0fffc',
                    'modalbody': '#edfffc',
                    'modalfooter': '#f0fffc',
                    'notibase': '#f5fffd',
                    'notihead': '#f0fffc',
                    'notiunread': '#e6fff9',
                    'notihover': '#dbfff5',
                    'tablehead': '#dbfff5',
                    'tablerow': '#f7fffd',
                    'tablerowalt': '#edfffb',
                    primary: {
                        DEFAULT: '#20d9c2',
                    },
                    secondary: {
                        DEFAULT: '#17bda7',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            blossom: {
                colors: {
                    'content': '#3d2832',
                    'offwhite': '#ffffff',
                    'altwhite': '#6c6067',
                    'dynamic': '#d17994',
                    'titlebar': '#fff0f5',
                    'titlehover': '#ffe6ee',
                    'base': '#fff5f8',
                    'container': '#fffafb',
                    'containerhover': '#ffe0ea',
                    'footer': '#ffe0e5',
                    'border': '#f2d5dc',
                    'input': '#fffafb',
                    'link': '#e65c8f',
                    'linkhover': '#d14a79',
                    'modalheader': '#fff0f5',
                    'modalbody': '#fff5f8',
                    'modalfooter': '#fff0f5',
                    'notibase': '#fffafb',
                    'notihead': '#fff0f5',
                    'notiunread': '#ffe6ee',
                    'notihover': '#ffdbe7',
                    'tablehead': '#ffdbe7',
                    'tablerow': '#fffbfc',
                    'tablerowalt': '#fff5f8',
                    primary: {
                        DEFAULT: '#f47ba8',
                    },
                    secondary: {
                        DEFAULT: '#e65c8f',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            meadow: {
                colors: {
                    'content': '#2c4a3a',
                    'offwhite': '#ffffff',
                    'altwhite': '#6c8e7c',
                    'dynamic': '#71cc8b',
                    'titlebar': '#f3fff7',
                    'titlehover': '#e9fff0',
                    'base': '#f0fff5',
                    'container': '#f7fff9',
                    'containerhover': '#e3ffef',
                    'footer': '#e0ffe5',
                    'border': '#b8f4c5',
                    'input': '#f7fff9',
                    'link': '#6dd78a',
                    'linkhover': '#59c378',
                    'modalheader': '#f3fff7',
                    'modalbody': '#f0fff5',
                    'modalfooter': '#f3fff7',
                    'notibase': '#f7fff9',
                    'notihead': '#f3fff7',
                    'notiunread': '#e9fff0',
                    'notihover': '#dbffe6',
                    'tablehead': '#dbffe6',
                    'tablerow': '#f6fff9',
                    'tablerowalt': '#e8ffed',
                    primary: {
                        DEFAULT: '#7de69b',
                    },
                    secondary: {
                        DEFAULT: '#6dd78a',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            sandstone: {
                colors: {
                    'content': '#4a3a2c',
                    'offwhite': '#ffffff',
                    'altwhite': '#8e7c6c',
                    'dynamic': '#c99a6b',
                    'titlebar': '#fffaf3',
                    'titlehover': '#fff3e9',
                    'base': '#fff5f0',
                    'container': '#fffaf7',
                    'containerhover': '#ffefe3',
                    'footer': '#ffe5e0',
                    'border': '#f4c5b8',
                    'input': '#fffaf7',
                    'link': '#e6a46d',
                    'linkhover': '#c38b59',
                    'modalheader': '#fffaf3',
                    'modalbody': '#fff5f0',
                    'modalfooter': '#fffaf3',
                    'notibase': '#fffaf7',
                    'notihead': '#fffaf3',
                    'notiunread': '#fff3e9',
                    'notihover': '#ffe6db',
                    'tablehead': '#ffe6db',
                    'tablerow': '#fdf6f0',
                    'tablerowalt': '#f8efe8',
                    primary: {
                        DEFAULT: '#e6b17d',
                    },
                    secondary: {
                        DEFAULT: '#e6a46d',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            icicle: {
                colors: {
                    'content': '#2c3a4a',
                    'offwhite': '#ffffff',
                    'altwhite': '#7c8e9e',
                    'dynamic': '#7db2e6',
                    'titlebar': '#f3fbff',
                    'titlehover': '#e9f7ff',
                    'base': '#f0faff',
                    'container': '#f7fdff',
                    'containerhover': '#e3f6ff',
                    'footer': '#e0f2ff',
                    'border': '#b8daf4',
                    'input': '#f7fdff',
                    'link': '#6db7e6',
                    'linkhover': '#5a9fc3',
                    'modalheader': '#f3fbff',
                    'modalbody': '#f0faff',
                    'modalfooter': '#f3fbff',
                    'notibase': '#f7fdff',
                    'notihead': '#f3fbff',
                    'notiunread': '#e9f7ff',
                    'notihover': '#dbf2ff',
                    'tablehead': '#dbf2ff',
                    'tablerow': '#f6fbff',
                    'tablerowalt': '#eef8ff',
                    primary: {
                        DEFAULT: '#7dd3ff',
                    },
                    secondary: {
                        DEFAULT: '#6db7e6',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            midnight: {
                colors: {
                    'content': '#ffffff',
                    'offwhite': '#ebebeb',
                    'altwhite': '#a9a9a9',
                    'dynamic': '#2f4a9e',
                    'titlebar': '#0a0d14',
                    'titlehover': '#141b29',
                    'base': '#080a10',
                    'container': '#0e1018',
                    'containerhover': '#161c2c',
                    'footer': '#070a0f',
                    'border': '#171d2d',
                    'input': '#0f1219',
                    'link': '#4d8ad3',
                    'linkhover': '#6ba1e9',
                    'modalheader': '#0b0e15',
                    'modalbody': '#0e121a',
                    'modalfooter': '#0b0e15',
                    'notibase': '#080a10',
                    'notihead': '#0c101a',
                    'notiunread': '#131b2a',
                    'notihover': '#111724',
                    'tablehead': '#0e1018',
                    'tablerow': '#12141d',
                    'tablerowalt': '#131723',
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
            amethyst: {
                colors: {
                    'content': '#f4ecff',
                    'offwhite': '#f9f5ff',
                    'altwhite': '#d4c2f0',
                    'dynamic': '#8e42e3',
                    'titlebar': '#30204a',
                    'titlehover': '#3e2a5e',
                    'base': '#221638',
                    'container': '#291c40',
                    'containerhover': '#3f2b5e',
                    'footer': '#1c1230',
                    'border': '#4e3570',
                    'input': '#2d1d44',
                    'link': '#b36bff',
                    'linkhover': '#c68eff',
                    'modalheader': '#30204a',
                    'modalbody': '#291c40',
                    'modalfooter': '#30204a',
                    'notibase': '#221638',
                    'notihead': '#2d1d44',
                    'notiunread': '#3e2a5e',
                    'notihover': '#372552',
                    'tablehead': '#221634',
                    'tablerow': '#2e1f46',
                    'tablerowalt': '#271a3c',
                    primary: {
                        DEFAULT: '#8a42e3',
                    },
                    secondary: {
                        DEFAULT: '#6836b0',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            emerald: {
                colors: {
                    'content': '#e4fff0',
                    'offwhite': '#f0fff7',
                    'altwhite': '#b4e0ca',
                    'dynamic': '#1eb47a',
                    'titlebar': '#0f3929',
                    'titlehover': '#184938',
                    'base': '#0a2a1e',
                    'container': '#0e3425',
                    'containerhover': '#194e3d',
                    'footer': '#081f17',
                    'border': '#1e5d47',
                    'input': '#103a2a',
                    'link': '#4ce4a7',
                    'linkhover': '#6fefbd',
                    'modalheader': '#0f3929',
                    'modalbody': '#0e3425',
                    'modalfooter': '#0f3929',
                    'notibase': '#0a2a1e',
                    'notihead': '#103a2a',
                    'notiunread': '#194e3d',
                    'notihover': '#154536',
                    'tablehead': '#0c2a1c',
                    'tablerow': '#113d2c',
                    'tablerowalt': '#0e3324',
                    primary: {
                        DEFAULT: '#1eb47a',
                    },
                    secondary: {
                        DEFAULT: '#158a5c',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            cherry: {
                colors: {
                    'content': '#ffedf0',
                    'offwhite': '#fff3f5',
                    'altwhite': '#e7c0c7',
                    'dynamic': '#ff6b89',
                    'titlebar': '#4a1723',
                    'titlehover': '#5e1f2d',
                    'base': '#38111b',
                    'container': '#421520',
                    'containerhover': '#5e1f2d',
                    'footer': '#2f0e17',
                    'border': '#6d2a3a',
                    'input': '#471722',
                    'link': '#ff6b89',
                    'linkhover': '#ff8ca4',
                    'modalheader': '#4a1723',
                    'modalbody': '#421520',
                    'modalfooter': '#4a1723',
                    'notibase': '#38111b',
                    'notihead': '#471722',
                    'notiunread': '#612130',
                    'notihover': '#561c29',
                    'tablehead': '#38101a',
                    'tablerow': '#4a1824',
                    'tablerowalt': '#41141e',
                    primary: {
                        DEFAULT: '#db2e4c',
                    },
                    secondary: {
                        DEFAULT: '#b0273d',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            cosmic: {
                colors: {
                    'content': '#f1edff',
                    'offwhite': '#f7f5ff',
                    'altwhite': '#c9c2e6',
                    'dynamic': '#7a4eff',
                    'titlebar': '#15122d',
                    'titlehover': '#1e1a3b',
                    'base': '#0e0b22',
                    'container': '#131029',
                    'containerhover': '#201c40',
                    'footer': '#0a081b',
                    'border': '#2c2654',
                    'input': '#15122e',
                    'link': '#9b7aff',
                    'linkhover': '#b69dff',
                    'modalheader': '#15122d',
                    'modalbody': '#131029',
                    'modalfooter': '#15122d',
                    'notibase': '#0e0b22',
                    'notihead': '#15122e',
                    'notiunread': '#211d42',
                    'notihover': '#1c193a',
                    'tablehead': '#100d24',
                    'tablerow': '#171431',
                    'tablerowalt': '#141129',
                    primary: {
                        DEFAULT: '#6a4ee3',
                    },
                    secondary: {
                        DEFAULT: '#4f38b0',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            mint: {
                colors: {
                    'content': '#e8fff8',
                    'offwhite': '#f2fffc',
                    'altwhite': '#b9e5da',
                    'dynamic': '#20b396',
                    'titlebar': '#18453d',
                    'titlehover': '#215a4f',
                    'base': '#10352d',
                    'container': '#164038',
                    'containerhover': '#23594f',
                    'footer': '#0d2a24',
                    'border': '#286e61',
                    'input': '#18453d',
                    'link': '#4fdec3',
                    'linkhover': '#76f1d9',
                    'modalheader': '#18453d',
                    'modalbody': '#164038',
                    'modalfooter': '#18453d',
                    'notibase': '#10352d',
                    'notihead': '#18453d',
                    'notiunread': '#23594f',
                    'notihover': '#1e4f46',
                    'tablehead': '#11342b',
                    'tablerow': '#194840',
                    'tablerowalt': '#153e36',
                    primary: {
                        DEFAULT: '#20b396',
                    },
                    secondary: {
                        DEFAULT: '#178776',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            arctic: {
                colors: {
                    'content': '#eafaff',
                    'offwhite': '#f2fdff',
                    'altwhite': '#c0dee7',
                    'dynamic': '#2aa3c9',
                    'titlebar': '#1d3c4a',
                    'titlehover': '#264c5e',
                    'base': '#162f3b',
                    'container': '#1b3745',
                    'containerhover': '#274c5e',
                    'footer': '#122730',
                    'border': '#2f5669',
                    'input': '#1d3c4a',
                    'link': '#5dc7e6',
                    'linkhover': '#84d7ee',
                    'modalheader': '#1d3c4a',
                    'modalbody': '#1b3745',
                    'modalfooter': '#1d3c4a',
                    'notibase': '#162f3b',
                    'notihead': '#1d3c4a',
                    'notiunread': '#274c5e',
                    'notihover': '#224354',
                    'tablehead': '#162e39',
                    'tablerow': '#1e3e4c',
                    'tablerowalt': '#1a3642',
                    primary: {
                        DEFAULT: '#2aa3c9',
                    },
                    secondary: {
                        DEFAULT: '#1f7e9c',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            },
            nightshade: {
                colors: {
                    'content': '#f0edff',
                    'offwhite': '#f6f4ff',
                    'altwhite': '#c7c2e6',
                    'dynamic': '#7a4eff',
                    'titlebar': '#201550',
                    'titlehover': '#2a1c68',
                    'base': '#17103e',
                    'container': '#1c1349',
                    'containerhover': '#2b1d6a',
                    'footer': '#120c32',
                    'border': '#3c2777',
                    'input': '#1f154f',
                    'link': '#a77dff',
                    'linkhover': '#bfa0ff',
                    'modalheader': '#201550',
                    'modalbody': '#1c1349',
                    'modalfooter': '#201550',
                    'notibase': '#17103e',
                    'notihead': '#1f154f',
                    'notiunread': '#2c1d6c',
                    'notihover': '#271a60',
                    'tablehead': '#17103c',
                    'tablerow': '#211651',
                    'tablerowalt': '#1c1348',
                    primary: {
                        DEFAULT: '#6e42e8',
                    },
                    secondary: {
                        DEFAULT: '#5230c0',
                    },
                    danger: {
                        DEFAULT: '#ef4444',
                        foreground: '#fff'
                    }
                }
            }
        }
    })],
};
