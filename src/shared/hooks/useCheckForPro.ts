import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'

export function useCheckForPro() {
  const userSummary = useUserStore(state => state.userSummary)
  const setIsPro = useUserStore(state => state.setIsPro)

  // Keep premium features enabled in-app
  useEffect(() => {
    const steamId = userSummary?.steamId

    if (!steamId) return

    setIsPro(true)
  }, [userSummary?.steamId, setIsPro])
}
