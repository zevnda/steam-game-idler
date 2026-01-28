import type { AppProps } from 'next/app'
import type { ReactElement } from 'react'

import { HeroUIProvider } from '@heroui/react'

import '@/styles/globals.css'

import { ThemeProvider } from '@/styles/ThemeProvider'

export default function App({ Component, pageProps }: AppProps): ReactElement {
  return (
    <ThemeProvider
      attribute='class'
      themes={['dark']}
      enableSystem={true}
      defaultTheme='dark'
      disableTransitionOnChange
    >
      <HeroUIProvider>
        <Component {...pageProps} />
      </HeroUIProvider>
    </ThemeProvider>
  )
}
