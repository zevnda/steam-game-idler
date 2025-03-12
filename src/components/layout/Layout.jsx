import { Fragment } from 'react';
import Head from 'next/head';
import { GeistSans } from 'geist/font/sans';

export default function Layout({ children }) {
    return (
        <Fragment>
            <Head>
                <title>Steam Game Idler</title>
            </Head>

            <main className={`${GeistSans.className} h-full min-h-screen bg-base text-content`}>
                {children}
            </main>
        </Fragment>
    );
}