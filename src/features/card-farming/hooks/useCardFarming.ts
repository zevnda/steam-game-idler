import type { CardFarmingSettings, SteamCookies } from '../types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGamesWithDrops } from './useGamesWithDrops'
import { useCardFarmingStore } from '@/shared/stores/cardFarmingStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import { clearSavedSteamCookies } from '@/shared/utils/steamCommunitySessionExpired'

// Start/stop/connect actions for the card-farming page. Reads the shared `cardFarmingStore` (kept
// current by `useCardFarmingSync`, mounted permanently in `DashboardShell`) rather than tracking its
// own copy of farming state - same reasoning `useIdling` already established for idling.
//
// `connect` and `start` are deliberately separate actions (see `SteamCookiesConnectPanel`'s doc
// comment for why): `connect` only validates+resolves cookies (via `useGamesWithDrops`, which
// doubles as the "Games With Drops" browse tab's own data source) and remembers which cookies
// worked in `manualCookiesRef` - it never starts a farming cycle. `start` reuses whatever cookies
// `connect` already proved work, so it only needs `account`; it farms whatever this account's
// `card_farming::queue` currently holds (Rust-side, not passed from here - see `commands.rs`'s
// `start_farming` doc comment).
//
// `start` deliberately does NOT apply `start_farming`'s own return value to the store (an earlier
// version of this hook did) - see `useAchievementUnlockerRun.start`'s identical doc comment for why:
// that return value is only a spawn-time snapshot, and for a cycle that ends within a couple of
// milliseconds (every queued game already over its max-playtime cap or already out of drops, so
// `card_farming::manager`'s very first poll finds nothing to farm), the backend's real, final
// `FARMING_STATE_EVENT` could land and get applied by `useCardFarmingSync` before this command's own
// promise resolves back here - applying the stale snapshot afterward would clobber the correct
// "finished" state with a phantom "still farming" one nothing could clear. `stop` already relies
// purely on the event stream - `start` now matches it instead of double-sourcing state.
export const useCardFarming = () => {
  const account = useSessionStore(state => state.account)
  const state = useCardFarmingStore(state => state.state)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [connectErrorCode, setConnectErrorCode] = useState<string | null>(null)
  const manualCookiesRef = useRef<SteamCookies | undefined>(undefined)
  const browse = useGamesWithDrops()
  // Own copy of just the `allGames` field, for CardFarmingPageHeader's "Farming mode: ..." label
  // while idle - not the tab-gated `useCardFarmingSettings` copy (that only loads while the
  // Settings modal's card-farming tab is open). `refreshSettingsMode` lets CardFarmingPage re-read
  // it on the modal's close transition, same pattern as useInventory's `refreshSettings`.
  const [allGames, setAllGames] = useState<boolean | null>(null)

  const refreshSettingsMode = useCallback(async () => {
    if (!account) return
    try {
      const settings = await invoke<CardFarmingSettings>('get_card_farming_settings', { account })
      setAllGames(settings.allGames)
    } catch (error) {
      console.error('Error in (get_card_farming_settings):', error)
    }
  }, [account])

  useEffect(() => {
    refreshSettingsMode()
  }, [refreshSettingsMode])

  const connect = useCallback(
    async (manualCookies: SteamCookies | undefined) => {
      if (!account) return false
      setIsConnecting(true)
      setConnectErrorCode(null)
      const ok = await browse.refresh(manualCookies)
      if (ok) {
        manualCookiesRef.current = manualCookies
        setConnected(true)
      } else if (browse.errorCode) {
        setConnectErrorCode(browse.errorCode)
      }
      setIsConnecting(false)
      return ok
    },
    [account, browse],
  )

  const start = useCallback(async () => {
    if (!account) return
    setIsStarting(true)
    setErrorCode(null)
    try {
      await invoke('start_farming', {
        account,
        manualCookies: manualCookiesRef.current ?? null,
      })
      logFrontendInfo('useCardFarming', 'user started card farming')
    } catch (error) {
      console.error('Error in (start_farming):', error)
      setErrorCode(String(error))
      // A definitive session expiry (Rust already cleared any saved credentials - see
      // AppError::SteamCommunitySessionExpired's doc comment) - unlike card farming's other
      // errors, there's no fixing this without reconnecting, and this page has no separate
      // "Reconnect" affordance the way InventoryPageHeader does, so drop back to
      // CardFarmingStartPanel directly rather than leaving the user stuck looking at an empty tab
      // view with only an error banner.
      if (String(error) === 'steam_community_session_expired') {
        manualCookiesRef.current = undefined
        clearSavedSteamCookies(account)
        setConnected(false)
      }
    } finally {
      setIsStarting(false)
    }
  }, [account])

  const stop = useCallback(async () => {
    if (!account) return
    setIsStopping(true)
    setErrorCode(null)
    try {
      await invoke('stop_farming', { account })
      logFrontendInfo('useCardFarming', 'user stopped card farming')
    } catch (error) {
      console.error('Error in (stop_farming):', error)
      setErrorCode(String(error))
    } finally {
      setIsStopping(false)
    }
  }, [account])

  // Re-scrapes the browse list using the same cookies `connect` already proved work - used after
  // un-blacklisting a game (see CardFarmingPage's doc comment): that game has no cached
  // `remaining`/`playtimeHours` to restore it optimistically the way `removeBrowseGame` can, so a
  // real refetch is the only way to bring it back.
  const refreshBrowse = useCallback(() => browse.refresh(manualCookiesRef.current), [browse])

  return {
    state,
    isStarting,
    isStopping,
    isConnecting,
    connected,
    errorCode,
    connectErrorCode,
    browseGames: browse.games,
    isBrowseLoading: browse.isLoading,
    removeBrowseGame: browse.removeGame,
    refreshBrowse,
    allGames,
    refreshSettingsMode,
    connect,
    start,
    stop,
  }
}
