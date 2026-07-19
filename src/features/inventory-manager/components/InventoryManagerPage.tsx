import type { InventoryItem } from '../types'
import type { FilterKey } from './InventoryFilterPanel'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInventory } from '../hooks/useInventory'
import { useLockedItems } from '../hooks/useLockedItems'
import { getCurrencyDecimalPlaces } from '../utils/currency'
import { errorMessageKey } from '../utils/errorMessageKey'
import { InventoryConnectPanel } from './InventoryConnectPanel'
import { InventoryFilterPanel } from './InventoryFilterPanel'
import { InventoryItemGrid } from './InventoryItemGrid'
import { InventoryPageHeader } from './InventoryPageHeader'
import { PriceOrderModal } from './PriceOrderModal'
import { Alert, toast } from '@heroui/react'
import { useRouter } from 'next/router'
import { GameGridSkeleton } from '@/shared/components/GameGridSkeleton'
import { useAutoConnectSteamCookies } from '@/shared/hooks/useAutoConnectSteamCookies'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'

// Manual "fetch price" clicks only (see handleOpenPriceModal) - bulk flows (sellCandidates) call
// fetchItemPrice directly and are already spaced out server-side via settings.sellDelay, so this
// doesn't gate them. Mirrors `main`'s PriceData.tsx cooldown, which had the same scope.
const PRICE_FETCH_COOLDOWN_MS = 5_000

const TYPE_FILTER_TO_ITEM_TYPE: Partial<Record<FilterKey, string>> = {
  cards: 'item_class_2',
  backgrounds: 'item_class_3',
  emoticons: 'item_class_4',
  boosters: 'item_class_5',
  sale: 'item_class_10',
}

