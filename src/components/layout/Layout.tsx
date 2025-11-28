import type { ReactElement, ReactNode } from 'react'

import { useEffect, useState } from 'react'
import { useStateStore } from '@/stores/stateStore'
import { useUserStore } from '@/stores/userStore'
import { Inter } from 'next/font/google'
import Head from 'next/head'
import Image from 'next/image'
import Script from 'next/script'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function Layout({ children }: { children: ReactNode }): ReactElement {
  const loadingUserSummary = useStateStore(state => state.loadingUserSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const isPro = useUserStore(state => state.isPro)
  const [customBackground, setCustomBackground] = useState('')

  useEffect(() => {
    if (userSettings?.general?.customBackground) {
      setCustomBackground(userSettings.general.customBackground)
    } else {
      setCustomBackground('')
    }
  }, [userSettings])

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

      {!loadingUserSummary && customBackground && isPro && (
        <>
          <Image
            src={customBackground}
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

          <div className='absolute top-0 left-0 bg-base/80 w-full h-screen backdrop-blur-xs pointer-events-none z-1' />
        </>
      )}

      <main className={`${inter.className} h-full min-h-screen text-content bg-gradient-bg`}>{children}</main>
    </>
  )
}
