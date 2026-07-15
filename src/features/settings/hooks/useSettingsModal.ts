import type { Settings } from '../types'
import { useCallback, useState } from 'react'
import { useTabGatedLoad } from './useTabGatedLoad'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

// Loads once when the modal opens, not route-synced - settings are app-wide, not per-account
// live state, so there's nothing here that drifts externally the way idling/games-list do (same
// reasoning useFreeGames/useFavorites already use for their own page-scoped fetch-on-mount).
//
// `loadErrorCode` (get_settings failing) and `actionErrorCode` (a save/clear action failing) are
// deliberately separate states, not one shared `errorCode` - a load failure is a persistent
// "nothing to show" state (rendered as an inline Alert, see GeneralSettingsTab), while a save/clear
// failure is one-off action feedback (rendered as a toast) that shouldn't linger or get confused
// with an unrelated load failure sitting in the same field. Mirrors useLocalSignIn's existing
// loadErrorCode/actionErrorCode split.
export const useSettingsModal = () => {
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setLoadErrorCode(null)
    try {
      setSettings(await invoke<Settings>('get_settings'))
    } catch (error) {
      console.error('Error in (get_settings):', error)
      setLoadErrorCode(String(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Scoped to a constant, not an account key - general/customization are app-wide, not
  // per-account, so there's nothing to re-key a reload off other than "has this ever loaded".
  useTabGatedLoad(isOpen, 'app-wide', loadSettings)

  // Validates a non-blank key against the Steam Web API before persisting it - matches `main`'s
  // pre-save validation (`validate_steam_api_key`), which this rewrite had dropped. A blank key
  // (clearing the override) skips validation entirely, same as `main`.
  const saveSteamWebApiKey = useCallback(async (key: string) => {
    setIsSaving(true)
    setActionErrorCode(null)
    try {
      const trimmed = key.trim()
      if (trimmed) {
        const isValid = await invoke<boolean>('validate_steam_web_api_key', { apiKey: trimmed })
        if (!isValid) {
          setActionErrorCode('steam_web_api_key_invalid')
          return false
        }
      }
      setSettings(await invoke<Settings>('set_steam_web_api_key', { key: trimmed || null }))
      logFrontendInfo(
        'useSettingsModal',
        trimmed ? 'steam web api key saved' : 'steam web api key cleared',
      )
      return true
    } catch (error) {
      console.error('Error in (set_steam_web_api_key):', error)
      setActionErrorCode(String(error))
      return false
    } finally {
      setIsSaving(false)
    }
  }, [])

  // No `isSaving`/loading gate of its own, unlike `saveSteamWebApiKey` - this is a toggle switch,
  // not a form with a separate Save button, so a spinner would just be visual noise for what's
  // normally a near-instant local settings.json write. `useAntiAwayStatus` (mounted in
  // DashboardShell, not here) picks up the resulting `settings.antiAway` value independently -
  // this action only persists the setting, not drives the interval itself.
  const saveAntiAway = useCallback(async (enabled: boolean) => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('set_anti_away', { enabled }))
      logFrontendInfo('useSettingsModal', 'anti-away setting saved', { enabled })
      return true
    } catch (error) {
      console.error('Error in (set_anti_away):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  // Mirrors `saveAntiAway` exactly - a toggle switch, not a form field. Unlike `antiAway`, no store
  // consumes this live: `settings.startMinimized` is only read once by Rust at the *next* app
  // launch, so the modal-local `settings` snapshot this hook already refreshes is sufficient (see
  // GeneralSettingsTab.tsx's own comment on this split).
  const saveStartMinimized = useCallback(async (enabled: boolean) => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('set_start_minimized', { enabled }))
      logFrontendInfo('useSettingsModal', 'start minimized setting saved', { enabled })
      return true
    } catch (error) {
      console.error('Error in (set_start_minimized):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  // Mirrors `saveStartMinimized` exactly. `useTitlebar.ts`'s `close()` reads `settings.closeToTray`
  // fresh via its own `get_settings` call at click time, so no store is needed here either.
  const saveCloseToTray = useCallback(async (enabled: boolean) => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('set_close_to_tray', { enabled }))
      logFrontendInfo('useSettingsModal', 'close to tray setting saved', { enabled })
      return true
    } catch (error) {
      console.error('Error in (set_close_to_tray):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  // Mirrors `saveAntiAway` exactly - a toggle switch, not a form field. `useAutoUpdateGamesListStatus`
  // (mounted in DashboardShell, not here) picks up the resulting `settings.autoUpdateGamesList`
  // value independently and drives the actual polling interval.
  const saveAutoUpdateGamesList = useCallback(async (enabled: boolean) => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('set_auto_update_games_list', { enabled }))
      logFrontendInfo('useSettingsModal', 'auto update games list setting saved', { enabled })
      return true
    } catch (error) {
      console.error('Error in (set_auto_update_games_list):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  // Mirrors `saveAntiAway` exactly - a toggle switch, not a form field. `useFreeGamesWatcher`
  // (mounted in DashboardShell, not here) picks up the resulting `settings.freeGameNotifications`
  // value independently and reads it live on every poll tick.
  const saveFreeGameNotifications = useCallback(async (enabled: boolean) => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('set_free_game_notifications', { enabled }))
      logFrontendInfo('useSettingsModal', 'free game notifications setting saved', { enabled })
      return true
    } catch (error) {
      console.error('Error in (set_free_game_notifications):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  // Mirrors `saveAntiAway` exactly - a toggle switch, not a form field. `useTheme` (mounted at the
  // app root, not here) picks up the resulting `settings.theme` value independently via its own
  // `get_settings` call - this action only persists the choice; `CustomizationSettingsTab`'s own
  // handler calls `applyTheme` directly for an instant preview rather than waiting on that.
  const saveTheme = useCallback(async (theme: string) => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('set_theme', { theme }))
      logFrontendInfo('useSettingsModal', 'theme setting saved', { theme })
      return true
    } catch (error) {
      console.error('Error in (set_theme):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  // Mirrors `saveTheme` exactly. `useFont` (mounted at the app root, not here) picks up the
  // resulting `settings.font` value independently via its own `get_settings` call -
  // `CustomizationSettingsTab`'s own handler calls `applyFont` directly for an instant preview
  // rather than waiting on that.
  const saveFont = useCallback(async (font: string) => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('set_font', { font }))
      logFrontendInfo('useSettingsModal', 'font setting saved', { font })
      return true
    } catch (error) {
      console.error('Error in (set_font):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  // Mirrors `saveAntiAway` exactly. `AppTooltip.Root` (used throughout the app) reads
  // `disableTooltipsStore` directly - `CustomizationSettingsTab`'s handler writes that store after
  // a successful save, same split every other live-synced toggle here uses.
  const saveDisableTooltips = useCallback(async (enabled: boolean) => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('set_disable_tooltips', { enabled }))
      logFrontendInfo('useSettingsModal', 'disable tooltips setting saved', { enabled })
      return true
    } catch (error) {
      console.error('Error in (set_disable_tooltips):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  // Mirrors `saveAntiAway` exactly. `GamesPage`/`CardFarmingPage` read `carouselSettingsStore`
  // directly - `CustomizationSettingsTab`'s handlers write that store after a successful save.
  const saveShowRecommendedCarousel = useCallback(async (enabled: boolean) => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('set_show_recommended_carousel', { enabled }))
      logFrontendInfo('useSettingsModal', 'show recommended carousel setting saved', { enabled })
      return true
    } catch (error) {
      console.error('Error in (set_show_recommended_carousel):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  const saveShowRecentCarousel = useCallback(async (enabled: boolean) => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('set_show_recent_carousel', { enabled }))
      logFrontendInfo('useSettingsModal', 'show recent carousel setting saved', { enabled })
      return true
    } catch (error) {
      console.error('Error in (set_show_recent_carousel):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  // Unlike the toggles above, this persists a file (see `customization::set_background`) - `path`
  // comes from `@tauri-apps/plugin-dialog`'s file picker, resolved by
  // `CustomizationSettingsTab`'s own handler, which also refreshes `customBackgroundStore` with the
  // new `data:` URI after a successful save (this action alone doesn't know that URI, only the
  // resulting `Settings`).
  const saveCustomBackground = useCallback(async (path: string) => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('set_custom_background', { path }))
      logFrontendInfo('useSettingsModal', 'custom background saved')
      return true
    } catch (error) {
      console.error('Error in (set_custom_background):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  const clearCustomBackground = useCallback(async () => {
    setActionErrorCode(null)
    try {
      setSettings(await invoke<Settings>('clear_custom_background'))
      logFrontendInfo('useSettingsModal', 'custom background cleared')
      return true
    } catch (error) {
      console.error('Error in (clear_custom_background):', error)
      setActionErrorCode(String(error))
      return false
    }
  }, [])

  return {
    settings,
    isLoading,
    isSaving,
    loadErrorCode,
    actionErrorCode,
    refresh: loadSettings,
    saveSteamWebApiKey,
    saveAntiAway,
    saveStartMinimized,
    saveCloseToTray,
    saveAutoUpdateGamesList,
    saveFreeGameNotifications,
    saveTheme,
    saveFont,
    saveDisableTooltips,
    saveShowRecommendedCarousel,
    saveShowRecentCarousel,
    saveCustomBackground,
    clearCustomBackground,
  }
}