// Steam Community inventory/market management - trading cards, backgrounds, emoticons, boosters,
// and sale items (see src-tauri/src/inventory/mod.rs's doc comment for why this isn't card-
// specific). Replaces the inventory-manager.tsx placeholder, the last one.
//
// Page-scoped for its own items/settings (no DashboardShell sync hook/shared store) - see
// useInventory's own doc comment for why. The credentials check itself is NOT page-scoped though -
// `useAutoConnectSteamCookies` now reads a check `useSteamCookiesSync` already ran once in
// DashboardShell (see steamCookiesStore's doc comment), so it can skip InventoryConnectPanel
// entirely for a gamer-tier agent-mode account or one with previously-saved cookies (silent
// `connect`) without a fresh per-visit round trip; everyone else sees the panel once the check
// (and any trusted auto-connect it fires) has genuinely settled, then the full browse/manage view -
// mirrors CardFarmingStartPanel's identical gamer-tier automatic-vs-manual cookie split
// (the same template every cookie-gated feature follows), applied here to a one-shot fetch instead
// of a background farming cycle.
export const InventoryManagerPage = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const account = useSessionStore(state => state.account)
  const openSettings = useSettingsModalStore(state => state.open)
  const isSettingsModalOpen = useSettingsModalStore(state => state.isOpen)
  const {
    items,
    settings,
    canAccessInventory,
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
  } = useInventory()
  const { isLocked, toggleLock } = useLockedItems()
  const { isChecking, isAutoConnecting } = useAutoConnectSteamCookies(account, connect)
  const currency = settings?.currency ?? '1'
  const currencyDecimalPlaces = getCurrencyDecimalPlaces(currency)

  const [searchQuery, setSearchQuery] = useState('')
  // Persisted across navigation/reload/restart via `sortPreferencesStore` (localStorage) - see
  // GamesPage.tsx's identical wiring.
  const sortStyle = useSortPreferencesStore(state => state.inventory)
  const setSortPreference = useSortPreferencesStore(state => state.setSortPreference)
  const [filterValues, setFilterValues] = useState<Set<FilterKey>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [priceDrafts, setPriceDrafts] = useState<Record<string, number>>({})
  const [priceModalAssetId, setPriceModalAssetId] = useState<string | null>(null)
  const [isSellingAll, setIsSellingAll] = useState(false)
  const [isSellingDupes, setIsSellingDupes] = useState(false)
  // Client-side rate-limit guard for the manual "fetch price" button - a plain ref (not state; a
  // cooldown tick shouldn't cause a re-render), read/written only inside handleOpenPriceModal.
  const priceFetchCooldownUntilRef = useRef(0)

  useEffect(() => {
    if (!account) {
      router.replace('/')
    }
  }, [account, router])

  // The Settings modal is an overlay (see useSettingsModalStore's doc comment), not a route change,
  // so this page never remounts while it's open - re-read this page's own settings copy on the
  // falling edge (modal just closed) so a price-adjustment/sell-limit/currency/sell-delay change
  // saved from the modal takes effect immediately instead of only after navigating away and back.
  const wasSettingsModalOpenRef = useRef(false)
  useEffect(() => {
    if (wasSettingsModalOpenRef.current && !isSettingsModalOpen) {
      refreshSettings()
    }
    wasSettingsModalOpenRef.current = isSettingsModalOpen
  }, [isSettingsModalOpen, refreshSettings])

  const filteredItems = useMemo(() => {
    let list = items

    const query = searchQuery.trim().toLowerCase()
    if (query) {
      list = list.filter(
        item =>
          item.fullName.toLowerCase().includes(query) || item.appName.toLowerCase().includes(query),
      )
    }

    if (!filterValues.has('locked')) {
      list = list.filter(item => !isLocked(item.assetid))
    }

    if (filterValues.size === 0) return list

    const dupeCounts: Record<string, number> = {}
    if (filterValues.has('dupes')) {
      for (const item of list) {
        dupeCounts[item.marketHashName] = (dupeCounts[item.marketHashName] ?? 0) + 1
      }
    }

    const activeTypeFilters = (Object.keys(TYPE_FILTER_TO_ITEM_TYPE) as FilterKey[]).filter(key =>
      filterValues.has(key),
    )
    const hasTypeFilter = activeTypeFilters.length > 0 || filterValues.has('foil')

    return list.filter(item => {
      if (hasTypeFilter) {
        const matchesType = activeTypeFilters.some(
          key => item.itemType === TYPE_FILTER_TO_ITEM_TYPE[key],
        )
        const matchesFoil = filterValues.has('foil') && item.foil
        if (!matchesType && !matchesFoil) return false
      }
      if (filterValues.has('badge') && !(item.badgeLevel > 0)) return false
      if (filterValues.has('dupes') && !(dupeCounts[item.marketHashName] > 1)) return false
      if (filterValues.has('locked') && !isLocked(item.assetid)) return false
      return true
    })
  }, [items, searchQuery, filterValues, isLocked])

  const sortedItems = useMemo(() => {
    const list = [...filteredItems]
    switch (sortStyle) {
      case 'name-asc':
        return list.sort((a, b) => a.fullName.localeCompare(b.fullName))
      case 'name-desc':
        return list.sort((a, b) => b.fullName.localeCompare(a.fullName))
      case 'game-asc':
        return list.sort((a, b) => a.appName.localeCompare(b.appName))
      case 'game-desc':
        return list.sort((a, b) => b.appName.localeCompare(a.appName))
      case 'badge-desc':
        return list.sort((a, b) => (b.badgeLevel || 0) - (a.badgeLevel || 0))
      default:
        return list
    }
  }, [filteredItems, sortStyle])

  // Duplicate detection ignores active filters/search (a distinct, global "clean up my inventory"
  // action, not scoped to whatever's currently being browsed) and locked items (locking an item is
  // this feature's one "never sell this automatically" affordance) - mirrors `main`'s
  // `handleSellAllDupes`, which also groups the full list rather than the filtered view.
  const dupeCandidates = useMemo(() => {
    const groups = new Map<string, InventoryItem[]>()
    for (const item of items) {
      if (isLocked(item.assetid)) continue
      const group = groups.get(item.marketHashName) ?? []
      group.push(item)
      groups.set(item.marketHashName, group)
    }
    const dupes: InventoryItem[] = []
    for (const group of groups.values()) {
      if (group.length > 1) dupes.push(...group.slice(1))
    }
    return dupes
  }, [items, isLocked])

  const selectedCount = useMemo(
    () => Array.from(selectedIds).filter(id => (priceDrafts[id] ?? 0) > 0).length,
    [selectedIds, priceDrafts],
  )

  const priceModalItem = priceModalAssetId
    ? (items.find(item => item.assetid === priceModalAssetId) ?? null)
    : null

  const toggleSelect = useCallback((assetid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(assetid)) {
        next.delete(assetid)
      } else {
        next.add(assetid)
      }
      return next
    })
  }, [])

  const setPriceDraft = useCallback((assetid: string, value: number) => {
    setPriceDrafts(prev => ({ ...prev, [assetid]: value }))
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (value > 0) {
        next.add(assetid)
      } else {
        next.delete(assetid)
      }
      return next
    })
  }, [])

  // A cached price skips the cooldown entirely (just opens the modal on already-fetched data) -
  // mirrors `main`'s PriceData.tsx handleFetchPrice, including not opening the modal at all while
  // on cooldown (nothing to show yet, and opening-then-immediately-closing on the next real fetch
  // reads as a glitch).
  const handleOpenPriceModal = useCallback(
    (item: InventoryItem) => {
      if (item.priceData) {
        setPriceModalAssetId(item.assetid)
        return
      }
      const now = Date.now()
      if (now < priceFetchCooldownUntilRef.current) {
        const secondsLeft = Math.ceil((priceFetchCooldownUntilRef.current - now) / 1000)
        toast.warning(
          t('dashboard.inventoryManager.toasts.priceFetchCooldown', { seconds: secondsLeft }),
        )
        return
      }
      priceFetchCooldownUntilRef.current = now + PRICE_FETCH_COOLDOWN_MS
      setPriceModalAssetId(item.assetid)
      fetchItemPrice(item)
    },
    [fetchItemPrice, t],
  )

  const handlePickPrice = useCallback(
    (price: number) => {
      if (priceModalAssetId) setPriceDraft(priceModalAssetId, price)
    },
    [priceModalAssetId, setPriceDraft],
  )

  // Mirrors `main`'s handleSellSingleCard: a lock re-check (an item can be locked after being
  // priced/selected but before this fires) and priceAdjustment/sellLimit enforcement apply to every
  // listing path, not just the automatic sellCandidates flow - a manually entered price is still
  // adjusted and range-checked the same as an auto-filled one.
  const handleListSingle = useCallback(
    async (item: InventoryItem) => {
      const price = priceDrafts[item.assetid] ?? 0
      if (price <= 0) return
      if (isLocked(item.assetid)) {
        toast.warning(t('dashboard.inventoryManager.toasts.itemLocked'))
        return
      }
      const adjustedPrice = price + (settings?.priceAdjustment ?? 0)
      const sellLimit = settings?.sellLimit
      if (sellLimit && (adjustedPrice < sellLimit.min || adjustedPrice > sellLimit.max)) {
        toast.warning(
          t('dashboard.inventoryManager.toasts.priceOutOfRange', {
            price: adjustedPrice.toFixed(currencyDecimalPlaces),
            min: sellLimit.min.toFixed(currencyDecimalPlaces),
            max: sellLimit.max.toFixed(currencyDecimalPlaces),
          }),
        )
        return
      }
      await listItems([[item.assetid, adjustedPrice.toFixed(currencyDecimalPlaces)]])
      setPriceDrafts(prev => {
        const next = { ...prev }
        delete next[item.assetid]
        return next
      })
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(item.assetid)
        return next
      })
    },
    [priceDrafts, listItems, currencyDecimalPlaces, isLocked, settings, t],
  )

  const handleListSelected = useCallback(async () => {
    const priceAdjustment = settings?.priceAdjustment ?? 0
    const sellLimit = settings?.sellLimit
    const candidateIds = Array.from(selectedIds).filter(id => (priceDrafts[id] ?? 0) > 0)

    const unlockedIds = candidateIds.filter(id => !isLocked(id))
    const lockedCount = candidateIds.length - unlockedIds.length
    if (lockedCount > 0) {
      toast.warning(t('dashboard.inventoryManager.toasts.skippedLocked', { count: lockedCount }))
    }

    const pairs: [string, string][] = []
    let skippedOutOfRange = 0
    for (const id of unlockedIds) {
      const adjustedPrice = priceDrafts[id] + priceAdjustment
      if (sellLimit && (adjustedPrice < sellLimit.min || adjustedPrice > sellLimit.max)) {
        skippedOutOfRange++
        continue
      }
      pairs.push([id, adjustedPrice.toFixed(currencyDecimalPlaces)])
    }
    if (skippedOutOfRange > 0) {
      toast.warning(
        t('dashboard.inventoryManager.toasts.skippedOutOfRange', { count: skippedOutOfRange }),
      )
    }

    if (pairs.length === 0) {
      if (candidateIds.length > 0)
        toast.warning(t('dashboard.inventoryManager.toasts.noneEligible'))
      return
    }
    await listItems(pairs, settings?.sellDelay)
    setPriceDrafts({})
    setSelectedIds(new Set())
  }, [selectedIds, priceDrafts, listItems, settings, isLocked, currencyDecimalPlaces, t])

  // Shared by "Sell all" (candidates = the currently filtered view, matching `main`'s own scoping)
  // and "Sell dupes" (candidates = dupeCandidates, ignores filters). A user-entered `priceDrafts`
  // value (from the price modal or manual input, whichever is why the card shows as selected) wins
  // over the auto-computed price - it's an explicit override, not just a selection side-effect, so
  // it must be honored here the same as it already is by handleListSingle/handleListSelected. Only
  // items with no draft fall back to fetching a price and applying this account's price
  // preference/adjustment. Either way, anything outside the configured sell-limit range is skipped,
  // then everything that qualified is listed in one batched `list_items` call (the backend spaces
  // the actual listing requests out by `settings.sellDelay` itself - see inventory/market.rs - so
  // this doesn't need its own per-item client-side delay loop the way `main`'s sequential version
  // did).
  const sellCandidates = useCallback(
    async (candidates: InventoryItem[]) => {
      if (!settings) return
      const pairs: [string, string][] = []
      const listedIds: string[] = []
      for (const item of candidates) {
        if (isLocked(item.assetid)) continue
        const customPrice = priceDrafts[item.assetid]
        if (customPrice > 0) {
          const finalPrice = customPrice + settings.priceAdjustment
          if (finalPrice < settings.sellLimit.min || finalPrice > settings.sellLimit.max) continue
          pairs.push([item.assetid, finalPrice.toFixed(currencyDecimalPlaces)])
          listedIds.push(item.assetid)
          continue
        }
        let priceData = item.priceData
        if (!priceData) {
          try {
            priceData = (await fetchItemPrice(item, { silent: true })) ?? undefined
          } catch (error) {
            // Mirrors `main`'s sellCardsList: stop the whole batch the moment price-fetching hits
            // Steam's rate limit instead of hammering it again for every remaining candidate.
            if (String(error) === 'market_price_rate_limited') {
              toast.warning(t('dashboard.inventoryManager.errors.priceRateLimited'))
              break
            }
            continue
          }
        }
        if (!priceData) continue
        const base =
          settings.pricePreference === 'lowestSellOrder'
            ? priceData.lowestSellOrder
            : (priceData.highestBuyOrder ?? priceData.lowestSellOrder)
        if (base === undefined) continue
        const finalPrice = base + settings.priceAdjustment
        if (finalPrice < settings.sellLimit.min || finalPrice > settings.sellLimit.max) continue
        pairs.push([item.assetid, finalPrice.toFixed(currencyDecimalPlaces)])
        listedIds.push(item.assetid)
      }
      if (pairs.length === 0) {
        toast.warning(t('dashboard.inventoryManager.toasts.noneEligible'))
        return
      }
      await listItems(pairs, settings.sellDelay)
      setPriceDrafts(prev => {
        const next = { ...prev }
        for (const id of listedIds) delete next[id]
        return next
      })
      setSelectedIds(prev => {
        const next = new Set(prev)
        for (const id of listedIds) next.delete(id)
        return next
      })
    },
    [settings, isLocked, priceDrafts, fetchItemPrice, listItems, t, currencyDecimalPlaces],
  )

  const handleSellAll = useCallback(async () => {
    setIsSellingAll(true)
    try {
      await sellCandidates(filteredItems)
    } finally {
      setIsSellingAll(false)
    }
  }, [filteredItems, sellCandidates])

  const handleSellDupes = useCallback(async () => {
    setIsSellingDupes(true)
    try {
      await sellCandidates(dupeCandidates)
    } finally {
      setIsSellingDupes(false)
    }
  }, [dupeCandidates, sellCandidates])

  // Single source of truth for "some bulk market action is in flight" - passed to both the header
  // (which also needs the individual flags below for each button's own spinner) and the item grid
  // (whose per-card "list single" button has no per-action flag of its own to check). See
  // InventoryPageHeader.tsx's doc comment on why this must gate every action, not just its own.
  const isBusy = isListing || isSellingAll || isSellingDupes || isRemovingListings

  if (!account) {
    return null
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Always mounted, like every other page's header (GamesPageHeader/CardFarmingPageHeader/
          etc.) - only the action buttons are gated on `hasLoaded` (here, `canAccessInventory` -
          see useInventory.ts's doc comment for why raw `hasLoaded` alone isn't sufficient), so the
          title/count row stays visible through the initial skeleton and the connect panel instead
          of the page looking headerless until a fetch succeeds. */}
      <InventoryPageHeader
        dupesCount={dupeCandidates.length}
        hasLoaded={canAccessInventory}
        isBusy={isBusy}
        isFetching={isFetching}
        isListing={isListing}
        isRemovingListings={isRemovingListings}
        isSellingAll={isSellingAll}
        isSellingDupes={isSellingDupes}
        itemCount={filteredItems.length}
        selectedCount={selectedCount}
        sellDelaySeconds={settings?.sellDelay ?? 10}
        onListSelected={handleListSelected}
        onOpenSettings={() => openSettings('inventoryManager')}
        onRefresh={refresh}
        onRemoveListings={removeListings}
        onSellAll={handleSellAll}
        onSellDupes={handleSellDupes}
      />

      {canAccessInventory && errorCode && (
        <div className='px-6 pt-4'>
          <Alert status='danger'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('dashboard.inventoryManager.errors.title')}</Alert.Title>
              <Alert.Description>
                {t(errorMessageKey(errorCode), { code: errorCode })}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      {isInitializing || isChecking || isAutoConnecting || isManualRefreshing ? (
        // Folds the shared credentials check (and any trusted auto-connect attempt it kicks off -
        // see useAutoConnectSteamCookies's doc comment) into the same skeleton branch as the
        // cache-read init - an account with already-valid cookies never flashes the connect panel
        // first. `isManualRefreshing` (not the broader `isFetching`, which also covers the first
        // connect above) replaces the grid with the skeleton again on an explicit refresh-button
        // click - real, visible feedback that the click did something, matching GamesPage's
        // identical `isManualRefreshing` pattern instead of refreshing silently in place.
        <GameGridSkeleton
          gridClassName='grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 p-6'
          tileClassName='h-64 rounded-xl'
        />
      ) : !canAccessInventory ? (
        // Centered in the remaining content area - matches CardFarmingStartPanel's identical
        // centering so both cookie-prompt screens look the same.
        <div className='flex flex-1 items-center justify-center overflow-y-auto'>
          <InventoryConnectPanel
            errorCode={errorCode}
            isConnecting={isFetching}
            onConnect={connect}
          />
        </div>
      ) : (
        <div className='flex min-h-0 flex-1'>
          <InventoryFilterPanel
            filterValues={filterValues}
            isDisabled={items.length === 0}
            searchQuery={searchQuery}
            sortStyle={sortStyle}
            onFilterValuesChange={setFilterValues}
            onSearchQueryChange={setSearchQuery}
            onSortStyleChange={style => setSortPreference('inventory', style)}
          />
          {/* `overflow-hidden`, not `-auto` - InventoryItemGrid is virtualized (react-window's Grid
              owns its own scroll container), matching GamesPage's identical wrapper for GamesList. */}
          <div className='min-h-0 flex-1 overflow-hidden'>
            <InventoryItemGrid
              currency={currency}
              isBusy={isBusy}
              isFetchingPriceFor={marketHashName => pricePendingIds.has(marketHashName)}
              isListing={isListing}
              isLocked={isLocked}
              isSelected={id => selectedIds.has(id)}
              items={sortedItems}
              priceValueFor={id => priceDrafts[id] ?? 0}
              onListSingle={handleListSingle}
              onOpenPriceModal={handleOpenPriceModal}
              onPriceChange={setPriceDraft}
              onToggleLock={toggleLock}
              onToggleSelect={toggleSelect}
            />
          </div>
        </div>
      )}

      <PriceOrderModal
        currency={currency}
        isLoading={priceModalItem ? pricePendingIds.has(priceModalItem.marketHashName) : false}
        item={priceModalItem}
        onOpenChange={open => !open && setPriceModalAssetId(null)}
        onPickPrice={handlePickPrice}
      />
    </div>
  )
}
