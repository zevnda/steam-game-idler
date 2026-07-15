import { useTranslation } from 'react-i18next'
import { TbCopy, TbExternalLink } from 'react-icons/tb'
import { useSubscriptionSettings } from '../hooks/useSubscriptionSettings'
import { AlertDialog, Button, Input, TextField, Typography } from '@heroui/react'
import { SettingsRow } from '@/shared/components/SettingsRow'
import { TierBadge } from '@/shared/components/TierBadge'
import { PAYPAL_BILLING_URL, STRIPE_BILLING_URL } from '@/shared/constants'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { openExternalLink } from '@/shared/utils/links'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

// The Subscription tab of the (app-wide) SettingsModal - status display plus manual license-key
// activate/clear/transfer, matching `main`'s SubscriptionSettings.tsx feature-for-feature. Unlike
// Achievement Unlocker/Inventory Manager's
// load-then-edit-draft tabs, there's no settings file of its own to load - every value here comes
// straight from `subscriptionStore` (kept current for the session's lifetime by
// `useCheckSubscription`, mounted in DashboardShell) plus this tab's own `useSubscriptionSettings`
// for the manual actions, closer to the Debug tab's action-button shape.
export const SubscriptionSettingsTab = () => {
  const { t } = useTranslation()
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const subscriptionDetails = useSubscriptionStore(state => state.subscriptionDetails)
  const {
    storedKey,
    inputKey,
    setInputKey,
    isActivating,
    isTransferring,
    showTransferConfirm,
    activate,
    confirmTransfer,
    cancelTransfer,
    clear,
    copyLicenseKey,
  } = useSubscriptionSettings()

  return (
    <div className='flex flex-col gap-4'>
      <Typography type='h3' className='font-bold mb-4'>
        {t('dashboard.settings.subscription.title')}
      </Typography>

      <SettingsRow
        description={t('dashboard.settings.subscription.status.description')}
        title={t('dashboard.settings.subscription.status.title')}
      >
        {/* `isSubscribed === null` means the first check hasn't resolved yet - render nothing
            rather than a flash of "Inactive" before it does, same rule Sidebar.tsx's tier pill
            already follows. */}
        {isSubscribed !== null && (
          <div className='flex flex-col items-end gap-2'>
            {isSubscribed ? (
              <TierBadge tier={subscriptionTier} />
            ) : (
              <Typography color='muted' type='body-xs' weight='semibold'>
                {t('dashboard.settings.subscription.status.inactive')}
              </Typography>
            )}
            {isSubscribed && subscriptionDetails?.email && (
              <Typography color='muted' type='body-xs'>
                {subscriptionDetails.email}
              </Typography>
            )}
            {isSubscribed && subscriptionDetails?.currentPeriodEnd && (
              <Typography
                className={subscriptionDetails.cancelAtPeriodEnd ? 'text-danger' : undefined}
                color={subscriptionDetails.cancelAtPeriodEnd ? undefined : 'muted'}
                type='body-xs'
              >
                {t(
                  subscriptionDetails.cancelAtPeriodEnd
                    ? 'dashboard.settings.subscription.status.cancelsOn'
                    : 'dashboard.settings.subscription.status.renewsOn',
                  { date: formatDate(subscriptionDetails.currentPeriodEnd) },
                )}
              </Typography>
            )}
            {isSubscribed && (
              <Button
                size='sm'
                className='inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold'
                onPress={() =>
                  openExternalLink(
                    subscriptionDetails?.paymentProvider === 'paypal'
                      ? PAYPAL_BILLING_URL
                      : STRIPE_BILLING_URL,
                  )
                }
              >
                {t('dashboard.settings.subscription.status.manage')}
                <TbExternalLink fontSize={14} />
              </Button>
            )}
          </div>
        )}
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.settings.subscription.licenseKey.description')}
        showDivider={false}
        title={t('dashboard.settings.subscription.licenseKey.title')}
      >
        {storedKey ? (
          <div className='flex flex-col items-end gap-3'>
            <TextField
              isReadOnly
              aria-label={t('dashboard.settings.subscription.licenseKey.title')}
              className='w-62.5'
              value={storedKey}
            >
              <Input type='password' />
            </TextField>
            <div className='flex items-center gap-2'>
              <Button size='sm' variant='secondary' onPress={copyLicenseKey}>
                <TbCopy fontSize={16} />
                {t('common.actions.copy')}
              </Button>
              <Button size='sm' variant='secondary' onPress={clear}>
                {t('common.actions.clear')}
              </Button>
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-end gap-3'>
            <TextField
              aria-label={t('dashboard.settings.subscription.licenseKey.title')}
              className='w-62.5'
              isDisabled={isActivating}
              value={inputKey}
              onChange={setInputKey}
              onKeyDown={event => {
                if (event.key === 'Enter') activate()
              }}
            >
              <Input placeholder={t('dashboard.settings.subscription.licenseKey.placeholder')} />
            </TextField>
            <Button
              isDisabled={!inputKey.trim()}
              isPending={isActivating}
              size='sm'
              onPress={activate}
            >
              {t('dashboard.settings.subscription.licenseKey.activate')}
            </Button>
          </div>
        )}
      </SettingsRow>

      <AlertDialog isOpen={showTransferConfirm} onOpenChange={open => !open && cancelTransfer()}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {t('dashboard.settings.subscription.transfer.title')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {t('dashboard.settings.subscription.transfer.description')}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button isDisabled={isTransferring} variant='secondary' onPress={cancelTransfer}>
                  {t('common.actions.cancel')}
                </Button>
                <Button isPending={isTransferring} onPress={confirmTransfer}>
                  {t('common.actions.continue')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  )
}
