import type { ReactElement, ReactNode } from 'react'

import { Inter } from 'next/font/google'
import Head from 'next/head'
import Script from 'next/script'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function Layout({ children }: { children: ReactNode }): ReactElement {
  return (
    <>
      <Head>
        <title>Steam Game Idler</title>
      </Head>

      <Script id='chatway' src='https://cdn.chatway.app/widget.js?id=1F2cY0TT2RKh' />
      <Script id='chatway-hide-icon' strategy='afterInteractive'>
        {`
          window.$chatwayOnLoad = function() {
            if (window.$chatway && typeof window.$chatway.hideChatwayIcon === 'function') {
              window.$chatway.hideChatwayIcon();
            }
          };
        `}
      </Script>

      <main className={`${inter.className} h-full min-h-screen text-content bg-gradient-bg`}>{children}</main>
    </>
  )
}
