import React, { useEffect } from 'react';
import Head from 'next/head';
import { GeistSans } from 'geist/font/sans';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from 'next-themes';

export default function Layout({ children }) {
    const { theme } = useTheme();

    const getToastStyles = () => {
        if (typeof window === 'undefined') return {};

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDarkMode = theme === 'system' ? prefersDark : theme === 'dark';

        const background = isDarkMode ? '#141414' : '#f5f5f5';
        const border = isDarkMode ? '1px solid #333' : '1px solid #ccc';
        const color = isDarkMode ? '#fff' : '#000';

        return { background, border, color, fontSize: 12 };
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const toastContainers = document.querySelectorAll('.Toastify__toast');
        toastContainers.forEach(container => {
            Object.assign(container.style, getToastStyles());
        });
    }, [theme]);

    return (
        <React.Fragment>
            <Head>
                <title>Steam Game Idler</title>
            </Head>

            <main className={`${GeistSans.className} h-full min-h-screen bg-base`}>
                {children}
            </main>
            <ToastContainer
                toastStyle={getToastStyles()}
                position='bottom-right'
                theme={theme}
                transition={Slide}
                pauseOnFocusLoss={false}
                limit={2}
                pauseOnHover={false}
                newestOnTop
                autoClose={2000}
            />
        </React.Fragment>
    );
}