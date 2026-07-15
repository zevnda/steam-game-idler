import { useEffect, useRef } from 'react'

// Shared by every per-category settings hook (useInventorySettings, useCardFarmingSettings,
// useAchievementUnlockerSettings, useSteamCredentialsSettings, useFreeGamesSettings,
// useSettingsModal) - all had their own copy of "load once while this tab is active/the modal is
// open" with no memory of having already loaded, so switching away from a tab and back (or
// closing/reopening the modal) re-fired the fetch and re-showed that tab's loading skeleton every
// time, even though nothing on disk had changed since the first load. `scopeKey` is what "already
// loaded" is scoped to - an account key for per-account categories (so switching accounts still
// forces a real reload), or a constant for the app-wide general/customization tab. `refresh`
// (each hook's own `load`) stays a separate, ungated action so explicit refresh buttons and
// DebugSettingsTab's post-reset refreshes keep bypassing this cache entirely.
export function useTabGatedLoad(shouldLoad: boolean, scopeKey: string | null, load: () => void) {
  const loadedForRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (!shouldLoad) return
    if (loadedForRef.current === scopeKey) return
    loadedForRef.current = scopeKey
    load()
  }, [shouldLoad, scopeKey, load])
}
