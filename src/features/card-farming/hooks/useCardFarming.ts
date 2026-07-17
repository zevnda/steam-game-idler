import type { CardFarmingSettings, SteamCookies } from '../types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGamesWithDrops } from './useGamesWithDrops'
import { useCardFarmingStore } from '@/shared/stores/cardFarmingStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import { clearSavedSteamCookies } from '@/shared/utils/steamCommunitySessionExpired'
import { canResolveCookiesAutomatically } from '@/shared/utils/subscriptionAccess'

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
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
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

  // Both outcomes mean the Steam Community session itself couldn't be confirmed (as opposed to
  // some other card-farming-specific failure) - a confirmed `expired` and a merely
  // "couldn't confirm" `failed` both need the same frontend response: never leave a dead
  // credential displayed/reused. `failed` exists to cover a transient network hiccup without
  // wiping a possibly-still-good credential (see `SessionStatus::Inconclusive`'s doc comment) -
  // but in practice even a genuine, permanent Steam-side sign-out often surfaces as `failed`
  // rather than a definitive `expired` (Steam doesn't reliably send the one unambiguous
  // logged-out signal `validate` looks for), so treating only `expired` this way left real dead
  // credentials sitting in the connect panel's fields indefinitely. The OS-level credential store
  // is untouched either way for `failed` (only Rust's own `ensure_valid` decides that) - this only
  // resets what the frontend displays/reuses.
  const isSessionCode = (code: string) =>
    code === 'steam_community_session_expired' || code === 'steam_community_session_failed'

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

  // A cycle that was already running when its session expired mid-farm (as opposed to `start`'s
  // own catch block below, which only covers a fresh connect/start attempt failing) - reached via
  // `state.sessionExpired` rather than a thrown error, since the expiry is detected asynchronously
  // by the running Rust cycle, not by any call this hook made itself. `useCardFarmingSync` already
  // clears the cached cookies unconditionally (it's always mounted, this hook isn't); this effect
  // only owns the page-local "drop back to the connect panel" UI reset. Keyed on the primitive
  // boolean, not `state` itself, which gets a new identity on every poll tick. Also sets
  // `connectErrorCode` so the user sees *why* the connect panel reappeared - every other path that
  // drops back to it (a failed connect/start attempt) surfaces a real error code; this is the one
  // path that only ever detects a confirmed `SteamCommunitySessionExpired` (never `_failed` - see
  // `card_farming::scraper::is_session_revoked`), so the code is always known here, not read off
  // anything.
  useEffect(() => {
    if (state.sessionExpired && account) {
      manualCookiesRef.current = undefined
      setConnected(false)
      setConnectErrorCode('steam_community_session_expired')
    }
  }, [state.sessionExpired, account])

  // Refuses to let `manualCookies: undefined` reach the backend for a non-gamer account -
  // `session::resolve` has no Rust-side tier check at all, so without this, any call site that
  // reuses `manualCookiesRef.current` (which is `undefined` both right after a session-expiry
  // reset and before the very first successful connect) would silently succeed via automatic
  // derivation for free. Treated exactly like a dead credential: clear the ref/saved cookies and
  // drop back to the connect panel, rather than proceeding.
  const enforceCookieGate = useCallback(
    (manualCookies: SteamCookies | undefined) => {
      if (!account) return false
      if (canResolveCookiesAutomatically(manualCookies !== undefined, subscriptionTier)) return true
      manualCookiesRef.current = undefined
      clearSavedSteamCookies(account)
      setConnected(false)
      return false
    },
    [account, subscriptionTier],
  )

  const connect = useCallback(
    async (manualCookies: SteamCookies | undefined) => {
      if (!account || !enforceCookieGate(manualCookies)) return false
      setIsConnecting(true)
      setConnectErrorCode(null)
      // Use `refresh`'s own return value, not a post-await read of `browse.errorCode` - that
      // property only updates on `useGamesWithDrops`' *next* render, which hasn't happened yet by
      // the time this closure resumes, so it was always a stale (pre-attempt) snapshot here. That
      // silently broke both the error banner and the dead-cookie clearing below for every failure.
      const failureCode = await browse.refresh(manualCookies)
      if (failureCode === null) {
        manualCookiesRef.current = manualCookies
        setConnected(true)
      } else {
        setConnectErrorCode(failureCode)
        // See `start`'s identical handling - `connect` reaches this same outcome both on a fresh
        // connect attempt and via `refreshBrowse` reusing already-proven cookies that died since.
        // Without this, a dead cookie set never gets cleared from this path at all, so the connect
        // panel keeps re-showing (and re-prefilling) the exact same dead values forever.
        if (isSessionCode(failureCode)) {
          manualCookiesRef.current = undefined
          clearSavedSteamCookies(account)
        }
      }
      setIsConnecting(false)
      return failureCode === null
    },
    [account, enforceCookieGate, browse],
  )

  const start = useCallback(async () => {
    if (!account || !enforceCookieGate(manualCookiesRef.current)) return
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
      // Unlike card farming's other errors, a session-related failure isn't fixable without
      // reconnecting, and this page has no separate "Reconnect" affordance the way
      // InventoryPageHeader does, so drop back to CardFarmingStartPanel directly rather than
      // leaving the user stuck looking at an empty tab view with only an error banner.
      if (isSessionCode(String(error))) {
        manualCookiesRef.current = undefined
        clearSavedSteamCookies(account)
        setConnected(false)
      }
    } finally {
      setIsStarting(false)
    }
  }, [account, enforceCookieGate])

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
  // real refetch is the only way to bring it back. Also goes through `enforceCookieGate` - reuses
  // `manualCookiesRef.current` directly, same exposure `connect`/`start` have - and the same
  // session-failure handling, since the reused cookies can just as easily have died since.
  const refreshBrowse = useCallback(async () => {
    if (!account || !enforceCookieGate(manualCookiesRef.current)) return
    const failureCode = await browse.refresh(manualCookiesRef.current)
    if (failureCode !== null) {
      setConnectErrorCode(failureCode)
      if (isSessionCode(failureCode)) {
        manualCookiesRef.current = undefined
        clearSavedSteamCookies(account)
        setConnected(false)
      }
    }
  }, [account, enforceCookieGate, browse])

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
