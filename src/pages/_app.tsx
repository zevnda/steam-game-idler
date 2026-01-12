import type { AppProps } from 'next/app'
import type { ReactElement } from 'react'

import { HeroUIProvider, ToastProvider } from '@heroui/react'
import { TbX } from 'react-icons/tb'

import { ThemeProvider } from '@/components/ui/theme/ThemeProvider'

import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps): ReactElement {
  return (
    <ThemeProvider
      attribute='class'
      // Themes
      themes={['dark', 'black']}
      enableSystem={true}
      defaultTheme='dark'
      disableTransitionOnChange
    >
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
        <Component {...pageProps} />
      </HeroUIProvider>
    </ThemeProvider>
  )
}
