import type { Game } from '@/shared/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { GameCard } from '@/shared/components/GameCard'

interface RecommendedGamesCarouselProps {
  unplayedGames: Game[]
}

export function RecommendedGamesCarousel({ unplayedGames }: RecommendedGamesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)
  const pauseRef = useRef<NodeJS.Timeout | null>(null)
  const { t } = useTranslation()

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = 440 * 2 + 40
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

  const autoScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    if (el.scrollLeft >= max) el.scrollTo({ left: 0, behavior: 'smooth' })
    else scroll('right')
  }, [scroll])

  const handleManualScroll = useCallback(
    (direction: 'left' | 'right') => {
      setIsAutoScrolling(false)
      scroll(direction)
      if (pauseRef.current) clearTimeout(pauseRef.current)
      pauseRef.current = setTimeout(() => setIsAutoScrolling(true), 5000)
    },
    [scroll],
  )

  useEffect(() => {
    if (isAutoScrolling && unplayedGames.length > 0) {
      autoScrollRef.current = setInterval(autoScroll, 7000)
    } else if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current)
    }
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    }
  }, [isAutoScrolling, autoScroll, unplayedGames.length])

  useEffect(() => {
    return () => {
      if (pauseRef.current) clearTimeout(pauseRef.current)
    }
  }, [])

  if (unplayedGames.length === 0) return <div />

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
      <div ref={scrollRef} className='flex gap-5 pb-2 overflow-x-hidden'>
        {unplayedGames.map(game => (
          <div key={game.appid} className='shrink-0 w-110'>
            <GameCard item={game} />
          </div>
        ))}
      </div>
    </div>
  )
}
