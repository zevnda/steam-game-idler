import type { InvokeSettings, InvokeSteamCredentials, UserSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores/userStore'

export async function handleShowStoreLoginWindow(
  setUserSettings: (v: UserSettings | ((p: UserSettings) => UserSettings)) => void,
) {
  const { userSummary } = useUserStore.getState()
  const result = await invoke<InvokeSteamCredentials>('open_store_login_window')
  if (!result || !result.success) {
    toast.danger(i18next.t('common.error'))
    return
  }
  const res = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'general.autoRedeemFreeGames',
    value: true,
  })
  setUserSettings(res.settings)
  toast.success(i18next.t('toast.autoRedeem.authenticated', { user: userSummary?.personaName }))
}

export async function handleSignOutCurrentStoreUser(
  setUserSettings: (v: UserSettings | ((p: UserSettings) => UserSettings)) => void,
) {
  const { userSummary } = useUserStore.getState()
  const result = await invoke<InvokeSteamCredentials>('delete_store_cookies')
  if (!result || !result.success) {
    toast.danger(i18next.t('common.error'))
    return
  }
  const res = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'general.autoRedeemFreeGames',
    value: false,
  })
  setUserSettings(res.settings)
}
