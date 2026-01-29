import type { PropsWithChildren } from 'react'

import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'

import { i18n } from '@/shared/config'

type Props = PropsWithChildren

export const I18nProvider = ({ children }: Props) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
