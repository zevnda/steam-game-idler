import type { Achievement, ChangedStats, InvokeAchievementData, InvokeResetStats, Statistic, StatValue } from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { useStateStore } from '@/stores/stateStore'
import { useUserStore } from '@/stores/userStore'
import { useTranslation } from 'react-i18next'

import { updateStats } from '@/utils/achievements'
import { checkSteamStatus } from '@/utils/tasks'
import { showDangerToast, showSuccessToast, showWarningToast } from '@/utils/toasts'

interface StatisticButtonHook {
  handleUpdateAllStats: () => Promise<void>
  handleResetAll: (onClose: () => void) => Promise<void>
}

export default function useStatisticButtons(
  statistics: Statistic[],
  setStatistics: Dispatch<SetStateAction<Statistic[]>>,
  changedStats: ChangedStats,
  setChangedStats: Dispatch<SetStateAction<ChangedStats>>,
  setAchievements: Dispatch<SetStateAction<Achievement[]>>,
): StatisticButtonHook {
  const { t } = useTranslation()
  const userSummary = useUserStore(state => state.userSummary)
  const appId = useStateStore(state => state.appId)
  const appName = useStateStore(state => state.appName)

  // Handle updating only changed statistics
  const handleUpdateAllStats = async (): Promise<void> => {
    // Make sure Steam client is running
    const isSteamRunning = checkSteamStatus(true)
    if (!isSteamRunning) return

    // Get list of stats that were modified by the user
    const changedKeys = Object.keys(changedStats)

    if (changedKeys.length === 0) {
      return showWarningToast(t('toast.updateAll.noChanges'))
    }

    // Format stats into array of objects with name/value pairs
    // This format is required by SteamUtility
    const valuesArr: StatValue[] = changedKeys.map(name => ({
      name,
      value: changedStats[name],
    }))

    // Update stats
    const success = await updateStats(userSummary?.steamId, appId, appName, valuesArr, setAchievements)

    if (success) {
      showSuccessToast(
        t('toast.updateAll.success', {
          count: changedKeys.length,
          appName,
        }),
      )
      // Clear the tracked changes after successful update
      setChangedStats({})
    } else {
      showDangerToast(t('toast.updateAll.error'))
    }
  }

  // Handle resetting all statistics
  const handleResetAll = async (onClose: () => void): Promise<void> => {
    // Close modla
    onClose()

    // Make sure Steam client is running
    const isSteamRunning = checkSteamStatus(true)
    if (!isSteamRunning) return

    // Reset all stats
    const response = await invoke<InvokeResetStats>('reset_all_stats', {
      appId,
    })
    const status = JSON.parse(String(response)) as InvokeResetStats

    const newData = await invoke<InvokeAchievementData>('get_achievement_data', {
      steamId: userSummary?.steamId,
      appId,
      refetch: true,
    })

    if (status.success) {
      setStatistics(newData.achievement_data.stats)

      showSuccessToast(
        t('toast.resetAll.success', {
          count: statistics.length,
          appName,
        }),
      )

      // Clear the tracked changes after successful update
      setChangedStats({})
    } else {
      showDangerToast(t('toast.resetAll.error'))
    }
  }

  return { handleUpdateAllStats, handleResetAll }
}
