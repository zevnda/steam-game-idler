import type { AppProps } from 'next/app'

import { HeroUIProvider } from '@heroui/react'

import '@/styles/globals.css'

import '@/shared/config'
import { ThemeProvider } from '@/shared/ui'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute='class'
      themes={['dark']}
      enableSystem
      defaultTheme='dark'
      disableTransitionOnChange
    >
      <HeroUIProvider>
        <Component {...pageProps} />
      </HeroUIProvider>
    </ThemeProvider>
  )
}
