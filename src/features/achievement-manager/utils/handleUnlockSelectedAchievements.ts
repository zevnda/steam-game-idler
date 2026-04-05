import type { Achievement } from '@/shared/types'
import i18next from 'i18next'
import { showAccountMismatchToast, showDangerToast, showSuccessToast } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import { checkSteamStatus, logEvent, unlockAchievement } from '@/shared/utils'

export const handleUnlockSelectedAchievements = async (
  appId: number,
  appName: string,
  selectedIds: Set<string>,
  achievements: Achievement[],
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>,
  setSelectedToUnlock: React.Dispatch<React.SetStateAction<Set<string>>>,
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
    const selectedAchievements = achievements.filter(a => selectedIds.has(a.id))

    for (const achievement of selectedAchievements) {
      const success = await unlockAchievement(userSummary?.steamId, appId, achievement.id, appName)
      if (success) successCount++
    }

    if (successCount > 0) {
      // Update UI to show selected achievements as unlocked
      setAchievements(prevAchievements =>
        prevAchievements.map(a => (selectedIds.has(a.id) ? { ...a, achieved: true } : a)),
      )
      setSelectedToUnlock(new Set())

      showSuccessToast(
        i18next.t('toast.unlockAll.success', {
          count: successCount,
          appName,
        }),
      )
    } else {
      // Shows toast when Steam account doesn't match current user
      showAccountMismatchToast('danger')
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in handleUnlockSelected:', error)
    logEvent(`[Error] in (handleUnlockSelected): ${error}`)
  }
}
