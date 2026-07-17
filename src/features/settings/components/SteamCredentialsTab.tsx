import type { SteamCookies } from '../types'
import { useTranslation } from 'react-i18next'
import { TbExternalLink } from 'react-icons/tb'
import { steamCredentialsErrorMessageKey } from '../utils/errorMessageKey'
import { Alert, Button, Skeleton, Typography } from '@heroui/react'
import { SteamCookiesConnectPanel } from '@/shared/components/SteamCookiesConnectPanel'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { openExternalLink } from '@/shared/utils/links'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

const STEAM_CREDENTIALS_DOCS_URL = 'https://steamgameidler.com/docs/steam-credentials'

interface SteamCredentialsTabProps {
  isLoading: boolean
  isSaving: boolean
  isAcquiring: boolean
  loadErrorCode: string | null
  actionErrorCode: string | null
  onRefresh: () => void
  onSave: (next: SteamCookies) => Promise<boolean>
  onAcquire: () => Promise<boolean>
}

// The Steam Credentials category of the (app-wide) SettingsModal - lets a CLI-mode user save
// Steam Community cookies (sid/sls/sma) once, either automatically (gamer-tier) or by pasting them
// manually, so CardFarmingStartPanel/InventoryConnectPanel's own manual-entry tab doesn't need them
// re-entered every time (see `src-tauri/src/steam_community/credentials.rs`'s doc comment - the
// same store backs all three surfaces via the frontend's `useSavedSteamCookies` hook).
//
// Folded onto the shared `SteamCookiesConnectPanel` (2026-07-18) instead of hand-rolling its own
// tabs/form/error-display/clear-button - that used to drift out of sync with
// CardFarmingStartPanel/InventoryConnectPanel (no inline error display at all, a stale-closure bug
// that dropped error toasts on a first-ever failed save) - see that component's own doc comment for
// the shared contract. Uses `variant='embedded'` since this tab renders its own title row (it also
// needs a "Learn more" docs link inline with it, which the shared component has no slot for) rather
// than the standalone centered-card presentation CardFarmingStartPanel/InventoryConnectPanel use.
//
// Only a Gamer-tier agent-mode account never needs this (it derives cookies straight from its
// live daemon session unconditionally - see `session.rs::derive_from_agent_session`) - shown as
// an inline note instead of the panel. A Casual/free-tier agent-mode account still falls back to
// manually-pasted cookies exactly like Local mode does (automatic derivation for agent mode is
// gamer-gated in `useAutoConnectSteamCookies.ts`/`SteamCookiesConnectPanel.tsx`, not a hard mode
// gate), so it gets the same panel everyone else does - gating on `mode === 'agent'` alone used to
// hide this account's only way to view/edit/clear its manually-saved cookies.
export const SteamCredentialsTab = ({
  isLoading,
  isSaving,
  isAcquiring,
  loadErrorCode,
  actionErrorCode,
  onRefresh,
  onSave,
  onAcquire,
}: SteamCredentialsTabProps) => {
  const { t } = useTranslation()
  const account = useSessionStore(state => state.account)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const canUseAutomatic = hasGamerAccess(subscriptionTier)

  // Routes SteamCookiesConnectPanel's single `onConnect` callback to whichever action the selected
  // tab actually needs - `undefined` manualCookies means the automatic tab submitted, matching
  // every other SteamCookiesConnectPanel caller's convention (see that component's own doc
  // comment).
  const handleConnect = (manualCookies: SteamCookies | undefined) =>
    manualCookies === undefined ? onAcquire() : onSave(manualCookies)

  if (loadErrorCode) {
    return (
      <div className='flex flex-col items-center gap-4 p-8 text-center'>
        <Alert className='max-w-md' status='danger'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('dashboard.settings.errors.title')}</Alert.Title>
            <Alert.Description>
              {t(steamCredentialsErrorMessageKey(loadErrorCode), { code: loadErrorCode })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <Button size='sm' variant='secondary' onPress={onRefresh}>
          {t('common.actions.tryAgain')}
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <Typography type='h3' className='font-bold mb-4'>
          {t('dashboard.settings.steamCredentials.title')}
        </Typography>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className='h-10 w-full rounded-lg' />
        ))}
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-center justify-between gap-4'>
        <Typography type='h3' className='font-bold'>
          {t('dashboard.settings.steamCredentials.title')}
        </Typography>
        {!(account?.mode === 'agent' && canUseAutomatic) && (
          <Button
            size='sm'
            variant='secondary'
            className='inline-flex shrink-0 items-center gap-1 text-sm duration-150 cursor-pointer'
            type='button'
            onClick={() => openExternalLink(STEAM_CREDENTIALS_DOCS_URL)}
          >
            {t('common.learnMore')}
            <TbExternalLink fontSize={14} />
          </Button>
        )}
      </div>
      <Typography color='muted' type='body-sm'>
        {t('dashboard.settings.steamCredentials.description')}
      </Typography>

      {account?.mode === 'agent' && canUseAutomatic ? (
        <Alert status='default'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              {t('dashboard.settings.steamCredentials.agentModeNote')}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <SteamCookiesConnectPanel<SteamCookies>
          automaticDescription={t('dashboard.settings.steamCredentials.automaticDescription')}
          automaticTabLabel={t('common.connect.automaticTab')}
          errorSlot={
            actionErrorCode ? (
              <Alert status='danger'>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>
                    {t(steamCredentialsErrorMessageKey(actionErrorCode), { code: actionErrorCode })}
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            ) : undefined
          }
          isSubmitting={isSaving || isAcquiring}
          manualTabLabel={t('common.connect.manualTab')}
          savedCredentialsNote={t('common.manualCookies.savedFromSettingsNote')}
          showClear
          showSuccessToast
          skipAutoSave
          variant='embedded'
          onConnect={handleConnect}
        />
      )}
    </div>
  )
}
