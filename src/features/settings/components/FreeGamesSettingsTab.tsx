import type { FreeGamesSettings } from '@/features/free-games/types'
import { useTranslation } from 'react-i18next'
import { freeGamesErrorMessageKey } from '../utils/errorMessageKey'
import { Alert, Button, Skeleton, toast, Typography } from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { SettingsRow } from '@/shared/components/SettingsRow'
import { TierBadge } from '@/shared/components/TierBadge'
import { ToggleSwitch } from '@/shared/components/ToggleSwitch'
import { useFreeGameNotificationsStore } from '@/shared/stores/freeGameNotificationsStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

interface FreeGamesSettingsTabProps {
  onSaveFreeGameNotifications: (enabled: boolean) => Promise<boolean>
  notificationsActionErrorCode: string | null
  settings: FreeGamesSettings | null
  isLoading: boolean
  isEstablishingSession: boolean
  isClearingSession: boolean
  loadErrorCode: string | null
  actionErrorCode: string | null
  onRefresh: () => void
  onToggleAutoRedeem: (enabled: boolean) => Promise<boolean>
  onEstablishSession: () => Promise<boolean>
  onClearSession: () => Promise<boolean>
}

// The Free Games category of the (app-wide) SettingsModal - the app-wide notification toggle
// (`free_game_notifications`, see settings::Settings's doc comment) plus this account's
// gamer-tier-gated auto-redeem toggle (`free_games::settings::FreeGamesSettings`). Auto-redeem's
// controls genuinely differ per sign-in mode (see useFreeGamesSettings.ts's doc comments): agent
// mode is a plain switch (no store session needed at all to auto-redeem - see
// `free_games/mod.rs`'s doc comment), CLI mode instead uses sign-in/sign-out buttons that double as
// the on/off control, matching `main`'s own CLI-only automation flow but scoped to this account's
// own webview profile rather than `main`'s shared one.
export const FreeGamesSettingsTab = ({
  onSaveFreeGameNotifications,
  notificationsActionErrorCode,
  settings,
  isLoading,
  isEstablishingSession,
  isClearingSession,
  loadErrorCode,
  actionErrorCode,
  onRefresh,
  onToggleAutoRedeem,
  onEstablishSession,
  onClearSession,
}: FreeGamesSettingsTabProps) => {
  const { t } = useTranslation()
  const account = useSessionStore(state => state.account)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const canAutoRedeem = hasGamerAccess(subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  // Live value, not `settings.freeGameNotifications` - `useFreeGamesWatcher` (mounted in
  // DashboardShell) already hydrates this store on app start regardless of whether this modal is
  // ever opened, same split GeneralSettingsTab's antiAway toggle uses.
  const notificationsEnabled = useFreeGameNotificationsStore(state => state.enabled)
  const setNotificationsEnabled = useFreeGameNotificationsStore(state => state.setEnabled)

  const handleToggleNotifications = async (next: boolean) => {
    const ok = await onSaveFreeGameNotifications(next)
    if (ok) {
      setNotificationsEnabled(next)
    } else if (notificationsActionErrorCode) {
      toast.danger(
        t(freeGamesErrorMessageKey(notificationsActionErrorCode), {
          code: notificationsActionErrorCode,
        }),
      )
    }
  }

  const handleToggleAutoRedeem = async (next: boolean) => {
    const ok = await onToggleAutoRedeem(next)
    if (!ok && actionErrorCode) {
      toast.danger(t(freeGamesErrorMessageKey(actionErrorCode), { code: actionErrorCode }))
    }
  }

  const handleEstablishSession = async () => {
    const ok = await onEstablishSession()
    if (ok) {
      toast.success(t('dashboard.settings.freeGames.autoRedeem.sessionEstablished'))
    } else if (actionErrorCode) {
      toast.danger(t(freeGamesErrorMessageKey(actionErrorCode), { code: actionErrorCode }))
    }
  }

  const handleClearSession = async () => {
    const ok = await onClearSession()
    if (ok) {
      toast.success(t('dashboard.settings.freeGames.autoRedeem.sessionCleared'))
    } else if (actionErrorCode) {
      toast.danger(t(freeGamesErrorMessageKey(actionErrorCode), { code: actionErrorCode }))
    }
  }

  if (loadErrorCode) {
    return (
      <div className='flex flex-col items-center gap-4 p-8 text-center'>
        <Alert className='max-w-md' status='danger'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('dashboard.settings.errors.title')}</Alert.Title>
            <Alert.Description>
              {t(freeGamesErrorMessageKey(loadErrorCode), { code: loadErrorCode })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <Button variant='secondary' onPress={onRefresh}>
          {t('common.actions.tryAgain')}
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-5'>
      <Typography type='h3' className='font-bold mb-4'>
        {t('dashboard.sidebar.nav.freeGames')}
      </Typography>

      <SettingsRow
        description={t('dashboard.settings.freeGames.notifications.description')}
        title={t('dashboard.settings.freeGames.notifications.label')}
      >
        <ToggleSwitch isSelected={notificationsEnabled} onChange={handleToggleNotifications} />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.settings.freeGames.autoRedeem.description')}
        showDivider={false}
        title={
          <span className='flex items-center gap-2'>
            {t('dashboard.settings.freeGames.autoRedeem.label')}
            {!canAutoRedeem && <TierBadge tier='gamer' />}
          </span>
        }
      >
        {isLoading ? (
          <Skeleton className='h-8 w-24 rounded-lg' />
        ) : !canAutoRedeem ? (
          // Not `isDisabled` - see GeneralSettingsTab's identical gate for why this stays a real,
          // normal-looking Switch whose `onChange` opens the upsell instead of saving.
          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <ToggleSwitch isSelected={false} onChange={() => openProModalWithTier('gamer')} />
            </AppTooltip.Trigger>
            <AppTooltip.Content>{t('common.proTier.gamerRequired')}</AppTooltip.Content>
          </AppTooltip.Root>
        ) : account?.mode === 'agent' ? (
          <ToggleSwitch
            isSelected={settings?.autoRedeem ?? false}
            onChange={handleToggleAutoRedeem}
          />
        ) : (
          <div className='flex flex-col items-end gap-2'>
            <Button isPending={isEstablishingSession} size='sm' onPress={handleEstablishSession}>
              {settings?.autoRedeem
                ? t('dashboard.settings.freeGames.autoRedeem.reauthenticate')
                : t('dashboard.settings.freeGames.autoRedeem.signIn')}
            </Button>
            <Button
              isDisabled={!settings?.autoRedeem}
              isPending={isClearingSession}
              size='sm'
              variant='secondary'
              onPress={handleClearSession}
            >
              {t('common.actions.signOut')}
            </Button>
          </div>
        )}
      </SettingsRow>
    </div>
  )
}
