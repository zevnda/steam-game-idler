import { Geist, Geist_Mono } from 'next/font/google'
import '../globals.css'

interface LayoutProps {
  children: React.ReactNode
}

const geist = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const mono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Changelog | Steam Game Idler',
  metadataBase: new URL('https://steamgameidler.com/'),
}

// Runs before first paint: the desktop app passes `?scheme=light` while a light theme preset is
// active, so the page's text/tag colors flip and its color-scheme matches the app's - a mismatched
// scheme makes the browser paint an opaque canvas behind this (otherwise transparent) iframe.
const schemeInitScript =
  '(function(){try{if(new URLSearchParams(location.search).get("scheme")==="light"){var h=document.documentElement;h.classList.remove("dark");h.style.colorScheme="light";h.dataset.scheme="light"}}catch(e){}})()'

export default function Layout({ children }: LayoutProps) {
  return (
    <html
      lang='en'
      className={`${geist.variable} ${mono.variable} dark`}
      style={{ colorScheme: 'dark' }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: schemeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
