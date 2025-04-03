import { GeistSans } from 'geist/font/sans';
import Head from 'next/head';
import type { ReactElement, ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }): ReactElement {
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