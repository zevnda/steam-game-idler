import type { Game } from '@/types'
import type { Dispatch, ReactElement, SetStateAction } from 'react'

import { Button, cn } from '@heroui/react'
import { useRef } from 'react'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'

import GameCard from '@/components/ui/GameCard'

interface RecentGamesCarouselProps {
  gamesContext: {
    sortStyle: string
    recentGames: Game[]
    setSortStyle: Dispatch<SetStateAction<string>>
  }
}

export default function RecentGamesCarousel({ gamesContext }: RecentGamesCarouselProps): ReactElement {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right'): void => {
    if (scrollContainerRef.current) {
      const scrollAmount = 1000
      const currentScroll = scrollContainerRef.current.scrollLeft
      const newScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount

      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth',
      })
    }
  }

  const topRecentGames = gamesContext.recentGames.slice(0, 10)

  if (topRecentGames.length === 0) {
    return <></>
  }

  return (
    <div
      className={cn(
        'duration-250 px-4 overflow-hidden group/carousel',
        gamesContext.sortStyle !== 'recent' ? 'h-full opacity-100 mb-6 mt-4' : 'h-0 opacity-0',
      )}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-baseline gap-2'>
          <p className='font-black'>Recently Played</p>
          <p
            className='text-xs cursor-pointer text-dynamic hover:text-dynamic-hover opacity-0 group-hover/carousel:opacity-100 transition-[opacity] duration-150'
            onClick={() => {
              localStorage.setItem('sortStyle', 'recent')
              gamesContext.setSortStyle('recent')
            }}
          >
            View All
          </p>
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

      <div ref={scrollContainerRef} className='flex gap-4 pb-2 overflow-x-hidden'>
        {topRecentGames.map((game: Game) => (
          <div key={game.appid} className='flex-shrink-0 w-48'>
            <GameCard item={game} />
          </div>
        ))}
      </div>
    </div>
  )
}
