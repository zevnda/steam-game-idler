import type { SteamCookies } from '../types'
import { useTranslation } from 'react-i18next'
import { errorMessageKey } from '../utils/errorMessageKey'
import { Alert } from '@heroui/react'
import { SteamCookiesConnectPanel } from '@/shared/components/SteamCookiesConnectPanel'

interface InventoryConnectPanelProps {
  isConnecting: boolean
  errorCode: string | null
  onConnect: (manualCookies: SteamCookies | undefined) => Promise<boolean>
}

// The pre-fetch state: lets the user load their Steam Community inventory either automatically
// (hidden-webview/agent-derived cookie acquisition, gated behind `hasGamerAccess`) or by pasting
// Steam Community cookies manually, which stays available regardless of tier - mirrors
// CardFarmingStartPanel's identical gate exactly, since both features resolve the same
// `steam_community::SteamCookies` (the same template every cookie-gated feature follows). There
// is no Rust-side enforcement of this gate - this
// panel is the one and only place it's enforced for this feature. Only ever shown when
// `useAutoConnectSteamCookies` couldn't skip it (see that hook's doc comment). All of the card/tab/
// prefill/save UI lives in the shared `SteamCookiesConnectPanel` (see its own doc comment) - this
// component just supplies this feature's copy, error display, and forwards `onConnect`.
export const InventoryConnectPanel = ({
  isConnecting,
  errorCode,
  onConnect,
}: InventoryConnectPanelProps) => {
  const { t } = useTranslation()

  return (
    <SteamCookiesConnectPanel<SteamCookies>
      automaticDescription={t('dashboard.inventoryManager.connect.automaticDescription')}
      automaticTabLabel={t('common.connect.automaticTab')}
      description={t('dashboard.inventoryManager.connect.description')}
      errorSlot={
        errorCode ? (
          <Alert status='danger'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>
                {t(errorMessageKey(errorCode), { code: errorCode })}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : undefined
      }
      isSubmitting={isConnecting}
      manualTabLabel={t('common.connect.manualTab')}
      savedCredentialsNote={t('common.manualCookies.savedFromSettingsNote')}
      title={t('dashboard.inventoryManager.connect.title')}
      onConnect={onConnect}
    />
  )
}
