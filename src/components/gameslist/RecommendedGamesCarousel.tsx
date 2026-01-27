import type { Game } from '@/types'
import type { ReactElement } from 'react'

import { Button } from '@heroui/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  const scroll = useCallback((direction: 'left' | 'right'): void => {
    if (scrollContainerRef.current) {
      const scrollAmount = 440 * 2 + 20 + 20
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

  const autoScroll = useCallback((): void => {
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
  }, [scroll])

  const handleManualScroll = useCallback(
    (direction: 'left' | 'right'): void => {
      setIsAutoScrolling(false)
      scroll(direction)

      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }

      pauseTimeoutRef.current = setTimeout(() => {
        setIsAutoScrolling(true)
      }, 5000)
    },
    [scroll],
  )

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
  }, [isAutoScrolling, autoScroll, gamesContext.unplayedGames.length])

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [])

  if (gamesContext.unplayedGames.length === 0) {
    return <div />
  }

  return (
    <div className='mb-6 px-6 mt-4'>
      <div className='flex items-center justify-between mb-3'>
        <p className='text-lg font-black'>{t('gamesList.recommended')}</p>
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

      <div ref={scrollContainerRef} className='flex gap-5 pb-2 overflow-x-hidden'>
        {gamesContext.unplayedGames.map(game => (
          <div key={game.appid} className='shrink-0 w-110'>
            <GameCard item={game} />
          </div>
        ))}
      </div>
    </div>
  )
}
