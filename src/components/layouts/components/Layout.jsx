import React from 'react';
import Head from 'next/head';
import { GeistSans } from 'geist/font/sans';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from 'next-themes';

export default function Layout({ children }) {
    const { theme } = useTheme();

    return (
        <React.Fragment>
            <Head>
                <title>Steam Game Idler</title>
            </Head>

            <main className={`${GeistSans.className} h-full min-h-screen bg-base`}>
                {children}
            </main>
            <ToastContainer
                toastStyle={{ fontSize: 12 }}
                toastClassName={() => 'relative flex min-h-10 justify-between overflow-hidden p-2 bg-container text-black dark:text-offwhite border border-border rounded mt-2'}
                position='bottom-right'
                theme={theme}
                transition={Slide}
                pauseOnFocusLoss={false}
                limit={2}
                pauseOnHover={false}
                newestOnTop
                autoClose={1500}
            />
        </React.Fragment>
    );
}