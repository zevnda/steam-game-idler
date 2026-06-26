import type { ProTier } from '@/shared/utils'
import { invoke } from '@tauri-apps/api/core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronRight, TbCopy, TbExternalLink, TbTrash } from 'react-icons/tb'
import { Button, Chip, cn, Divider, Input } from '@heroui/react'
import { CustomModal, ExtLink, ProBadge, showSuccessToast } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import { GRANDFATHER_CUTOFF, logEvent } from '@/shared/utils'

interface SubscriptionResult {
  results: {
    status: string
    tier: string | null
    created_at: string
    email?: string | null
    current_period_end?: string | null
    cancel_at_period_end?: boolean | null
    payment_provider?: string | null
  }
}

export const SubscriptionSettings = () => {
  const { t } = useTranslation()
  const isSubscribed = useUserStore(state => state.isSubscribed)
  const subscriptionTier = useUserStore(state => state.subscriptionTier)
  const subscriptionDetails = useUserStore(state => state.subscriptionDetails)
  const setIsSubscribed = useUserStore(state => state.setIsSubscribed)
  const setSubscriptionTier = useUserStore(state => state.setSubscriptionTier)
  const setSubscriptionDetails = useUserStore(state => state.setSubscriptionDetails)

  const storedKey = typeof window !== 'undefined' ? (localStorage.getItem('licenseKey') ?? '') : ''
  const [inputKey, setInputKey] = useState('')
  const [pendingKey, setPendingKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTransferLoading, setIsTransferLoading] = useState(false)
  const [activationError, setActivationError] = useState<'not_found' | null>(null)
  const [showTransferConfirm, setShowTransferConfirm] = useState(false)

  const applySubscriptionResult = (data: SubscriptionResult) => {
    const createdAt = data.results.created_at
    const tier = (data.results.tier as ProTier) ?? 'casual'
    setIsSubscribed(true)
    if (createdAt && new Date(createdAt) < GRANDFATHER_CUTOFF) {
      setSubscriptionTier('gamer')
    } else {
      setSubscriptionTier(tier)
    }
    setSubscriptionDetails({
      email: data.results.email ?? null,
      currentPeriodEnd: data.results.current_period_end ?? null,
      cancelAtPeriodEnd: data.results.cancel_at_period_end ?? null,
      status: data.results.status ?? null,
      paymentProvider: data.results.payment_provider ?? null,
    })
  }

  const handleActivate = async () => {
    const key = inputKey.trim()
    if (!key) return

    setIsLoading(true)
    setActivationError(null)

    try {
      const deviceFingerprint = await invoke<string>('get_device_fingerprint')
      const response = await fetch('https://apibase.vercel.app/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key, deviceFingerprint }),
      })

      const data = await response.json()

      if (data?.error === 'already_activated') {
        setPendingKey(key)
        setShowTransferConfirm(true)
        return
      }

      if (!data?.results?.status) {
        setActivationError('not_found')
        return
      }

      localStorage.setItem('licenseKey', key)
      setInputKey('')
      showSuccessToast(t('settings.subscription.activateSuccess'))
      applySubscriptionResult(data)
    } catch (err) {
      console.error('Activation error:', err)
      logEvent(`[Error] in (handleActivate - Subscription): ${err}`)
      setActivationError('not_found')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmTransfer = async () => {
    setIsTransferLoading(true)
    setActivationError(null)

    try {
      const deviceFingerprint = await invoke<string>('get_device_fingerprint')
      const response = await fetch('https://apibase.vercel.app/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: pendingKey, deviceFingerprint, forceTransfer: true }),
      })

      const data = await response.json()

      if (!data?.results?.status) {
        setActivationError('not_found')
        setShowTransferConfirm(false)
        return
      }

      localStorage.setItem('licenseKey', pendingKey)
      setInputKey('')
      setPendingKey('')
      setShowTransferConfirm(false)
      showSuccessToast(t('settings.subscription.activateSuccess'))
      applySubscriptionResult(data)
    } catch (err) {
      console.error('Transfer error:', err)
      logEvent(`[Error] in (handleConfirmTransfer - Subscription): ${err}`)
      setActivationError('not_found')
      setShowTransferConfirm(false)
    } finally {
      setIsTransferLoading(false)
    }
  }

  const handleCancelTransfer = () => {
    setShowTransferConfirm(false)
    setPendingKey('')
  }

  const handleClear = () => {
    localStorage.removeItem('licenseKey')
    setIsSubscribed(false)
    setSubscriptionTier(null)
    setSubscriptionDetails(null)
    setActivationError(null)
    setShowTransferConfirm(false)
    setPendingKey('')
  }

  const handleCopy = () => {
    if (storedKey) {
      navigator.clipboard.writeText(storedKey)
      showSuccessToast(t('toast.exportData.success'))
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className='relative flex flex-col gap-4 mt-9 pb-16 w-4/5'>
      <div className='flex flex-col gap-0 select-none'>
        <p className='flex items-center text-xs text-altwhite font-bold'>
          {t('settings.title')}
          <span>
            <TbChevronRight size={12} />
          </span>
        </p>
        <p className='text-3xl font-black'>{t('settings.subscription.title')}</p>
      </div>

      <div className='flex flex-col gap-3 mt-4'>
        {/* Status */}
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.general.manageSubscription')}
            </p>
            <p className='text-xs text-altwhite'>{t('settings.subscription.manage.description')}</p>
          </div>
          <div className='flex flex-col items-end gap-2'>
            {isSubscribed ? (
              <ProBadge requiredTier={subscriptionTier ?? 'casual'} className='scale-85' />
            ) : (
              <Chip>
                <p className='text-xs text-altwhite'>{t('settings.subscription.inactive')}</p>
              </Chip>
            )}
            {isSubscribed && subscriptionDetails?.email && (
              <p className='text-xs text-altwhite'>{subscriptionDetails.email}</p>
            )}
            {isSubscribed && subscriptionDetails?.currentPeriodEnd && (
              <p
                className={cn(
                  'text-xs',
                  subscriptionDetails.cancelAtPeriodEnd ? 'text-danger' : 'text-altwhite',
                )}
              >
                {subscriptionDetails.cancelAtPeriodEnd
                  ? t('settings.subscription.cancelsOn')
                  : t('settings.subscription.renewsOn')}{' '}
                {formatDate(subscriptionDetails.currentPeriodEnd)}
              </p>
            )}
            {isSubscribed && subscriptionDetails?.paymentProvider === 'paypal' && (
              <ExtLink href='https://www.paypal.com/myaccount/autopay/'>
                <div className='flex items-center gap-1.5 text-black bg-white font-semibold text-xs py-2 px-3 rounded-full'>
                  {t('settings.general.manageSubscription')}
                  <TbExternalLink size={13} />
                </div>
              </ExtLink>
            )}
            {isSubscribed && subscriptionDetails?.paymentProvider !== 'paypal' && (
              <ExtLink href='https://billing.stripe.com/p/login/8x23cwf8CeNE6PLaAecbC00'>
                <div className='flex items-center gap-1.5 text-black bg-white font-semibold text-xs py-2 px-3 rounded-full'>
                  {t('settings.general.manageSubscription')}
                  <TbExternalLink size={13} />
                </div>
              </ExtLink>
            )}
          </div>
        </div>

        <Divider className='bg-border/70 my-4' />

        {/* License Key */}
        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.subscription.licenseKey')}
            </p>
            <p className='text-xs text-altwhite'>
              {t('settings.subscription.licenseKey.description')}
            </p>
          </div>

          <div className='flex flex-col gap-3 w-62.5'>
            {storedKey && (
              <div className='flex flex-col gap-4'>
                <Input
                  isReadOnly
                  labelPlacement='outside'
                  type='password'
                  value={storedKey}
                  className='max-w-72.5'
                  classNames={{
                    inputWrapper: cn(
                      'bg-input data-[hover=true]:!bg-input',
                      'rounded-lg group-data-[focus-within=true]:!bg-input',
                    ),
                    input: ['!text-content font-mono'],
                  }}
                />
                <div className='flex justify-end gap-2'>
                  <Button
                    size='sm'
                    variant='light'
                    radius='full'
                    className='text-content'
                    onPress={handleCopy}
                    startContent={<TbCopy size={16} />}
                  >
                    {t('common.copy')}
                  </Button>
                  <Button
                    size='sm'
                    variant='light'
                    radius='full'
                    color='danger'
                    onPress={handleClear}
                    startContent={<TbTrash size={16} />}
                  >
                    {t('common.clear')}
                  </Button>
                </div>
              </div>
            )}

            {!storedKey && (
              <>
                {activationError === 'not_found' && (
                  <p className='text-xs text-danger'>{t('settings.subscription.errorNotFound')}</p>
                )}

                <div className='flex flex-col gap-4'>
                  <Input
                    labelPlacement='outside'
                    placeholder={t('settings.subscription.licenseKey.description')}
                    className='max-w-72.5'
                    classNames={{
                      inputWrapper: cn(
                        'bg-input data-[hover=true]:!bg-inputhover',
                        'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                      ),
                      input: ['!text-content font-mono placeholder:text-altwhite/50'],
                    }}
                    value={inputKey}
                    onValueChange={val => {
                      setInputKey(val)
                      setActivationError(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleActivate()
                    }}
                  />
                  <div className='flex justify-end'>
                    <Button
                      size='sm'
                      radius='full'
                      className='bg-btn-secondary text-btn-text font-bold'
                      isLoading={isLoading}
                      isDisabled={!inputKey.trim()}
                      onPress={handleActivate}
                    >
                      {t('settings.subscription.activate')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <CustomModal
        isOpen={showTransferConfirm}
        onOpenChange={handleCancelTransfer}
        title={t('common.confirm')}
        body={
          <p className='text-sm text-altwhite leading-relaxed'>
            {t('settings.subscription.errorDeviceMismatch')}
          </p>
        }
        buttons={
          <>
            <Button
              size='sm'
              radius='full'
              variant='light'
              isDisabled={isTransferLoading}
              onPress={handleCancelTransfer}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              radius='full'
              className='bg-btn-secondary text-btn-text font-bold'
              isLoading={isTransferLoading}
              onPress={handleConfirmTransfer}
            >
              {t('common.continue')}
            </Button>
          </>
        }
      />
    </div>
  )
}
