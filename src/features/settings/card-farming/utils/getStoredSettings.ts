import type { CardFarmingUser, UserSettings } from '@/shared/types'
import i18next from 'i18next'
import { showDangerToast } from '@/shared/ui'
import { logEvent } from '@/shared/utils'

export const getStoredSettings = async (
  userSettings: UserSettings,
  setHasCookies: React.Dispatch<React.SetStateAction<boolean>>,
  setSidValue: React.Dispatch<React.SetStateAction<string>>,
  setSlsValue: React.Dispatch<React.SetStateAction<string>>,
  setSmaValue: React.Dispatch<React.SetStateAction<string>>,
  setGamesWithDrops: React.Dispatch<React.SetStateAction<number>>,
  setTotalDropsRemaining: React.Dispatch<React.SetStateAction<number>>,
  setCardFarmingUser: React.Dispatch<React.SetStateAction<CardFarmingUser | null>>,
) => {
  try {
    const credentials = userSettings.cardFarming.credentials
    const cardFarmingUser = userSettings.cardFarming.userSummary
    const gamesWithDrops = userSettings.cardFarming.gamesWithDrops
    const totalDropsRemaining = userSettings.cardFarming.totalDropsRemaining

    if (credentials && credentials.sid && credentials.sls) {
      setHasCookies(true)
      setSidValue(credentials.sid)
      setSlsValue(credentials.sls)
      setSmaValue(credentials?.sma || '')
    }
    if (cardFarmingUser?.steamId) {
      setCardFarmingUser(cardFarmingUser)
    }
    if (gamesWithDrops > 0 && totalDropsRemaining > 0) {
      setGamesWithDrops(gamesWithDrops)
      setTotalDropsRemaining(totalDropsRemaining)
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (getStoredSettings):', error)
    logEvent(`[Error] in (getStoredSettings): ${error}`)
  }
}
