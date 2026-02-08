import type {
  GameWithRemainingDrops,
  InvokeSettings,
  InvokeValidateSession,
  UserSettings,
  UserSummary,
} from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { showDangerToast, showOutdatedCredentialsToast } from '@/shared/ui'
import { decrypt, getAllGamesWithDrops, logEvent } from '@/shared/utils'

export const fetchGamesWithDropsData = async (
  userSummary: UserSummary,
  setIsCFDataLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setUserSettings: (value: UserSettings) => void,
  setGamesWithDropsData: React.Dispatch<React.SetStateAction<GameWithRemainingDrops[]>>,
) => {
  try {
    setIsCFDataLoading(true)

    const cachedUserSummary = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })

    const credentials = cachedUserSummary.settings.cardFarming.credentials

    if (!credentials || !credentials.sid || !credentials.sls) {
      setIsCFDataLoading(false)
      return showOutdatedCredentialsToast()
    }

    // Validate credentials
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

      const response = await invoke<InvokeSettings>('update_user_settings', {
        steamId: userSummary?.steamId,
        key: 'cardFarming.userSummary',
        value: null,
      })

      setUserSettings(response.settings)
      setIsCFDataLoading(false)
      return showOutdatedCredentialsToast()
    }

    const getGamesWithDrops = await getAllGamesWithDrops(
      userSummary?.steamId,
      credentials.sid,
      credentials.sls,
      credentials?.sma,
    )

    setGamesWithDropsData(getGamesWithDrops)

    const gamesWithDrops = getGamesWithDrops.length
    const totalDropsRemaining = getGamesWithDrops.reduce(
      (total, game) => total + (game.remaining || 0),
      0,
    )

    // Save games with drops and total drops remaining
    await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.gamesWithDrops',
      value: gamesWithDrops,
    })

    // Save total drops remaining
    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.totalDropsRemaining',
      value: totalDropsRemaining,
    })

    setUserSettings(response.settings)
    setIsCFDataLoading(false)
  } catch (error) {
    setIsCFDataLoading(false)
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (fetchGamesWithDropsData):', error)
    logEvent(`[Error] in (fetchGamesWithDropsData): ${error}`)
  }
}
