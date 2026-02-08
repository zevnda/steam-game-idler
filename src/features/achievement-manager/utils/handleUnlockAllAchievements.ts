import type { Achievement } from '@/shared/types'
import i18next from 'i18next'
import { useUserStore } from '@/shared/stores'
import { showAccountMismatchToast, showDangerToast, showSuccessToast } from '@/shared/ui'
import { checkSteamStatus, logEvent, unlockAllAchievements } from '@/shared/utils'

export const handleUnlockAllAchievements = async (
  appId: number,
  appName: string,
  achievements: Achievement[],
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>,
  onClose: () => void,
) => {
  const { userSummary } = useUserStore.getState()

  try {
    // Close modal
    onClose()

    // Make sure Steam client is running
    const isSteamRunning = await checkSteamStatus(true)
    if (!isSteamRunning) return

    // Unlock all achievements
    const success = await unlockAllAchievements(userSummary?.steamId, appId, achievements, appName)

    if (success) {
      // Update UI to show all achievements as unlocked
      setAchievements(prevAchievements => {
        return prevAchievements.map(achievement => {
          return { ...achievement, achieved: true }
        })
      })

      showSuccessToast(
        i18next.t('toast.unlockAll.success', {
          count: achievements.length,
          appName,
        }),
      )
    } else {
      // Shows toast when Steam account doesn't match current user
      showAccountMismatchToast('danger')
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in handleUnlockAll:', error)
    logEvent(`[Error] in (handleUnlockAll): ${error}`)
  }
}
