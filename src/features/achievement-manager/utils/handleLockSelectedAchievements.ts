import type { Achievement, InvokeAchievementData, InvokeAchievementUnlock } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { showAccountMismatchToast, showDangerToast, showSuccessToast } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import { checkSteamStatus, logEvent } from '@/shared/utils'

export const handleLockSelectedAchievements = async (
  appId: number,
  appName: string,
  selectedToLock: Set<string>,
  achievements: Achievement[],
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>,
  setSelectedToLock: React.Dispatch<React.SetStateAction<Set<string>>>,
  onClose: () => void,
) => {
  const { userSummary } = useUserStore.getState()

  try {
    // Close modal
    onClose()

    // Make sure Steam client is running
    const isSteamRunning = await checkSteamStatus(true)
    if (!isSteamRunning) return

    let successCount = 0
    const selectedAchievements = achievements.filter(a => selectedToLock.has(a.id))

    for (const achievement of selectedAchievements) {
      const response = await invoke<string>('lock_achievement', {
        appId,
        achievementId: achievement.id,
      })

      await invoke<InvokeAchievementData>('get_achievement_data', {
        steamId: userSummary?.steamId,
        appId,
        refetch: true,
      })

      const status = JSON.parse(String(response)) as InvokeAchievementUnlock

      if (status.success) {
        successCount++
        logEvent(`[Achievement Manager] Locked ${achievement.id} for ${appName} (${appId})`)
      }
    }

    if (successCount > 0) {
      // Update UI to show selected achievements as locked
      setAchievements(prevAchievements =>
        prevAchievements.map(a => (selectedToLock.has(a.id) ? { ...a, achieved: false } : a)),
      )
      setSelectedToLock(new Set())

      showSuccessToast(
        i18next.t('toast.lockAll.success', {
          count: successCount,
          appName,
        }),
      )
    } else {
      showAccountMismatchToast('danger')
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in handleLockSelected:', error)
    logEvent(`[Error] in (handleLockSelected): ${error}`)
  }
}
