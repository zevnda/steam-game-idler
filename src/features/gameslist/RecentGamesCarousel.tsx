import type { Game } from '@/shared/types'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import { GameCard } from '@/shared/ui'

interface RecentGamesCarouselProps {
  gamesContext: {
    sortStyle: string
    recentGames: Game[]
    setSortStyle: React.Dispatch<React.SetStateAction<string>>
  }
}

export const RecentGamesCarousel = ({ gamesContext }: RecentGamesCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 192 * 2 + 20 + 20
      const container = scrollContainerRef.current
      const maxScroll = container.scrollWidth - container.clientWidth
      const currentScroll = container.scrollLeft

      let newScroll
      if (direction === 'left') {
        if (currentScroll - scrollAmount > 0) {
          newScroll = currentScroll - scrollAmount
        } else if (currentScroll > 0) {
          newScroll = 0
        } else {
          newScroll = maxScroll
        }
      } else {
        if (currentScroll + scrollAmount < maxScroll) {
          newScroll = currentScroll + scrollAmount
        } else if (currentScroll < maxScroll) {
          newScroll = maxScroll
        } else {
          newScroll = 0
        }
      }

      container.scrollTo({
        left: newScroll,
        behavior: 'smooth',
      })
    }
  }, [])

  const topRecentGames = useMemo(
    () => gamesContext.recentGames.slice(0, 15),
    [gamesContext.recentGames],
  )

  if (topRecentGames.length === 0) {
    return <div />
  }

  return (
    <div className={cn('duration-250 px-6 overflow-hidden group/carousel')}>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-baseline gap-2'>
          <p className='text-lg font-black'>{t('gamesList.recentlyPlayed')}</p>
        </div>
        <div className='flex gap-2'>
          <Button
            isIconOnly
            size='sm'
            className='bg-btn-secondary text-btn-text font-bold'
            radius='full'
            onPress={() => scroll('left')}
          >
            <TbChevronLeft size={16} />
          </Button>
          <Button
            isIconOnly
            size='sm'
            className='bg-btn-secondary text-btn-text font-bold'
            radius='full'
            onPress={() => scroll('right')}
          >
            <TbChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div ref={scrollContainerRef} className='flex gap-5 pb-2 overflow-x-hidden'>
        {topRecentGames.map((game: Game) => (
          <div key={game.appid} className='shrink-0 w-48'>
            <GameCard item={game} />
          </div>
        ))}
      </div>
    </div>
  )
}
