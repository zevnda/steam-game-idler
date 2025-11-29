import type { Game } from '@/types'
import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { useCallback, useEffect, useState } from 'react'
import { useStateStore } from '@/stores/stateStore'
import { useUserStore } from '@/stores/userStore'
import { useTranslation } from 'react-i18next'

import GameCard from '@/components/ui/GameCard'

export default function FreeGamesList(): ReactElement {
  const { t } = useTranslation()
  const freeGamesList = useUserStore(state => state.freeGamesList)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const [columnCount, setColumnCount] = useState(5)

  const handleResize = useCallback((): void => {
    if (window.innerWidth >= 3200) {
      setColumnCount(12)
    } else if (window.innerWidth >= 2300) {
      setColumnCount(10)
    } else if (window.innerWidth >= 2000) {
      setColumnCount(8)
    } else if (window.innerWidth >= 1500) {
      setColumnCount(7)
    } else {
      setColumnCount(5)
    }
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

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
      <div className={cn('w-[calc(100vw-227px)] z-50 pl-6 pt-2')}>
        <div className='flex justify-between items-center pb-3'>
          <div className='flex items-center gap-1 select-none'>
            <div className='flex flex-col justify-center'>
              <p className='text-3xl font-black'>{t('freeGames.title')}</p>

              <p className='text-xs text-altwhite my-2'>
                {freeGamesList.length > 0
                  ? t('common.showing', {
                      count: freeGamesList.length,
                      total: freeGamesList.length,
                    })
                  : t('freeGames.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'grid gap-x-5 gap-y-4 px-6',
          columnCount === 7 ? 'grid-cols-7' : 'grid-cols-5',
          columnCount === 8 ? 'grid-cols-8' : '',
          columnCount === 10 ? 'grid-cols-10' : '',
          columnCount === 12 ? 'grid-cols-12' : '',
        )}
      >
        {freeGamesList &&
          freeGamesList.map((item: Game) => <GameCard key={item.appid} item={item} isFreeGame={true} />)}
      </div>
    </div>
  )
}
