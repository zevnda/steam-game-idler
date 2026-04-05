import type { InvokeSettings, UserSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { showDangerToast } from '@/shared/components'
import { logEvent } from '@/shared/utils'

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
  setUserSettings: (value: UserSettings) => void,
) => {
  try {
    const { name, checked } = e.target

    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId,
      key: `${key}.${name}`,
      value: checked,
    })

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

    if (key === 'cardFarming' && otherName) {
      if (checked) {
        // Uncheck the mutually exclusive counterpart
        const updated = await invoke<InvokeSettings>('update_user_settings', {
          steamId,
          key: `cardFarming.${otherName}`,
          value: false,
        })
        setUserSettings(updated.settings)
      } else if (listGamesPair) {
        // For listGames/allGames pair: don't allow both to be unchecked
        if (
          !response.settings.cardFarming[otherName as keyof typeof response.settings.cardFarming]
        ) {
          const updated = await invoke<InvokeSettings>('update_user_settings', {
            steamId,
            key: `cardFarming.${otherName}`,
            value: true,
          })
          setUserSettings(updated.settings)
        }
      } else {
        setUserSettings(response.settings)
      }
    } else {
      setUserSettings(response.settings)
    }

    logEvent(`[Settings - ${key}] Changed '${name}' to '${checked}'`)
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleCheckboxChange):', error)
    logEvent(`[Error] in (handleCheckboxChange): ${error}`)
  }
}
