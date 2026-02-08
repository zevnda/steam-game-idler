import type { InvokeCustomList } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { useStateStore, useUserStore } from '@/shared/stores'
import { showDangerToast, showNoGamesToast } from '@/shared/ui'
import { checkSteamStatus, logEvent } from '@/shared/utils'

export const startAchievementUnlocker = async () => {
  const { userSummary } = useUserStore.getState()
  const { setIsAchievementUnlocker } = useStateStore.getState()

  try {
    // Make sure Steam client is running
    const isSteamRunning = await checkSteamStatus(true)
    if (!isSteamRunning) return

    // Retrieve achievement unlocker list
    const achievementUnlockerList = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId: userSummary?.steamId,
      list: 'achievementUnlockerList',
    })

    if (achievementUnlockerList.list_data.length === 0) return showNoGamesToast()

    setIsAchievementUnlocker(true)
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (startAchievementUnlocker):', error)
    logEvent(`[Error] in (startAchievementUnlocker): ${error}`)
  }
}
