import type { Achievement, UserSummary } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { showAccountMismatchToast, showDangerToast, showSuccessToast } from '@/shared/ui'
import {
  checkSteamStatus,
  lockAllAchievements,
  logEvent,
  unlockAllAchievements,
} from '@/shared/utils'

export function useAchievementButtons(
  userSummary: UserSummary,
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>,
) {
  const { t } = useTranslation()

  // Handle change in sorting option
  const handleChange = (
    currentKey: string | undefined,
    achievements: Achievement[],
    setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>,
  ) => {
    if (!currentKey) return

    // Convert event selection to array and get first value
    const sortedAchievements = [...achievements]

    // Sort achievements based on user selection
    switch (currentKey) {
      case 'percent':
        // Sort by completion percentage (highest first)
        sortedAchievements.sort((b, a) => (a.percent || 0) - (b.percent || 0))
        break
      case 'title':
        // Alphabetical sort by achievement name
        sortedAchievements.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'unlocked':
        // Show unlocked achievements first
        sortedAchievements.sort((b, a) => (a.achieved === b.achieved ? 0 : a.achieved ? 1 : -1))
        break
      case 'locked':
        // Show locked achievements first
        sortedAchievements.sort((a, b) => (a.achieved === b.achieved ? 0 : a.achieved ? 1 : -1))
        break
      case 'protected':
        // Show protected achievements first
        sortedAchievements.sort((b, a) => {
          if (a.protected_achievement && !b.protected_achievement) return 1
          if (!a.protected_achievement && b.protected_achievement) return -1
          return 0
        })
        break
      case 'unprotected':
        // Show unprotected achievements first
        sortedAchievements.sort((a, b) => {
          if (a.protected_achievement && !b.protected_achievement) return 1
          if (!a.protected_achievement && b.protected_achievement) return -1
          return 0
        })
        break
      default:
        break
    }

    setAchievements(sortedAchievements)
  }

  // Handle unlocking all achievements
  const handleUnlockAll = async (
    appId: number,
    appName: string,
    achievements: Achievement[],
    onClose: () => void,
  ) => {
    try {
      // Close modal
      onClose()

      // Make sure Steam client is running
      const isSteamRunning = await checkSteamStatus(true)
      if (!isSteamRunning) return

      // Unlock all achievements
      const success = await unlockAllAchievements(
        userSummary?.steamId,
        appId,
        achievements,
        appName,
      )

      if (success) {
        // Update UI to show all achievements as unlocked
        setAchievements(prevAchievements => {
          return prevAchievements.map(achievement => {
            return { ...achievement, achieved: true }
          })
        })

        showSuccessToast(
          t('toast.unlockAll.success', {
            count: achievements.length,
            appName,
          }),
        )
      } else {
        // Shows toast when Steam account doesn't match current user
        showAccountMismatchToast('danger')
      }
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in handleUnlockAll:', error)
      logEvent(`[Error] in (handleUnlockAll): ${error}`)
    }
  }

  // Handle locking all achievements
  const handleLockAll = async (
    appId: number,
    appName: string,
    achievements: Achievement[],
    onClose: () => void,
  ) => {
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
          t('toast.lockAll.success', {
            count: achievements.length,
            appName,
          }),
        )
      } else {
        showAccountMismatchToast('danger')
      }
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in handleLockAll:', error)
      logEvent(`[Error] in handleLockAll: ${error}`)
    }
  }

  return { handleChange, handleUnlockAll, handleLockAll }
}
