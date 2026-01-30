import { getRuntimeConfig } from '@/shared/config'
import { useTranslation } from 'react-i18next'

export const HomePage = () => {
  const { t } = useTranslation()

  const { isPortable } = getRuntimeConfig()

  return (
    <div className='bg-black h-screen w-screen'>
      <p>{t('sample')}</p>
      <p>{`isPortable: ${String(isPortable)}`}</p>
    </div>
  )
}
