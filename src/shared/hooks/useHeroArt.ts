import { useEffect, useState } from 'react'
import { fetchGameArt } from '@/shared/stores/gameArtStore'
import { checkedHeroArt, checkHeroArt } from '@/shared/utils/heroArt'

// One game's wide hero art and title logo, checked the same way the Games page's Recommended banner
// checks its slides (see heroArt.ts). `undefined` while checking, `null` when the game has no usable
// hero art - callers then show its header image instead, which every Steam game has.
export const useHeroArt = (appId: number) => {
  const [art, setArt] = useState(() => checkedHeroArt.get(appId))

  useEffect(() => {
    if (checkedHeroArt.has(appId)) {
      setArt(checkedHeroArt.get(appId))
      return
    }
    setArt(undefined)
    let isCancelled = false
    void (async () => {
      const resolved = await fetchGameArt([appId])
      const result = await checkHeroArt(appId, resolved[appId]?.hero ?? null)
      checkedHeroArt.set(appId, result)
      if (!isCancelled) setArt(result)
    })()
    return () => {
      isCancelled = true
    }
  }, [appId])

  return art
}
