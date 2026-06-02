import type { ProTier } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect } from 'react'
import { logEvent } from '@/shared/services/logService'
import { useUserStore } from '@/shared/stores'
import { GRANDFATHER_CUTOFF } from '@/shared/utils'

export function useCheckForPro() {
  const userSummary = useUserStore(s => s.userSummary)
  const setIsPro = useUserStore(s => s.setIsPro)
  const setProTier = useUserStore(s => s.setProTier)
  const setProDetails = useUserStore(s => s.setProDetails)

  useEffect(() => {
    const steamId = userSummary?.steamId
    if (!steamId) return

    const check = async () => {
      try {
        const licenseKey = localStorage.getItem('licenseKey')
        const deviceFingerprint = await invoke<string>('get_device_fingerprint')
        const body = licenseKey ? { licenseKey, deviceFingerprint } : { steamId, deviceFingerprint }

        const res = await fetch('https://apibase.vercel.app/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()

        if (!licenseKey && data?.licenseKey) {
          localStorage.setItem('licenseKey', data.licenseKey)
        }

        if (data?.results?.status) {
          setIsPro(true)
          const tier = data.results.tier as ProTier
          const createdAt = data.results.created_at
          setProTier(
            createdAt && new Date(createdAt) < GRANDFATHER_CUTOFF ? 'gamer' : (tier ?? null),
          )
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
        await logEvent(`[Error] in checkSubscription: ${error}`)
        setIsPro(false)
        setProTier(null)
        setProDetails(null)
      }
    }

    check()
  }, [userSummary?.steamId, setIsPro, setProTier, setProDetails])
}
