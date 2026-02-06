import type { InvokeSettings, UserSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import i18next from 'i18next'
import { showDangerToast } from '@/shared/ui'
import { getAppVersion, logEvent } from '@/shared/utils'

export function useSettings() {
  const [version, setVersion] = useState('0.0.0')
  const [refreshKey, setRefreshKey] = useState(0)

  // Get the app version
  useEffect(() => {
    const getAndSetVersion = async () => {
      const version = await getAppVersion()
      setVersion(version ? version : '0.0.0')
    }
    getAndSetVersion()
  }, [])

  return { version, refreshKey, setRefreshKey }
}

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

    if (key === 'cardFarming' && (name === 'listGames' || name === 'allGames')) {
      // Add radio-button-like behavior for mutually exclusive options
      // Only one of the card farming options can be active at a time
      if (checked) {
        // If this checkbox is checked, uncheck the other one
        const otherCheckboxName = name === 'listGames' ? 'allGames' : 'listGames'

        const response = await invoke<InvokeSettings>('update_user_settings', {
          steamId,
          key: `cardFarming.${otherCheckboxName}`,
          value: false,
        })
        setUserSettings(response.settings)
      } else {
        // Don't allow both checkboxes to be unchecked - keep one enabled
        const otherCheckboxName = name === 'listGames' ? 'allGames' : 'listGames'

        if (
          !response.settings.cardFarming[
            otherCheckboxName as keyof typeof response.settings.cardFarming
          ]
        ) {
          const response = await invoke<InvokeSettings>('update_user_settings', {
            steamId,
            key: `cardFarming.${otherCheckboxName}`,
            value: true,
          })
          setUserSettings(response.settings)
        }
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
