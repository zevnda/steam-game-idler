import { useCallback, useEffect, useState } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

interface PerGameSettings {
  maxIdleTime: number | null
  maxCardDrops: number | null
  maxCardFarmingTime: number | null
  maxAchievementUnlocks: number | null
  maxPlaytime: number | null
}

const EMPTY_PER_GAME: PerGameSettings = {
  maxIdleTime: null,
  maxCardDrops: null,
  maxCardFarmingTime: null,
  maxAchievementUnlocks: null,
  maxPlaytime: null,
}

// Backs the Game Settings tab - a cross-cutting screen spanning idling/card-farming/
// achievement-unlocker's own per-account settings modules (see each module's own doc comment for
// why the auto-stop caps live as sibling fields there rather than in one shared blob), plus
// `max_playtime`'s own settings module (not owned by any one feature - see its module doc
// comment). Both the global fields and the `appId`-keyed per-game fields re-fetch every time this
// tab becomes active (not just once) - see the per-game load effect's own doc comment for why that
// matters more here than in `useCardFarmingSettings`'s simpler "load once" gating.
export const useGameSettings = () => {
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const isActive = isOpen && activeTab === 'gameSettings'
  const account = useSessionStore(state => state.account)

  const [globalMaxIdleTime, setGlobalMaxIdleTimeState] = useState(0)
  const [globalMaxCardFarmingTime, setGlobalMaxCardFarmingTimeState] = useState(0)
  const [globalMaxPlaytime, setGlobalMaxPlaytimeState] = useState(0)
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)

  // App IDs with a non-default per-game override in any of the four caps - backs the game list's
  // "customized" indicator. Loaded in bulk alongside the global fields (one command per owning
  // module, unioned here) rather than per-game, since the indicator needs to cover every game in
  // the list at once, not just the currently selected one.
  const [customizedAppIds, setCustomizedAppIds] = useState<Set<number>>(new Set())

  const [selectedAppId, setSelectedAppId] = useState<number | null>(null)
  const [perGame, setPerGame] = useState<PerGameSettings>(EMPTY_PER_GAME)
  const [isLoadingGame, setIsLoadingGame] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null)

  const loadGlobal = useCallback(async () => {
    if (!account) return
    setIsLoadingGlobal(true)
    setLoadErrorCode(null)
    try {
      const [
        idle,
        farming,
        playtime,
        idlingCustomized,
        cardFarmingCustomized,
        achievementCustomized,
        playtimeCustomized,
      ] = await Promise.all([
        invoke<number>('get_idling_global_max_idle_time', { account }),
        invoke<number>('get_card_farming_global_max_farming_time', { account }),
        invoke<number>('get_global_max_playtime', { account }),
        invoke<number[]>('get_idling_customized_app_ids', { account }),
        invoke<number[]>('get_card_farming_customized_app_ids', { account }),
        invoke<number[]>('get_achievement_unlocker_customized_app_ids', { account }),
        invoke<number[]>('get_max_playtime_customized_app_ids', { account }),
      ])
      setGlobalMaxIdleTimeState(idle)
      setGlobalMaxCardFarmingTimeState(farming)
      setGlobalMaxPlaytimeState(playtime)
      setCustomizedAppIds(
        new Set([
          ...idlingCustomized,
          ...cardFarmingCustomized,
          ...achievementCustomized,
          ...playtimeCustomized,
        ]),
      )
    } catch (error) {
      console.error('Error loading global game settings:', error)
      setLoadErrorCode(String(error))
    } finally {
      setIsLoadingGlobal(false)
    }
  }, [account])

  useEffect(() => {
    if (isActive) {
      loadGlobal()
    }
  }, [isActive, loadGlobal])

  // Updates `customizedAppIds` membership for `appId` from its full, freshly-known per-game state
  // - shared by the per-game load effect below (fresh from the fetch) and every per-game setter
  // further down (fresh from merging the save result into the previous per-game state).
  const syncCustomizedAppId = useCallback((appId: number, next: PerGameSettings) => {
    const isCustomized = Boolean(
      next.maxIdleTime ||
      next.maxCardDrops ||
      next.maxCardFarmingTime ||
      next.maxAchievementUnlocks ||
      next.maxPlaytime,
    )
    setCustomizedAppIds(prev => {
      if (prev.has(appId) === isCustomized) return prev
      const nextSet = new Set(prev)
      if (isCustomized) {
        nextSet.add(appId)
      } else {
        nextSet.delete(appId)
      }
      return nextSet
    })
  }, [])

  // Gated on `isActive`, not just `account`/`selectedAppId` - the TabPanel stays mounted while
  // another Settings tab is active (see SettingsPanel's doc comment), so a still-selected game's
  // per-game fields would otherwise go stale after Debug's "Reset Settings" wipes them on disk
  // without this tab's own state knowing. Re-fetching on every reactivation (not just once) mirrors
  // `loadGlobal`'s own tab-gating above rather than adding a separate reset-specific refresh path.
  useEffect(() => {
    if (!account || selectedAppId === null || !isActive) {
      setPerGame(EMPTY_PER_GAME)
      return
    }

    let cancelled = false
    setIsLoadingGame(true)
    setLoadErrorCode(null)
    ;(async () => {
      try {
        const [maxIdleTime, maxCardDrops, maxCardFarmingTime, maxAchievementUnlocks, maxPlaytime] =
          await Promise.all([
            invoke<number | null>('get_idling_max_idle_time', { account, appId: selectedAppId }),
            invoke<number | null>('get_card_farming_max_card_drops', {
              account,
              appId: selectedAppId,
            }),
            invoke<number | null>('get_card_farming_max_card_farming_time', {
              account,
              appId: selectedAppId,
            }),
            invoke<number | null>('get_achievement_unlocker_max_unlocks', {
              account,
              appId: selectedAppId,
            }),
            invoke<number | null>('get_max_playtime', { account, appId: selectedAppId }),
          ])
        if (cancelled) return
        const next = {
          maxIdleTime,
          maxCardDrops,
          maxCardFarmingTime,
          maxAchievementUnlocks,
          maxPlaytime,
        }
        setPerGame(next)
        // Uses `selectedAppId` from this effect's own closure, not a reactively-read `perGame`
        // state value - `perGame` still holds the *previous* selection's data for the async gap
        // between selecting a new game and this fetch resolving, so deriving "customized" from it
        // reactively (an earlier version of this effect) briefly attributed the wrong game's
        // overrides to the newly-selected appId.
        syncCustomizedAppId(selectedAppId, next)
      } catch (error) {
        if (cancelled) return
        console.error('Error loading per-game settings:', error)
        setLoadErrorCode(String(error))
      } finally {
        if (!cancelled) setIsLoadingGame(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [account, selectedAppId, isActive, syncCustomizedAppId])

  // `0` always means "no override" on the wire (see each Rust setter's own doc comment) - the
  // number input never needs to represent an explicit override of exactly 0 as distinct from
  // "unset," so every per-game save collapses `0` to `null` here rather than persisting a
  // needless map entry.
  const asOverride = (value: number) => (value > 0 ? value : null)

  // A discriminated result, not a bare `T | null` return - several of these commands' own success
  // value *is* `null` (an `Option<u32>` override being cleared), so `null` can't double as "the
  // call failed" the way `useCardFarmingSettings`'s simpler `T | false` pattern gets away with for
  // commands that only ever return an object.
  const runSave = useCallback(async <T>(command: string, args: Record<string, unknown>) => {
    setIsSaving(true)
    setActionErrorCode(null)
    try {
      const value = await invoke<T>(command, args)
      const { account: _account, ...rest } = args
      logFrontendInfo('useGameSettings', 'game setting saved', { command, ...rest })
      return { ok: true as const, value }
    } catch (error) {
      console.error(`Error in (${command}):`, error)
      setActionErrorCode(String(error))
      return { ok: false as const }
    } finally {
      setIsSaving(false)
    }
  }, [])

  const setGlobalMaxIdleTime = useCallback(
    async (minutes: number) => {
      if (!account) return false
      const result = await runSave<number>('set_idling_global_max_idle_time', {
        account,
        minutes,
      })
      if (!result.ok) return false
      setGlobalMaxIdleTimeState(result.value)
      return true
    },
    [account, runSave],
  )

  const setGlobalMaxCardFarmingTime = useCallback(
    async (minutes: number) => {
      if (!account) return false
      const result = await runSave<number>('set_card_farming_global_max_farming_time', {
        account,
        minutes,
      })
      if (!result.ok) return false
      setGlobalMaxCardFarmingTimeState(result.value)
      return true
    },
    [account, runSave],
  )

  const setMaxIdleTime = useCallback(
    async (value: number) => {
      if (!account || selectedAppId === null) return false
      const result = await runSave<number | null>('set_idling_max_idle_time', {
        account,
        appId: selectedAppId,
        maxIdleTime: asOverride(value),
      })
      if (!result.ok) return false
      setPerGame(prev => {
        const next = { ...prev, maxIdleTime: result.value }
        syncCustomizedAppId(selectedAppId, next)
        return next
      })
      return true
    },
    [account, selectedAppId, runSave, syncCustomizedAppId],
  )

  const setMaxCardDrops = useCallback(
    async (value: number) => {
      if (!account || selectedAppId === null) return false
      const result = await runSave<number | null>('set_card_farming_max_card_drops', {
        account,
        appId: selectedAppId,
        maxCardDrops: asOverride(value),
      })
      if (!result.ok) return false
      setPerGame(prev => {
        const next = { ...prev, maxCardDrops: result.value }
        syncCustomizedAppId(selectedAppId, next)
        return next
      })
      return true
    },
    [account, selectedAppId, runSave, syncCustomizedAppId],
  )

  const setMaxCardFarmingTime = useCallback(
    async (value: number) => {
      if (!account || selectedAppId === null) return false
      const result = await runSave<number | null>('set_card_farming_max_card_farming_time', {
        account,
        appId: selectedAppId,
        maxCardFarmingTime: asOverride(value),
      })
      if (!result.ok) return false
      setPerGame(prev => {
        const next = { ...prev, maxCardFarmingTime: result.value }
        syncCustomizedAppId(selectedAppId, next)
        return next
      })
      return true
    },
    [account, selectedAppId, runSave, syncCustomizedAppId],
  )

  const setMaxAchievementUnlocks = useCallback(
    async (value: number) => {
      if (!account || selectedAppId === null) return false
      const result = await runSave<number | null>('set_achievement_unlocker_max_unlocks', {
        account,
        appId: selectedAppId,
        maxUnlocks: asOverride(value),
      })
      if (!result.ok) return false
      setPerGame(prev => {
        const next = { ...prev, maxAchievementUnlocks: result.value }
        syncCustomizedAppId(selectedAppId, next)
        return next
      })
      return true
    },
    [account, selectedAppId, runSave, syncCustomizedAppId],
  )

  const setGlobalMaxPlaytime = useCallback(
    async (minutes: number) => {
      if (!account) return false
      const result = await runSave<number>('set_global_max_playtime', {
        account,
        minutes,
      })
      if (!result.ok) return false
      setGlobalMaxPlaytimeState(result.value)
      return true
    },
    [account, runSave],
  )

  const setMaxPlaytime = useCallback(
    async (value: number) => {
      if (!account || selectedAppId === null) return false
      const result = await runSave<number | null>('set_max_playtime', {
        account,
        appId: selectedAppId,
        maxPlaytime: asOverride(value),
      })
      if (!result.ok) return false
      setPerGame(prev => {
        const next = { ...prev, maxPlaytime: result.value }
        syncCustomizedAppId(selectedAppId, next)
        return next
      })
      return true
    },
    [account, selectedAppId, runSave, syncCustomizedAppId],
  )

  return {
    selectedAppId,
    selectGame: setSelectedAppId,
    customizedAppIds,
    globalMaxIdleTime,
    globalMaxCardFarmingTime,
    globalMaxPlaytime,
    perGame,
    isLoading: isLoadingGlobal || isLoadingGame,
    isSaving,
    loadErrorCode,
    actionErrorCode,
    refresh: loadGlobal,
    setGlobalMaxIdleTime,
    setGlobalMaxCardFarmingTime,
    setMaxIdleTime,
    setMaxCardDrops,
    setMaxCardFarmingTime,
    setMaxAchievementUnlocks,
    setGlobalMaxPlaytime,
    setMaxPlaytime,
  }
}
