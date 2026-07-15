import type { Settings } from '@/features/settings/types'
import { useEffect } from 'react'
import { useCarouselSettingsStore } from '@/shared/stores/carouselSettingsStore'
import { invoke } from '@/shared/utils/invoke'

// Mounted once in DashboardShell - hydrates `carouselSettingsStore` from the persisted setting on
// mount, mirroring `useAntiAwayStatus`'s exact shape. `GamesPage`/`CardFarmingPage` read this store
// directly, so toggling a carousel's visibility in `CustomizationSettingsTab` takes effect
// immediately (that tab's save action also writes the store).
export const useCarouselSettingsSync = () => {
  const setShowRecommended = useCarouselSettingsStore(state => state.setShowRecommended)
  const setShowRecent = useCarouselSettingsStore(state => state.setShowRecent)

  useEffect(() => {
    invoke<Settings>('get_settings')
      .then(settings => {
        setShowRecommended(settings.showRecommendedCarousel)
        setShowRecent(settings.showRecentCarousel)
      })
      .catch(error => {
        console.error('Error in (get_settings) for carousel-visibility hydration:', error)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
