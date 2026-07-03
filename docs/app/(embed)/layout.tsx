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

export default function Layout({ children }: LayoutProps) {
  return (
    <html
      lang='en'
      className={`${geist.variable} ${mono.variable} dark`}
      style={{ colorScheme: 'dark' }}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  )
}
