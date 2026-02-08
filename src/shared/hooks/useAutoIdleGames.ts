import { useEffect } from 'react'
import { startAutoIdleGames } from '@/shared/utils'

export function useAutoIdleGames() {
  useEffect(() => {
    // Start idling games in auto idle list
    startAutoIdleGames()
  }, [])
}
