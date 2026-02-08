import type { Achievement } from '@/shared/types'
import i18next from 'i18next'
import { showAccountMismatchToast, showDangerToast, showSuccessToast } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import { checkSteamStatus, lockAllAchievements, logEvent } from '@/shared/utils'

export const handleLockAllAchievements = async (
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

    // Lock all achievemnts
    const success = await lockAllAchievements(userSummary?.steamId, appId, achievements, appName)

    if (success) {
      // Update UI to show all achievements as locked
      setAchievements(prevAchievements => {
        return prevAchievements.map(achievement => {
          return { ...achievement, achieved: false }
        })
      })

      showSuccessToast(
        i18next.t('toast.lockAll.success', {
          count: achievements.length,
          appName,
        }),
      )
    } else {
      showAccountMismatchToast('danger')
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in handleLockAll:', error)
    logEvent(`[Error] in handleLockAll: ${error}`)
  }
}
