import type { Dispatch, ReactElement, SetStateAction } from 'react'

import { Button, cn } from '@heroui/react'
import { useTranslation } from 'react-i18next'

import ExtLink from '@/components/ui/ExtLink'

interface PrivateProps {
  setRefreshKey: Dispatch<SetStateAction<number>>
}

export default function Private({ setRefreshKey }: PrivateProps): ReactElement {
  const { t } = useTranslation()

  const handleRefresh = (): void => {
    setRefreshKey(prevKey => prevKey + 1)
  }

  return (
    <div className='flex justify-center items-center w-calc h-full'>
      <div
        className={cn(
          'flex justify-center items-center flex-col border bg-titlebar',
          'border-border w-[420px] rounded-xl shadow-sm',
        )}
      >
        <div className='flex items-center flex-col gap-3 pt-8 pb-2'>
          <p className='text-3xl font-semibold text-content'>Uh-oh!</p>
        </div>
        <div className='flex justify-center items-center flex-col pb-8 px-6'>
          <div className='flex justify-center items-center flex-col'>
            <p className='text-center font-medium text-content mb-5'>{t('gamesList.private.message')}</p>
            <ul className='text-center text-sm space-y-1 text-altwhite'>
              <li>{t('gamesList.private.reason.1')}</li>
              <li>{t('gamesList.private.reason.2')}</li>
              <li>{t('gamesList.private.reason.3')}</li>
              <li>{t('gamesList.private.reason.4')}</li>
            </ul>
          </div>
          <ExtLink
            href='https://steamcommunity.com/my/edit/settings'
            className='text-sm text-link hover:text-linkhover mt-6 font-medium'
          >
            {t('gamesList.private.change')}
          </ExtLink>
          <Button
            size='sm'
            className='font-medium rounded-lg mt-6 bg-dynamic text-button-text px-6 shadow-sm hover:shadow-md transition-shadow'
            onPress={handleRefresh}
          >
            {t('gamesList.private.tryAgain')}
          </Button>
        </div>
      </div>
    </div>
  )
}
