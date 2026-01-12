import type { UserSettings } from '@/types'
import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'
import { arch, locale, version } from '@tauri-apps/plugin-os'

import { Button } from '@heroui/react'
import { useUserStore } from '@/stores/userStore'
import { useTranslation } from 'react-i18next'
import { TbArrowBarUp } from 'react-icons/tb'

import { getAppVersion } from '@/utils/tasks'
import { showDangerToast, showSuccessToast } from '@/utils/toasts'

interface SystemType {
  version: string
  locale: string | null
  isPortable: boolean
}

interface ExportedData {
  version: string | undefined
  system: SystemType
  settings: Partial<UserSettings>
  [key: string]: unknown
}

const collectSystemInfo = async (): Promise<SystemType> => {
  const system = {} as SystemType
  const osVersion = await version()
  const cpuArch = await arch()
  const isPortable = await invoke<boolean>('is_portable')

  let winVersion = 'Windows'
  const buildMatch = osVersion.match(/^10\.0\.(\d+)$/)
  if (buildMatch && buildMatch[1]) {
    const buildNumber = Number(buildMatch[1])
    winVersion = buildNumber >= 22000 ? 'Windows 11' : 'Windows 10'
  }

  const is64Bit = cpuArch === 'x86_64'
  system.version = `${winVersion} ${is64Bit ? '64-bit' : '32-bit'} (${osVersion})`
  system.locale = await locale()
  system.isPortable = isPortable

  return system
}

const sanitizeUserSettings = (settings: UserSettings): Partial<UserSettings> => {
  const sanitizedSettings = JSON.parse(JSON.stringify(settings))

  // Remove sensitive data before exporting
  if (sanitizedSettings.cardFarming) {
    if (sanitizedSettings.cardFarming.credentials) {
      delete sanitizedSettings.cardFarming.credentials
    }
    if (sanitizedSettings.cardFarming.userSummary && sanitizedSettings.cardFarming.userSummary.steamId) {
      delete sanitizedSettings.cardFarming.userSummary.steamId
    }
  }

  if (sanitizedSettings.general) {
    delete sanitizedSettings.general.apiKey
  }

  return sanitizedSettings
}

const processLocalStorageItem = (key: string, value: string | null): string | null | object => {
  // Skip specific keys
  if (
    [
      'cachedNotifications',
      'seenNotifications',
      'ally-supports-cache',
      'steamCookies',
      'apiKey',
      'google_adsense_settings',
      'showTextBubble',
      'isWidgetVisible',
    ].includes(key) ||
    key.startsWith('ch_cw_') ||
    key.startsWith('emoji-mart')
  ) {
    return null
  }

  if (value && (value.startsWith('{') || value.startsWith('['))) {
    try {
      const parsedValue = JSON.parse(value)

      // Sanitize sensitive data
      if (key === 'cardFarming' && parsedValue) {
        const sanitizedValue = JSON.parse(JSON.stringify(parsedValue))
        if (sanitizedValue.credentials) {
          delete sanitizedValue.credentials
        }
        return sanitizedValue
      } else {
        return parsedValue
      }
    } catch (error) {
      console.error(`Error parsing JSON for key "${key}":`, error)
      return value
    }
  } else {
    return value
  }
}

const collectLocalStorageData = (): Record<string, unknown> => {
  const storageData: Record<string, unknown> = {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    const value = localStorage.getItem(key)
    const processedValue = processLocalStorageItem(key, value)

    if (processedValue !== null) {
      storageData[key] = processedValue
    }
  }

  return storageData
}

export const getExportData = async (userSettings: UserSettings) => {
  const allSettings: ExportedData = {} as ExportedData

  // Add app version
  allSettings.version = await getAppVersion()

  // Collect system information
  allSettings.system = await collectSystemInfo()

  // Process user settings
  allSettings.settings = sanitizeUserSettings(userSettings)

  // Process localStorage data
  const localStorageData = collectLocalStorageData()
  Object.assign(allSettings, localStorageData)

  return allSettings
}

export default function ExportSettings(): ReactElement {
  const { t } = useTranslation()
  const userSettings = useUserStore(state => state.userSettings)

  const exportSettings = async (): Promise<void> => {
    try {
      const allSettings = await getExportData(userSettings)
      // Copy to clipboard
      const allSettingsString = JSON.stringify(allSettings, null, 2)
      await navigator.clipboard.writeText(allSettingsString)
      showSuccessToast(t('toast.exportData.success'))
    } catch (error) {
      showDangerToast(t('toast.exportData.error'))
      console.error('Export settings error:', error)
    }
  }

  return (
    <Button
      size='sm'
      className='bg-btn-secondary text-btn-text font-bold'
      radius='full'
      onPress={exportSettings}
      startContent={<TbArrowBarUp size={20} />}
    >
      {t('settings.exportData')}
    </Button>
  )
}
