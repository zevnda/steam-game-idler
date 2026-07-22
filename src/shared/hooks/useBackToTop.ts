import { useCallback, useEffect, useState } from 'react'

// Pixel scrollTop past which the floating button appears - large enough that it doesn't pop in
// after a trivial nudge, small enough to still be useful on a moderately short list.
const SHOW_THRESHOLD_PX = 400

// Shared "back to top" scroll-tracking for every scrollable game-card list/grid in the app.
// `setScrollElement` is a callback ref (not a plain `useRef`) so this hook re-attaches its scroll
// listener whenever the underlying element's *identity* changes - both a react-window Grid/List
// (whose real scroll root only exists once mounted - see its `gridRef`/`listRef` imperative API's
// `.element` getter) and a plain `overflow-y-auto` ancestor that unmounts on tab switch (a HeroUI
// `TabPanel` - see GameListTabPanel.tsx) need this rather than a mount-once effect.
export function useBackToTop() {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!scrollElement) {
      setIsVisible(false)
      return
    }
    const handleScroll = () => setIsVisible(scrollElement.scrollTop > SHOW_THRESHOLD_PX)
    handleScroll()
    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [scrollElement])

  const scrollToTop = useCallback(() => {
    scrollElement?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [scrollElement])

  return { setScrollElement, isVisible, scrollToTop }
}
