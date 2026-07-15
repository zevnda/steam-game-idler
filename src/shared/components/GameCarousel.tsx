import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'

// Matches this component's own `gap-4` between cards.
const GAP = 16
// How long autoscroll pauses after a manual scroll (button click) before resuming - long enough
// that a user actively browsing isn't fighting the timer, matching `main`'s own carousels.
const MANUAL_SCROLL_PAUSE_MS = 5000

interface GameCarouselProps<T> {
  title: string
  items: T[]
  itemKey: (item: T) => number | string
  renderItem: (item: T) => ReactNode
  // Fixed pixel width for each card - carousels intentionally don't share the responsive column
  // sizing the plain games grid uses (see GamesList.tsx's `useResponsiveColumnCount`), since a
  // horizontally-scrolling row isn't constrained to a fixed number of visible columns.
  cardWidth: number
  // When set, the carousel auto-advances on this interval (ms) and wraps back to the start once
  // scrolled to the end. Omit for a manual-only carousel.
  autoScrollIntervalMs?: number
}

// Shared horizontal-scroll carousel shell backing the Games page's Recommended/Recently Played
// carousels - one component instead of near-duplicate ones. No react-window virtualization weaving
// (a carousel is a short, bounded-length list; virtualization is reserved for a list that can
// realistically grow large, e.g. the owned-games grid `VirtualizedGameGrid` backs). Generic over
// item type so the same shell could serve other card shapes too - each caller supplies its own
// card renderer.
export function GameCarousel<T>({
  title,
  items,
  itemKey,
  renderItem,
  cardWidth,
  autoScrollIntervalMs,
}: GameCarouselProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Loops to the opposite edge when already at the start/end, same as the auto-scroll wrap below,
  // so manual left/right clicks loop too instead of dead-ending at the edge.
  const scrollBy = useCallback(
    (direction: 1 | -1) => {
      const container = scrollRef.current
      if (!container) return
      const maxScroll = container.scrollWidth - container.clientWidth
      if (direction === 1 && container.scrollLeft >= maxScroll - 1) {
        container.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }
      if (direction === -1 && container.scrollLeft <= 1) {
        container.scrollTo({ left: maxScroll, behavior: 'smooth' })
        return
      }
      container.scrollBy({ left: direction * (cardWidth * 2 + GAP * 2), behavior: 'smooth' })
    },
    [cardWidth],
  )

  const handleManualScroll = useCallback(
    (direction: 1 | -1) => {
      setIsAutoScrolling(false)
      scrollBy(direction)
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = setTimeout(() => setIsAutoScrolling(true), MANUAL_SCROLL_PAUSE_MS)
    },
    [scrollBy],
  )

  useEffect(() => {
    if (!autoScrollIntervalMs || !isAutoScrolling || items.length === 0) return
    const interval = setInterval(() => scrollBy(1), autoScrollIntervalMs)
    return () => clearInterval(interval)
  }, [autoScrollIntervalMs, isAutoScrolling, scrollBy, items.length])

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
    }
  }, [])

  if (items.length === 0) return null

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <Typography type='h4'>{title}</Typography>
        <div className='flex items-center gap-1'>
          <Button
            isIconOnly
            variant='secondary'
            aria-label='Scroll left'
            onPress={() => (autoScrollIntervalMs ? handleManualScroll(-1) : scrollBy(-1))}
          >
            <TbChevronLeft />
          </Button>
          <Button
            isIconOnly
            variant='secondary'
            aria-label='Scroll right'
            onPress={() => (autoScrollIntervalMs ? handleManualScroll(1) : scrollBy(1))}
          >
            <TbChevronRight />
          </Button>
        </div>
      </div>
      <div className='no-scrollbar flex gap-4 overflow-x-auto pb-1' ref={scrollRef}>
        {items.map(item => (
          <div className='shrink-0' key={itemKey(item)} style={{ width: cardWidth }}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  )
}
