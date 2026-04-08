import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'

export function useCheckForPro() {
  const setIsPro = useUserStore(state => state.setIsPro)

  // Always enable pro features
  useEffect(() => {
    setIsPro(true)
  }, [setIsPro])
}
