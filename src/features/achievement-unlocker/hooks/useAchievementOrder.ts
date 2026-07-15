import type { AchievementDto } from '@/features/achievement-manager/types'
import type { AchievementOrder, AchievementTiming } from '../types'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessageKey, importTimingsErrorMessageKey } from '../utils/errorMessageKey'
import { toast } from '@heroui/react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

interface OpenGame {
  appId: number
  name: string
}

// Order-specific fields layered onto the achievement-manager's own AchievementDto - only unlocked
// achievements are relevant here (an already-unlocked one has nothing left to order/skip/delay).
export interface OrderableAchievement extends AchievementDto {
  skip: boolean
  delayNextUnlock?: number
}

const byPercentDescending = (a: AchievementDto, b: AchievementDto) =>
  (b.percent ?? 0) - (a.percent ?? 0)

// Data/actions for the achievement-order overlay (achievementOrderStore). Fetch-on-open, same
// pattern as useAchievementManager.ts. Merges the saved AchievementOrder (id/skip/delay only, per
// order.rs's own doc comment on why it doesn't duplicate achievement data) against a live
// get_achievement_data call, rather than trusting a possibly-stale saved copy of the achievement's
// own fields (name/icon/achieved) - mirrors `main`'s AchievementOrderPage.tsx reconciliation, just
// keyed by `id` instead of the display `name`.
export const useAchievementOrder = (openGame: OpenGame | null) => {
  const { t } = useTranslation()
  const account = useSessionStore(state => state.account)
  const [achievements, setAchievements] = useState<OrderableAchievement[]>([])
  const [delayBeforeFirstUnlock, setDelayBeforeFirstUnlock] = useState<number | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!account || !openGame) return
    setIsLoading(true)
    setLoadErrorCode(null)
    try {
      const [data, order] = await Promise.all([
        invoke<{ achievements: AchievementDto[] }>('get_achievement_data', {
          account,
          appId: openGame.appId,
        }),
        invoke<AchievementOrder | null>('get_achievement_order', {
          account,
          appId: openGame.appId,
        }),
      ])

      const unlocked = data.achievements.filter(achievement => !achievement.achieved)

      if (order) {
        const savedById = new Map(
          order.achievements.map((entry, index) => [entry.id, { entry, index }]),
        )
        const merged: OrderableAchievement[] = unlocked.map(achievement => {
          const saved = savedById.get(achievement.id)
          return {
            ...achievement,
            skip: saved?.entry.skip ?? false,
            delayNextUnlock: saved?.entry.delayNextUnlock,
          }
        })
        merged.sort((a, b) => {
          const indexA = savedById.get(a.id)?.index
          const indexB = savedById.get(b.id)?.index
          if (indexA !== undefined && indexB !== undefined) return indexA - indexB
          if (indexA !== undefined) return -1
          if (indexB !== undefined) return 1
          return byPercentDescending(a, b)
        })
        setAchievements(merged)
        setDelayBeforeFirstUnlock(order.delayBeforeFirstUnlock ?? '')
      } else {
        const sorted = [...unlocked].sort(byPercentDescending)
        setAchievements(sorted.map(achievement => ({ ...achievement, skip: false })))
        setDelayBeforeFirstUnlock('')
      }
    } catch (error) {
      console.error('Error in (get_achievement_data/get_achievement_order):', error)
      setLoadErrorCode(String(error))
    } finally {
      setIsLoading(false)
    }
  }, [account, openGame])

  useEffect(() => {
    if (openGame) {
      setAchievements([])
      setLoadErrorCode(null)
      load()
    }
    // Only re-runs when the overlay opens for a (possibly new) game, same reasoning as
    // useAchievementManager.ts's own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openGame?.appId])

  const reorder = useCallback((newOrder: OrderableAchievement[]) => setAchievements(newOrder), [])

  const toggleSkip = useCallback((id: string) => {
    setAchievements(prev =>
      prev.map(achievement =>
        achievement.id === id ? { ...achievement, skip: !achievement.skip } : achievement,
      ),
    )
  }, [])

  const setDelay = useCallback((id: string, value: number | null) => {
    setAchievements(prev =>
      prev.map(achievement =>
        achievement.id === id
          ? { ...achievement, delayNextUnlock: value === null ? undefined : value }
          : achievement,
      ),
    )
  }, [])

  const resetOrder = useCallback(() => {
    setAchievements(prev =>
      [...prev].sort(byPercentDescending).map(achievement => ({
        ...achievement,
        skip: false,
        delayNextUnlock: undefined,
      })),
    )
    setDelayBeforeFirstUnlock('')
  }, [])

  const save = useCallback(async () => {
    if (!account || !openGame) return false
    setIsSaving(true)
    try {
      const order: AchievementOrder = {
        achievements: achievements.map(achievement => ({
          id: achievement.id,
          skip: achievement.skip,
          delayNextUnlock: achievement.delayNextUnlock,
        })),
        delayBeforeFirstUnlock:
          typeof delayBeforeFirstUnlock === 'number' && delayBeforeFirstUnlock > 0
            ? delayBeforeFirstUnlock
            : undefined,
      }
      await invoke('save_achievement_order', { account, appId: openGame.appId, order })
      logFrontendInfo('useAchievementOrder', 'saved custom achievement order', {
        appId: openGame.appId,
        achievementCount: achievements.length,
      })
      toast.success(t('dashboard.achievementUnlocker.order.toasts.saved'))
      return true
    } catch (error) {
      console.error('Error in (save_achievement_order):', error)
      const code = String(error)
      toast.danger(t(errorMessageKey(code), { code }))
      return false
    } finally {
      setIsSaving(false)
    }
  }, [account, openGame, achievements, delayBeforeFirstUnlock, t])

  // Imports a target player's real unlock timestamps and reorders/derives per-achievement delays
  // from them - same delay math as `main`'s ImportTimingsModal.tsx, keyed by `id` (order.rs's own
  // stable key) instead of the display name it used. Achievements this rewrite's list has that
  // aren't present in the imported result get marked `skip: true` and moved to the end, same as
  // `main` - there's no timing data to place them sensibly, so they default to excluded rather than
  // guessed.
  const importTimings = useCallback(
    async (steamInput: string) => {
      if (!openGame) return false
      try {
        const timings = await invoke<AchievementTiming[]>('import_achievement_timings', {
          appId: openGame.appId,
          steamInput,
        })

        const sorted = [...timings].sort((a, b) => a.unlockTime - b.unlockTime)
        const delayMap = new Map<string, number>()
        for (let i = 0; i < sorted.length - 1; i++) {
          const minutes = (sorted[i + 1].unlockTime - sorted[i].unlockTime) / 60
          delayMap.set(sorted[i].id, Math.round(minutes * 10) / 10)
        }
        const orderIndex = new Map(sorted.map((entry, index) => [entry.id, index]))

        setAchievements(prev => {
          const matched = prev.filter(achievement => orderIndex.has(achievement.id))
          const unmatched = prev.filter(achievement => !orderIndex.has(achievement.id))
          matched.sort((a, b) => orderIndex.get(a.id)! - orderIndex.get(b.id)!)
          return [
            ...matched.map(achievement => ({
              ...achievement,
              delayNextUnlock: delayMap.get(achievement.id),
            })),
            ...unmatched.map(achievement => ({
              ...achievement,
              skip: true,
              delayNextUnlock: undefined,
            })),
          ]
        })

        logFrontendInfo('useAchievementOrder', 'imported achievement timings', {
          appId: openGame.appId,
          matchedCount: sorted.length,
        })
        toast.success(
          t('dashboard.achievementUnlocker.importTimings.success', { count: sorted.length }),
        )
        return true
      } catch (error) {
        console.error('Error in (import_achievement_timings):', error)
        const code = String(error)
        toast.danger(t(importTimingsErrorMessageKey(code), { code }))
        return false
      }
    },
    [openGame, t],
  )

  return {
    achievements,
    delayBeforeFirstUnlock,
    setDelayBeforeFirstUnlock,
    isLoading,
    isSaving,
    loadErrorCode,
    refresh: load,
    reorder,
    toggleSkip,
    setDelay,
    resetOrder,
    save,
    importTimings,
  }
}
