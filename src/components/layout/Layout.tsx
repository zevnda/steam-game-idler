import { GeistSans } from 'geist/font/sans';
import Head from 'next/head';
import type { JSX, ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }): JSX.Element {
    return (
        <>
            <Head>
                <title>Steam Game Idler</title>
            </Head>

            <main className={`${GeistSans.className} h-full min-h-screen bg-base text-content`}>
                {children}
            </main>
        </>
    );
}