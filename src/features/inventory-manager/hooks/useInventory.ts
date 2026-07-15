import type {
  InventoryItem,
  InventorySettings,
  ListItemsResult,
  PriceData,
  RemoveListingsResult,
  SteamCookies,
} from '../types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessageKey } from '../utils/errorMessageKey'
import { toast } from '@heroui/react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'
import { showErrorToast } from '@/shared/utils/showErrorToast'
import { clearSavedSteamCookies } from '@/shared/utils/steamCommunitySessionExpired'

// Data/actions for the inventory-manager page - fetch/cache/connect, market actions (price lookup,
// listing, removing listings), and this account's selling-preferences settings. Page-scoped, not
// `DashboardShell`-synced: unlike idling/games-list/card-farming, nothing here drifts externally
// while the user is looking at a different page, so a fresh fetch per page visit is the right
// default.
//
// `resolvedSteamId` is fetched once via the existing `resolve_account_steam_id` rather than only
// trusting `account.steamId` (local mode only) - this lets both sign-in modes read
// `get_inventory_cache` for an instant paint before the cookie-gated live fetch runs.
// `update_item_price_data`/`get_inventory_cache` both take a raw `steam_id`, not `account`, so
// this is needed for every sign-in mode, not just an optimization.
export const useInventory = () => {
  const { t } = useTranslation()
  const account = useSessionStore(state => state.account)
  const [resolvedSteamId, setResolvedSteamId] = useState<string | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [settings, setSettings] = useState<InventorySettings | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [isListing, setIsListing] = useState(false)
  const [isRemovingListings, setIsRemovingListings] = useState(false)
  const [pricePendingIds, setPricePendingIds] = useState<Set<string>>(new Set())
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const manualCookiesRef = useRef<SteamCookies | undefined>(undefined)

  const toastActionError = useCallback(
    (error: unknown) => {
      const code = String(error)
      showErrorToast(t(errorMessageKey(code), { code }), code, t('common.learnMore'))
      // A definitive session expiry (Rust already cleared any saved credentials - see
      // AppError::SteamCommunitySessionExpired's doc comment). Drops the cached manual cookies so
      // the next action doesn't silently retry the same dead ones (unlike card-farming, which
      // drops straight back to its connect panel instead).
      if (code === 'steam_community_session_expired' && account) {
        manualCookiesRef.current = undefined
        clearSavedSteamCookies(account)
      }
    },
    [t, account],
  )

  // Re-reads just the settings half of init() - exposed as `refreshSettings` so this page's own
  // copy doesn't go stale after a save from the Settings *modal* (an overlay - see
  // useSettingsModalStore's doc comment - not a route change, so this page never remounts while
  // it's open; useInventorySettings.ts's doc comment assumed a remount would handle this, which
  // isn't true for the modal's actual overlay behavior). Matters here specifically (unlike most
  // other settings-consuming pages) because priceAdjustment/sellLimit/pricePreference/sellDelay/
  // currency are all enforced client-side against this exact state, not re-read fresh from disk by
  // a Rust-side loop the way most other per-account settings are.
  const refreshSettings = useCallback(async () => {
    if (!account) return
    try {
      setSettings(await invoke<InventorySettings>('get_inventory_settings', { account }))
    } catch (error) {
      console.error('Error in (get_inventory_settings):', error)
    }
  }, [account])

  // Resolves this account's SteamID64 and reads back cache + this page's own copy of selling
  // preferences (see useInventorySettings.ts's doc comment for why the settings tab keeps a
  // separate, tab-gated copy rather than sharing this one).
  useEffect(() => {
    if (!account) {
      setIsInitializing(false)
      return
    }
    let cancelled = false

    const init = async () => {
      try {
        const steamId = await invoke<string>('resolve_account_steam_id', { account })
        if (cancelled) return
        setResolvedSteamId(steamId)

        const [cached, loadedSettings] = await Promise.all([
          invoke<InventoryItem[]>('get_inventory_cache', { steamId }),
          invoke<InventorySettings>('get_inventory_settings', { account }),
        ])
        if (cancelled) return
        setSettings(loadedSettings)
        if (cached.length > 0) {
          setItems(cached)
          setHasLoaded(true)
        }
      } catch (error) {
        console.error('Error initializing inventory manager:', error)
      } finally {
        if (!cancelled) setIsInitializing(false)
      }
    }
    init()

    return () => {
      cancelled = true
    }
  }, [account])

  // Returns whether the connect succeeded - `useAutoConnectSteamCookies` reads this to decide
  // whether a gamer-tier agent-mode/saved-cookie auto-attempt actually worked.
  const connect = useCallback(
    async (manualCookies: SteamCookies | undefined) => {
      if (!account) return false
      setIsFetching(true)
      setErrorCode(null)
      try {
        const fresh = await invoke<InventoryItem[]>('get_inventory', {
          account,
          manualCookies: manualCookies ?? null,
        })
        manualCookiesRef.current = manualCookies
        setItems(fresh)
        setHasLoaded(true)
        // A successful fetch proves the account resolves cleanly - opportunistically retry the
        // SteamID64 resolution if the mount-time attempt hadn't settled yet (e.g. called right
        // after agent-mode sign-in, before the daemon's first `status_changed` event landed), so
        // fetchItemPrice isn't left permanently disabled for the rest of this page visit.
        if (!resolvedSteamId) {
          invoke<string>('resolve_account_steam_id', { account })
            .then(setResolvedSteamId)
            .catch(error => console.error('Error in (resolve_account_steam_id):', error))
        }
        return true
      } catch (error) {
        console.error('Error in (get_inventory):', error)
        const code = String(error)
        setErrorCode(code)
        // See toastActionError's identical handling for why this drops the cached manual cookies -
        // `connect` reaches this same expired outcome both on a fresh connect and via `refresh`.
        if (code === 'steam_community_session_expired') {
          manualCookiesRef.current = undefined
          clearSavedSteamCookies(account)
        }
        return false
      } finally {
        setIsFetching(false)
      }
    },
    [account, resolvedSteamId],
  )

  // Deliberately separate from `isFetching` - that flag also covers the *first* connect (before
  // `hasLoaded`), where the connect panel's own `isConnecting` spinner is the right feedback, not a
  // full-page skeleton. Only an explicit refresh-button click should replace the already-loaded grid
  // with the skeleton again (real, visible feedback that the click did something) - mirrors
  // `useGamesList.ts`'s identical `isManualRefreshing` split.
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const refresh = useCallback(async () => {
    setIsManualRefreshing(true)
    try {
      await connect(manualCookiesRef.current)
    } finally {
      setIsManualRefreshing(false)
    }
  }, [connect])

  const fetchItemPrice = useCallback(
    // `silent` skips the toast and rethrows the raw error instead - used by sellCandidates so it
    // can distinguish a rate-limit error (and stop the batch) from any other failure (and just
    // skip that item), rather than every per-item failure surfacing its own toast during a bulk run.
    async (item: InventoryItem, options?: { silent?: boolean }) => {
      if (!resolvedSteamId) return null
      setPricePendingIds(prev => new Set(prev).add(item.marketHashName))
      try {
        const priceData = await invoke<PriceData>('get_item_price', {
          marketHashName: item.marketHashName,
          currency: settings?.currency,
        })
        const updated = await invoke<InventoryItem[]>('update_item_price_data', {
          steamId: resolvedSteamId,
          marketHashName: item.marketHashName,
          priceData,
        })
        setItems(updated)
        return priceData
      } catch (error) {
        console.error('Error in (get_item_price):', error)
        if (options?.silent) throw error
        toastActionError(error)
        return null
      } finally {
        setPricePendingIds(prev => {
          const next = new Set(prev)
          next.delete(item.marketHashName)
          return next
        })
      }
    },
    [resolvedSteamId, settings?.currency, toastActionError],
  )

  const listItems = useCallback(
    async (pairs: [string, string][], delay?: number) => {
      if (!account || pairs.length === 0) return null
      setIsListing(true)
      try {
        const result = await invoke<ListItemsResult>('list_items', {
          account,
          manualCookies: manualCookiesRef.current ?? null,
          items: pairs,
          currency: settings?.currency,
          delay,
        })
        if (result.successful > 0) {
          toast.success(t('dashboard.inventoryManager.toasts.listed', { count: result.successful }))
        }
        if (result.successful < result.total) {
          toast.warning(
            t('dashboard.inventoryManager.toasts.listFailed', {
              count: result.total - result.successful,
            }),
          )
        }
        return result
      } catch (error) {
        console.error('Error in (list_items):', error)
        toastActionError(error)
        return null
      } finally {
        setIsListing(false)
      }
    },
    [account, settings?.currency, t, toastActionError],
  )

  const removeListings = useCallback(async () => {
    if (!account) return null
    setIsRemovingListings(true)
    try {
      const result = await invoke<RemoveListingsResult>('remove_market_listings', {
        account,
        manualCookies: manualCookiesRef.current ?? null,
      })
      if (result.totalListings === 0) {
        toast.info(t('dashboard.inventoryManager.toasts.noListings'))
      } else if (result.successfulRemovals > 0) {
        toast.success(
          t('dashboard.inventoryManager.toasts.removedListings', {
            count: result.successfulRemovals,
            total: result.processedListings,
          }),
        )
        refresh()
      } else {
        toast.danger(t('dashboard.inventoryManager.toasts.removeFailed'))
      }
      return result
    } catch (error) {
      console.error('Error in (remove_market_listings):', error)
      toastActionError(error)
      return null
    } finally {
      setIsRemovingListings(false)
    }
  }, [account, refresh, t, toastActionError])

  return {
    items,
    settings,
    hasLoaded,
    isInitializing,
    isFetching,
    isManualRefreshing,
    isListing,
    isRemovingListings,
    pricePendingIds,
    errorCode,
    connect,
    refresh,
    refreshSettings,
    fetchItemPrice,
    listItems,
    removeListings,
  }
}
