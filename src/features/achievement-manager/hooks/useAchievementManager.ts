import type { AchievementData, BulkAchievementResult, SetAchievementsResult } from '../types'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessageKey } from '../utils/errorMessageKey'
import { toast } from '@heroui/react'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { logFrontendWarn } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import { showErrorToast } from '@/shared/utils/showErrorToast'

interface OpenGame {
  appId: number
  name: string
}

// Data/actions for the single-game achievement-manager overlay (achievementManagerStore), against
// the six commands src-tauri/src/achievements/commands.rs exposes. Fetch-on-open, not
// route-synced, since this data has no meaning while the overlay is closed and doesn't drift
// externally while it's open.
//
// Individual achievement toggles and bulk unlock/lock patch `data` locally from the command's own
// result instead of refetching - the command already tells us exactly what changed.
// `reset_all_stats` is the one action that refetches, since it doesn't report the new values.
//
// `loadErrorCode` only ever comes from `load()` - it's what AchievementManagerOverlay uses to
// replace the whole tab with a blocking error state. Mutation failures (toggle/bulk-set/
// save-stats/reset-stats) fire a toast instead of touching this state, so a single failed toggle
// doesn't blank out the entire view behind a full-page error.
export const useAchievementManager = (openGame: OpenGame | null) => {
  const { t, i18n } = useTranslation()
  const account = useSessionStore(state => state.account)
  const currentOs = usePlatformStore(state => state.currentOs)
  const [data, setData] = useState<AchievementData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!account || !openGame) return
    setIsLoading(true)
    setLoadErrorCode(null)
    try {
      setData(
        await invoke<AchievementData>('get_achievement_data', {
          account,
          appId: openGame.appId,
          locale: i18n.language,
        }),
      )
    } catch (error) {
      console.error('Error in (get_achievement_data):', error)
      setLoadErrorCode(String(error))
    } finally {
      setIsLoading(false)
    }
  }, [account, openGame, i18n.language])

  const toastActionError = useCallback(
    (error: unknown) => {
      const code = String(error)
      showErrorToast(t(errorMessageKey(code, currentOs), { code }), code, t('common.learnMore'))
    },
    [t, currentOs],
  )

  useEffect(() => {
    if (openGame) {
      setData(null)
      setLoadErrorCode(null)
      load()
    }
    // Only re-runs when the overlay is opened for a (possibly new) game, not on every account
    // object identity change - `load` already closes over the latest `account`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openGame?.appId])

  const toggleAchievement = useCallback(
    async (achievementId: string, achieved: boolean) => {
      if (!account || !openGame) return
      const name = data?.achievements.find(achievement => achievement.id === achievementId)?.name
      try {
        await invoke('set_achievement', {
          account,
          appId: openGame.appId,
          achievementId,
          unlock: !achieved,
        })
        setData(
          prev =>
            prev && {
              ...prev,
              achievements: prev.achievements.map(achievement =>
                achievement.id === achievementId
                  ? { ...achievement, achieved: !achieved }
                  : achievement,
              ),
            },
        )
        toast.success(
          t(
            achieved
              ? 'dashboard.achievements.toasts.achievementLocked'
              : 'dashboard.achievements.toasts.achievementUnlocked',
            { name },
          ),
        )
      } catch (error) {
        console.error('Error in (set_achievement):', error)
        toastActionError(error)
      }
    },
    [account, openGame, data, t, toastActionError],
  )

  // Backs AchievementsView's selection bar ("Save changes") - unlike `toggleAchievement`, this
  // fires a single summary toast at the end, matching `bulkSetAchievements`'s one-toast convention.
  // One `set_achievements` call applies the whole unlock+lock mix as a single batched write (and
  // retries any rejected item on its own, Rust-side) - replaying `set_achievement` per id made
  // saving scale linearly with the selection size.
  const applyStagedChanges = useCallback(
    async (unlockIds: string[], lockIds: string[]) => {
      if (!account || !openGame) return
      setIsMutating(true)
      const unlockedIds = new Set<string>()
      const lockedIds = new Set<string>()
      try {
        const unlockSet = new Set(unlockIds)
        try {
          const result = await invoke<SetAchievementsResult>('set_achievements', {
            account,
            appId: openGame.appId,
            changes: [
              ...unlockIds.map(id => ({ id, unlock: true })),
              ...lockIds.map(id => ({ id, unlock: false })),
            ],
          })
          for (const id of result.succeeded) {
            if (unlockSet.has(id)) unlockedIds.add(id)
            else lockedIds.add(id)
          }
        } catch (error) {
          console.error('Error in (set_achievements) during applyStagedChanges:', error)
        }
        setData(
          prev =>
            prev && {
              ...prev,
              achievements: prev.achievements.map(achievement => {
                if (unlockedIds.has(achievement.id)) return { ...achievement, achieved: true }
                if (lockedIds.has(achievement.id)) return { ...achievement, achieved: false }
                return achievement
              }),
            },
        )
        const succeededCount = unlockedIds.size + lockedIds.size
        if (succeededCount > 0) {
          toast.success(
            t('dashboard.achievements.toasts.changesApplied', { count: succeededCount }),
          )
        }
        if (succeededCount < unlockIds.length + lockIds.length) {
          toast.danger(t('dashboard.achievements.toasts.applyPartialFailure'))
          logFrontendWarn(
            'useAchievementManager',
            'staged achievement changes had per-item failures',
            {
              appId: openGame.appId,
              attempted: unlockIds.length + lockIds.length,
              succeeded: succeededCount,
            },
          )
        }
        return { unlockedIds, lockedIds }
      } finally {
        setIsMutating(false)
      }
    },
    [account, openGame, t],
  )

  const bulkSetAchievements = useCallback(
    async (unlock: boolean) => {
      if (!account || !openGame) return null
      setIsMutating(true)
      try {
        const command = unlock ? 'unlock_all_achievements' : 'lock_all_achievements'
        const result = await invoke<BulkAchievementResult>(command, {
          account,
          appId: openGame.appId,
        })
        const succeeded = new Set(result.succeeded)
        setData(
          prev =>
            prev && {
              ...prev,
              achievements: prev.achievements.map(achievement =>
                succeeded.has(achievement.id) ? { ...achievement, achieved: unlock } : achievement,
              ),
            },
        )
        if (result.failed.length > 0) {
          logFrontendWarn('useAchievementManager', 'bulk achievement set had per-item failures', {
            command,
            appId: openGame.appId,
            failed: result.failed,
            skipped: result.skipped,
          })
        }
        if (result.succeeded.length > 0) {
          toast.success(
            t(
              unlock
                ? 'dashboard.achievements.toasts.bulkUnlocked'
                : 'dashboard.achievements.toasts.bulkLocked',
              { count: result.succeeded.length },
            ),
          )
        } else {
          toast.warning(t('dashboard.achievements.toasts.bulkNoChanges'))
        }
        return result
      } catch (error) {
        console.error('Error in (bulk achievement set):', error)
        toastActionError(error)
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [account, openGame, t, toastActionError],
  )

  const saveStats = useCallback(
    async (edits: Record<string, number>) => {
      if (!account || !openGame) return false
      const stats = Object.entries(edits).map(([name, value]) => ({ name, value }))
      if (stats.length === 0) return true
      setIsMutating(true)
      try {
        await invoke('update_stats', { account, appId: openGame.appId, stats })
        setData(
          prev =>
            prev && {
              ...prev,
              stats: prev.stats.map(stat =>
                stat.id in edits ? { ...stat, value: edits[stat.id] } : stat,
              ),
            },
        )
        toast.success(t('dashboard.achievements.toasts.statsSaved', { count: stats.length }))
        return true
      } catch (error) {
        console.error('Error in (update_stats):', error)
        toastActionError(error)
        return false
      } finally {
        setIsMutating(false)
      }
    },
    [account, openGame, t, toastActionError],
  )

  const resetAllStats = useCallback(async () => {
    if (!account || !openGame) return false
    setIsMutating(true)
    try {
      await invoke('reset_all_stats', { account, appId: openGame.appId })
      await load()
      toast.success(t('dashboard.achievements.toasts.statsReset'))
      return true
    } catch (error) {
      console.error('Error in (reset_all_stats):', error)
      toastActionError(error)
      return false
    } finally {
      setIsMutating(false)
    }
  }, [account, openGame, load, t, toastActionError])

  return {
    data,
    isLoading,
    isMutating,
    loadErrorCode,
    refresh: load,
    toggleAchievement,
    bulkSetAchievements,
    applyStagedChanges,
    saveStats,
    resetAllStats,
  }
}
