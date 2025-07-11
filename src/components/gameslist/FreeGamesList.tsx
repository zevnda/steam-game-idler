import type { Game } from '@/types'
import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { useTranslation } from 'react-i18next'

import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import GameCard from '@/components/ui/GameCard'

export default function FreeGamesList(): ReactElement {
  const { t } = useTranslation()
  const { freeGamesList } = useUserContext()
  const { sidebarCollapsed, transitionDuration } = useStateContext()

  return (
    <div
      className={cn(
        'min-h-calc max-h-calc overflow-y-auto overflow-x-hidden mt-9 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
    >
      <div className={cn('w-[calc(100vw-227px)] z-[50] pl-4 pt-2')}>
        <div className='flex justify-between items-center pb-3'>
          <div className='flex items-center gap-1 select-none'>
            <div className='flex flex-col justify-center'>
              <p className='text-3xl font-black'>{t('freeGames.title')}</p>

              <p className='text-xs text-altwhite my-2'>
                {t('common.showing', {
                  count: freeGamesList.length,
                  total: freeGamesList.length,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-5 2xl:grid-cols-7 gap-x-4 gap-y-4 p-4 pt-0'>
        {freeGamesList &&
          freeGamesList.map((item: Game) => <GameCard key={item.appid} item={item} isFreeGame={true} />)}
      </div>
    </div>
  )
}
