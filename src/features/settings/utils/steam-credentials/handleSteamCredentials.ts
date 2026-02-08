import type {
  CardFarmingUser,
  GameWithRemainingDrops,
  InvokeSettings,
  InvokeValidateSession,
  UserSettings,
  UserSummary,
} from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { fetchGamesWithDropsData, fetchUserSummary } from '@/features/settings'
import {
  showAccountMismatchToast,
  showDangerToast,
  showIncorrectCredentialsToast,
  showSuccessToast,
} from '@/shared/components'
import { encrypt, logEvent } from '@/shared/utils'

export const handleSaveCredentials = async (
  sidValue: string,
  slsValue: string,
  smaValue: string | undefined,
  setHasCookies: React.Dispatch<React.SetStateAction<boolean>>,
  setCardFarmingUser: React.Dispatch<React.SetStateAction<CardFarmingUser | null>>,
  userSummary: UserSummary,
  userSettings: UserSettings,
  setUserSettings: (value: UserSettings) => void,
  setIsCFDataLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setGamesWithDropsData: React.Dispatch<React.SetStateAction<GameWithRemainingDrops[]>>,
) => {
  try {
    if (sidValue.length > 0 && slsValue.length > 0) {
      // Verify steam cookies are valid
      const validate = await invoke<InvokeValidateSession>('validate_session', {
        sid: sidValue,
        sls: slsValue,
        sma: smaValue,
        steamid: userSummary?.steamId,
      })

      if (validate.user) {
        // Extract steamID from the steamLoginSecure cookie (first 17 chars)
        const steamId = slsValue.slice(0, 17)
        const apiKey = userSettings.general.apiKey

        // Wait for user info first, which should be faster
        const cardFarmingUser = await fetchUserSummary(steamId, apiKey)

        // Make sure user isn't trying to farm cards with different account than they're logged in with
        if (cardFarmingUser.steamId !== userSummary?.steamId) {
          showAccountMismatchToast('danger')
          return logEvent('[Error] in (handleSave) Account mismatch between Steam and SGI')
        }

        // Save valid cookies and update UI state
        await invoke<InvokeSettings>('update_user_settings', {
          steamId: userSummary?.steamId,
          key: 'cardFarming.credentials',
          value: { sid: encrypt(sidValue), sls: encrypt(slsValue), sma: smaValue },
        })

        // Save card farming user and update UI state
        await invoke<InvokeSettings>('update_user_settings', {
          steamId: userSummary?.steamId,
          key: 'cardFarming.userSummary',
          value: cardFarmingUser,
        })

        setCardFarmingUser(cardFarmingUser)
        setHasCookies(true)

        showSuccessToast(i18next.t('toast.cardFarming.logIn', { user: validate.user }))
        logEvent(`[Settings - Card Farming] Logged in as ${validate.user}`)

        fetchGamesWithDropsData(
          userSummary,
          setIsCFDataLoading,
          setUserSettings,
          setGamesWithDropsData,
        )
      } else {
        showIncorrectCredentialsToast()
        logEvent('[Error] [Settings - Card Farming] Incorrect card farming credentials')
      }
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleSave):', error)
    logEvent(`[Error] in (handleSave): ${error}`)
  }
}

export const handleClearCredentials = async (
  setHasCookies: React.Dispatch<React.SetStateAction<boolean>>,
  setSidValue: React.Dispatch<React.SetStateAction<string>>,
  setSlsValue: React.Dispatch<React.SetStateAction<string>>,
  setSmaValue: React.Dispatch<React.SetStateAction<string>>,
  setCardFarmingUser: React.Dispatch<React.SetStateAction<CardFarmingUser | null>>,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings) => void,
  setGamesWithDrops: React.Dispatch<React.SetStateAction<number>>,
  setTotalDropsRemaining: React.Dispatch<React.SetStateAction<number>>,
) => {
  try {
    // Clear all saved credentials and reset UI states
    await invoke('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.credentials',
      value: null,
    })

    await invoke('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.gamesWithDrops',
      value: 0,
    })

    await invoke('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.totalDropsRemaining',
      value: 0,
    })

    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.userSummary',
      value: null,
    })

    setSidValue('')
    setSlsValue('')
    setSmaValue('')
    setHasCookies(false)
    setCardFarmingUser(null)
    setGamesWithDrops(0)
    setTotalDropsRemaining(0)
    setUserSettings(response.settings)

    showSuccessToast(i18next.t('toast.cardFarming.logOut'))

    logEvent('[Settings - Card Farming] Logged out')
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleCredentialsClear):', error)
    logEvent(`[Error] in (handleCredentialsClear): ${error}`)
  }
}
