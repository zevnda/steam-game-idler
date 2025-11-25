import type { Dispatch, ReactElement, SetStateAction } from 'react'

import { Button } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { BiSolidMessageSquareError } from 'react-icons/bi'

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
    <div className='flex justify-center items-center w-calc h-calc'>
      <div className='flex justify-center items-center flex-col p-6 bg-tab-panel rounded-4xl border border-border'>
        <div className='flex justify-center items-center flex-col'>
          <BiSolidMessageSquareError size={64} className='mb-4' />
          <p className='text-center font-medium text-content mb-5'>{t('gamesList.private.message')}</p>
          <ul className='text-center text-sm space-y-1 text-altwhite'>
            <li>{t('gamesList.private.reason.1')}</li>
            <li>{t('gamesList.private.reason.2')}</li>
            <li>{t('gamesList.private.reason.3')}</li>
            <li>{t('gamesList.private.reason.4')}</li>
            <li>{t('gamesList.private.reason.5')}</li>
          </ul>
        </div>
        <ExtLink
          href='https://steamcommunity.com/my/edit/settings'
          className='text-sm text-dynamic hover:text-dynamic-hover mt-6 font-medium duration-150'
        >
          {t('gamesList.private.change')}
        </ExtLink>
        <Button className='bg-btn-secondary text-btn-text font-bold mt-4' radius='full' onPress={handleRefresh}>
          {t('gamesList.private.tryAgain')}
        </Button>
      </div>
    </div>
  )
}
