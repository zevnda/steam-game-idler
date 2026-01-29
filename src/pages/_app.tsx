import type { AppProps } from 'next/app'

import { HeroUIProvider } from '@heroui/react'

import '@/styles/globals.css'

import { ErrorBoundaryProvider, I18nProvider, ThemeProvider } from '@/shared/ui'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundaryProvider>
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
    </ErrorBoundaryProvider>
  )
}
