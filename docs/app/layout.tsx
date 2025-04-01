import { GeistSans } from 'geist/font/sans';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Layout, Navbar } from 'nextra-theme-docs';
import type { ReactElement, ReactNode } from 'react';

import Logo from '@docs/components/Logo';
import 'nextra-theme-docs/style.css';
import './globals.css';

export const metadata = {
    description: 'An automatic Steam trading card farmer and achievement unlocker, with a modern UI',
    metadataBase: new URL('https://steamgameidler.vercel.app/'),
    keywords: [
        'Steam Game Idler',
        'Steam',
        'Automation',
        'Steam Idler',
        'Steam Tools',
        'Steam Trading Cards',
        'Steam Achievement Unlocker',
        'Steam Achievements',
    ],
    authors: [{ name: 'zevnda', url: 'https://github.com/zevnda' }],
    creator: 'zevnda',
    generator: 'Next.js',
    applicationName: 'Steam Game Idler',
    appleWebApp: {
        title: 'Steam Game Idler',
    },
    title: {
        default: 'Steam Game Idler – An automatic Steam trading card farmer and achievement unlocker',
        template: '%s | Steam Game Idler',
    },
    openGraph: {
        url: 'https://steamgameidler.vercel.app',
        siteName: 'Steam Game Idler',
        images: 'https://steamgameidler.vercel.app/og-image.png',
        locale: 'en_US',
        type: 'article',
    },
    other: {
        'msapplication-TileColor': '#fff',
    },
    twitter: {
        site: 'https://steamgameidler.vercel.app/',
    },
    alternates: {
        canonical: './',
    },
};

const navbar = (
    <Navbar logo={<Logo />} projectLink='https://github.com/zevnda/steam-game-idler' />
);

export default async function RootLayout({
    children
}: {
    children: ReactNode
}): Promise<ReactElement> {
    return (
        <html lang='en' dir='ltr' suppressHydrationWarning>
            <Head
                backgroundColor={{
                    light: '#fafafa',
                    dark: '#101010',
                }}
            />
            <body className={`${GeistSans.className} text-sm`}>
                <Layout
                    navbar={navbar}
                    pageMap={await getPageMap()}
                    docsRepositoryBase='https://github.com/zevnda/steam-game-idler/tree/main/docs'
                    editLink='Edit on GitHub'
                    sidebar={{ defaultMenuCollapseLevel: 1, toggleButton: false }}
                    footer={<div />}
                    feedback={{ content: 'Give us feedback' }}
                >
                    {children}
                </Layout>
            </body>
        </html>
    );
}