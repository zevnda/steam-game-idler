import type { ProTier } from '@/shared/utils'
import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'
import { GRANDFATHER_CUTOFF, logEvent } from '@/shared/utils'

export function useCheckForPro() {
  const userSummary = useUserStore(state => state.userSummary)
  const setIsPro = useUserStore(state => state.setIsPro)
  const setProTier = useUserStore(state => state.setProTier)

  // Check for active subscription and set isPro + proTier
  useEffect(() => {
    const steamId = userSummary?.steamId

    if (!steamId) return

    const checkSubscription = async () => {
      try {
        const response = await fetch('https://apibase.vercel.app/api/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ steamId }),
        })

        const data = await response.json()

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
        } else {
          setIsPro(false)
          setProTier(null)
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        logEvent(`[Error] in checkSubscription: ${error}`)
        setIsPro(false)
        setProTier(null)
      }
    }

    checkSubscription()
  }, [userSummary?.steamId, setIsPro, setProTier])
}
