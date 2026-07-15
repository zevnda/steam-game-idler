import type { Settings } from '@/features/settings/types'
import { useEffect } from 'react'
import { useDisableTooltipsStore } from '@/shared/stores/disableTooltipsStore'
import { invoke } from '@/shared/utils/invoke'

// Mounted once in DashboardShell - hydrates `disableTooltipsStore` from the persisted setting on
// mount, mirroring `useAntiAwayStatus`'s exact shape. Every `AppTooltip.Root` in the tree reads
// this store directly, so toggling the switch in `CustomizationSettingsTab` takes effect
// immediately (that tab's save action also writes the store, same as `saveAntiAway`).
export const useDisableTooltipsSync = () => {
  const setDisabled = useDisableTooltipsStore(state => state.setDisabled)

  useEffect(() => {
    invoke<Settings>('get_settings')
      .then(settings => setDisabled(settings.disableTooltips))
      .catch(error => {
        console.error('Error in (get_settings) for disable-tooltips hydration:', error)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
