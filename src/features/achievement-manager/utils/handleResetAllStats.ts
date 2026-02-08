import type {
  ChangedStats,
  InvokeAchievementData,
  InvokeResetStats,
  Statistic,
} from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { showDangerToast, showSuccessToast } from '@/shared/components'
import { useStateStore, useUserStore } from '@/shared/stores'
import { checkSteamStatus } from '@/shared/utils'

export const handleResetAllStats = async (
  statistics: Statistic[],
  setStatistics: React.Dispatch<React.SetStateAction<Statistic[]>>,
  setChangedStats: React.Dispatch<React.SetStateAction<ChangedStats>>,
  onClose: () => void,
) => {
  const { userSummary } = useUserStore.getState()
  const { appId, appName } = useStateStore.getState()

  // Close modla
  onClose()

  // Make sure Steam client is running
  const isSteamRunning = await checkSteamStatus(true)
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
      i18next.t('toast.resetAll.success', {
        count: statistics.length,
        appName,
      }),
    )

    // Clear the tracked changes after successful update
    setChangedStats({})
  } else {
    showDangerToast(i18next.t('toast.resetAll.error'))
  }
}
