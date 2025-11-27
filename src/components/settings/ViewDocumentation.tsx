import type { ReactElement } from 'react'

import { useNavigationStore } from '@/stores/navigationStore'
import { useTranslation } from 'react-i18next'

import WebviewWindow from '@/components/ui/WebviewWindow'

export default function ViewDocumentation(): ReactElement {
  const { t } = useTranslation()
  const { currentSettingsTab } = useNavigationStore()

  return (
    <WebviewWindow href={`https://steamgameidler.com/docs/settings/${currentSettingsTab}`}>
      <p className='text-xs text-center text-dynamic hover:text-dynamic-hover duration-150'>
        {t('settings.documentation')}
      </p>
    </WebviewWindow>
  )
}
