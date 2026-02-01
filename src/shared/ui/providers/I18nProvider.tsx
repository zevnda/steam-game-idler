import { useEffect, useState } from 'react'
import { i18n } from '@/shared/config'
import { I18nextProvider } from 'react-i18next'

type Props = React.PropsWithChildren

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
