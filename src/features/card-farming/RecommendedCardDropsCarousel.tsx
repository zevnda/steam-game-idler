import type { Game } from '@/shared/types'
import type { ReactElement, SyntheticEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronLeft, TbChevronRight, TbPlus } from 'react-icons/tb'
import { Button, Spinner } from '@heroui/react'
import Image from 'next/image'

interface RecommendedCardDropsCarouselProps {
  gamesWithDrops: Game[]
  onAddGame: (game: Game) => void
  isLoading: boolean
}

export default function RecommendedCardDropsCarousel({
  gamesWithDrops,
  onAddGame,
  isLoading,
}: RecommendedCardDropsCarouselProps): ReactElement {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { t } = useTranslation()

  const scroll = (direction: 'left' | 'right'): void => {
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
  }

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
  }, [scrollContainerRef])

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

  const handleImageError = (event: SyntheticEvent<HTMLImageElement, Event>): void => {
    ;(event.target as HTMLImageElement).src = '/fallback.webp'
  }

  useEffect(() => {
    if (isAutoScrolling && gamesWithDrops && gamesWithDrops.length > 0) {
      autoScrollIntervalRef.current = setInterval(autoScroll, 7000)
    } else if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current)
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
  }, [isAutoScrolling, autoScroll, gamesWithDrops, gamesWithDrops?.length])

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [])

  if (isLoading) {
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
              isDisabled
            >
              <TbChevronLeft size={16} />
            </Button>
            <Button
              isIconOnly
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              isDisabled
            >
              <TbChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className='h-66.5 flex items-center justify-center'>
          <Spinner size='lg' />
        </div>
      </div>
    )
  }

  if (!gamesWithDrops || gamesWithDrops.length === 0) {
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
        {gamesWithDrops.map(game => (
          <div key={game.appid} className='shrink-0 w-110'>
            <div className='relative group select-none'>
              <div className='overflow-hidden will-change-transform transition-transform duration-150'>
                <div className='aspect-460/215 relative overflow-hidden'>
                  <Image
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                    width={460}
                    height={215}
                    alt={`${game.name} image`}
                    priority={true}
                    onError={handleImageError}
                    className='w-full h-full object-cover rounded-lg duration-150'
                  />
                  <div
                    className='pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150'
                    style={{ boxShadow: 'inset 0 0 0 2px hsl(var(--heroui-dynamic))' }}
                  />
                </div>
                <div className='flex justify-between items-center pt-3'>
                  <h3 className='text-xs font-bold text-altwhite group-hover:text-content truncate duration-150 flex-1 mr-2'>
                    {game.name}
                  </h3>

                  <div className='flex items-center gap-2 shrink-0'>
                    <span className='text-xs bg-white text-black font-semibold px-2 py-1 rounded-full'>
                      {t('customLists.cardFarming.drops', { count: game.remaining || 0 })}
                    </span>
                    <Button
                      isIconOnly
                      size='sm'
                      radius='full'
                      className='bg-transparent hover:bg-item-hover text-altwhite hover:text-content transition-colors duration-150'
                      onPress={() => onAddGame(game)}
                    >
                      <TbPlus size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
