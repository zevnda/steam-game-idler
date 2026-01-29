import { emit } from '@tauri-apps/api/event'

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function Index() {
  const { t } = useTranslation()

  // Emits the 'ready' event to Tauri backend when the component is mounted
  useEffect(() => {
    emit('ready')
  }, [])

  return (
    <div className='bg-black h-screen w-screen'>
      <p>{t('sample')}</p>
    </div>
  )
}
