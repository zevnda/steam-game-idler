import type { Game } from '@/types'
import type { ReactElement } from 'react'

import { Button } from '@heroui/react'
import { useRef } from 'react'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'

import GameCard from '@/components/ui/GameCard'

interface RecentGamesCarouselProps {
  recentGames: Game[]
}

export default function RecentGamesCarousel({ recentGames }: RecentGamesCarouselProps): ReactElement {
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

  const topRecentGames = recentGames.slice(0, 10)

  if (topRecentGames.length === 0) {
    return <></>
  }

  return (
    <div className='mb-6 px-4 mt-4'>
      <div className='flex items-center justify-between mb-4'>
        <p className='font-black'>Recently Played</p>
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
        {topRecentGames.map(game => (
          <div key={game.appid} className='flex-shrink-0 w-48'>
            <GameCard item={game} />
          </div>
        ))}
      </div>
    </div>
  )
}
