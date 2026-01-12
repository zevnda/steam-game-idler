import type { ReactElement, ReactNode } from 'react'

import { Inter } from 'next/font/google'
import Head from 'next/head'

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

      <main className={`${inter.className} h-full min-h-screen text-content bg-gradient-bg`}>{children}</main>
    </>
  )
}
