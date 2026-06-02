import type { ProTier } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronRight, TbCopy, TbExternalLink, TbTrash } from 'react-icons/tb'
import { Button, Chip, cn, Divider, Input } from '@heroui/react'
import { CustomModal } from '@/shared/components/CustomModal'
import { ExtLink } from '@/shared/components/ExtLink'
import { ProBadge } from '@/shared/components/pro/ProBadge'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores'
import { GRANDFATHER_CUTOFF } from '@/shared/utils'

export function SubscriptionSettings() {
  const { t } = useTranslation()
  const isPro = useUserStore(s => s.isPro)
  const proTier = useUserStore(s => s.proTier)
  const proDetails = useUserStore(s => s.proDetails)
  const setIsPro = useUserStore(s => s.setIsPro)
  const setProTier = useUserStore(s => s.setProTier)
  const setProDetails = useUserStore(s => s.setProDetails)

  const storedKey = typeof window !== 'undefined' ? (localStorage.getItem('licenseKey') ?? '') : ''
  const [inputKey, setInputKey] = useState('')
  const [pendingKey, setPendingKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTransferLoading, setIsTransferLoading] = useState(false)
  const [activationError, setActivationError] = useState<'not_found' | null>(null)
  const [showTransfer, setShowTransfer] = useState(false)

  const applyResult = (data: {
    results: {
      status: string
      tier: string | null
      created_at: string
      email?: string | null
      current_period_end?: string | null
      cancel_at_period_end?: boolean | null
    }
  }) => {
    const { created_at, tier, email, current_period_end, cancel_at_period_end, status } =
      data.results
    setIsPro(true)
    setProTier(
      created_at && new Date(created_at) < GRANDFATHER_CUTOFF
        ? 'gamer'
        : ((tier as ProTier) ?? null),
    )
    setProDetails({
      email: email ?? null,
      currentPeriodEnd: current_period_end ?? null,
      cancelAtPeriodEnd: cancel_at_period_end ?? null,
      status: status ?? null,
    })
  }

  const handleActivate = async () => {
    const key = inputKey.trim()
    if (!key) return
    setIsLoading(true)
    setActivationError(null)
    try {
      const fp = await invoke<string>('get_device_fingerprint')
      const res = await fetch('https://apibase.vercel.app/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key, deviceFingerprint: fp }),
      })
      const data = await res.json()
      if (data?.error === 'already_activated') {
        setPendingKey(key)
        setShowTransfer(true)
        return
      }
      if (!data?.results?.status) {
        setActivationError('not_found')
        return
      }
      localStorage.setItem('licenseKey', key)
      setInputKey('')
      toast.success(t('settings.subscription.activateSuccess'))
      applyResult(data)
    } catch (err) {
      await logEvent(`[Error] in (handleActivate): ${err}`)
      setActivationError('not_found')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmTransfer = async () => {
    setIsTransferLoading(true)
    setActivationError(null)
    try {
      const fp = await invoke<string>('get_device_fingerprint')
      const res = await fetch('https://apibase.vercel.app/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: pendingKey,
          deviceFingerprint: fp,
          forceTransfer: true,
        }),
      })
      const data = await res.json()
      if (!data?.results?.status) {
        setActivationError('not_found')
        setShowTransfer(false)
        return
      }
      localStorage.setItem('licenseKey', pendingKey)
      setInputKey('')
      setPendingKey('')
      setShowTransfer(false)
      toast.success(t('settings.subscription.activateSuccess'))
      applyResult(data)
    } catch (err) {
      await logEvent(`[Error] in (handleConfirmTransfer): ${err}`)
      setActivationError('not_found')
      setShowTransfer(false)
    } finally {
      setIsTransferLoading(false)
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
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.general.manageSubscription')}
            </p>
            <p className='text-xs text-altwhite'>{t('settings.subscription.manage.description')}</p>
          </div>
          <div className='flex flex-col items-end gap-2'>
            {isPro ? (
              <ProBadge requiredTier={proTier ?? 'casual'} className='scale-85' />
            ) : (
              <Chip>
                <p className='text-xs text-altwhite'>{t('settings.subscription.inactive')}</p>
              </Chip>
            )}
            {isPro && proDetails?.email && (
              <p className='text-xs text-altwhite'>{proDetails.email}</p>
            )}
            {isPro && proDetails?.currentPeriodEnd && (
              <p
                className={cn(
                  'text-xs',
                  proDetails.cancelAtPeriodEnd ? 'text-danger' : 'text-altwhite',
                )}
              >
                {proDetails.cancelAtPeriodEnd
                  ? t('settings.subscription.cancelsOn')
                  : t('settings.subscription.renewsOn')}{' '}
                {formatDate(proDetails.currentPeriodEnd)}
              </p>
            )}
            {isPro && (
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
            {storedKey ? (
              <div className='flex flex-col gap-4'>
                <Input
                  isReadOnly
                  type='password'
                  value={storedKey}
                  className='max-w-72.5'
                  classNames={{
                    inputWrapper: cn('bg-input data-[hover=true]:!bg-input rounded-lg'),
                    input: ['!text-content font-mono'],
                  }}
                />
                <div className='flex justify-end gap-2'>
                  <Button
                    size='sm'
                    variant='light'
                    radius='full'
                    className='text-content'
                    onPress={() => {
                      navigator.clipboard.writeText(storedKey)
                      toast.success(t('toast.exportData.success'))
                    }}
                    startContent={<TbCopy size={16} />}
                  >
                    {t('common.copy')}
                  </Button>
                  <Button
                    size='sm'
                    variant='light'
                    radius='full'
                    color='danger'
                    onPress={() => {
                      localStorage.removeItem('licenseKey')
                      setIsPro(false)
                      setProTier(null)
                      setProDetails(null)
                    }}
                    startContent={<TbTrash size={16} />}
                  >
                    {t('common.clear')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {activationError === 'not_found' && (
                  <p className='text-xs text-danger'>{t('settings.subscription.errorNotFound')}</p>
                )}
                <div className='flex flex-col gap-4'>
                  <Input
                    placeholder={t('settings.subscription.licenseKey.description')}
                    className='max-w-72.5'
                    classNames={{
                      inputWrapper: cn('bg-input data-[hover=true]:!bg-inputhover rounded-lg'),
                      input: ['!text-content font-mono placeholder:text-altwhite/50'],
                    }}
                    value={inputKey}
                    onValueChange={v => {
                      setInputKey(v)
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
        isOpen={showTransfer}
        onOpenChange={() => {
          setShowTransfer(false)
          setPendingKey('')
        }}
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
              onPress={() => {
                setShowTransfer(false)
                setPendingKey('')
              }}
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
