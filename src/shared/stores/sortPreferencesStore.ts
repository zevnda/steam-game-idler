import type { AchievementSortStyle } from '@/features/achievement-manager/utils/sortAchievements'
import type { CardFarmingSortStyle } from '@/features/card-farming/utils/sortGamesWithDrops'
import type { SortStyle as InventorySortStyle } from '@/features/inventory-manager/components/InventoryFilterPanel'
import type { OwnedGameSortStyle } from '@/shared/utils/sortOwnedGames'
import { create } from 'zustand'

const STORAGE_KEY = 'sortPreferences'

interface SortPreferences {
  games: OwnedGameSortStyle
  favorites: OwnedGameSortStyle
  achievementUnlocker: OwnedGameSortStyle
  autoIdle: OwnedGameSortStyle
  cardFarming: CardFarmingSortStyle
  achievements: AchievementSortStyle
  inventory: InventorySortStyle
}

const DEFAULT_SORT_PREFERENCES: SortPreferences = {
  games: 'playtimeDesc',
  favorites: 'playtimeDesc',
  achievementUnlocker: 'playtimeDesc',
  autoIdle: 'playtimeDesc',
  cardFarming: 'dropsDesc',
  achievements: 'percent',
  inventory: 'name-asc',
}

const persist = (preferences: SortPreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
}

const preferencesOf = (state: SortPreferencesStore) => {
  const { games, favorites, achievementUnlocker, autoIdle, cardFarming, achievements, inventory } =
    state
  return { games, favorites, achievementUnlocker, autoIdle, cardFarming, achievements, inventory }
}

interface SortPreferencesStore extends SortPreferences {
  hydrated: boolean
  // Reads the persisted preferences once - called from `useSortPreferencesSync` (mounted in
  // DashboardShell) rather than at module init, since `localStorage` doesn't exist during Next.js's
  // SSR pass. Mirrors `sidebarStore`'s own hydrate-on-mount shape.
  hydrate: () => void
  setSortPreference: <K extends keyof SortPreferences>(key: K, value: SortPreferences[K]) => void
}

// One shared store for every sort dropdown's selected style (games list, favorites,
// achievement-unlocker, auto-idle, card farming, achievement manager, inventory manager) - a
// single localStorage blob rather than seven near-identical stores, since all of them are
// read/written the same way and none of them are tied to a specific Steam account (a sort
// preference is a personal UI taste that should apply the same way regardless of which signed-in
// account is active, matching `sidebarStore`'s own reasoning).
export const useSortPreferencesStore = create<SortPreferencesStore>((set, get) => ({
  ...DEFAULT_SORT_PREFERENCES,
  hydrated: false,
  hydrate: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const stored = raw ? (JSON.parse(raw) as Partial<SortPreferences>) : {}
      set({ ...DEFAULT_SORT_PREFERENCES, ...stored, hydrated: true })
    } catch (error) {
      console.error('Error in (sortPreferencesStore.hydrate) reading localStorage:', error)
      set({ hydrated: true })
    }
  },
  setSortPreference: (key, value) => {
    set({ [key]: value } as Pick<SortPreferences, typeof key>)
    persist(preferencesOf(get()))
  },
}))
