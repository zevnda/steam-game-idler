import type { ProTier } from '@/shared/utils'
import { invoke } from '@tauri-apps/api/core'
import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'
import { GRANDFATHER_CUTOFF, logEvent } from '@/shared/utils'

export function useCheckForPro() {
  const userSummary = useUserStore(state => state.userSummary)
  const setIsPro = useUserStore(state => state.setIsPro)
  const setProTier = useUserStore(state => state.setProTier)
  const setProDetails = useUserStore(state => state.setProDetails)

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

        // Migration: persist auto-generated key for legacy Steam ID subscribers
        if (!licenseKey && data?.licenseKey) {
          localStorage.setItem('licenseKey', data.licenseKey)
        }

        if (data?.results?.status) {
          setIsPro(true)

          const createdAt = data?.results?.created_at
          const tier = data?.results?.tier as ProTier

          // Grandfather: subscribers before cutoff get full Gamer access regardless of plan
          if (createdAt && new Date(createdAt) < GRANDFATHER_CUTOFF) {
            setProTier('gamer')
          } else {
            setProTier(tier ?? null)
          }

          setProDetails({
            email: data.results.email ?? null,
            currentPeriodEnd: data.results.current_period_end ?? null,
            cancelAtPeriodEnd: data.results.cancel_at_period_end ?? null,
            status: data.results.status ?? null,
          })
        } else {
          setIsPro(false)
          setProTier(null)
          setProDetails(null)
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        logEvent(`[Error] in checkSubscription: ${error}`)
        setIsPro(false)
        setProTier(null)
        setProDetails(null)
      }
    }

    checkSubscription()
  }, [userSummary?.steamId, setIsPro, setProTier, setProDetails])
}
