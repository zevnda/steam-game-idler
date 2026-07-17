import type { SubscriptionApiResult } from '@/shared/utils/subscriptionApi'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@heroui/react'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import {
  applySubscriptionResult,
  clearSubscription,
  SUBSCRIPTION_API_URL,
} from '@/shared/utils/subscriptionApi'

const LICENSE_KEY_STORAGE_KEY = 'licenseKey'

interface SubscriptionApiResponse {
  error?: string
  results?: SubscriptionApiResult
}

async function postSubscription(body: Record<string, unknown>) {
  const deviceFingerprint = await invoke<string>('get_device_fingerprint')
  const response = await fetch(SUBSCRIPTION_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, deviceFingerprint }),
  })
  return (await response.json()) as SubscriptionApiResponse
}

// Backs the Subscription tab's manual license-key management (activate/clear/transfer) - a second,
// user-triggered entry point into `subscriptionStore` alongside `useCheckSubscription`'s periodic
// poll (mounted for the lifetime of the session in DashboardShell). Deliberately doesn't touch that
// hook's fetch/interval logic, per its own doc comment - it only reuses the shared
// `applySubscriptionResult`/`clearSubscription` helpers both call sites need for the identical
// grandfather-cutoff + field-mapping rules.
export function useSubscriptionSettings() {
  const { t } = useTranslation()
  const [inputKey, setInputKey] = useState('')
  const [isActivating, setIsActivating] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  // Set only while the "already activated on another device" confirm dialog is open - holds the
  // key so `confirmTransfer` can re-POST it with `forceTransfer: true` without the user re-typing.
  const [pendingTransferKey, setPendingTransferKey] = useState<string | null>(null)

  // Real component state rather than a plain `localStorage.getItem` read during render - the latter
  // only reflects a `clear()`/`activate()` mutation once something else happens to trigger a
  // re-render, which isn't guaranteed (e.g. `clearSubscription()`'s `setState` is a no-op re-render
  // if `subscriptionStore` was already in the cleared shape, since zustand's selector hooks bail out
  // via `Object.is` on an unchanged slice).
  const [storedKey, setStoredKey] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(LICENSE_KEY_STORAGE_KEY) : null,
  )

  const activate = async () => {
    const key = inputKey.trim()
    if (!key) return

    setIsActivating(true)
    try {
      const data = await postSubscription({ licenseKey: key })

      if (data.error === 'already_activated') {
        setPendingTransferKey(key)
        return
      }
      if (!data.results?.status) {
        toast.danger(t('dashboard.settings.subscription.errors.activationFailed'))
        return
      }

      localStorage.setItem(LICENSE_KEY_STORAGE_KEY, key)
      setStoredKey(key)
      setInputKey('')
      applySubscriptionResult(data.results)
      toast.success(t('dashboard.settings.subscription.licenseKey.activated'))
      logFrontendInfo('useSubscriptionSettings', 'license key activated')
    } catch (error) {
      console.error('Error in (activate - subscription settings):', error)
      toast.danger(t('dashboard.settings.subscription.errors.activationFailed'))
    } finally {
      setIsActivating(false)
    }
  }

  const confirmTransfer = async () => {
    if (!pendingTransferKey) return

    setIsTransferring(true)
    try {
      const data = await postSubscription({ licenseKey: pendingTransferKey, forceTransfer: true })

      if (!data.results?.status) {
        toast.danger(t('dashboard.settings.subscription.errors.activationFailed'))
        return
      }

      localStorage.setItem(LICENSE_KEY_STORAGE_KEY, pendingTransferKey)
      setStoredKey(pendingTransferKey)
      setInputKey('')
      applySubscriptionResult(data.results)
      toast.success(t('dashboard.settings.subscription.licenseKey.activated'))
      logFrontendInfo('useSubscriptionSettings', 'license key transferred')
    } catch (error) {
      console.error('Error in (confirmTransfer - subscription settings):', error)
      toast.danger(t('dashboard.settings.subscription.errors.activationFailed'))
    } finally {
      setIsTransferring(false)
      setPendingTransferKey(null)
    }
  }

  const cancelTransfer = () => setPendingTransferKey(null)

  const clear = () => {
    localStorage.removeItem(LICENSE_KEY_STORAGE_KEY)
    setStoredKey(null)
    clearSubscription()
    logFrontendInfo('useSubscriptionSettings', 'license key cleared')
  }

  const copyLicenseKey = () => {
    if (!storedKey) return
    navigator.clipboard.writeText(storedKey)
    toast.success(t('dashboard.settings.subscription.licenseKey.copied'))
  }

  return {
    storedKey,
    inputKey,
    setInputKey,
    isActivating,
    isTransferring,
    showTransferConfirm: pendingTransferKey !== null,
    activate,
    confirmTransfer,
    cancelTransfer,
    clear,
    copyLicenseKey,
  }
}
