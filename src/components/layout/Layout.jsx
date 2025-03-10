import { Fragment, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Head from 'next/head';

import { GeistSans } from 'geist/font/sans';

import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Layout({ children }) {
    const { theme } = useTheme();

    const getToastStyles = () => {
        if (typeof window === 'undefined') return {};

        const darkThemes = ['dark', 'midnight', 'amethyst', 'emerald', 'cherry', 'cosmic', 'mint', 'arctic', 'nightshade'];
        const isDarkMode = darkThemes.includes(theme);

        const themeColors = {
            light: { background: '#f5f5f5', border: '#e3e3e3' },
            dark: { background: '#141414', border: '#272727' },
            nordic: { background: '#e0eafc', border: '#e3e3e3' },
            pastel: { background: '#fef0ff', border: '#e8d5f4' },
            sunshine: { background: '#fff8e0', border: '#f2e8cc' },
            seafoam: { background: '#e0fff8', border: '#cceee7' },
            blossom: { background: '#ffe0f0', border: '#f2d5dc' },
            meadow: { background: '#e0ffe8', border: '#b8f4c5' },
            sandstone: { background: '#fff0e0', border: '#f4c5b8' },
            icicle: { background: '#e0f8ff', border: '#b8daf4' },
            midnight: { background: '#0a0d14', border: '#171d2d' },
            amethyst: { background: '#3a204a', border: '#4e3570' },
            emerald: { background: '#0f4939', border: '#1e5d47' },
            cherry: { background: '#5a1723', border: '#6d2a3a' },
            cosmic: { background: '#25122d', border: '#2c2654' },
            mint: { background: '#20453d', border: '#286e61' },
            arctic: { background: '#2d3c4a', border: '#2f5669' },
            nightshade: { background: '#301550', border: '#3c2777' }
        };

        const { background, border } = themeColors[theme] || (isDarkMode ? { background: '#141414', border: '#333' } : { background: '#f5f5f5', border: '#ccc' });
        const color = isDarkMode ? '#fff' : '#000';

        return { background, border: `1px solid ${border}`, color, fontSize: 12 };
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const toastContainers = document.querySelectorAll('.Toastify__toast');
        toastContainers.forEach(container => {
            Object.assign(container.style, getToastStyles());
        });
    }, [theme]);

    return (
        <Fragment>
            <Head>
                <title>Steam Game Idler</title>
            </Head>

            <main className={`${GeistSans.className} h-full min-h-screen bg-base text-content`}>
                {children}
            </main>

            <ToastContainer
                toastStyle={getToastStyles()}
                position='bottom-right'
                theme={theme}
                transition={Slide}
                pauseOnHover
                pauseOnFocusLoss={false}
                limit={2}
                newestOnTop
                autoClose={3000}
            />
        </Fragment>
    );
}