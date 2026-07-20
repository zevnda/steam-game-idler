import type { CurrentOs } from '@/shared/stores/platformStore'
import { useEffect } from 'react'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { invoke } from '@/shared/utils/invoke'

// Root-mounted once in `_app.tsx`, same reasoning as useZoomControls/useTheme/useContextMenu -
// the pre-dashboard sign-in landing page is the first place this needs to be known (hiding the
// CLI-mode sign-in option on Linux), so it can't wait for DashboardShell. `current_os`
// (src-tauri/src/platform.rs) is a static value for the process's whole lifetime, so this fetches
// once and caches in platformStore rather than each consumer invoking it separately.
export function usePlatform() {
  useEffect(() => {
    invoke<CurrentOs>('current_os')
      .then(os => usePlatformStore.getState().setCurrentOs(os))
      .catch(error => {
        console.error('Error in (current_os):', error)
      })
  }, [])
}
