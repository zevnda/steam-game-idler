import type { InvokeCustomList } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useSessionStore, useUserStore } from '@/shared/stores'
import { checkSteamStatus } from '@/shared/utils'

export async function startAchievementUnlocker() {
  const { userSummary } = useUserStore.getState()
  const { setIsAchievementUnlocker } = useSessionStore.getState()

  try {
    const running = await checkSteamStatus(true)
    if (!running) return

    const list = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId: userSummary?.steamId,
      list: 'achievementUnlockerList',
    })

    if (list.list_data.length === 0) return toast.noGames()

    setIsAchievementUnlocker(true)
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    console.error('Error in startAchievementUnlocker:', error)
    await logEvent(`[Error] in (startAchievementUnlocker): ${error}`)
  }
}
