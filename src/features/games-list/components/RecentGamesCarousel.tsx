import type { Game } from '@/shared/types'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import { GameCard } from '@/shared/components/GameCard'

interface RecentGamesCarouselProps {
  recentGames: Game[]
  sortStyle: string
  setSortStyle: (v: string) => void
}

export function RecentGamesCarousel({ recentGames }: RecentGamesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = 192 * 2 + 40
    const max = el.scrollWidth - el.clientWidth
    const cur = el.scrollLeft
    let next: number
    if (direction === 'left') {
      next = cur - amount > 0 ? cur - amount : cur > 0 ? 0 : max
    } else {
      next = cur + amount < max ? cur + amount : cur < max ? max : 0
    }
    el.scrollTo({ left: next, behavior: 'smooth' })
  }, [])

  const topGames = useMemo(() => recentGames.slice(0, 15), [recentGames])
  if (topGames.length === 0) return <div />

  return (
    <div className={cn('duration-250 px-6 overflow-hidden group/carousel')}>
      <div className='flex items-center justify-between mb-3'>
        <p className='text-xs font-black uppercase tracking-wide text-altwhite/60'>
          {t('gamesList.recentlyPlayed')}
        </p>
        <div className='flex gap-2'>
          <Button
            isIconOnly
            size='sm'
            className='bg-card border border-border/20 text-altwhite hover:text-content font-semibold'
            radius='full'
            onPress={() => scroll('left')}
          >
            <TbChevronLeft size={16} />
          </Button>
          <Button
            isIconOnly
            size='sm'
            className='bg-card border border-border/20 text-altwhite hover:text-content font-semibold'
            radius='full'
            onPress={() => scroll('right')}
          >
            <TbChevronRight size={16} />
          </Button>
        </div>
      </div>
      <div ref={scrollRef} className='flex gap-5 pb-2 overflow-x-hidden'>
        {topGames.map((game: Game) => (
          <div key={game.appid} className='shrink-0 w-48'>
            <GameCard item={game} />
          </div>
        ))}
      </div>
    </div>
  )
}
