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
          'border-border w-[50%] rounded-lg',
        )}
      >
        <div className='flex items-center flex-col gap-2 p-6'>
          <p className='text-4xl font-bold'>Uh-oh!</p>
        </div>
        <div className='flex justify-center items-center flex-col pb-6'>
          <div className='flex justify-center items-center flex-col'>
            <p className='text-center font-bold px-3'>{t('gamesList.private.message')}</p>
            <ul className='text-center text-sm mt-4'>
              <li>{t('gamesList.private.reason.1')}</li>
              <li>{t('gamesList.private.reason.2')}</li>
              <li>{t('gamesList.private.reason.3')}</li>
              <li>{t('gamesList.private.reason.4')}</li>
            </ul>
          </div>
          <ExtLink
            href='https://steamcommunity.com/my/edit/settings'
            className='text-xs text-link hover:text-linkhover mt-4'
          >
            {t('gamesList.private.change')}
          </ExtLink>
          <Button
            size='sm'
            className='font-semibold rounded-lg mt-5 bg-dynamic text-button-text'
            onPress={handleRefresh}
          >
            {t('gamesList.private.tryAgain')}
          </Button>
        </div>
      </div>
    </div>
  )
}
