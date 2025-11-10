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

      <Script strategy='lazyOnload'>
        {`
          window.$crisp=[];
          window.CRISP_WEBSITE_ID="eb33074a-5483-48db-a289-f727b77679d5";
          (function(){
            var d=document;
            var s=d.createElement("script");
            s.src="https://client.crisp.chat/l.js";
            s.async=1;
            d.getElementsByTagName("head")[0].appendChild(s);
          })();
        `}
      </Script>

      <main className={`${inter.className} h-full min-h-screen bg-base text-content`}>{children}</main>
    </>
  )
}
