import type { AppProps } from 'next/app'
import { HeroUIProvider, ToastProvider } from '@heroui/react'
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
import { TbX } from 'react-icons/tb'

export default function App({ Component, pageProps }: AppProps) {
  const { loaderVisible, loaderFadeOut } = useLoaderStore()

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
              <ToastProvider
                toastProps={{
                  radius: 'sm',
                  variant: 'flat',
                  timeout: 3000,
                  shouldShowTimeoutProgress: true,
                  closeIcon: <TbX size={16} className='text-content' />,
                  classNames: {
                    base: ['bg-sidebar border-none cursor-default'],
                    description: ['text-content text-sm font-medium'],
                    closeButton: ['opacity-100 absolute right-1 top-1 hover:bg-item-hover'],
                  },
                }}
              />
              <MainLayout>
                {loaderVisible && <FullScreenLoader loaderFadeOut={loaderFadeOut} />}
                <Component {...pageProps} />
              </MainLayout>
            </HeroUIProvider>
          </I18nProvider>
        </ThemeProvider>
      </ConfigProvider>
    </ErrorBoundaryProvider>
  )
}
