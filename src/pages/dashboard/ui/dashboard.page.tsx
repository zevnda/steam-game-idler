import { useTranslation } from 'react-i18next'
import { getRuntimeConfig } from '@/shared/config'

export const DashboardPage = () => {
  const { t } = useTranslation()

  const { isPortable } = getRuntimeConfig()

  return (
    <div className='h-calc w-screen'>
      <p>{t('sample')}</p>
      <p>{`isPortable: ${String(isPortable)}`}</p>
      <p>Dashboard Page</p>
    </div>
  )
}
