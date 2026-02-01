import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Titlebar } from '../titlebar/Titlebar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const MainLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <>
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

      <div className={`${inter.className} bg-base h-screen w-screen`}>
        <Titlebar />
        <main>{children}</main>
      </div>
    </>
  )
}
