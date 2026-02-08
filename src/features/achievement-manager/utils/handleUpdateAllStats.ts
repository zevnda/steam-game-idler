import type { Achievement, ChangedStats, StatValue } from '@/shared/types'
import i18next from 'i18next'
import { showDangerToast, showSuccessToast, showWarningToast } from '@/shared/components'
import { useStateStore, useUserStore } from '@/shared/stores'
import { checkSteamStatus, updateStats } from '@/shared/utils'

export const handleUpdateAllStats = async (
  changedStats: ChangedStats,
  setChangedStats: React.Dispatch<React.SetStateAction<ChangedStats>>,
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>,
) => {
  const { userSummary } = useUserStore.getState()
  const { appId, appName } = useStateStore.getState()

  // Make sure Steam client is running
  const isSteamRunning = await checkSteamStatus(true)
  if (!isSteamRunning) return

  // Get list of stats that were modified by the user
  const changedKeys = Object.keys(changedStats)

  if (changedKeys.length === 0) {
    return showWarningToast(i18next.t('toast.updateAll.noChanges'))
  }

  // Format stats into array of objects with name/value pairs
  // This format is required by SteamUtility
  const valuesArr: StatValue[] = changedKeys.map(name => ({
    name,
    value: changedStats[name],
  }))

  // Update stats
  const success = await updateStats(
    userSummary?.steamId,
    appId,
    appName,
    valuesArr,
    setAchievements,
  )

  if (success) {
    showSuccessToast(
      i18next.t('toast.updateAll.success', {
        count: changedKeys.length,
        appName,
      }),
    )
    // Clear the tracked changes after successful update
    setChangedStats({})
  } else {
    showDangerToast(i18next.t('toast.updateAll.error'))
  }
}
