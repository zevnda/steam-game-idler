import type { Game } from '@/shared/types'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@heroui/react'
import { GameCard } from '@/shared/components/GameCard'
import { useUiStore, useUserStore } from '@/shared/stores'

function useColumnCount() {
  const [count, setCount] = useState(5)
  const update = useCallback(() => {
    if (window.innerWidth >= 3200) setCount(12)
    else if (window.innerWidth >= 2300) setCount(10)
    else if (window.innerWidth >= 2000) setCount(8)
    else if (window.innerWidth >= 1500) setCount(7)
    else setCount(5)
  }, [])
  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])
  return count
}

export function FreeGamesList() {
  const { t } = useTranslation()
  const freeGamesList = useUserStore(s => s.freeGamesList)
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const transitionDuration = useUiStore(s => s.transitionDuration)
  const columnCount = useColumnCount()

  return (
    <div
      className={cn(
        'min-h-calc max-h-calc overflow-y-auto overflow-x-hidden mt-12 ease-in-out',
        sidebarCollapsed ? 'w-calc-collapsed' : 'w-calc',
      )}
      style={{ transitionDuration, transitionProperty: 'width' }}
    >
      <div className='px-6 pt-4 pb-3 select-none'>
        <p className='text-2xl font-black'>{t('freeGames.title')}</p>
        <p className='text-xs text-altwhite/60 mt-0.5'>
          {freeGamesList.length > 0
            ? t('common.showing', {
                count: freeGamesList.length,
                total: freeGamesList.length,
              })
            : t('freeGames.subtitle')}
        </p>
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
        {freeGamesList.map((item: Game) => (
          <GameCard key={item.appid} item={item} isFreeGame={true} />
        ))}
      </div>
    </div>
  )
}
