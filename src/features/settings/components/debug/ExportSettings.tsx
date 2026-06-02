import type { UserSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { arch, locale, version } from '@tauri-apps/plugin-os'
import { useTranslation } from 'react-i18next'
import { TbArrowBarUp } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores'
import { getAppVersion } from '@/shared/utils'

export function ExportSettings() {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)
  const userSettings = useUserStore(s => s.userSettings)

  const handleExport = async () => {
    try {
      const appVersion = await getAppVersion()
      const osVersion = await version()
      const cpuArch = await arch()
      const osLocale = await locale()
      const isPortable = await invoke<boolean>('is_portable')

      const sanitizedSettings: Partial<UserSettings> = {
        ...userSettings,
        cardFarming: { ...userSettings.cardFarming, credentials: null, userSummary: null },
        general: { ...userSettings.general, apiKey: null, customBackground: null },
      }

      const exportData = {
        version: appVersion,
        system: { version: `${osVersion} (${cpuArch})`, locale: osLocale, isPortable },
        steamId: userSummary?.steamId,
        settings: sanitizedSettings,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sgi-settings-${userSummary?.steamId}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(t('toast.exportData.success'))
      await logEvent('[Settings] Exported settings')
    } catch (error) {
      toast.danger(t('common.error'))
      await logEvent(`[Error] in (handleExport): ${error}`)
    }
  }

  return (
    <Button
      size='sm'
      className='bg-btn-secondary text-btn-text font-bold'
      radius='full'
      onPress={handleExport}
      startContent={<TbArrowBarUp size={20} />}
    >
      {t('settings.exportData')}
    </Button>
  )
}
