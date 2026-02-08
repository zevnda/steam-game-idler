import type { InvokeSettings, InvokeSteamCredentials, UserSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { useUserStore } from '@/shared/stores'
import { showDangerToast, showSuccessToast } from '@/shared/ui'
import { logEvent } from '@/shared/utils'

export const handleShowStoreLoginWindow = async (
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
) => {
  const { userSummary } = useUserStore.getState()

  const result = await invoke<InvokeSteamCredentials>('open_store_login_window')

  if (!result || result.success === false) {
    showDangerToast(i18next.t('common.error'))
    logEvent(`[Error] in (handleShowStoreLoginWindow): ${result?.message || 'Unknown error'}`)
    return
  }

  if (result.success) {
    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'general.autoRedeemFreeGames',
      value: true,
    })

    setUserSettings(response.settings)

    showSuccessToast(
      i18next.t('toast.autoRedeem.authenticated', { user: userSummary?.personaName }),
    )
  }
}

export const handleSignOutCurrentStoreUser = async (
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
) => {
  const { userSummary } = useUserStore.getState()

  const result = await invoke<InvokeSteamCredentials>('delete_store_cookies')

  if (!result || result.success === false) {
    showDangerToast(i18next.t('common.error'))
    logEvent(
      `[Error] in (handleSignOutCurrentStoreUser) this error can occur if you are not already signed in: ${result?.message || 'Unknown error'}`,
    )
    return
  }

  const response = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'general.autoRedeemFreeGames',
    value: false,
  })

  setUserSettings(response.settings)
}
