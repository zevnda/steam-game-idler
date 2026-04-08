import type { InvokeSettings, InvokeSteamCredentials, UserSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { showDangerToast, showSuccessToast } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import {
  isMissingTauriInvokeError,
  logEvent,
  showDesktopOnlyToast,
  waitForTauriInvoke,
} from '@/shared/utils'

export const handleShowStoreLoginWindow = async (
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
) => {
  try {
    const tauriReady = await waitForTauriInvoke()
    if (!tauriReady) {
      showDesktopOnlyToast()
      return
    }

    const { userSummary } = useUserStore.getState()

    const result = await invoke<InvokeSteamCredentials>('open_store_login_window')

    if (!result || result.success === false) {
      showDangerToast(i18next.t('common.error'))
      logEvent(`[Error] in (handleShowStoreLoginWindow): ${result?.message || 'Unknown error'}`)
      return
    }

    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'general.autoRedeemFreeGames',
      value: true,
    })

    setUserSettings(response.settings)

    showSuccessToast(
      i18next.t('toast.autoRedeem.authenticated', { user: userSummary?.personaName }),
    )
  } catch (error) {
    if (isMissingTauriInvokeError(error)) {
      showDesktopOnlyToast()
      return
    }

    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleShowStoreLoginWindow):', error)
    logEvent(`[Error] in (handleShowStoreLoginWindow): ${error}`)
  }
}

export const handleSignOutCurrentStoreUser = async (
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
) => {
  try {
    const tauriReady = await waitForTauriInvoke()
    if (!tauriReady) {
      showDesktopOnlyToast()
      return
    }

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
  } catch (error) {
    if (isMissingTauriInvokeError(error)) {
      showDesktopOnlyToast()
      return
    }

    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleSignOutCurrentStoreUser):', error)
    logEvent(`[Error] in (handleSignOutCurrentStoreUser): ${error}`)
  }
}
