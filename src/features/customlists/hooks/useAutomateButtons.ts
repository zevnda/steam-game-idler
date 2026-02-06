import type { InvokeCustomList, InvokeSettings, InvokeValidateSession } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { useStateStore, useUserStore } from '@/shared/stores'
import {
  showDangerToast,
  showEnableAllGamesToast,
  showMissingCredentialsToast,
  showNoGamesToast,
  showOutdatedCredentialsToast,
} from '@/shared/ui'
import { autoRevalidateSteamCredentials, checkSteamStatus, decrypt, logEvent } from '@/shared/utils'

// Automate card farming and achievement unlocking
export const useAutomateButtons = () => {
  const { t } = useTranslation()
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const setIsCardFarming = useStateStore(state => state.setIsCardFarming)
  const setIsAchievementUnlocker = useStateStore(state => state.setIsAchievementUnlocker)
  const isPro = useUserStore(state => state.isPro)

  // Start card farming
  const startCardFarming = async () => {
    try {
      // Make sure Steam client is running
      const isSteamRunning = await checkSteamStatus(true)
      if (!isSteamRunning) return

      // Retrieve Steam cookies from local storage
      let credentials = userSettings.cardFarming.credentials

      // Attempt to automatically revalidate Steam credentials for PRO users
      if (isPro) {
        const autoRevalidateResult = await autoRevalidateSteamCredentials(setUserSettings)
        if (autoRevalidateResult?.credentials) {
          credentials = autoRevalidateResult.credentials
        }
      }

      if (!credentials?.sid || !credentials?.sls) return showMissingCredentialsToast()

      // Validate Steam session
      const response = await invoke<InvokeValidateSession>('validate_session', {
        sid: decrypt(credentials?.sid),
        sls: decrypt(credentials?.sls),
        sma: credentials?.sma,
        steamid: userSummary?.steamId,
      })

      if (!response.user) {
        await invoke<InvokeSettings>('update_user_settings', {
          steamId: userSummary?.steamId,
          key: 'cardFarming.credentials',
          value: null,
        })

        const response = await invoke<InvokeSettings>('update_user_settings', {
          steamId: userSummary?.steamId,
          key: 'cardFarming.userSummary',
          value: null,
        })

        setUserSettings(response.settings)
        return showOutdatedCredentialsToast()
      }
      // Retrieve card farming list
      const cardFarmingList = await invoke<InvokeCustomList>('get_custom_lists', {
        steamId: userSummary?.steamId,
        list: 'cardFarmingList',
      })

      if (!userSettings.cardFarming.allGames && cardFarmingList.list_data.length === 0)
        return showEnableAllGamesToast()

      setIsCardFarming(true)
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in (startCardFarming):', error)
      logEvent(`[Error] in (startCardFarming): ${error}`)
    }
  }

  // Start achievement unlocker
  const startAchievementUnlocker = async () => {
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
      showDangerToast(t('common.error'))
      console.error('Error in (startAchievementUnlocker):', error)
      logEvent(`[Error] in (startAchievementUnlocker): ${error}`)
    }
  }

  return { startCardFarming, startAchievementUnlocker }
}
