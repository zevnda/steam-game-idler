import { useTranslation } from 'react-i18next'

export const HomePage = () => {
  const { t } = useTranslation()

  return (
    <div className='bg-black h-screen w-screen'>
      <p>{t('sample')}</p>
    </div>
  )
}
