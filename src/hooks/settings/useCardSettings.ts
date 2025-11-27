import type {
  CardFarmingUser,
  InvokeSettings,
  InvokeUserSummary,
  InvokeValidateSession,
  UserSettings,
  UserSummary,
} from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/stores/userStore'

import { getAllGamesWithDrops } from '@/utils/automation'
import { decrypt, encrypt, logEvent } from '@/utils/tasks'
import {
  showAccountMismatchToast,
  showDangerToast,
  showIncorrectCredentialsToast,
  showOutdatedCredentialsToast,
  showSuccessToast,
  t,
} from '@/utils/toasts'

interface CardSettingsHook {
  sidValue: string
  slsValue: string
  smaValue: string
  gamesWithDrops: number
  totalDropsRemaining: number
  hasCookies: boolean
  cardFarmingUser: CardFarmingUser | null
  setCardFarmingUser: Dispatch<SetStateAction<CardFarmingUser | null>>
  setSidValue: Dispatch<SetStateAction<string>>
  setSlsValue: Dispatch<SetStateAction<string>>
  setSmaValue: Dispatch<SetStateAction<string>>
  setHasCookies: Dispatch<SetStateAction<boolean>>
  setGamesWithDrops: Dispatch<SetStateAction<number>>
  setTotalDropsRemaining: Dispatch<SetStateAction<number>>
  isCFDataLoading: boolean
  setIsCFDataLoading: Dispatch<SetStateAction<boolean>>
}

export const useCardSettings = (): CardSettingsHook => {
  const { userSettings } = useUserStore()
  const [sidValue, setSidValue] = useState('') // sessionid
  const [slsValue, setSlsValue] = useState('') // steamLoginSecure
  const [smaValue, setSmaValue] = useState('') // steamMachineAuth
  const [gamesWithDrops, setGamesWithDrops] = useState(0)
  const [totalDropsRemaining, setTotalDropsRemaining] = useState(0)
  const [hasCookies, setHasCookies] = useState(false)
  const [cardFarmingUser, setCardFarmingUser] = useState<CardFarmingUser | null>(null)
  const [isCFDataLoading, setIsCFDataLoading] = useState(false)

  // Get stored cookies to set their input values
  useEffect(() => {
    getStoredSettings(
      userSettings,
      setHasCookies,
      setSidValue,
      setSlsValue,
      setSmaValue,
      setGamesWithDrops,
      setTotalDropsRemaining,
      setCardFarmingUser,
    )
  }, [userSettings])

  return {
    sidValue,
    slsValue,
    smaValue,
    gamesWithDrops,
    totalDropsRemaining,
    hasCookies,
    setSidValue,
    setSlsValue,
    setSmaValue,
    setHasCookies,
    cardFarmingUser,
    setCardFarmingUser,
    setGamesWithDrops,
    setTotalDropsRemaining,
    isCFDataLoading,
    setIsCFDataLoading,
  }
}

// Gets user summary
const fetchUserSummary = async (steamId: string, apiKey: string | null): Promise<CardFarmingUser> => {
  const res = await invoke<InvokeUserSummary>('get_user_summary', {
    steamId,
    apiKey: apiKey ? decrypt(apiKey) : null,
  })
  return {
    steamId: res.response.players[0]?.steamid,
    personaName: res.response.players[0]?.personaname,
    avatar: res.response.players[0]?.avatar.replace('.jpg', '_full.jpg'),
  }
}

const getStoredSettings = async (
  userSettings: UserSettings,
  setHasCookies: Dispatch<SetStateAction<boolean>>,
  setSidValue: Dispatch<SetStateAction<string>>,
  setSlsValue: Dispatch<SetStateAction<string>>,
  setSmaValue: Dispatch<SetStateAction<string>>,
  setGamesWithDrops: Dispatch<SetStateAction<number>>,
  setTotalDropsRemaining: Dispatch<SetStateAction<number>>,
  setCardFarmingUser: Dispatch<SetStateAction<CardFarmingUser | null>>,
): Promise<void> => {
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
    showDangerToast(t('common.error'))
    console.error('Error in (getStoredSettings):', error)
    logEvent(`[Error] in (getStoredSettings): ${error}`)
  }
}

export const fetchGamesWithDropsData = async (
  userSummary: UserSummary,
  setIsCFDataLoading: Dispatch<SetStateAction<boolean>>,
  setUserSettings: Dispatch<SetStateAction<UserSettings>>,
): Promise<void> => {
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

    const gamesWithDrops = getGamesWithDrops.length
    const totalDropsRemaining = getGamesWithDrops.reduce((total, game) => total + (game.remaining || 0), 0)

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
    showDangerToast(t('common.error'))
    console.error('Error in (fetchGamesWithDropsData):', error)
    logEvent(`[Error] in (fetchGamesWithDropsData): ${error}`)
  }
}

export const handleCredentialsSave = async (
  sidValue: string,
  slsValue: string,
  smaValue: string | undefined,
  setHasCookies: Dispatch<SetStateAction<boolean>>,
  setCardFarmingUser: Dispatch<SetStateAction<CardFarmingUser | null>>,
  userSummary: UserSummary,
  userSettings: UserSettings,
  setUserSettings: Dispatch<SetStateAction<UserSettings>>,
  setIsCFDataLoading: Dispatch<SetStateAction<boolean>>,
): Promise<void> => {
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

        showSuccessToast(t('toast.cardFarming.logIn', { user: validate.user }))
        logEvent(`[Settings - Card Farming] Logged in as ${validate.user}`)

        fetchGamesWithDropsData(userSummary, setIsCFDataLoading, setUserSettings)
      } else {
        showIncorrectCredentialsToast()
        logEvent('[Error] [Settings - Card Farming] Incorrect card farming credentials')
      }
    }
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (handleSave):', error)
    logEvent(`[Error] in (handleSave): ${error}`)
  }
}

export const handleCredentialsClear = async (
  setHasCookies: Dispatch<SetStateAction<boolean>>,
  setSidValue: Dispatch<SetStateAction<string>>,
  setSlsValue: Dispatch<SetStateAction<string>>,
  setSmaValue: Dispatch<SetStateAction<string>>,
  setCardFarmingUser: Dispatch<SetStateAction<CardFarmingUser | null>>,
  userSummary: UserSummary,
  setUserSettings: Dispatch<SetStateAction<UserSettings>>,
  setGamesWithDrops: Dispatch<SetStateAction<number>>,
  setTotalDropsRemaining: Dispatch<SetStateAction<number>>,
): Promise<void> => {
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

    showSuccessToast(t('toast.cardFarming.logOut'))

    logEvent('[Settings - Card Farming] Logged out')
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (handleCredentialsClear):', error)
    logEvent(`[Error] in (handleCredentialsClear): ${error}`)
  }
}

export const handleNextTaskChange = async (
  currentKey: string,
  userSummary: UserSummary,
  setUserSettings: Dispatch<SetStateAction<UserSettings>>,
): Promise<void> => {
  const response = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'cardFarming.nextTask',
    value: currentKey,
  })

  setUserSettings(response.settings)
}
