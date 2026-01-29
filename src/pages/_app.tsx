import type { AppProps } from 'next/app'

import { HeroUIProvider } from '@heroui/react'

import '@/styles/globals.css'

import { ThemeProvider, I18nProvider } from '@/shared/ui'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute='class'
      themes={['dark']}
      enableSystem
      defaultTheme='dark'
      disableTransitionOnChange
    >
      <I18nProvider>
        <HeroUIProvider>
          <Component {...pageProps} />
        </HeroUIProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
