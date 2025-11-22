import type { ReactElement, ReactNode } from 'react'

import { Inter } from 'next/font/google'
import Head from 'next/head'
import Image from 'next/image'
import Script from 'next/script'

import { useNavigationContext } from '@/components/contexts/NavigationContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function Layout({ children }: { children: ReactNode }): ReactElement {
  const { activePage } = useNavigationContext()

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

      {activePage !== 'settings' && (
        <>
          <Image
            src='/bg.webp'
            className='absolute top-0 left-0 w-full h-full object-cover pointer-events-none'
            alt='background'
            width={1920}
            height={1080}
            priority
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 40%)',

              zIndex: 1,
            }}
          />

          <div className='absolute top-0 left-0 bg-base/80 w-full h-screen backdrop-blur-lg pointer-events-none z-1' />
        </>
      )}

      <main className={`${inter.className} h-full min-h-screen bg-base text-content`}>{children}</main>
    </>
  )
}
