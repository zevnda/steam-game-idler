import type {
  CardFarmingUser,
  GameWithRemainingDrops,
  InvokeSettings,
  InvokeValidateSession,
  UserSettings,
  UserSummary,
} from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { fetchUserSummary } from './generalService'
import i18next from 'i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { getAllGamesWithDrops } from '@/shared/utils/automation'
import { decrypt, encrypt } from '@/shared/utils/crypto'

export async function handleSaveCredentials(
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
) {
  try {
    if (!sidValue.length || !slsValue.length) return
    const validate = await invoke<InvokeValidateSession>('validate_session', {
      sid: sidValue,
      sls: slsValue,
      sma: smaValue,
      steamid: userSummary?.steamId,
    })
    if (validate.user) {
      const steamId = slsValue.slice(0, 17)
      const cfUser = await fetchUserSummary(steamId, userSettings.general.apiKey)
      if (cfUser.steamId !== userSummary?.steamId) {
        toast.accountMismatch('danger')
        return await logEvent('[Error] in (handleSave) Account mismatch')
      }
      await invoke<InvokeSettings>('update_user_settings', {
        steamId: userSummary?.steamId,
        key: 'cardFarming.credentials',
        value: { sid: encrypt(sidValue), sls: encrypt(slsValue), sma: smaValue },
      })
      await invoke<InvokeSettings>('update_user_settings', {
        steamId: userSummary?.steamId,
        key: 'cardFarming.userSummary',
        value: cfUser,
      })
      setCardFarmingUser(cfUser)
      setHasCookies(true)
      toast.success(i18next.t('toast.cardFarming.logIn', { user: validate.user }))
      await logEvent(`[Settings - Card Farming] Logged in as ${validate.user}`)
      fetchGamesWithDropsData(
        userSummary,
        setIsCFDataLoading,
        setUserSettings,
        setGamesWithDropsData,
      )
    } else {
      toast.incorrectCredentials()
      await logEvent('[Error] [Settings - Card Farming] Incorrect credentials')
    }
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    await logEvent(`[Error] in (handleSaveCredentials): ${error}`)
  }
}

export async function handleClearCredentials(
  setHasCookies: React.Dispatch<React.SetStateAction<boolean>>,
  setSidValue: React.Dispatch<React.SetStateAction<string>>,
  setSlsValue: React.Dispatch<React.SetStateAction<string>>,
  setSmaValue: React.Dispatch<React.SetStateAction<string>>,
  setCardFarmingUser: React.Dispatch<React.SetStateAction<CardFarmingUser | null>>,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings) => void,
  setGamesWithDrops: React.Dispatch<React.SetStateAction<number>>,
  setTotalDropsRemaining: React.Dispatch<React.SetStateAction<number>>,
) {
  try {
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
    const res = await invoke<InvokeSettings>('update_user_settings', {
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
    setUserSettings(res.settings)
    toast.success(i18next.t('toast.cardFarming.logOut'))
    await logEvent('[Settings - Card Farming] Logged out')
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    await logEvent(`[Error] in (handleClearCredentials): ${error}`)
  }
}

export async function fetchGamesWithDropsData(
  userSummary: UserSummary,
  setIsCFDataLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setUserSettings: (value: UserSettings) => void,
  setGamesWithDropsData: React.Dispatch<React.SetStateAction<GameWithRemainingDrops[]>>,
) {
  try {
    setIsCFDataLoading(true)
    const cachedSettings = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })
    const credentials = cachedSettings.settings.cardFarming.credentials
    if (!credentials?.sid || !credentials?.sls) {
      setIsCFDataLoading(false)
      return toast.outdatedCredentials()
    }
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
      setIsCFDataLoading(false)
      return toast.outdatedCredentials()
    }
    const games = await getAllGamesWithDrops(
      userSummary?.steamId,
      credentials.sid,
      credentials.sls,
      credentials?.sma,
    )
    setGamesWithDropsData(games)
    const gamesWithDrops = games.length
    const totalDropsRemaining = games.reduce((t, g) => t + (g.remaining || 0), 0)
    await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.gamesWithDrops',
      value: gamesWithDrops,
    })
    const res = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.totalDropsRemaining',
      value: totalDropsRemaining,
    })
    setUserSettings(res.settings)
    setIsCFDataLoading(false)
  } catch (error) {
    setIsCFDataLoading(false)
    toast.danger(i18next.t('common.error'))
    await logEvent(`[Error] in (fetchGamesWithDropsData): ${error}`)
  }
}
