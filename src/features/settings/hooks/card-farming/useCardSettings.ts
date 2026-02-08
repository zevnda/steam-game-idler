import type { CardFarmingUser, GameWithRemainingDrops } from '@/shared/types'
import { useEffect, useState } from 'react'
import { getStoredSettings } from '@/features/settings'
import { useUserStore } from '@/shared/stores'

export const useCardSettings = () => {
  const userSettings = useUserStore(state => state.userSettings)
  const [sidValue, setSidValue] = useState('') // sessionid
  const [slsValue, setSlsValue] = useState('') // steamLoginSecure
  const [smaValue, setSmaValue] = useState('') // steamMachineAuth
  const [gamesWithDropsData, setGamesWithDropsData] = useState<GameWithRemainingDrops[]>([])
  const [gamesWithDrops, setGamesWithDrops] = useState(0)
  const [totalDropsRemaining, setTotalDropsRemaining] = useState(0)
  const [hasCookies, setHasCookies] = useState(false)
  const [cardFarmingUser, setCardFarmingUser] = useState<CardFarmingUser | null>(null)
  const [isCFDataLoading, setIsCFDataLoading] = useState(false)

  // Get stored cookies to set their input values
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
