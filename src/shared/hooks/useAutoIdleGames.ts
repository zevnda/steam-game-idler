import { useEffect } from 'react'
import { startAutoIdleGames } from '@/features/idle'

export function useAutoIdleGames() {
  useEffect(() => {
    startAutoIdleGames()
  }, [])
}
