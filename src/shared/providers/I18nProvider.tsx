import type { ReactElement, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/i18n'

export default function I18nProvider({ children }: { children: ReactNode }): ReactElement | null {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
