import type { SteamCookies } from '../types'
import { useTranslation } from 'react-i18next'
import { SteamCookiesConnectPanel } from '@/shared/components/SteamCookiesConnectPanel'

interface CardFarmingStartPanelProps {
  isConnecting: boolean
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
// feature's copy and forwards `onConnect`.
export const CardFarmingStartPanel = ({ isConnecting, onConnect }: CardFarmingStartPanelProps) => {
  const { t } = useTranslation()

  return (
    <SteamCookiesConnectPanel<SteamCookies>
      automaticDescription={t('dashboard.cardFarming.connect.automaticDescription')}
      automaticTabLabel={t('common.connect.automaticTab')}
      description={t('dashboard.cardFarming.connect.description')}
      isSubmitting={isConnecting}
      manualTabLabel={t('common.connect.manualTab')}
      savedCredentialsNote={t('common.manualCookies.savedFromSettingsNote')}
      title={t('dashboard.cardFarming.connect.title')}
      onConnect={onConnect}
    />
  )
}
