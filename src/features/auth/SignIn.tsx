import { useState } from 'react'
import { openExternalLink } from '@/shared/utils'
import { useTranslation } from 'react-i18next'
import { useLoaderStore } from '@/shared/stores'
import { Hero } from './Hero'
import { UserSelection } from './UserSelection'
import { useIndex } from './hooks/useIndex'

// TODO: Add language switcher once implemented

export const SignIn = () => {
  const { t } = useTranslation()
  const { showLoader, hideLoader } = useLoaderStore()
  const [refreshKey, setRefreshKey] = useState(0)
  useIndex({ refreshKey })

  const handleRefresh = () => {
    showLoader()
    setRefreshKey(prev => prev + 1)
    setTimeout(() => {
      hideLoader()
    }, 1500)
  }

  return (
    <div key={refreshKey} className='relative w-screen h-screen overflow-hidden'>
      <div className='flex gap-4 w-screen h-screen relative z-10'>
        {/* User selection */}
        <div className='flex flex-col items-center w-[90%] justify-center h-calc'>
          <UserSelection onRefresh={handleRefresh} />
        </div>

        {/* Hero */}
        <div className='relative flex flex-col items-center justify-center w-2/3 h-calc pr-10 select-none'>
          <Hero />
        </div>
      </div>

      {/* Language switch and help */}
      <div className='absolute bottom-0 right-0 p-10 z-20 flex items-center gap-4 pointer-events-none'>
        <button
          type='button'
          className='text-sm text-altwhite hover:text-altwhite/90 duration-150 cursor-pointer pointer-events-auto'
          onClick={() =>
            openExternalLink('https://steamgameidler.com/docs/get-started/how-to-sign-in')
          }
        >
          {t('common.need_help')}
        </button>

        <p>Language Switch Placeholder</p>
      </div>
    </div>
  )
}
