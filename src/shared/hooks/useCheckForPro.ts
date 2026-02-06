import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'
import { logEvent } from '@/shared/utils'

export function useCheckForPro() {
  const userSummary = useUserStore(state => state.userSummary)
  const setIsPro = useUserStore(state => state.setIsPro)

  // Check for active subscription and set isPro
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
        } else {
          setIsPro(false)
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        logEvent(`[Error] in checkSubscription: ${error}`)
        setIsPro(false)
      }
    }

    checkSubscription()
  }, [userSummary?.steamId, setIsPro])
}
