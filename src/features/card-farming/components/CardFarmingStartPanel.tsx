import type { SteamCookies } from '../types'
import { useTranslation } from 'react-i18next'
import { connectErrorMessageKey } from '../utils/errorMessageKey'
import { Alert } from '@heroui/react'
import { SteamCookiesConnectPanel } from '@/shared/components/SteamCookiesConnectPanel'

interface CardFarmingStartPanelProps {
  isConnecting: boolean
  errorCode: string | null
  onConnect: (manualCookies: SteamCookies | undefined) => Promise<boolean>
}

// The pre-connect state: lets the user connect a Steam Community session either automatically
// (gated behind `hasGamerAccess`) or by pasting cookies
// manually, which stays available regardless of tier. Only ever shown when
// `useAutoConnectSteamCookies` couldn't skip it (no saved cookies, and not a gamer-tier agent-mode
// account - see that hook's doc comment). Connecting does NOT start a farming cycle by itself - it
// only proves cookies work and populates the "Games With Drops" tab; starting is a separate
// explicit action from `CardFarmingPageHeader`. All of the card/tab/prefill/save UI lives in the
// shared `SteamCookiesConnectPanel` (see its own doc comment) - this component just supplies this
// feature's copy, error display, and forwards `onConnect` - mirrors InventoryConnectPanel's
// identical errorSlot wiring so a bad cookie paste shows the same way on both pages.
export const CardFarmingStartPanel = ({
  isConnecting,
  errorCode,
  onConnect,
}: CardFarmingStartPanelProps) => {
  const { t } = useTranslation()

  return (
    <SteamCookiesConnectPanel<SteamCookies>
      automaticDescription={t('dashboard.cardFarming.connect.automaticDescription')}
      automaticTabLabel={t('common.connect.automaticTab')}
      description={t('dashboard.cardFarming.connect.description')}
      errorSlot={
        errorCode ? (
          <Alert status='danger'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>
                {t(connectErrorMessageKey(errorCode), { code: errorCode })}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : undefined
      }
      isSubmitting={isConnecting}
      manualTabLabel={t('common.connect.manualTab')}
      savedCredentialsNote={t('common.manualCookies.savedFromSettingsNote')}
      showClear
      title={t('dashboard.cardFarming.connect.title')}
      onConnect={onConnect}
    />
  )
}
