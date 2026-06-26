import type { ProTier } from '@/shared/utils'
import { invoke } from '@tauri-apps/api/core'
import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'
import { GRANDFATHER_CUTOFF, logEvent } from '@/shared/utils'

export function useCheckSubscription() {
  const userSummary = useUserStore(state => state.userSummary)
  const setIsSubscribed = useUserStore(state => state.setIsSubscribed)
  const setSubscriptionTier = useUserStore(state => state.setSubscriptionTier)
  const setSubscriptionDetails = useUserStore(state => state.setSubscriptionDetails)

  useEffect(() => {
    const steamId = userSummary?.steamId

    if (!steamId) return

    const checkSubscription = async () => {
      try {
        const licenseKey = localStorage.getItem('licenseKey')
        const deviceFingerprint = await invoke<string>('get_device_fingerprint')
        const requestBody = licenseKey
          ? { licenseKey, deviceFingerprint }
          : { steamId, deviceFingerprint }

        const response = await fetch('https://apibase.vercel.app/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })

        const data = await response.json()

        if (data?.revoked) {
          await invoke('quit_app')
          return
        }

        // Migration: persist auto-generated key for legacy Steam ID subscribers
        if (!licenseKey && data?.licenseKey) {
          localStorage.setItem('licenseKey', data.licenseKey)
        }

        if (data?.results?.status) {
          setIsSubscribed(true)

          const createdAt = data?.results?.created_at
          const tier = (data?.results?.tier as ProTier) ?? 'casual'

          // Grandfather: subscribers before cutoff get full Gamer access regardless of plan
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
        } else {
          setIsSubscribed(false)
          setSubscriptionTier(null)
          setSubscriptionDetails(null)
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        logEvent(`[Error] in checkSubscription: ${error}`)
        setIsSubscribed(false)
        setSubscriptionTier(null)
        setSubscriptionDetails(null)
      }
    }

    checkSubscription()
    const interval = setInterval(checkSubscription, 3 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [userSummary?.steamId, setIsSubscribed, setSubscriptionTier, setSubscriptionDetails])
}
