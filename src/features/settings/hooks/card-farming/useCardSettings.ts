import type { CardFarmingUser, GameWithRemainingDrops } from '@/shared/types'
import { useEffect, useState } from 'react'
import { getStoredSettings } from '@/features/settings/services/generalService'
import { useUserStore } from '@/shared/stores'

export function useCardSettings() {
  const userSettings = useUserStore(s => s.userSettings)
  const [sidValue, setSidValue] = useState('')
  const [slsValue, setSlsValue] = useState('')
  const [smaValue, setSmaValue] = useState('')
  const [gamesWithDropsData, setGamesWithDropsData] = useState<GameWithRemainingDrops[]>([])
  const [gamesWithDrops, setGamesWithDrops] = useState(0)
  const [totalDropsRemaining, setTotalDropsRemaining] = useState(0)
  const [hasCookies, setHasCookies] = useState(false)
  const [cardFarmingUser, setCardFarmingUser] = useState<CardFarmingUser | null>(null)
  const [isCFDataLoading, setIsCFDataLoading] = useState(false)

  useEffect(() => {
    getStoredSettings(
      userSettings,
      setHasCookies,
      setSidValue,
      setSlsValue,
      setSmaValue,
      setGamesWithDrops,
      setTotalDropsRemaining,
      setCardFarmingUser,
    )
  }, [userSettings])

  return {
    sidValue,
    slsValue,
    smaValue,
    gamesWithDropsData,
    setGamesWithDropsData,
    gamesWithDrops,
    totalDropsRemaining,
    hasCookies,
    setSidValue,
    setSlsValue,
    setSmaValue,
    setHasCookies,
    cardFarmingUser,
    setCardFarmingUser,
    setGamesWithDrops,
    setTotalDropsRemaining,
    isCFDataLoading,
    setIsCFDataLoading,
  }
}
