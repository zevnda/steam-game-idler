import type { Achievement, InvokeAchievementData, InvokeAchievementUnlock } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { showAccountMismatchToast, showDangerToast, showSuccessToast } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import { checkSteamStatus, logEvent, unlockAchievement } from '@/shared/utils'

export const handleApplyChanges = async (
  appId: number,
  appName: string,
  selectedToUnlock: Set<string>,
  selectedToLock: Set<string>,
  achievements: Achievement[],
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>,
  setSelectedToUnlock: React.Dispatch<React.SetStateAction<Set<string>>>,
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

    let unlockCount = 0
    let lockCount = 0

    // Unlock selected achievements
    const toUnlock = achievements.filter(a => selectedToUnlock.has(a.id))
    for (const achievement of toUnlock) {
      const success = await unlockAchievement(userSummary?.steamId, appId, achievement.id, appName)
      if (success) unlockCount++
    }

    // Lock selected achievements
    const toLock = achievements.filter(a => selectedToLock.has(a.id))
    for (const achievement of toLock) {
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
        lockCount++
        logEvent(`[Achievement Manager] Locked ${achievement.id} for ${appName} (${appId})`)
      }
    }

    if (unlockCount > 0 || lockCount > 0) {
      setAchievements(prev =>
        prev.map(a => {
          if (selectedToUnlock.has(a.id)) return { ...a, achieved: true }
          if (selectedToLock.has(a.id)) return { ...a, achieved: false }
          return a
        }),
      )
      setSelectedToUnlock(new Set())
      setSelectedToLock(new Set())

      const parts: string[] = []
      if (unlockCount > 0) {
        parts.push(i18next.t('toast.unlockAll.success', { count: unlockCount, appName }))
      }
      if (lockCount > 0) {
        parts.push(i18next.t('toast.lockAll.success', { count: lockCount, appName }))
      }
      showSuccessToast(parts.join(' · '))
    } else {
      showAccountMismatchToast('danger')
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in handleApplyChanges:', error)
    logEvent(`[Error] in (handleApplyChanges): ${error}`)
  }
}
