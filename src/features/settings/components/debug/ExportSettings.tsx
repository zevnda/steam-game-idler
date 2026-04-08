import type { UserSettings } from '@/shared/types'
import { arch, locale, version } from '@tauri-apps/plugin-os'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { useTranslation } from 'react-i18next'
import { TbArrowBarUp } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { showDangerToast, showSuccessToast } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import { getAppVersion, hasTauriInvoke, invokeSafe, logEvent } from '@/shared/utils'

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

const collectSystemInfo = async () => {
  const system = {
    version: 'Unknown',
    locale: null,
    isPortable: false,
  } as SystemType

  const osVersion = await version().catch(() => 'Unknown')
  const cpuArch = await arch().catch(() => 'unknown')
  const portableValue = await invokeSafe<boolean>('is_portable').catch(() => null)

  const is64Bit = cpuArch === 'x86_64' || cpuArch.includes('64')
  system.version = `${is64Bit ? '64-bit' : '32-bit'} (${osVersion})`
  system.locale = await locale().catch(() => null)
  system.isPortable = Boolean(portableValue)

  return system
}

const copyToClipboard = async (text: string) => {
  if (hasTauriInvoke()) {
    await writeText(text)
    return
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  // Fallback for environments without Clipboard API.
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

const sanitizeUserSettings = (settings: UserSettings) => {
  const sanitizedSettings = JSON.parse(JSON.stringify(settings))

  // Remove sensitive data before exporting
  if (sanitizedSettings.cardFarming) {
    if (sanitizedSettings.cardFarming.credentials) {
      delete sanitizedSettings.cardFarming.credentials
    }
    if (
      sanitizedSettings.cardFarming.userSummary &&
      sanitizedSettings.cardFarming.userSummary.steamId
    ) {
      delete sanitizedSettings.cardFarming.userSummary.steamId
    }
  }

  if (sanitizedSettings.general) {
    delete sanitizedSettings.general.apiKey
    delete sanitizedSettings.general.customBackground
  }

  return sanitizedSettings
}

const processLocalStorageItem = (key: string, value: string | null) => {
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

const collectLocalStorageData = () => {
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

export const ExportSettings = () => {
  const { t } = useTranslation()
  const userSettings = useUserStore(state => state.userSettings)

  const exportSettings = async () => {
    try {
      const allSettings = await getExportData(userSettings)
      // Copy to clipboard
      const allSettingsString = JSON.stringify(allSettings, null, 2)
      await copyToClipboard(allSettingsString)
      showSuccessToast(t('toast.exportData.success'))
    } catch (error) {
      showDangerToast(t('toast.exportData.error'))
      console.error('Export settings error:', error)
      logEvent(`[Error] in (exportSettings): ${error}`)
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
