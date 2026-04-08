import type { InvokeSettings, UserSettings } from '@/shared/types'
import i18next from 'i18next'
import { showDangerToast } from '@/shared/components'
import { hasTauriInvoke, invokeSafe, isMissingTauriInvokeError, logEvent } from '@/shared/utils'

interface CheckboxEvent {
  target: {
    name: string
    checked: boolean
  }
}

export const handleCheckboxChange = async (
  e: CheckboxEvent,
  key: keyof UserSettings,
  steamId: string | undefined,
  userSettings: UserSettings,
  setUserSettings: (value: UserSettings) => void,
) => {
  const { name, checked } = e.target
  const mutuallyExclusivePairs: Record<string, string> = {
    listGames: 'allGames',
    allGames: 'listGames',
    sortByHighestDrops: 'sortByLowestDrops',
    sortByLowestDrops: 'sortByHighestDrops',
    skipNoPlaytime: 'farmUnplayedOnly',
    farmUnplayedOnly: 'skipNoPlaytime',
  }

  const listGamesPair = name === 'listGames' || name === 'allGames'
  const otherName = mutuallyExclusivePairs[name]

  const applyLocalFallback = () => {
    const nextSettings = {
      ...userSettings,
      [key]: {
        ...userSettings[key],
        [name]: checked,
      },
    } as UserSettings

    if (key === 'cardFarming' && otherName) {
      if (checked) {
        nextSettings.cardFarming = {
          ...nextSettings.cardFarming,
          [otherName]: false,
        }
      } else if (listGamesPair && !nextSettings.cardFarming[otherName]) {
        nextSettings.cardFarming = {
          ...nextSettings.cardFarming,
          [otherName]: true,
        }
      }
    }

    setUserSettings(nextSettings)
  }

  try {
    if (!hasTauriInvoke()) {
      applyLocalFallback()
      return
    }

    const response = await invokeSafe<InvokeSettings>('update_user_settings', {
      steamId,
      key: `${key}.${name}`,
      value: checked,
    })

    if (!response) {
      applyLocalFallback()
      return
    }

    if (key === 'cardFarming' && otherName) {
      if (checked) {
        // Uncheck the mutually exclusive counterpart
        const updated = await invokeSafe<InvokeSettings>('update_user_settings', {
          steamId,
          key: `cardFarming.${otherName}`,
          value: false,
        })

        if (updated) {
          setUserSettings(updated.settings)
        } else {
          applyLocalFallback()
        }
      } else if (listGamesPair) {
        // For listGames/allGames pair: don't allow both to be unchecked
        if (
          !response.settings.cardFarming[otherName as keyof typeof response.settings.cardFarming]
        ) {
          const updated = await invokeSafe<InvokeSettings>('update_user_settings', {
            steamId,
            key: `cardFarming.${otherName}`,
            value: true,
          })

          if (updated) {
            setUserSettings(updated.settings)
          } else {
            setUserSettings({
              ...response.settings,
              cardFarming: {
                ...response.settings.cardFarming,
                [otherName]: true,
              },
            })
          }
        }
      } else {
        setUserSettings(response.settings)
      }
    } else {
      setUserSettings(response.settings)
    }

    logEvent(`[Settings - ${key}] Changed '${name}' to '${checked}'`)
  } catch (error) {
    if (isMissingTauriInvokeError(error)) {
      applyLocalFallback()
      return
    }

    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleCheckboxChange):', error)
    logEvent(`[Error] in (handleCheckboxChange): ${error}`)
  }
}
