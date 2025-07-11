import type { Game } from '@/types'
import type { ReactElement } from 'react'

import { Button } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'

import GameCard from '@/components/ui/GameCard'

interface RecommendedGamesCarouselProps {
  gamesContext: {
    unplayedGames: Game[]
  }
}

export default function RecommendedGamesCarousel({ gamesContext }: RecommendedGamesCarouselProps): ReactElement {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scroll = (direction: 'left' | 'right'): void => {
    if (scrollContainerRef.current) {
      const scrollAmount = 910
      const currentScroll = scrollContainerRef.current.scrollLeft
      const newScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount

      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth',
      })
    }
  }

  const autoScroll = (): void => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const maxScroll = container.scrollWidth - container.clientWidth
      const currentScroll = container.scrollLeft

      if (currentScroll >= maxScroll) {
        container.scrollTo({
          left: 0,
          behavior: 'smooth',
        })
      } else {
        scroll('right')
      }
    }
  }

  const handleManualScroll = (direction: 'left' | 'right'): void => {
    setIsAutoScrolling(false)
    scroll(direction)

    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }

    pauseTimeoutRef.current = setTimeout(() => {
      setIsAutoScrolling(true)
    }, 5000)
  }

  useEffect(() => {
    if (isAutoScrolling && gamesContext.unplayedGames.length > 0) {
      autoScrollIntervalRef.current = setInterval(autoScroll, 7000)
    } else if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current)
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
  }, [isAutoScrolling, gamesContext.unplayedGames.length])

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [])

  if (gamesContext.unplayedGames.length === 0) {
    return <></>
  }

  return (
    <div className='mb-6 px-4 mt-4'>
      <div className='flex items-center justify-between mb-3'>
        <p className='font-black'>Recommended</p>
        <div className='flex gap-2'>
          <Button
            isIconOnly
            size='sm'
            className='bg-btn-secondary text-btn-text font-bold'
            radius='full'
            onPress={() => handleManualScroll('left')}
          >
            <TbChevronLeft size={16} />
          </Button>
          <Button
            isIconOnly
            size='sm'
            className='bg-btn-secondary text-btn-text font-bold'
            radius='full'
            onPress={() => handleManualScroll('right')}
          >
            <TbChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div ref={scrollContainerRef} className='flex gap-4 pb-2 overflow-x-hidden'>
        {gamesContext.unplayedGames.map(game => (
          <div key={game.appid} className='flex-shrink-0 w-[440px]'>
            <GameCard item={game} />
          </div>
        ))}
      </div>
    </div>
  )
}
