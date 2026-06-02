import type { InvokeCustomList, InvokeSettings, InvokeValidateSession } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useSessionStore, useUserStore } from '@/shared/stores'
import {
  autoRevalidateSteamCredentials,
  checkSteamStatus,
  decrypt,
  hasGamerFeature,
} from '@/shared/utils'

export async function startCardFarming() {
  const { userSettings, userSummary, proTier, setUserSettings } = useUserStore.getState()
  const { setIsCardFarming } = useSessionStore.getState()

  try {
    const isSteamRunning = await checkSteamStatus(true)
    if (!isSteamRunning) return

    let credentials = userSettings.cardFarming.credentials

    if (hasGamerFeature(proTier)) {
      const result = await autoRevalidateSteamCredentials(setUserSettings)
      if (result?.credentials) credentials = result.credentials
    }

    if (!credentials?.sid || !credentials?.sls) return toast.missingCredentials()

    const validate = await invoke<InvokeValidateSession>('validate_session', {
      sid: decrypt(credentials.sid),
      sls: decrypt(credentials.sls),
      sma: credentials?.sma,
      steamid: userSummary?.steamId,
    })

    if (!validate.user) {
      await invoke<InvokeSettings>('update_user_settings', {
        steamId: userSummary?.steamId,
        key: 'cardFarming.credentials',
        value: null,
      })
      const res = await invoke<InvokeSettings>('update_user_settings', {
        steamId: userSummary?.steamId,
        key: 'cardFarming.userSummary',
        value: null,
      })
      setUserSettings(res.settings)
      return toast.outdatedCredentials()
    }

    const list = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId: userSummary?.steamId,
      list: 'cardFarmingList',
    })
    if (!userSettings.cardFarming.allGames && list.list_data.length === 0)
      return toast.enableAllGames()

    setIsCardFarming(true)
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    console.error('Error in startCardFarming:', error)
    await logEvent(`[Error] in (startCardFarming): ${error}`)
  }
}
