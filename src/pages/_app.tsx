import type { AppProps } from 'next/app'
import { HeroUIProvider } from '@heroui/react'
import {
  ThemeProvider,
  I18nProvider,
  ErrorBoundaryProvider,
  MainLayout,
  FullScreenLoader,
  ConfigProvider,
} from '@/shared/ui'
import '@/styles/globals.css'
import { useLoaderStore } from '@/shared/stores'

export default function App({ Component, pageProps }: AppProps) {
  const { visible, fadeOut } = useLoaderStore()

  return (
    <ErrorBoundaryProvider>
      <ConfigProvider>
        <ThemeProvider
          attribute='class'
          themes={['dark']}
          enableSystem
          defaultTheme='dark'
          disableTransitionOnChange
        >
          <I18nProvider>
            <HeroUIProvider>
              <MainLayout>
                {visible && <FullScreenLoader fadeOut={fadeOut} />}
                <Component {...pageProps} />
              </MainLayout>
            </HeroUIProvider>
          </I18nProvider>
        </ThemeProvider>
      </ConfigProvider>
    </ErrorBoundaryProvider>
  )
}
